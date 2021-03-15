const { db, firestoreRef } = require("../utils/admin");
const {
  validateTradeDetails,
  validateStockId,
  validateBalance,
  validateSharesOwned,
  validateDifferentAccounts,
} = require("../utils/validators");

//gets trade data by id
exports.getTradeData = (req, res, next) => {
  db.collection("trades")
    .doc(req.params.tradeId)
    .get()
    .then((doc) => {
      let docData = doc.data();
      if (doc.exists) {
        req.tradeData = docData;
        return next();
      } else {
        return res.status(403).json({
          general: "That trade ID doesn't exist",
        });
      }
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

//gets all trades for a specific stock
exports.getAllTradesForStock = (req, res) => {
  db.collection("trades")
    .where("stockId", "==", req.params.stockId)
    .get()
    .then((doc) => {
      let dataArr = [];
      doc.forEach((doc) => {
        dataArr.push(doc.data());
      });
      return res.status(201).json(dataArr);
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
//gets all trades for a user
exports.getAllTrades = (req, res) => {
  db.collection("trades")
    .where("completed", "==", false)
    .get()
    .then((query) => {
      let dataArr = [];
      query.forEach((doc) => {
        const docData = doc.data();
        if (docData.sellingUserId !== req.user.uid) dataArr.push(docData);
      });
      return res.status(201).json(dataArr);
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
//gets all trades for a user
exports.getAllTradesForUser = (req, res) => {
  db.collection("trades")
    .where("completed", "==", false)
    .get()
    .then((query) => {
      let dataArr = [];
      query.forEach((doc) => {
        const docData = doc.data();
        if (
          docData.buyingUserId === req.user.uid ||
          docData.sellingUserId === req.user.uid
        )
          dataArr.push(docData);
      });
      return res.status(201).json(dataArr);
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

//returns trade details
exports.returnTradeDetails = (req, res) => {
  if (
    req.tradeData.buyingUserId == req.user.uid ||
    req.tradeData.sellingUserId == req.user.uid
  ) {
    return res.status(201).json(req.tradeData);
  } else
    return res.status(403).json({
      general: "You are not authorized to view this trade.",
    });
};

//creates a trade
exports.createTrade = (req, res, next) => {
  let newTrade = {
    stockId: req.body.stockId,
    dateCreated: firestoreRef.Timestamp.now().toDate().toLocaleDateString(),
    dateFinalized: null,
    sharesPrice: req.body.sharesPrice,
    sharesTraded: req.body.sharesTraded,
    completed: false,
  };

  const { valid, errors } = validateTradeDetails(newTrade, req.body.buy);
  if (!valid) return res.status(400).json(errors);

  let validAccount;
  if (req.body.buy == true) {
    validAccount = validateBalance(
      req.user.userName,
      newTrade.sharesTraded,
      newTrade.sharesPrice
    );
    newTrade.buyingUserId = req.user.uid;
    newTrade.buyingUserName = req.user.userName;
    newTrade.sellingUserId = null;
    newTrade.sellingUserName = null;
  } else {
    validAccount = validateSharesOwned(
      req.user.userName,
      newTrade.stockId,
      newTrade.sharesTraded
    );
    newTrade.sellingUserId = req.user.uid;
    newTrade.sellingUserName = req.user.userName;
    newTrade.buyingUserId = null;
    newTrade.buyingUserName = null;
  }

  Promise.all([validAccount, validateStockId(newTrade)])
    .then(() => {
      db.collection("trades")
        .add(newTrade)
        .then((doc) => {
          db.collection("trades").doc(doc.id).update({ tradeId: doc.id });

          db.collection("stocks")
            .doc(req.body.stockId)
            .update({ activeOrder: true });

          return res
            .status(200)
            .send({ general: `Trade ${doc.id} updated successfully!` });
        });
    })
    .catch((err) => {
      console.log(err);
      return res.status(400).json({ error: "Error validating trade." });
    });
};

//validates trade is able to go through
//proper account balance and owned shares are owned
exports.validateTrade = (req, res, next) => {
  if (req.tradeData.completed)
    return res.status(400).send("Trade already completed");

  let dateFrom = ["19/03/2021", "27/03/2021", "03/04/2021"];
  let dateTo = ["23/03/2021", "31/03/2021", "20/04/2021"];
  let currDate = new Date();
  let dateCheck =
    currDate.getDate() +
    "/" +
    (currDate.getMonth() + 1) +
    "/" +
    currDate.getFullYear();

  let i = 0;
  let invalidDate = false;
  dateFrom.forEach((date) => {
    let d1 = date.split("/");
    let d2 = dateTo[i].split("/");
    let c = dateCheck.split("/");

    let from = new Date(d1[2], parseInt(d1[1]) - 1, d1[0]); // -1 because months are from 0 to 11
    let to = new Date(d2[2], parseInt(d2[1]) - 1, d2[0]);
    let check = new Date(c[2], parseInt(c[1]) - 1, c[0]);

    if (check >= from && check <= to) {
      invalidDate = true;
    }
    i++;
  });
  if (invalidDate) {
    return res
      .status(400)
      .send("Buying is forbidden today because there are ongoing games!");
  }
  let updateDetails = {
    dateFinalized: firestoreRef.Timestamp.now().toDate().toLocaleDateString(),
  };

  if (req.tradeData.buyingUserId == null) {
    updateDetails.buyingUserId = req.user.uid;
    req.tradeData.buyingUserId = req.user.uid;
    updateDetails.buyingUserName = req.user.userName;
    req.tradeData.buyingUserName = req.user.userName;
  } else if (req.tradeData.sellingUserId == null) {
    updateDetails.sellingUserId = req.user.uid;
    req.tradeData.sellingUserId = req.user.uid;
    updateDetails.sellingUserName = req.user.userName;
    req.tradeData.sellingUserName = req.user.userName;
  }

  updateDetails.completed = true;
  req.updateDetails = updateDetails;

  Promise.all([
    validateDifferentAccounts(
      req.tradeData.buyingUserName,
      req.tradeData.sellingUserName
    ),
    validateBalance(
      req.tradeData.buyingUserName,
      req.tradeData.sharesTraded,
      req.tradeData.sharesPrice,
      req.buyingUserInfo
    ),
    validateSharesOwned(
      req.tradeData.sellingUserName,
      req.tradeData.stockId,
      req.tradeData.numShares,
      req.sellerUserInfo
    ),
  ])
    .then((values) => {
      req.buyingUserInfo = values[1];
      req.sellerUserInfo = values[2];
      return next();
    })
    .catch((err) => {
      console.error(err);
      return res.status(400).send("Error validating trade.");
    });
};

//updates a trade with finalized details
exports.updateTradeDetails = (req, res, next) => {
  db.collection("trades")
    .doc(req.params.tradeId)
    .update(req.updateDetails)
    .then(() => {
      return next();
    });
};

//transfers shares between accounts
exports.transferShares = (req, res, next) => {
  const buyingUserDoc = db
    .collection("users")
    .doc(req.tradeData.buyingUserName);
  const sellingUserDoc = db
    .collection("users")
    .doc(req.tradeData.sellingUserName);

  let buyerAvgBuyPrice = req.tradeData.sharesPrice;
  let buyerSharesOwned = req.tradeData.sharesTraded;
  let sellerAvgBuyPrice = req.tradeData.sharesPrice;
  let sellerSharesOwned = req.tradeData.sharesTraded;
  let buyerAccountBalance = req.buyingUserInfo.accountBalance;
  let sellerAccountBalance = req.sellerUserInfo.accountBalance;
  const costOfTrade = req.tradeData.sharesTraded * req.tradeData.sharesPrice;
  const sharesTraded = Number(req.tradeData.sharesTraded);

  const setSellerDoc = () => {
    if (sellerSharesOwned - req.tradeData.sharesTraded !== 0) {
      sellingUserDoc
        .collection("ownedStocks")
        .doc(req.tradeData.stockId)
        .update({
          numShares: firestoreRef.FieldValue.increment(sharesTraded * -1),
          stockId: req.tradeData.stockId,
          stockName: req.tradeData.stockName,
          avgBuyPrice:
            (sellerAvgBuyPrice * sellerSharesOwned -
              req.tradeData.sharesTraded * req.tradeData.sharesPrice) /
            (sellerSharesOwned - req.tradeData.sharesTraded),
        });
    } else {
      sellingUserDoc
        .collection("ownedStocks")
        .doc(req.tradeData.stockId)
        .delete();
    }
  };

  Promise.all([
    buyingUserDoc
      .collection("ownedStocks")
      .doc(req.tradeData.stockId)
      .get()
      .then((doc) => {
        if (doc.exists) {
          buyerAvgBuyPrice = doc.data().avgBuyPrice;
          buyerSharesOwned = doc.data().numShares;
        }
      }),
    sellingUserDoc
      .collection("ownedStocks")
      .doc(req.tradeData.stockId)
      .get()
      .then((doc) => {
        if (doc.exists) {
          sellerAvgBuyPrice = doc.data().avgBuyPrice;
          sellerSharesOwned = doc.data().numShares;
        }
      }),
  ]).then(() => {
    Promise.all([
      buyingUserDoc.update({
        accountBalance: firestoreRef.FieldValue.increment(costOfTrade * -1),
      }),

      buyingUserDoc.collection("transactionHistory").add({
        tradeId: req.params.tradeId,
        stockName: req.tradeData.stockName,
        transactionValue: costOfTrade * -1,
        sharesTraded: req.tradeData.sharesTraded,
        sharesPrice: req.tradeData.sharesPrice,
        dateAndTime: firestoreRef.Timestamp.now().toDate().toLocaleDateString(),
      }),

      buyingUserDoc
        .collection("ownedStocks")
        .doc(req.tradeData.stockId)
        .update({
          numShares: firestoreRef.FieldValue.increment(sharesTraded),
          stockName: req.tradeData.stockName,
          stockId: req.tradeData.stockId,
          avgBuyPrice:
            (buyerAvgBuyPrice * buyerSharesOwned +
              req.tradeData.sharesTraded * req.tradeData.sharesPrice) /
            (buyerSharesOwned + req.tradeData.sharesTraded),
        })
        .catch(() => {
          buyingUserDoc
            .collection("ownedStocks")
            .doc(req.tradeData.stockId)
            .set({
              numShares: sharesTraded,
              stockName: req.tradeData.stockName,
              stockId: req.tradeData.stockId,
              avgBuyPrice: buyerAvgBuyPrice,
            });
        }),
    ])
      .then(() => {
        Promise.all([
          sellingUserDoc.update({
            accountBalance: firestoreRef.FieldValue.increment(costOfTrade),
          }),

          sellingUserDoc.collection("transactionHistory").add({
            tradeId: req.params.tradeId,
            stockName: req.tradeData.stockName,
            transactionValue: costOfTrade,
            sharesTraded: req.tradeData.sharesTraded,
            sharesPrice: req.tradeData.sharesPrice,
            dateAndTime: firestoreRef.Timestamp.now()
              .toDate()
              .toLocaleDateString(),
          }),
          setSellerDoc(),
        ]);
      })
      .then(() => {
        return next();
      })
      .catch((err) => {
        return res
          .status(500)
          .json({ error: "Something wrong with the transferring" });
      });
  });
};

//updates the stock details to reflect the trade that just happened
exports.updateStockDetails = (req, res) => {
  let availableTrade = false;
  db.collection("trades")
    .where("stockId", "==", req.tradeData.stockId)
    .get()
    .then((query) => {
      query.forEach((trade) => {
        if (trade.data().completed === false) {
          availableTrade = true;
        }
      });
    })
    .then(() => {
      db.collection("stocks")
        .doc(req.tradeData.stockId)
        .get()
        .then((stock) => {
          let high = stock.data().high,
            low = stock.data().low,
            open = stock.data().open,
            ipoPrice = stock.data().ipoPrice;
          if (req.tradeData.sharesPrice > high) {
            high = req.tradeData.sharesPrice;
          } else if (req.tradeData.sharesPrice < low) {
            low = req.tradeData.sharesPrice;
          }
          const date = firestoreRef.Timestamp.now()
            .toDate()
            .toLocaleDateString()
            .toString();
          const dateId = date.replace("/", "").replace("/", "");
          Promise.all([
            db
              .collection("stocks")
              .doc(req.tradeData.stockId)
              .update({
                price: req.tradeData.sharesPrice,
                volume: firestoreRef.FieldValue.increment(
                  req.tradeData.sharesTraded
                ),
                high: high,
                low: low,
                activeOrder: availableTrade,
                /*
                ipoPrice: firestoreRef.FieldValue.increment(
                  (req.tradeData.sharesPrice - ipoPrice) / 10
                ),*/
              }),

            db
              .collection("stocks")
              .doc(req.tradeData.stockId)
              .collection("stockHistory")
              .doc(dateId)
              .set({
                value: req.tradeData.sharesPrice,
                time: date,
              }),
          ]);
        })
        .then(() => {
          return res.status(200).json({
            general: `Stock ${req.tradeData.stockId} and trade ${req.params.tradeId} updated successfully!`,
          });
        })
        .catch((values) => {
          return res.status(400).json({ error: "Something went wrong" });
        });
    });
};

//removes an unfinalized trade
exports.removeTrade = (req, res) => {
  const tradeDoc = db.collection("trades").doc(req.params.tradeId);
  let docData;
  tradeDoc.get().then((doc) => {
    docData = doc.data();
    if (
      doc.exists &&
      (docData.buyingUserId == req.user.uid ||
        docData.sellingUserId == req.user.uid) &&
      !docData.completed
    ) {
      tradeDoc
        .delete()
        .then(() => {
          let activeOrder = false;
          db.collection("trades")
            .where("stockId", "==", docData.stockId)
            .get()
            .then((query) => {
              query.forEach((trade) => {
                if (trade.data().completed == false) {
                  activeOrder = true;
                }
              });
            })
            .then(() => {
              if (!activeOrder) {
                db.collection("stocks")
                  .doc(docData.stockId)
                  .update({ activeOrder: false });
              }
            })
            .then(() => {
              return res.status(200).json({ general: "Deleted successfully!" });
            });
        })
        .catch((err) => {
          console.error(err);
          return res.status(500).json({ error: err.code });
        });
    } else {
      return res.status(403).json({
        general: "Trade couldn't be deleted.",
      });
    }
  });
};
