const functions = require("firebase-functions");
const { db, firestoreRef } = require("./utils/admin");
const app = require("express")();
const cors = require("cors");
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
} = require("./handlers/stocks");

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
} = require("./handlers/trades");

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
} = require("./handlers/users");
const { getAllScores } = require("./handlers/scores");
const FBAuth = require("./utils/FBAuth");
const AdminAuth = require("./utils/AdminAuth");

//add authentications

//Stocks Routes
const pubSub = async (req, res) => {
  const date = firestoreRef.Timestamp.now()
    .toDate()
    .toLocaleDateString()
    .toString();
  const dateId = date.replace("/", "").replace("/", "");
  const stockData = [];
  await db
    .collection("stocks")
    .get()
    .then((querySnapshot) => {
      querySnapshot.docs.forEach((doc) => {
        stockData.push(doc.data());
      });
    });

  stockData.forEach((docData) => {
    let updatedPrice = docData.currPoints == 0 ? 1 : docData.currPoints * 2;
    db.collection("stocks")
      .doc(docData.stockId)
      .collection("stockHistory")
      .doc(dateId)
      .set({
        value: docData.ipoPrice,
        time: date,
      });
    db.collection("stocks")
      .doc(docData.stockId)
      .update({
        ipoPrice: updatedPrice,
        volume: 0,
        open: docData.price,
        low: docData.price,
        high: docData.price,
        marketCap: docData.price * docData.float,
      });
  });

  return res.status(200).send(stockData);

  db.collection("users")
    .get()
    .then((res) => {
      res.forEach((user) => {
        const docData = user.data();
        let totalAccountValue = docData.accountBalance;
        db.collection("users")
          .doc(user.id)
          .collection("ownedStocks")
          .get()
          .then((resp) => {
            resp.forEach((doc) => {
              const ownedStockData = doc.data();
              totalAccountValue +=
                ownedStockData.numShares *
                stockData.find(
                  (stock) => stock.stockId === ownedStockData.stockId
                ).currPoints;
            });
          })
          .then(() => {
            db.collection("users").doc(user.id).update({
              totalAccountValue: totalAccountValue,
            });

            db.collection("users")
              .doc(user.id)
              .collection("accountHistory")
              .doc(dateId)
              .set({
                value: totalAccountValue,
                time: date,
              });
          });
      });
    });
  return null;
};

app.get("/test", pubSub);

app.get("/stocks", getAllStocks); //gets all stocks
app.get("/stocks/:stockId", FBAuth, getStockData, returnStockData); //gets specific stock by id
app.post("/stocks", FBAuth, AdminAuth, createStock); //creates a stock; admin auth only
app.post("/stocks/updateStandings", FBAuth, AdminAuth, updateStockStandings); //updates point values for each stock
app.get("/stocks/:stockId/stockHistory", FBAuth, getStockHistory); //gets the stock price history by id
app.put("/stocks/:stockId/buyIpo", FBAuth, ipoBuyStock); //allows user to instant buy a stock
app.put("/stocks/:stockId/sellIpo", FBAuth, ipoSellStock); //allows user to instant sell a stock

//Scores Routes
app.get("/scores", getAllScores); //allows user to instant sell a stock

//Trades Routes
app.get("/trades", FBAuth, getAllTrades); //get all transactions by stock id
app.get("/trades/all/:stockId", FBAuth, getAllTradesForStock); //get all transactions by stock id
app.get("/trades/:tradeId", FBAuth, getTradeData, returnTradeDetails); //get specific trade details by id
app.get("/userTrades", FBAuth, getAllTradesForUser); // gets all trades for user
app.post("/trades", FBAuth, createTrade); //creates a trade
app.put(
  "/trades/:tradeId",
  FBAuth,
  getTradeData,
  validateTrade,
  updateTradeDetails,
  transferShares,
  updateStockDetails
); //finalizes an already created trade if all validations are met
app.delete("/trades/:tradeId", FBAuth, removeTrade); //removes an active trade that isn't finalized

//User Routes
app.post("/signup", signup); //signs up a user
app.post("/login", login); //logs in a user
app.get("/user", FBAuth, getUserDetails); //gets user profile information
app.get("/userStocks", FBAuth, getUserOwnedStocks); //gets user's portfolio of stocks
app.get("/userStocks/:userId", FBAuth, getOtherUserOwnedStocks); //gets user's portfolio of stocks
app.get("/watchlist", FBAuth, getUserWatchlist); //gets user watchlist
app.post("/watchlist/:stockId", FBAuth, addToWatchlist); //adds a stock to their watchlist
app.delete("/watchlist/:stockId", FBAuth, removeFromWatchlist); //removes stock from user's watchlist
app.get("/transactions", FBAuth, getTransactions); //gets transactions for a user
app.get("/accountHistory", FBAuth, getAccountHistory); //gets account value history for a user
app.get("/leaderboard", FBAuth, getLeaderboard); //gets current leaderboard

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

/**
 * Auto updates necessary information every night at 12AM
 * Updates stock info, account values, and leaderboards
 */
exports.autoUpdate = functions.pubsub
  .schedule("0 0 * * *")
  .timeZone("America/New_York")
  .onRun(async (context) => {
    const date = firestoreRef.Timestamp.now()
      .toDate()
      .toLocaleDateString()
      .toString();
    const dateId = date.replace("/", "").replace("/", "");
    const stockData = [];
    await db
      .collection("stocks")
      .get()
      .then((querySnapshot) => {
        querySnapshot.docs.forEach((doc) => {
          stockData.push(doc.data());
        });
      });
    stockData.forEach((docData) => {
      let updatedPrice = docData.currPoints == 0 ? 1 : docData.currPoints * 2;
      db.collection("stocks")
        .doc(docData.stockId)
        .collection("stockHistory")
        .doc(dateId)
        .set({
          value: docData.ipoPrice,
          time: date,
        });

      db.collection("stocks")
        .doc(docData.stockId)
        .update({
          ipoPrice: updatedPrice,
          volume: 0,
          open: docData.price,
          low: docData.price,
          high: docData.price,
          marketCap: docData.price * docData.float,
        });
    });

    db.collection("users")
      .get()
      .then((res) => {
        res.forEach((user) => {
          const docData = user.data();
          let totalAccountValue = docData.accountBalance;
          db.collection("users")
            .doc(user.id)
            .collection("ownedStocks")
            .get()
            .then((resp) => {
              resp.forEach((doc) => {
                const ownedStockData = doc.data();
                totalAccountValue +=
                  ownedStockData.numShares *
                  stockData.find(
                    (stock) => stock.stockId === ownedStockData.stockId
                  ).currPoints;
              });
            })
            .then(() => {
              db.collection("users").doc(user.id).update({
                totalAccountValue: totalAccountValue,
              });

              db.collection("users")
                .doc(user.id)
                .collection("accountHistory")
                .doc(dateId)
                .set({
                  value: totalAccountValue,
                  time: date,
                });
            });
        });
      });
    return null;
  });

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
