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
    getStockHistory,
    ipoBuyStock,
    ipoSellStock,
    updateStockStandings,
    setWinners,
} = require('./handlers/stocks');

const {
    createTrade,
    getTradeData,
    updateTradeDetails,
    returnTradeDetails,
    updateStockDetails,
    removeTrade,
    transferShares,
    validateTrade,
    getAllTradesForStock,
    getAllTradesForUser,
    getAllTrades,
} = require('./handlers/trades');

const {
    signup,
    login,
    updateUserDetails,
    getUserDetails,
    getUserOwnedStocks,
    getOtherUserOwnedStocks,
    getAccountHistory,
    getTransactions,
    getUserWatchlist,
    addToWatchlist,
    removeFromWatchlist,
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

//Trades Routes
// app.get('/trades', FBAuth, getAllTrades); //get all transactions by stock id
// app.get('/trades/all/:stockId', FBAuth, getAllTradesForStock); //get all transactions by stock id
// app.get('/trades/:tradeId', FBAuth, getTradeData, returnTradeDetails); //get specific trade details by id
// app.get('/userTrades', FBAuth, getAllTradesForUser); // gets all trades for user
// app.post('/trades', FBAuth, createTrade); //creates a trade
// app.put(
//     '/trades/:tradeId',
//     FBAuth,
//     getTradeData,
//     validateTrade,
//     updateTradeDetails,
//     transferShares,
//     updateStockDetails
// ); //finalizes an already created trade if all validations are met
// app.delete('/trades/:tradeId', FBAuth, removeTrade); //removes an active trade that isn't finalized

//User Routes
app.post('/signup', signup); //signs up a user
app.post('/login', login); //logs in a user
app.get('/user', FBAuth, getUserDetails); //gets user profile information
app.get('/userStocks', FBAuth, getUserOwnedStocks); //gets user's portfolio of stocks
app.get('/userStocks/:userId', getOtherUserOwnedStocks); //gets user's portfolio of stocks
// app.get('/watchlist', FBAuth, getUserWatchlist); //gets user watchlist
// app.post('/watchlist/:stockId', FBAuth, addToWatchlist); //adds a stock to their watchlist
// app.delete('/watchlist/:stockId', FBAuth, removeFromWatchlist); //removes stock from user's watchlist
// app.get('/transactions', FBAuth, getTransactions); //gets transactions for a user
// app.get('/accountHistory', FBAuth, getAccountHistory); //gets account value history for a user
app.get('/leaderboard', getLeaderboard); //gets current leaderboard

app.get('/setWinners', setWinners);

//to implement
/*
//app.put("/user", FBAuth, updateUserDetails); //incomplete
app.post("/user/:userId/acccountValue", FBAuth, updateAccountValue);
app.get("/user/:userId/acccountValue", FBAuth, getAccountValue);
app.get("user/:userId/ownedStocks", FBAuth, getOwnedStocks);
app.post("user/:userId/ownedStocks", FBAuth, addOwnedStock);
app.delete("user/:userId/ownedStocks", FBAuth, removeOwnedStock);
app.get("user/:userId/transactionHistory", FBAuth, getTransactionHistory);
app.post("user/:userId/transactionHistory", FBAuth, addTransactionHistory);
app.delete("user/:userId/transactionHistory", FBAuth, removeTransactionHistory);
app.get("user/:userId/watchlist", FBAuth, getWatchlist);
app.post("user/:userId/watchlist", FBAuth, addToWatchlist);
app.delete("user/:userId/watchlist", FBAuth, removeFromWatchlist);
app.get("user/:userId/alerts", FBAuth, getAlerts);
app.post("user/:userId/alerts", FBAuth, addAlert);
app.delete("user/:userId/alerts", FBAuth, removeAlert);
app.get("user/:userId/notes", FBAuth, getNotes);
app.post("user/:userId/notes", FBAuth, addNote);
app.delete("user/:userId/notes", FBAuth, removeNote);
app.delete("/user/:userId", FBAuth, deleteUser);
*/

exports.api = functions.https.onRequest(app);

// exports.autoUpdateStocks = functions.pubsub
//     .schedule('10 0 * * *')
//     .timeZone('America/New_York')
//     .onRun(async (context) => {
//         const date = firestoreRef.Timestamp.now()
//             .toDate()
//             .toLocaleDateString()
//             .toString();
//         const dateId = date.replace('/', '').replace('/', '');
//         const stockData = [];
//         await db
//             .collection('stocks')
//             .get()
//             .then((querySnapshot) => {
//                 querySnapshot.docs.forEach((doc) => {
//                     stockData.push(doc.data());
//                 });
//             });

//         stockData.forEach((docData) => {
//             console.log('Current Doc Data: ', docData.stockName);
//             let updatedPrice =
//                 docData.currPoints == 0 ? 1 : docData.currPoints * 2;
//             db.collection('stocks')
//                 .doc(docData.stockId)
//                 .update({
//                     ipoPrice: updatedPrice,
//                     volume: 0,
//                     open: docData.price,
//                     low: docData.price,
//                     high: docData.price,
//                     marketCap: docData.price * docData.float,
//                 });
//             console.log('Sent update to stock');
//         });
//         return null;
//     });

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

                                    const stock = stockData.find(
                                        (stock) =>
                                            stock.stockName === displayName
                                    );

                                    console.log('winner', winner);
                                    console.log('stock', stock);
                                    console.log('displayName', displayName);
                                    if (winner && stock) {
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
                        leaderboard: firestoreRef.FieldValue.arrayUnion(
                            ...usernames
                        ),
                    });
            });
        // }

        return null;
    });

// /**
//  * Auto updates necessary information every night at 12AM
//  * Updates stock info, account values, and leaderboards
//  */

// /**
//  * Auto updates necessary information every night at 12AM
//  * Updates stock info, account values, and leaderboards
//  */
// exports.autoUpdateStockHistory = functions.pubsub
//     .schedule('20 0 * * *')
//     .timeZone('America/New_York')
//     .onRun(async (context) => {
//         const date = firestoreRef.Timestamp.now()
//             .toDate()
//             .toLocaleDateString()
//             .toString();
//         const dateId = date.replace('/', '').replace('/', '');
//         const stockData = [];
//         await db
//             .collection('stocks')
//             .get()
//             .then((querySnapshot) => {
//                 querySnapshot.docs.forEach((doc) => {
//                     stockData.push(doc.data());
//                 });
//             });

//         stockData.forEach((docData) => {
//             let updatedPrice =
//                 docData.currPoints == 0 ? 1 : docData.currPoints * 2;
//             console.log('Current Doc Data: ', docData.stockName);

//             db.collection('stocks')
//                 .doc(docData.stockId)
//                 .collection('stockHistory')
//                 .doc(dateId)
//                 .set({
//                     value: docData.ipoPrice,
//                     time: date,
//                 });

//             console.log('Sent update to stockHistory');
//         });

//         return null;
//     });

/**
 * Auto updates necessary information every night at 12AM
 * Updates stock info, account values, and leaderboards
 */
/*
exports.autoUpdateWeekly = functions.pubsub
  .schedule("55 23 * * 2")
  .timeZone("America/New_York")
  .onRun((context) => {
    db.collection("users")
      .get()
      .then((res) => {
        res.forEach((user) => {
          db.collection("users")
            .doc(user.data().userName)
            .update({
              accountBalance: firestoreRef.FieldValue.increment(100),
            });
        });
      });
    return null;
  });
*/
