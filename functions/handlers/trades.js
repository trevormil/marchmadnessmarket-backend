const { db, firestoreRef } = require("../utils/admin");
const {
  validateTradeDetails,
  validateStockId,
  validateBalance,
  validateSharesOwned,
} = require("../utils/validators");

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

exports.createTrade = (req, res) => {
  let newTrade = {
    stockId: req.body.stockId,
    dateCreated: firestoreRef.Timestamp.now(),
    dateFinalized: null,
    sharesPrice: req.body.sharesPrice,
    sharesTraded: req.body.sharesTraded,
    completed: false,
  };

  if (typeof req.body.buy == "boolean") {
    if (req.body.buy == true) {
      validateBalance(
        req.user.userName,
        newTrade.sharesTraded,
        newTrade.sharesPrice,
        res
      );

      newTrade.buyingUserId = req.user.uid;
      newTrade.buyingUserName = req.user.userName;
      newTrade.sellingUserId = null;
      newTrade.sellingUserName = null;
    } else {
      validateSharesOwned(
        req.user.userName,
        newTrade.stockId,
        newTrade.sharesTraded,
        res
      );

      newTrade.sellingUserId = req.user.uid;
      newTrade.sellingUserName = req.user.userName;
      newTrade.buyingUserId = null;
      newTrade.buyingUserName = null;
    }
  } else {
    return res.status(400).send("No buy boolean in body.");
  }
  const { valid, errors } = validateTradeDetails(newTrade);
  if (!valid) return res.status(400).json(errors);

  validateStockId(newTrade);

  db.collection("trades")
    .add(newTrade)
    .then((doc) => {
      return res
        .status(200)
        .json({ message: `Trade ${doc.id} created successfully!` });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: "Something went wrong" });
    });
};

exports.validateTrade = (req, res, next) => {
  if (req.tradeData.completed) {
    return res.status(400).send("Trade already completed");
  }

  let updateDetails = {
    dateFinalized: firestoreRef.Timestamp.now(),
  };

  if (req.tradeData.buyingUserId == null) {
    updateDetails.buyingUserId = req.user.uid;
    updateDetails.buyingUserName = req.user.userName;
    req.tradeData.buyingUserId = req.user.uid;
    req.tradeData.buyingUserName = req.user.userName;
  } else if (req.tradeData.sellingUserId == null) {
    updateDetails.sellingUserId = req.user.uid;
    updateDetails.sellingUserName = req.user.userName;
    req.tradeData.buyingUserId = req.user.uid;
    req.tradeData.buyingUserName = req.user.userName;
  } else {
    return res.status(400).send("Trade already completed");
  }
  updateDetails.completed = true;
  req.updateDetails = updateDetails;

  validateBalance(
    req.tradeData.buyingUserName,
    req.tradeData.sharesTraded,
    req.tradeData.sharesPrice,
    res
  );
  validateSharesOwned(
    req.tradeData.sellingUserName,
    req.tradeData.stockId,
    req.tradeData.numShares,
    res
  );

  return next();
};

exports.updateTradeDetails = (req, res, next) => {
  db.collection("trades")
    .doc(req.params.tradeId)
    .update(req.updateDetails)
    .then(() => {
      return next();
    })
    .catch((err) => {
      console.error(err);
      if (err.code === "5") {
        return res.status(403).json({ error: "That Id doesn't exist." });
      } else return res.status(500).json({ error: err.code });
    });
};

exports.transferShares = (req, res, next) => {
  const buyingUserDoc = db
    .collection("users")
    .doc(req.tradeData.buyingUserName);
  const sellingUserDoc = db
    .collection("users")
    .doc(req.tradeData.sellingUserName);

  const costOfTrade = req.tradeData.sharesTraded * req.tradeData.sharesPrice;

  buyingUserDoc.update({
    accountBalance: firestoreRef.FieldValue.increment(costOfTrade * -1),
  });

  sellingUserDoc.update({
    accountBalance: firestoreRef.FieldValue.increment(costOfTrade),
  });

  buyingUserDoc.collection("transactionHistory").add({
    tradeId: req.params.tradeId,
    transactionValue: costOfTrade * -1,
    sharesTraded: req.tradeData.sharesTraded,
    sharesPrice: req.tradeData.sharesPrice,
    dateAndTime: firestoreRef.Timestamp.now(),
  });

  sellingUserDoc.collection("transactionHistory").add({
    tradeId: req.params.tradeId,
    transactionValue: costOfTrade,
    sharesTraded: req.tradeData.sharesTraded,
    sharesPrice: req.tradeData.sharesPrice,
    dateAndTime: firestoreRef.Timestamp.now(),
  });

  buyingUserDoc
    .collection("ownedStocks")
    .doc(req.tradeId.stockId)
    .set({
      numShares: firestoreRef.FieldValue.increment(req.tradeData.sharesTraded),
    });

  sellingUserDoc
    .collection("ownedStocks")
    .doc(req.tradeId.stockId)
    .set({
      numShares: firestoreRef.FieldValue.increment(
        req.tradeData.sharesTraded * -1
      ),
    });
  return next();
};

exports.updateStockDetails = (req, res) => {
  db.collection("stocks")
    .doc(req.tradeData.stockId)
    .update({
      price: req.tradeData.sharesPrice,
      volume: firestoreRef.FieldValue.increment(req.tradeData.sharesTraded),
    })
    .then(() => {
      return res.status(200).json({
        general: `Stock ${req.tradeData.stockId} and trade ${req.params.tradeId} updated successfully!`,
      });
    })
    .catch((err) => {
      console.error(err);
      if (err.code === "5") {
        return res.status(403).json({ error: "That Id doesn't exist." });
      } else return res.status(500).json({ error: err.code });
    });

  //add trading view chart updates here

  //calls function to update high, low, etc.
};

exports.removeTrade = (req, res) => {
  const tradeDoc = db.collection("trades").doc(req.params.tradeId);
  tradeDoc
    .get()
    .then((doc) => {
      let docData = doc.data();
      if (
        doc.exists &&
        (docData.buyingUserId == req.user.uid ||
          docData.sellingUserId == req.user.uid) &&
        !docData.completed
      ) {
        tradeDoc.delete();
        return res.status(200).json({
          general: `Trade ${req.params.tradeId} deleted successfully.`,
        });
      } else {
        return res.status(403).json({
          general: "Trade couldn't be deleted.",
        });
      }
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
