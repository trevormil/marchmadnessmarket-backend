const { db, firestoreRef } = require('./admin');

const isEmail = (email) => {
    const emailRegEx =
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (email.match(emailRegEx)) return true;
    else return false;
};

const isEmpty = (string) => {
    if (string.trim() === '') {
        return true;
    } else return false;
};

var types = {
    get: function (prop) {
        return Object.prototype.toString.call(prop);
    },
    null: '[object Null]',
    object: '[object Object]',
    array: '[object Array]',
    string: '[object String]',
    boolean: '[object Boolean]',
    number: '[object Number]',
    date: '[object Date]',
};

const isType = (data, expectedType) => {
    return types.get(data) == types[expectedType];
};

exports.validateSignUpData = (newUser) => {
    let errors = {};
    if (isEmpty(newUser.email)) {
        errors.email = 'E-mail is empty';
    } else if (!isEmail(newUser.email)) {
        errors.email = 'E-mail must be valid e-mail address';
    }

    if (isEmpty(newUser.password)) {
        errors.password = 'Password must not be empty';
    }
    if (newUser.password !== newUser.confirmPassword) {
        errors.confirmPassword = 'Passwords must match';
    }
    if (isEmpty(newUser.userName)) {
        errors.userName = 'Username must not be empty';
    }
    let regExp = new RegExp(/^[a-zA-Z0-9]+$/);
    if (regExp.test(newUser.userName) == false) {
        errors.userName = 'Username must be alphanumeric';
    }

    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false,
    };
};

exports.validateLogInData = (user) => {
    let errors = {};

    if (isEmpty(user.email)) errors.email = 'E-mail must not be empty';
    if (isEmpty(user.password)) errors.password = 'Password must not be empty';

    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false,
    };
};

exports.validateStockDetails = (stock) => {
    let errors = {};
    if (!isType(stock.seed, 'number') || stock.seed < 0) {
        errors.seed = stock.seed;
    }
    if (!isType(stock.stockName, 'string') || isEmpty(stock.stockName)) {
        errors.stockName = stock.stockName;
    }
    if (!isType(stock.bio, 'string') || isEmpty(stock.bio)) {
        errors.bio = stock.bio;
    }
    if (!isType(stock.imageUrl, 'string') || isEmpty(stock.imageUrl)) {
        errors.imageUrl = stock.imageUrl;
    }

    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false,
    };
};

//gets rid of any extra properties in the request body
exports.reduceStockDetails = (stock) => {
    let stockDetails = {
        price: 1,
        float: 0,
        stockName: stock.stockName,
        bio: stock.bio,
        dateCreated: firestoreRef.Timestamp.now(),
        ipoPrice: 1,
        seed: stock.seed,
        currPoints: 0,
        imageUrl: stock.imageUrl,
    };
    return stockDetails;
};

exports.validateTradeDetails = (trade, buy) => {
    let errors = {};
    if (!(typeof buy == 'boolean')) {
        errors.buy = "Buy isn't a boolean.";
    }
    if (!isType(trade.sharesPrice, 'number') || trade.sharesPrice <= 0) {
        errors.sharesPrice = trade.sharesPrice;
    }
    if (
        !isType(trade.sharesTraded, 'number') ||
        trade.sharesTraded <= 0 ||
        trade.sharesTraded != Math.round(trade.sharesTraded)
    ) {
        errors.sharesTraded = trade.sharesTraded;
    }
    if (!isType(trade.stockId, 'string') || isEmpty(trade.stockId)) {
        errors.stockId = trade.stockId;
    }

    return {
        errors,
        valid: Object.keys(errors).length === 0 ? true : false,
    };
};

//gets rid of extra properties in the request body
exports.reduceUserDetails = (data) => {
    let userDetails = {};

    if (!isEmpty(data.bio)) userDetails.bio = data.bio;
    if (!isEmpty(data.phoneNum)) userDetails.phoneNum = data.phoneNum;
    if (!isEmpty(data.createdAt)) userDetails.createdAt = data.createdAt;
    if (!isEmpty(data.accountBalance))
        userDetails.accountBalance = data.accountBalance;

    return userDetails;
};

//validates stock id exists
exports.validateStockId = (trade) => {
    return db
        .collection('stocks')
        .doc(trade.stockId)
        .get()
        .then((doc) => {
            if (!doc.exists) {
                return res
                    .status(400)
                    .json({ stockId: "Stock Id doesn't exist" });
            } else {
                let docData = doc.data();
                trade.stockName = docData.stockName;
            }
        })
        .catch((err) => console.error(err));
};

exports.validateBalance = (buyingUserName, numShares, sharesPrice) => {
    return db
        .collection('users')
        .doc(buyingUserName)
        .get()
        .then((doc) => {
            if (doc.data().accountBalance < numShares * sharesPrice) {
                return Promise.reject('Account balance too low');
            } else {
                return Promise.resolve(doc.data());
            }
        })
        .catch((err) => {
            return Promise.reject(err.code);
        });
};

//validates user owns that amount of shares
exports.validateSharesOwned = (sellingUserName, stockId, numShares) => {
    return db
        .collection('users')
        .doc(sellingUserName)
        .collection('ownedStocks')
        .doc(stockId)
        .get()
        .then((doc) => {
            if (!doc.exists || doc.data().numShares < numShares) {
                return Promise.reject('Not enough shares owned');
            } else {
                return Promise.resolve(doc.data());
            }
        })
        .catch(() => {
            return Promise.reject();
        });
};

//validates that you can't buy your own trade up
exports.validateDifferentAccounts = (buyer, seller) => {
    if (buyer === seller) {
        return Promise.reject("Buyer and seller can't be same person");
    } else {
        return Promise.resolve();
    }
};
