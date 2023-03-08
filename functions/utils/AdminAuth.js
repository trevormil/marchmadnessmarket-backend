module.exports = (req, res, next) => {
    if (req.user.userName === 'trevormil') {
        return next();
    } else return res.status(403).json({ admin: 'Admin privileges only!' });
};
    