import chalk from 'chalk';
export class ErrorHandler {
  static getErrorExplanation(error) {
    let errorCode;
    if (error.code) {
      errorCode = error.code;
    } else if (error.errno) {
      errorCode = error.errno;
    } else if (error.message) {
      if (error.message.includes('ECONNREFUSED')) {
        errorCode = 'ECONNREFUSED';
      } else if (error.message.includes('Access denied')) {
        errorCode = 'ER_ACCESS_DENIED_ERROR';
      } else if (error.message.includes('Unknown database')) {
        errorCode = 'ER_BAD_DB_ERROR';
      } else if (error.message.includes("doesn't exist")) {
        errorCode = 'ER_NO_SUCH_TABLE';
      } else {
        errorCode = 'UNKNOWN_ERROR';
      }
    } else {
      errorCode = 'UNKNOWN_ERROR';
    }
    const userFriendlyError = this.errorMap.get(errorCode);
    if (userFriendlyError) {
      return userFriendlyError;
    }
    return {
      title: 'Unknown Error',
      description: 'An unexpected error occurred. This might be a temporary issue.',
      solution: 'Check the console for more details. If the problem persists, contact support.',
      severity: 'medium',
    };
  }
  static getSeverityChalk(severity) {
    switch (severity) {
      case 'critical':
        return chalk.bgRed.white.bold;
      case 'high':
        return chalk.red.bold;
      case 'medium':
        return chalk.yellow.bold;
      case 'low':
        return chalk.cyan;
      default:
        return chalk.white;
    }
  }
  static handleError(error, context, logger) {
    const explanation = this.getErrorExplanation(error);
    const timestamp = new Date().toLocaleTimeString();
    const contextStr = context ? ` [${context}]` : '';
    const log = logger || {
      error: console.error,
      debug: console.log,
      warn: console.warn,
      info: console.log,
    };
    const severityChalk = this.getSeverityChalk(explanation.severity);
    console.error('');
    console.error(severityChalk(`🚨 ${explanation.title}${contextStr} ${timestamp}`));
    console.error(chalk.gray(`📝 ${explanation.description}`));
    console.error(chalk.blue(`💡 ${explanation.solution}`));
    console.error(chalk.white(`⚠️  Severity: ${severityChalk(explanation.severity.toUpperCase())}`));
    if (process.env.DEBUG === 'true' || explanation.severity === 'critical') {
      console.error(chalk.dim('🔧 Technical Details:'));
      console.error(chalk.dim(`   Error Code: ${error.code || 'N/A'}`));
      console.error(chalk.dim(`   Error Message: ${error.message || 'N/A'}`));
      if (error.sql) {
        console.error(chalk.dim(`   SQL: ${error.sql}`));
      }
      if (error.sqlState) {
        console.error(chalk.dim(`   SQL State: ${error.sqlState}`));
      }
      if (error.errno) {
        console.error(chalk.dim(`   Error Number: ${error.errno}`));
      }
      if (error.stack && process.env.DEBUG === 'true') {
        const stackLines = error.stack.split('\n').slice(0, 5);
        stackLines.forEach(line => {
          console.error(chalk.dim(`   ${line}`));
        });
      }
    }
    console.error('');
  }
  static addErrorMapping(code, errorInfo) {
    this.errorMap.set(code, errorInfo);
  }
  static isCritical(error) {
    const explanation = this.getErrorExplanation(error);
    return explanation.severity === 'critical';
  }
  static handleAndCheckCritical(error, context, logger) {
    this.handleError(error, context, logger);
    return this.isCritical(error);
  }
}
ErrorHandler.errorMap = new Map([
  [
    'ECONNREFUSED',
    {
      title: 'Database Connection Failed',
      description:
        'The bot cannot connect to the database server. This usually means the database is not running or the connection settings are incorrect.',
      solution:
        'Check if your database server is running and verify your connection settings in the .env file (host, port, username, password).',
      severity: 'critical',
    },
  ],
  [
    'ER_ACCESS_DENIED_ERROR',
    {
      title: 'Database Access Denied',
      description: "The database credentials are incorrect or the user doesn't have permission to access the database.",
      solution:
        'Verify your database username and password in the .env file. Make sure the user has proper permissions.',
      severity: 'critical',
    },
  ],
  [
    'ER_BAD_DB_ERROR',
    {
      title: 'Database Does Not Exist',
      description: "The specified database name doesn't exist on the server.",
      solution: 'Create the database or check if the database name in your .env file is correct.',
      severity: 'critical',
    },
  ],
  [
    'ER_NO_SUCH_TABLE',
    {
      title: 'Database Table Missing',
      description: 'A required table is missing from the database.',
      solution:
        'Run the database migration scripts to create the required tables, or check if the table name is correct.',
      severity: 'high',
    },
  ],
  [
    'DISCORD_API_ERROR',
    {
      title: 'Discord API Error',
      description: "There was an error communicating with Discord's servers.",
      solution:
        "Check your bot token and permissions. If the issue persists, Discord's API might be experiencing issues.",
      severity: 'medium',
    },
  ],
  [
    'MISSING_PERMISSIONS',
    {
      title: 'Bot Missing Permissions',
      description: "The bot doesn't have the required permissions to perform this action.",
      solution: "Check the bot's role permissions in your Discord server settings.",
      severity: 'medium',
    },
  ],
  [
    'ENOTFOUND',
    {
      title: 'Network Connection Error',
      description: 'Cannot resolve the hostname. This could be a network connectivity issue.',
      solution: 'Check your internet connection and verify the server hostname is correct.',
      severity: 'high',
    },
  ],
  [
    'ETIMEDOUT',
    {
      title: 'Connection Timeout',
      description: 'The connection to the server timed out.',
      solution: 'Check your network connection and server availability. The server might be overloaded.',
      severity: 'medium',
    },
  ],
]);
