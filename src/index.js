#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const WebsiteEventRecorder = require('./recorder');
const { logger } = require('./utils/logger');

const program = new Command();

program
  .name('web-recorder')
  .description('Record website interactions and API calls')
  .version('1.0.0')
  .option('-u, --url <url>', 'Target website URL')
  .option('-s, --session <name>', 'Session name', `session_${Date.now()}`)
  .option('-o, --output <dir>', 'Output directory', './recordings')
  .option('--headless', 'Run in headless mode', false)
  .option('--no-video', 'Disable video recording')
  .parse(process.argv);

const options = program.opts();

if (!options.url) {
  console.error(chalk.red('❌ Error: --url is required'));
  program.help();
  process.exit(1);
}

async function main() {
  logger.info(chalk.bold.cyan('\n🎬 Website Event Recorder'));
  logger.info(chalk.gray('=====================================\n'));

  const recorder = new WebsiteEventRecorder({
    headless: options.headless,
    outputDir: options.output,
    sessionName: options.session,
    video: options.video
  });

  try {
    const session = await recorder.startRecording(options.url);

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info(chalk.yellow('\n\n⏹️  Stopping recording...'));
      await recorder.stopRecording();
      await session.browser.close();
      logger.success(chalk.green('\n✅ Recording saved successfully!\n'));
      process.exit(0);
    });

    // Keep process alive
    await new Promise(() => {});
  } catch (error) {
    logger.error(chalk.red(`❌ Error: ${error.message}`));
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = main;
