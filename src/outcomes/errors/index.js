const CustomAPIError = require('./custom-error');
const BadRequestError = require('./bad-request');
const NotFoundError = require('./not-found');
const UnauthenticatedError = require('./unauthenticated');
const ForbiddenError = require('./forbidden');
const TooManyRequestsError = require('./too_many_requests');
const InternalServerError = require('./internal-server-error');
const ConflictError = require('./conflict');
const UnprocessableEntityError = require('./unprocessable-entity');


module.exports = {
    CustomAPIError,
    BadRequestError,
    NotFoundError,
    UnauthenticatedError,
    ForbiddenError,
    TooManyRequestsError,
    InternalServerError,
    ConflictError,
    UnprocessableEntityError
}