const { db, firestoreRef } = require('../utils/admin');

const {
    validateStockDetails,
    reduceStockDetails,
    validateBalance,
    validateSharesOwned,
} = require('../utils/validators');

exports.setWinners = async (req, res) => {
    await db
        .collection('stocks')
        .orderBy('price', 'desc')
        .get()
        .then((data) => {
            let stocks = [];
            data.forEach(async (doc) => {
                await db
                    .collection('stocks')
                    .doc(doc.id)
                    .update({
                        hasLost: doc.data().currPoints == 0,
                        gamesLeft: 5,
                    });
            });

            return res.status(201).json({ message: 'Winners set' });
        })
        .catch((err) => console.error(err));
};

//gets all stocks
exports.getAllStocks = (req, res) => {
    db.collection('stocks')
        .orderBy('price', 'desc')
        .get()
        .then((data) => {
            let stocks = [];
            data.forEach((doc) => {
                stocks.push(doc.data());
            });
            return res.status(201).json(stocks);
        })
        .catch((err) => console.error(err));
};

//gets stock by id
exports.getStockData = (req, res, next) => {
    db.collection('stocks')
        .doc(req.params.stockId)
        .get()
        .then((doc) => {
            if (doc.exists) {
                req.stockData = doc.data();
                return next();
            } else
                return res
                    .status(403)
                    .json({ general: "That ID doesn't exist." });
        })
        .catch((err) => {
            console.error(err);
            return res.status(500).json({ error: err.code });
        });
};

//returns stock data
exports.returnStockData = (req, res) => {
    return res.status(201).json(req.stockData);
};

//gets stock price history
exports.getStockHistory = (req, res) => {
    db.doc(`/stocks/${req.params.stockId}`)
        .collection('stockHistory')
        .get()
        .then((data) => {
            let stockHistory = [];
            data.forEach((doc) => {
                stockHistory.push(doc.data());
            });
            return res.status(201).json(stockHistory);
        })
        .catch((err) => {
            console.error(err);
            return res.status(400).json({ general: 'Something went wrong' });
        });
};

//creates a stock
exports.createStock = (req, res) => {
    const { valid, errors } = validateStockDetails(req.body);
    if (!valid) return res.status(400).json(errors);

    const newStock = reduceStockDetails(req.body);
    newStock.activeOrder = false;

    db.collection('stocks')
        .add(newStock)
        .then((doc) => {
            db.collection('stocks').doc(doc.id).update({ stockId: doc.id });
            return res
                .status(200)
                .json({ message: `Stock ${doc.id} created successfully!` });
        })
        .catch((err) => {
            console.error(err);
            return res.status(500).json({ error: 'Something went wrong' });
        });
};

//buys a stock at BIN price
exports.ipoBuyStock = async (req, res) => {
    const stockId = req.params.stockId;
    const numShares = req.body.numShares;
    let stockData;
    const buyingUserDoc = db.collection('users').doc(req.user.userName);

    if (numShares <= 0) {
        return res
            .status(400)
            .json({ error: 'Number of shares has to be greater than 0.' });
    }
    await Promise.all([
        db
            .collection('stocks')
            .doc(stockId)
            .get()
            .then((res) => {
                stockData = res.data();
                return Promise.resolve();
            }),
    ]);

    let buyerAvgBuyPrice = stockData.ipoPrice;
    let buyerSharesOwned = numShares;

    await Promise.all([
        validateBalance(req.user.userName, numShares, stockData.ipoPrice),

        // buyingUserDoc
        //     .collection('ownedStocks')
        //     .doc(stockId)
        //     .get()
        //     .then((doc) => {
        //         if (doc.exists) {
        //             buyerAvgBuyPrice = doc.data().avgBuyPrice;
        //             buyerSharesOwned = doc.data().numShares;
        //         }
        //         return Promise.resolve();
        //     }),
    ]).catch((err) => {
        console.error(err);
        return res.status(400).send('Error validating balance.');
    });

    Promise.all([
        db
            .collection('stocks')
            .doc(stockId)
            .update({
                float: firestoreRef.FieldValue.increment(numShares),
                // marketCap: (stockData.float + numShares) * stockData.price,
            }),

        buyingUserDoc.update({
            accountBalance: firestoreRef.FieldValue.increment(
                numShares * stockData.ipoPrice * -1
            ),
            // totalAccountValue: firestoreRef.FieldValue.increment(
            //     numShares * stockData.currPoints -
            //         stockData.ipoPrice * numShares
            // ),
        }),
        // buyingUserDoc.collection('transactionHistory').add({
        //     stockName: stockData.stockName,
        //     transactionValue: numShares * stockData.ipoPrice * -1,
        //     sharesTraded: numShares,
        //     sharesPrice: stockData.ipoPrice,
        //     dateAndTime: firestoreRef.Timestamp.now()
        //         .toDate()
        //         .toLocaleDateString(),
        // }),
    ]);
    buyingUserDoc
        .collection('ownedStocks')
        .doc(stockId)
        .update({
            numShares: firestoreRef.FieldValue.increment(numShares),
            stockId: stockId,
            stockName: stockData.stockName,
            avgBuyPrice:
                (buyerAvgBuyPrice * buyerSharesOwned +
                    numShares * stockData.ipoPrice) /
                (buyerSharesOwned + numShares),
        })
        .catch(() => {
            buyingUserDoc
                .collection('ownedStocks')
                .doc(stockId)
                .set({
                    numShares: firestoreRef.FieldValue.increment(numShares),
                    stockId: stockId,
                    stockName: stockData.stockName,
                    avgBuyPrice: buyerAvgBuyPrice,
                });
        });
    // db.collection('stocks')
    //     .doc(stockId)
    //     .update({
    //         volume: firestoreRef.FieldValue.increment(numShares),
    //     });
    return res.status(201).json({ general: 'Success' });
};

//sells a stock at half the BIN price
exports.ipoSellStock = async (req, res) => {
    const stockId = req.params.stockId;
    const numShares = req.body.numShares;
    if (numShares <= 0) {
        return res
            .status(400)
            .json({ error: 'Number of shares has to be greater than 0.' });
    }
    let stockData;
    const sellingUserDoc = db.collection('users').doc(req.user.userName);

    await Promise.all([
        db
            .collection('stocks')
            .doc(stockId)
            .get()
            .then((res) => {
                stockData = res.data();
                return Promise.resolve();
            }),
    ]);

    let sellerAvgBuyPrice = stockData.ipoPrice;
    let sellerSharesOwned = 0;

    await Promise.all([
        validateSharesOwned(req.user.userName, stockId, numShares),

        // sellingUserDoc
        //     .collection('ownedStocks')
        //     .doc(stockId)
        //     .get()
        //     .then((doc) => {
        //         if (doc.exists) {
        //             sellerAvgBuyPrice = doc.data().avgBuyPrice;
        //             sellerSharesOwned = doc.data().numShares;
        //             return Promise.resolve();
        //         } else return Promise.reject();
        //     }),
    ]).catch((err) => {
        console.error(err);
        return res.status(400).send('Error validating shares owned.');
    });

    Promise.all([
        db
            .collection('stocks')
            .doc(stockId)
            .update({
                float: firestoreRef.FieldValue.increment(numShares * -1),
                // marketCap: (stockData.float + numShares) * stockData.price,
            }),
        sellingUserDoc.update({
            accountBalance: firestoreRef.FieldValue.increment(
                numShares * stockData.ipoPrice
            ),
            // totalAccountValue: firestoreRef.FieldValue.increment(
            //     numShares * (stockData.ipoPrice / 2) -
            //         numShares * stockData.currPoints
            // ),
        }),
        // sellingUserDoc.collection('transactionHistory').add({
        //     stockName: stockData.stockName,
        //     transactionValue: numShares * (stockData.ipoPrice / 2),
        //     sharesTraded: numShares,
        //     sharesPrice: stockData.ipoPrice,
        //     dateAndTime: firestoreRef.Timestamp.now()
        //         .toDate()
        //         .toLocaleDateString(),
        // }),
    ]);
    // if (sellerSharesOwned - numShares <= 0) {
    //     sellingUserDoc.collection('ownedStocks').doc(stockId).delete();
    // } else {
    sellingUserDoc
        .collection('ownedStocks')
        .doc(stockId)
        .update({
            numShares: firestoreRef.FieldValue.increment(numShares * -1),
            stockId: stockId,
            stockName: stockData.stockName,
            avgBuyPrice:
                (sellerAvgBuyPrice * sellerSharesOwned -
                    numShares * stockData.ipoPrice) /
                (sellerSharesOwned - numShares),
        });
    // }

    // db.collection('stocks')
    //     .doc(stockId)
    //     .update({
    //         // ipoPrice: firestoreRef.FieldValue.increment(
    //         //     ((numShares * stockData.ipoPrice) / 1000) * -1
    //         // ),
    //         volume: firestoreRef.FieldValue.increment(numShares),
    //     });
    return res.status(201).json({ general: 'Success' });
};

//update points value for all teams
exports.updateStockStandings = async (req, res) => {
    let teamArr = [];
    let splitStr = req.body.split(',');
    let allStockArr = [];
    await db
        .collection('stocks')
        .get()
        .then((query) => {
            query.forEach((stock) =>
                allStockArr.push({
                    id: stock.id,
                    stockName: stock.data().stockName,
                    seed: stock.data().seed,
                })
            );
        });

    splitStr.forEach((team) => {
        team = team.replace('\r\n', '');
        teamArr.push(team);
        allStockArr.forEach(async (stock) => {
            if (stock.stockName === team) {
                await db
                    .collection('stocks')
                    .doc(stock.id)
                    .update({
                        currPoints: firestoreRef.FieldValue.increment(
                            stock.seed
                        ),
                    })
                    .catch((err) => {
                        console.error(err);
                        return Promise.reject();
                    });
            }
        });
    });
    return res.send(teamArr);
    /*

  NFL Standing Updates w/ Web Scraper from NFL.com
  let teamArr = [];
  let splitStr = req.body.split("*");
  splitStr.shift();
  let count = 1;
  let allStockArr = [];
  await db
    .collection("stocks")
    .get()
    .then((query) => {
      query.forEach((stock) =>
        allStockArr.push({ id: stock.id, stockName: stock.data().stockName })
      );
    });

  splitStr.forEach((team) => {
    team = team.replace("\r\n", "");
    teamArr.push(team);
    allStockArr.forEach(async (stock) => {
      if (stock.stockName === team) {
        await db
          .collection("stocks")
          .doc(stock.id)
          .update({
            currPoints: getPoints(count),
          })
          .catch((err) => {
            console.error(err);
            return Promise.reject();
          });
      }
    });
    count++;
  });
  return res.send(teamArr);*/
};

const getPoints = (rank) => {
    if (rank === 1) return 10;
    else if (rank === 2) return 8;
    else if (rank <= 4) return 6;
    else if (rank <= 14) return 4;
    else if (rank <= 22) return 2;
    else return 0;
};
