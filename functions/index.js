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
} = require("./handlers/trades");

const {
  signup,
  login,
  updateUserDetails,
  getUserDetails,
  getUserOwnedStocks,
  getAccountHistory,
  getTransactions,
  getUserWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  getLeaderboard,
} = require("./handlers/users");
const FBAuth = require("./utils/FBAuth");
const AdminAuth = require("./utils/AdminAuth");

//add authentications

//Stocks Routes
//add filtering
app.get("/stocks", getAllStocks);
app.get("/stocks/:stockId", FBAuth, getStockData, returnStockData);
app.post("/stocks", FBAuth, AdminAuth, createStock);
app.post("/stocks/updateStandings", FBAuth, AdminAuth, updateStockStandings);
app.get("/stocks/:stockId/stockHistory", FBAuth, getStockHistory);
app.put("/stocks/:stockId/buyIpo", FBAuth, ipoBuyStock);
app.put("/stocks/:stockId/sellIpo", FBAuth, ipoSellStock);

//Trades Routes
app.get("/trades/all/:stockId", FBAuth, getAllTradesForStock);
app.get("/trades/:tradeId", FBAuth, getTradeData, returnTradeDetails);
app.get("/userTrades", FBAuth, getAllTradesForUser);
app.post("/trades", FBAuth, createTrade);
app.put(
  "/trades/:tradeId",
  FBAuth,
  getTradeData,
  validateTrade,
  updateTradeDetails,
  transferShares,
  updateStockDetails
);
app.delete("/trades/:tradeId", FBAuth, removeTrade);

//User Routes
app.post("/signup", signup);
app.post("/login", login);
app.get("/user", FBAuth, getUserDetails); //incomplete
app.get("/userStocks", FBAuth, getUserOwnedStocks);
app.get("/watchlist", FBAuth, getUserWatchlist);
app.post("/watchlist/:stockId", FBAuth, addToWatchlist);
app.delete("/watchlist/:stockId", FBAuth, removeFromWatchlist);
app.get("/transactions", FBAuth, getTransactions);
app.get("/accountHistory", FBAuth, getAccountHistory);
app.get("/leaderboard", FBAuth, getLeaderboard);

//app.put("/user", FBAuth, updateUserDetails); //incomplete
//to implement
/*
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

exports.autoUpdate = functions.pubsub
  .schedule("0 0 * * *")
  .timeZone("America/New_York")
  .onRun((context) => {
    const date = firestoreRef.Timestamp.now()
      .toDate()
      .toLocaleDateString()
      .toString();
    const dateId = date.replace("/", "").replace("/", "");
    const stockData = [];
    Promise.all([
      db
        .collection("stocks")
        .get()
        .then((res) => {
          res.forEach((stock) => {
            const docData = stock.data();
            stockData.push(docData);
            db.collection("stocks")
              .doc(stock.id)
              .collection("stockHistory")
              .doc(dateId)
              .set({
                value: docData.ipoPrice,
                time: date,
              });
            db.collection("stocks")
              .doc(stock.id)
              .update({
                volume: 0,
                open: docData.price,
                low: docData.price,
                high: docData.price,
                marketCap: docData.price * docData.float,
              });
          });
        }),
    ]);

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
