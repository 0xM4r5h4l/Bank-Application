class EmailService {
    constructor() {
        console.log('Simulated Email Service Started.');
    }

    static async sendEmail(to, subject, body) {
        try {
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
}

module.exports = EmailService;