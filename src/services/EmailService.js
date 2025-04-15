require('dotenv').config();
const { USER_VERIFICATION_TOKEN_EXPIRY } = require('../validations/rules/database/userRules');

class EmailService {
    constructor(domain) {
        this.domain = domain;
        this.USER_VERIFICATION_TOKEN_EXPIRY = USER_VERIFICATION_TOKEN_EXPIRY;
    }
    
    async sendEmail(to, subject, body) {
        try {
            console.log('Simulated Email Service Started.');
            console.log('-----------------------');
            console.log('Simulated Email Sent:');
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`Body: ${body}`);
            console.log('-----------------------');

            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate email sending progress time
            return {
                messageId: `simulated-${Date.now()}`,
                accepted: true
            }
        } catch(error) {
            console.log('Simulated Email Sending Error: ', error);
            throw error;
        }
    }

    async sendVerificationEmail(email, fname, token) {
        const { subject, body } = EmailTemplate.getVerificationEmailTemplate(fname, this.domain, this.USER_VERIFICATION_TOKEN_EXPIRY, token);
        return await this.sendEmail(email, subject, body);
    }
}

class EmailTemplate {
    static getVerificationEmailTemplate(fname, domain, expiry, token) {
        const subject = 'Verify Your Email Address';
        const body = `Dear ${fname},\n\nPlease click the link below to verify your email address. This link will expire in ${expiry} minutes:\n\n${domain}/user/verify/${token}\n\nThank you for choosing our service.\n\nBest regards,\nThe Team`;
        return { subject, body };
    }
}

module.exports = EmailService;