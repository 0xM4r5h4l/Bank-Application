const scheduleDailyResetJob = require('../jobs/dailyReset');

function initializeCronJobs() {
    // All cron jobs
    scheduleDailyResetJob(); // Daily Account Limits Reset Job
}

module.exports = initializeCronJobs;