const { db, firestoreRef } = require('../utils/admin');
const firebaseConfig = require('../utils/config');
const firebase = require('firebase/compat/app');
require('firebase/compat/auth');
firebase.initializeApp(firebaseConfig);

const {
    validateSignUpData,
    validateLogInData,
    reduceUserDetails,
} = require('../utils/validators');

//signs up a user
exports.signup = (req, res) => {
    let newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        userName: req.body.userName,
        createdAt: firestoreRef.Timestamp.now().toDate().toLocaleDateString(),
        accountBalance: 1000,
        totalAccountValue: 0,
    };

    const { valid, errors } = validateSignUpData(newUser);
    if (!valid) return res.status(400).json(errors);

    let token, userId;

    //Validating users
    db.doc(`/users/${newUser.userName}`)
        .get()
        .then((doc) => {
            if (doc.exists) {
                return res
                    .status(400)
                    .json({ userName: 'This username is already taken' });
            } else {
                return firebase
                    .auth()
                    .createUserWithEmailAndPassword(
                        newUser.email,
                        newUser.password
                    );
            }
        })
        .then((data) => {
            userId = data.user.uid;
            return data.user.getIdToken();
        })
        .then((tokenId) => {
            token = tokenId;
            newUser.userId = userId;
            delete newUser.password;
            delete newUser.confirmPassword;
            return db
                .doc(`/users/${newUser.userName}`)
                .set(newUser)
                .then(() => {});
        })
        .then(() => {
            const date = firestoreRef.Timestamp.now()
                .toDate()
                .toLocaleDateString()
                .toString();
            const dateId = date.replace('/', '').replace('/', '');

            //   db.doc(`/users/${newUser.userName}`)
            //     .collection("accountHistory")
            //     .doc(dateId)
            //     .set({
            //       time: date,
            //       value: 500,
            //     });
        })
        .then(() => {
            return res.status(201).json({ token });
        })
        .catch((err) => {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                return res.status(400).json({ email: 'email already in use' });
            } else {
                return res.status(500).json({ error: err.code });
            }
        });
};

//logs in a user
exports.login = (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password,
    };

    const { valid, errors } = validateLogInData(user);
    if (!valid) return res.status(400).json(errors);

    firebase
        .auth()
        .signInWithEmailAndPassword(user.email, user.password)
        .then((data) => {
            return data.user.getIdToken();
        })
        .then((token) => {
            return res.json({ token });
        })
        .catch((err) => {
            console.error(err);
            if (err.code === 'auth/wrong-password') {
                return res
                    .status(403)
                    .json({ general: 'Wrong credentials. Please Try Again' });
            } else {
                return res.status(500).json({ error: err.code });
            }
        });
};

//gets user details
exports.getUserDetails = (req, res) => {
    db.doc(`/users/${req.user.userName}`)
        .get()
        .then((doc) => {
            if (doc.exists) {
                return res.status(201).json(doc.data());
            } else
                return res
                    .status(403)
                    .json({ general: "That User ID doesn't exist." });
        })
        .catch((err) => {
            res.status(500).json({ error: 'Something went wrong.' });
            console.error(err);
        });
};

//gets user owned stocks
exports.getUserOwnedStocks = (req, res) => {
    db.doc(`/users/${req.user.userName}`)
        .collection('ownedStocks')
        .get()
        .then((data) => {
            let stocks = [];
            data.forEach((doc) => {
                stocks.push(doc.data());
            });
            return res.status(201).json(stocks);
        })
        .catch((err) => {
            console.error(err);
            return res.status(404).json({ general: 'Something went wrong' });
        });
};

//gets user owned stocks
exports.getOtherUserOwnedStocks = (req, res) => {
    db.doc(`/users/${req.params.userId}`)
        .collection('ownedStocks')
        .get()
        .then((data) => {
            let stocks = [];
            data.forEach((doc) => {
                stocks.push(doc.data());
            });
            return res.status(201).json(stocks);
        })
        .catch((err) => {
            console.error(err);
            return res.status(404).json({ general: 'Something went wrong' });
        });
};

//gets a user's watchlist
exports.getUserWatchlist = (req, res) => {
    db.doc(`/users/${req.user.userName}`)
        .collection('watchlist')
        .get()
        .then((data) => {
            let stocks = [];
            data.forEach((doc) => {
                stocks.push(doc.data());
            });
            return res.status(201).json(stocks);
        })
        .catch((err) => {
            console.error(err);
            return res.status(404).json({ general: 'Something went wrong' });
        });
};

//gets current leaderboard
exports.getLeaderboard = (req, res) => {
    db.collection('users')
        .orderBy('totalAccountValue', 'desc')
        .get()
        .then((data) => {
            let leaderboardData = [];
            data.forEach((user) => {
                let dataDoc = user.data();
                leaderboardData.push({
                    userName: dataDoc.userName,
                    totalAccountValue: dataDoc.totalAccountValue,
                    accountBalance: dataDoc.accountBalance,
                });
            });
            return res.status(201).json(leaderboardData);
        })
        .catch((err) => {
            console.error(err);
            return res.status(404).json({ general: 'Something went wrong' });
        });
};

//adds a stock to watchlist
exports.addToWatchlist = (req, res) => {
    db.doc(`/users/${req.user.userName}`)
        .collection('watchlist')
        .doc(req.params.stockId)
        .set({
            stockId: req.params.stockId,
        })
        .then(() => {
            return res.status(200).json({ general: 'Success' });
        });
};

//removes from watchlist
exports.removeFromWatchlist = (req, res) => {
    db.doc(`/users/${req.user.userName}`)
        .collection('watchlist')
        .doc(req.params.stockId)
        .delete()
        .then(() => {
            return res.status(200).json({ general: 'Success' });
        });
};

//gets all transactions for a user
exports.getTransactions = (req, res) => {
    db.doc(`/users/${req.user.userName}`)
        .collection('transactionHistory')
        .orderBy('dateAndTime', 'desc')
        .get()
        .then((data) => {
            let transactions = [];
            data.forEach((doc) => {
                transactions.push(doc.data());
            });
            return res.status(201).json(transactions);
        })
        .catch((err) => {
            console.error(err);
            return res.status(404).json({ general: 'Something went wrong' });
        });
};

//gets a user's account history
exports.getAccountHistory = (req, res) => {
    db.doc(`/users/${req.user.userName}`)
        .collection('accountHistory')
        .get()
        .then((data) => {
            let accountHistory = [];
            data.forEach((doc) => {
                accountHistory.push(doc.data());
            });
            return res.status(201).json(accountHistory);
        })
        .catch((err) => {
            console.error(err);
            return res.status(404).json({ general: 'Something went wrong' });
        });
};

exports.updateUserDetails = (req, res) => {
    //not implemented yet
    /*let userDetails = reduceUserDetails(req.body);
  db.doc(`/users/${req.user.userName}`)
    .update(userDetails)
    .then(() => {
      return res.json({ message: "Details updated successfully" });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });*/
};
