require('dotenv').config();
class EmailService {
    constructor() {
        this.domain = process.env.DOMAIN;
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
        const subject = 'Verify Your Email Address';
        const body = `Dear ${fname},\n\nPlease click the link below to verify your email address:\n\n${this.domain}/user/verify/${token}\n\nThank you for choosing our service.\n\nBest regards,\nThe Team`;
        return await this.sendEmail(email, subject, body);
    }
}

module.exports = EmailService;