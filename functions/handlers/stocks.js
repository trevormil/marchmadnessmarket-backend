const { db } = require("../utils/admin");

const {
  validateStockDetails,
  reduceStockDetails,
} = require("../utils/validators");

exports.getAllStocks = (req, res) => {
  db.collection("stocks")
    .orderBy("price", "desc")
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

exports.getStockData = (req, res, next) => {
  db.collection("stocks")
    .doc(req.params.stockId)
    .get()
    .then((doc) => {
      if (doc.exists) {
        req.stockData = doc.data();
        return next();
      } else return res.status(403).json({ general: "That ID doesn't exist." });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

exports.returnStockData = (req, res) => {
  return res.status(201).json(req.stockData);
};

exports.createStock = (req, res) => {
  const { valid, errors } = validateStockDetails(req.body);
  if (!valid) return res.status(400).json(errors);

  const newStock = reduceStockDetails(req.body);

  db.collection("stocks")
    .add(newStock)
    .then((doc) => {
      return res
        .status(200)
        .json({ message: `Stock ${doc.id} created successfully!` });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: "Something went wrong" });
    });
};
