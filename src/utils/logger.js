const chalk = require('chalk');

class Logger {
  info(message) {
    console.log(chalk.blue('ℹ'), message);
  }

  success(message) {
    console.log(chalk.green('✓'), message);
  }

  error(message) {
    console.log(chalk.red('✗'), message);
  }

  warn(message) {
    console.log(chalk.yellow('⚠'), message);
  }

  api(message) {
    console.log(chalk.cyan('🌐'), message);
  }

  interaction(message) {
    console.log(chalk.magenta('👆'), message);
  }
}

module.exports = {
  logger: new Logger()
};
