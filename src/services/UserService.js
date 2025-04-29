const User = require('../models/User');

const {
    BadRequestError,
    UnauthenticatedError,
    NotFoundError,
    InternalServerError,
    ConflictError
} = require('../outcomes/errors');

class UserService {
    constructor(emailService) {
        this.emailService = emailService;
    }

    async userRegister(userData, clientIp) {
        const { error: duplicateError, duplicate } = await User.checkDuplicates({
            email: userData.email,
            nationalId: userData.nationalId,
            phoneNumber: userData.phoneNumber
        });
        
        if (duplicateError) throw new InternalServerError('Error while checking duplicate');
        if (duplicate) throw new BadRequestError(`User with the same '${duplicate}' already exists`);

        const user = await User.create({ ...userData });
        if (!user) throw new BadRequestError('Couldn\'t register user');

        const token = await user.createUserJWT(clientIp);
        if (!token) throw new InternalServerError('Error while generating token');

        const verifyToken = await user.createVerificationToken();
        if (!verifyToken) throw new InternalServerError('Error while generating verification token');

        const emailVerify = await this.emailService.sendVerificationEmail(user.email, user.firstName, verifyToken);
        if (!emailVerify) throw new InternalServerError('Error while sending verification email');

        return { user, token };
    }

    async verifyEmail(token) {
        const userVerify = await User.validateVerificationToken(token);
        if (!userVerify) throw new BadRequestError('Invalid token or token expired');
        return userVerify;
    }

    async userResendVerification(userId) {
        let action = '';
        let token = '';
        const user = await User.findOne({ _id: userId });

        if (!user) throw new NotFoundError('User not found.');
        if (user.security.status !== 'pending') throw new ConflictError('Account already verified');
        const tokenStatus = await user.getVerificationTokenState();
        if (tokenStatus === 'valid') {
            token = user.security.verificationToken.token;
            action = 'EMAIL_VERIFICATION_RESENT';
        } else if (tokenStatus === 'expired' || tokenStatus === 'not set') {
            token = await user.createVerificationToken();
            action = 'EMAIL_VERIFICATION_TOKEN_CREATED';
        }
        
        if (!token) throw new InternalServerError('Something went wrong while getting verification token');
        const emailVerify = await this.emailService.sendVerificationEmail(user.email, user.firstName, token);
        if (!emailVerify) throw new InternalServerError('Error while sending verification email');

        return { action, user };
    }

    async userLogin(userData, clientIp, LOGIN_PROCESS_GAP_DELAY) {
        const user = await User.findOne({ email: userData.email })
        .select('+password')
        .select('-nationalId -phoneNumber -dateOfBirth -address');
        if (!user) {
            // Next line for security: Fixing time-based email enumeration
            await new Promise(resolve => setTimeout(resolve, LOGIN_PROCESS_GAP_DELAY));
            throw new UnauthenticatedError("Invalid email or password.");
        };
        const isPasswordCorrect = await user.comparePasswords(userData.password);
        delete user.password
        const userStatus = await user.loginAttempt();
        if (!isPasswordCorrect) throw new UnauthenticatedError("Invalid email or password.");
        await user.resetLoginAttempts();

        const token = await user.createUserJWT(clientIp);
        if (!token) throw new InternalServerError('Error while generating token');

        return { user, token, userStatus };
    }
}

module.exports = UserService;