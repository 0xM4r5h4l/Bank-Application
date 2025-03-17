const { ForbiddenError } = require('../outcomes/errors');

const authorization = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user || !requiredRole.includes(req.user.role)) {
            return next(new ForbiddenError('Authorization failed. You are not authorized to perform this action.'));
        }
        next();
    };
};

module.exports = authorization;
