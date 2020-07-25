const functions = require("firebase-functions");
const app = require("express")();
const cors = require("cors");
app.use(cors());

const {
  getAllStocks,
  createStock,
  getStockData,
  returnStockData,
  getStockHistory,
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
} = require("./handlers/trades");

const {
  signup,
  login,
  updateUserDetails,
  getUserDetails,
  getUserOwnedStocks,
  getAccountHistory,
  getTransactions,
} = require("./handlers/users");
const FBAuth = require("./utils/FBAuth");
const AdminAuth = require("./utils/AdminAuth");

//add authentications

//Stocks Routes
//add filtering
app.get("/stocks", FBAuth, getAllStocks);
app.get("/stocks/:stockId", FBAuth, getStockData, returnStockData);
app.post("/stocks", FBAuth, AdminAuth, createStock);
app.get("/stocks/:stockId/stockHistory", FBAuth, getStockHistory);

//Trades Routes
app.get("/trades/all/:stockId", FBAuth, getAllTradesForStock);
app.get("/trades/:tradeId", FBAuth, getTradeData, returnTradeDetails);
app.post("/trades", FBAuth, createTrade);
app.put(
  "/trades/:tradeId",
  FBAuth,
  getTradeData,
  validateTrade,
  updateTradeDetails,
  transferShares,
  updateStockDetails
); //still work to do w/ account balance, shares transfer and update high, low
app.delete("/trades/:tradeId", FBAuth, removeTrade);

//User Routes
app.post("/signup", signup);
app.post("/login", login);
app.get("/user", FBAuth, getUserDetails); //incomplete
app.get("/userStocks", FBAuth, getUserOwnedStocks);
app.get("/transactions", FBAuth, getTransactions);
app.get("/accountHistory", FBAuth, getAccountHistory);

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
