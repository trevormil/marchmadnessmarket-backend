const { admin, db } = require("./admin");

module.exports = (req, res, next) => {
  if (req.user.userName === "TMAdmin") {
    return next();
  } else return res.status(403).json({ admin: "Admin privileges only!" });
};
