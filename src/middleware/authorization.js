const { ForbiddenError } = require('../outcomes/errors/forbidden');

const authorization = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user || !requiredRole.includes(req.user.role)) {
            return next(new ForbiddenError('You can\'t access this resource'));
        }
        next();
    };
};

module.exports = authorization;
