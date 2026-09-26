const functions = require('firebase-functions');
const { db, firestoreRef } = require('./utils/admin');
const app = require('express')();
const axios = require('axios').default;
const cors = require('cors');
app.use(cors());

const {
    getAllStocks,
    createStock,
    getStockData,
    returnStockData,
    ipoBuyStock,
    ipoSellStock,
    updateStockStandings,
    setWinners,
} = require('./handlers/stocks');

const {
    signup,
    login,
    getUserDetails,
    getUserOwnedStocks,
    getOtherUserOwnedStocks,
    getLeaderboard,
} = require('./handlers/users');
const { getAllScores } = require('./handlers/scores');
const FBAuth = require('./utils/FBAuth');
const AdminAuth = require('./utils/AdminAuth');

//add authentications

app.get('/stocks', getAllStocks); //gets all stocks
app.get('/stocks/:stockId', getStockData, returnStockData); //gets specific stock by id
app.post('/stocks', FBAuth, AdminAuth, createStock); //creates a stock; admin auth only
app.post('/stocks/updateStandings', FBAuth, AdminAuth, updateStockStandings); //updates point values for each stock
// app.get('/stocks/:stockId/stockHistory', FBAuth, getStockHistory); //gets the stock price history by id
app.put('/stocks/:stockId/buyIpo', FBAuth, ipoBuyStock); //allows user to instant buy a stock
app.put('/stocks/:stockId/sellIpo', FBAuth, ipoSellStock); //allows user to instant sell a stock

//Scores Routes
app.get('/scores', getAllScores); //allows user to instant sell a stock

//User Routes
app.post('/signup', signup); //signs up a user
app.post('/login', login); //logs in a user
app.get('/user', FBAuth, getUserDetails); //gets user profile information
app.get('/userStocks', FBAuth, getUserOwnedStocks); //gets user's portfolio of stocks
app.get('/userStocks/:userId', getOtherUserOwnedStocks); //gets user's portfolio of stocks

app.get('/leaderboard', getLeaderboard); //gets current leaderboard

app.get('/setWinners', setWinners);

exports.api = functions.https.onRequest(app);
/**
 * Auto updates necessary information every night at 12AM
 * Updates stock info, account values, and leaderboards
 */
exports.autoUpdate = functions.pubsub
    .schedule('*/10 * * * *')
    .timeZone('America/New_York')
    .onRun(async (context) => {
        const date = firestoreRef.Timestamp.now()
            .toDate()
            .toLocaleDateString()
            .toString();
        const dateId = date.replace('/', '').replace('/', '');
        let stockData = [];

        await db
            .collection('stocks')
            .get()
            .then(async (querySnapshot) => {
                querySnapshot.docs.forEach((doc) => {
                    stockData.push(doc.data());
                });
            });

        let handledIds = [];
        let lastUpdated = '';

        await db
            .collection('handledIds')
            .doc('handledIds')
            .get()
            .then((res) => {
                const docData = res.data();
                handledIds = docData.handledIds;
                lastUpdated = docData.lastUpdated;
            });

        const url =
            'http://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?limit=365&groups=50';
        const winners = [];
        const losers = [];
        const playInRenames = []; // { stockId, newName }
        await axios
            .get(url)
            .then((res) => {
                return res.data;
            })
            .then((response) => {
                let scores = [];

                response['events'].forEach((element) => {
                    let gameInfo = {};
                    gameInfo.name = element['name'];
                    gameInfo.shortName = element['shortName'];
                    gameInfo.score = [];
                    element['competitions'].forEach((elem) => {
                        const status = elem.status.type.name;
                        const id = elem.id;
                        if (!handledIds.includes(id)) {
                            if (status === 'STATUS_FINAL') {
                                //FINAL
                                elem['competitors'].forEach((e) => {
                                    const winner = e.winner;

                                    const displayName =
                                        e['team']['displayName'];

                                    // Try exact match first
                                    let stock = stockData.find(
                                        (stock) =>
                                            stock.stockName === displayName
                                    );

                                    // If no exact match, try play-in match (stockName contains " / ")
                                    const isPlayIn = !stock;
                                    if (!stock) {
                                        stock = stockData.find(
                                            (s) =>
                                                s.stockName.includes(' / ') &&
                                                s.stockName.includes(displayName)
                                        );
                                    }

                                    console.log('winner', winner);
                                    console.log('stock', stock);
                                    console.log('displayName', displayName);
                                    console.log('isPlayIn', isPlayIn);

                                    if (isPlayIn && stock) {
                                        // Play-in game: rename stock to winner, don't score
                                        if (winner) {
                                            handledIds.push(id);
                                            playInRenames.push({
                                                stockId: stock.stockId,
                                                newName: displayName,
                                            });
                                        }
                                        // Loser in play-in: do nothing (stock continues with winner)
                                    } else if (winner && stock) {
                                        handledIds.push(id);
                                        winners.push(stock);
                                    } else if (stock) {
                                        losers.push(stock);
                                    }
                                });
                            }
                        }
                    });
                });
            })
            .catch((err) => {
                console.log(err);
            });

        // Handle play-in renames (rename stock to winner's ESPN name)
        for (const rename of playInRenames) {
            console.log(`Play-in rename: ${rename.stockId} -> ${rename.newName}`);
            const newStockData = [...stockData];
            const matchedStock = newStockData.find(
                (stock) => stock.stockId === rename.stockId
            );
            if (matchedStock) {
                matchedStock.stockName = rename.newName;
            }
            stockData = newStockData;

            await db
                .collection('stocks')
                .doc(rename.stockId)
                .update({ stockName: rename.newName })
                .catch((err) => {
                    console.error('Play-in rename error:', err);
                });
        }

        // let teamArr = [];
        console.log('winners', winners);

        losers.forEach(async (team) => {
            // team = team.replace('\r\n', '');
            // teamArr.push(team);

            console.log('team', team);

            const newStockData = [...stockData];
            newStockData.find(
                (stock) => stock.stockId === team.stockId
            ).hasLost = true;
            stockData = newStockData;

            await db
                .collection('stocks')
                .doc(team.stockId)
                .update({
                    hasLost: true,
                    gamesLeft: firestoreRef.FieldValue.increment(0),
                })
                .catch((err) => {
                    console.error(err);
                    return Promise.reject();
                });
        });

        winners.forEach(async (team) => {
            // team = team.replace('\r\n', '');
            // teamArr.push(team);

            console.log('team', team);

            const newStockData = [...stockData];
            newStockData.find(
                (stock) => stock.stockId === team.stockId
            ).currPoints += team.seed;
            stockData = newStockData;

            await db
                .collection('stocks')
                .doc(team.stockId)
                .update({
                    currPoints: firestoreRef.FieldValue.increment(team.seed),
                    gamesLeft: firestoreRef.FieldValue.increment(-1),
                })
                .catch((err) => {
                    console.error(err);
                    return Promise.reject();
                });
        });

        await db
            .collection('handledIds')
            .doc('handledIds')
            .set({
                handledIds: handledIds,
                lastUpdated:
                    new Date().toLocaleDateString() +
                    ' at ' +
                    new Date().toLocaleTimeString(),
            });

        // if (winners.length > 0) { TODO: if scalability is an issue, uncomment this
        await db
            .collection('users')
            .get()
            .then(async (res) => {
                let usernames = [];
                const docs = [];
                res.forEach((doc) => {
                    docs.push(doc);
                });

                for (const user of docs) {
                    const docData = user.data();
                    let totalAccountValue = 0;
                    let maxAccountValue = 0;

                    await db
                        .collection('users')
                        .doc(user.id)
                        .collection('ownedStocks')
                        .get()
                        .then(async (resp) => {
                            resp.forEach((doc) => {
                                const ownedStockData = doc.data();

                                const stockCurrPoints = stockData.find(
                                    (stock) =>
                                        stock.stockId === ownedStockData.stockId
                                ).currPoints;
                                totalAccountValue +=
                                    ownedStockData.numShares * stockCurrPoints;

                                //Add current + potential
                                maxAccountValue +=
                                    ownedStockData.numShares * stockCurrPoints;

                                const seed = stockData.find(
                                    (stock) =>
                                        stock.stockId === ownedStockData.stockId
                                ).seed;

                                const gamesLeft = stockData.find(
                                    (stock) =>
                                        stock.stockId === ownedStockData.stockId
                                ).gamesLeft;

                                const hasLost = stockData.find(
                                    (stock) =>
                                        stock.stockId === ownedStockData.stockId
                                ).hasLost;

                                if (!hasLost) {
                                    maxAccountValue +=
                                        ownedStockData.numShares *
                                        gamesLeft *
                                        seed;
                                }
                            });

                            if (
                                docData.totalAccountValue !==
                                    totalAccountValue ||
                                docData.maxAccountValue !== maxAccountValue
                            ) {
                                await db
                                    .collection('users')
                                    .doc(user.id)
                                    .update({
                                        totalAccountValue: totalAccountValue,
                                        maxAccountValue: maxAccountValue,
                                    });
                            }

                            usernames = [
                                ...usernames,
                                {
                                    username: docData.userName,
                                    accountValue: totalAccountValue,
                                    maxAccountValue: maxAccountValue,
                                },
                            ];
                        });
                }

                await db
                    .collection('leaderboard')
                    .doc('leaderboard')
                    .set({
                        leaderboard: usernames,
                    });
            });
        // }

        return null;
    });
