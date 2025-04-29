const cron = require('node-cron');
const Account = require('../models/Account');
const logger = require('../utils/logManager');

const auditLogger = logger.get('audit');
const accountOperationsLogger = logger.get('account-operations');

async function performReset() {
    const result = await Account.updateMany(
      {},
      {
        $set: {
          dailyStats: {
              withdrawal: 0,
              deposit: 0,
              transfer: 0
          }
        },
      }
    );
  
    accountOperationsLogger.info({
      action: 'DAILY_LIMITS_RESET',
      message: `Reset daily limits for ${result.modifiedCount} accounts.`,
    });
  
    auditLogger.info({
        action: 'DAILY_LIMITS_RESET',
        modifiedCount: result.modifiedCount,
        system: 'cronjob',
        performedBy: 'SYSTEM',
        message: 'Daily limits reset for all accounts.',
    });
  
    return result.modifiedCount;
}

// Schedule with retry
function scheduleDailyResetJob() {
  cron.schedule('0 0 * * *', async () => {
    accountOperationsLogger.info({ action: 'DAILY_LIMITS_RESET_SCHEDULED', message: 'Daily limits reset job started.' });

    const maxAttempts = 3;
    const delay = 2000; // 2 seconds

    
    for (let i = 1; i <= maxAttempts; i++) {
      try {
        const results = await performReset();
        if (results) break;
      } catch (error) {
        if (i === 3) {
          accountOperationsLogger.error({
            action: 'DAILY_LIMITS_RESET_FAILED',
            message: 'Final failure after retries',
            error: error.message,
          });
    
          auditLogger.error({
              action: 'DAILY_LIMITS_RESET_FAILED',
              error: error.message,
              stack: error.stack,
              system: 'cronjob',
              performedBy: 'SYSTEM',
              message: 'Daily limits reset job failed after retries.',
          });
          break;
        }
        
        accountOperationsLogger.warn({
          action: 'DAILY_LIMITS_RESET_RETRY',
          message: `Attempt ${i} failed: ${error.message}`,
        });
  
        await new Promise(resolve => setTimeout(resolve, delay)); // Wait before retrying
      }
    }

  });
}

module.exports = scheduleDailyResetJob;
