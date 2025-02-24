const jwt = require('jsonwebtoken');
const { UnauthenticatedError } = require('../errors');

const authentication = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')){
        throw new UnauthenticatedError('Invalid authentication');
    }

    try{
        const token = authHeader.split(' ')[1];
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {userId: payload.userId, fullName: payload.fullName};
        next();
    } catch(error){
        throw new UnauthenticatedError('Invalid Token');
    }
}

module.exports = authentication;
