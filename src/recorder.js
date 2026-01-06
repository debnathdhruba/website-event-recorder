const { chromium } = require('playwright');
const path = require('path');
const config = require('../config/default');
const NetworkMonitor = require('./monitors/networkMonitor');
const InteractionMonitor = require('./monitors/interactionMonitor');
const ConsoleMonitor = require('./monitors/consoleMonitor');
const JsonReporter = require('./reporters/jsonReporter');
const MarkdownReporter = require('./reporters/markdownReporter');
const EndpointReporter = require('./reporters/endpointReporter');
const { logger } = require('./utils/logger');

class WebsiteEventRecorder {
  constructor(options = {}) {
    this.options = { ...config, ...options };
    this.sessionStart = new Date();
    this.networkMonitor = new NetworkMonitor();
    this.interactionMonitor = new InteractionMonitor();
    this.consoleMonitor = new ConsoleMonitor();
    this.session = null;
  }

  async startRecording(url) {
    const { headless, sessionName, outputDir, video, viewport } = this.options;

    logger.info(`🎬 Starting recording session: ${sessionName}`);
    logger.info(`🌐 Target URL: ${url}\n`);

    // Launch browser
    const browser = await chromium.launch({
      headless,
      args: headless ? [] : ['--auto-open-devtools-for-tabs']
    });

    const context = await browser.newContext({
      viewport,
      ...(video && {
        recordVideo: {
          dir: path.join(outputDir, sessionName, 'videos'),
          size: viewport
        }
      })
    });

    const page = await context.newPage();

    // Enable CDP
    const client = await context.newCDPSession(page);
    await client.send('Network.enable');
    await client.send('DOM.enable');
    await client.send('Runtime.enable');

    // Setup monitors
    this.networkMonitor.setup(client);
    this.interactionMonitor.setup(page);
    this.consoleMonitor.setup(page);

    // Navigate
    await page.goto(url, { waitUntil: 'networkidle' });
    
    logger.success('✅ Page loaded. Recording started...');
    logger.info('📝 Interact with the page. Press Ctrl+C when done.\n');

    this.session = { browser, page, context, client, url };
    return this.session;
  }

  async stopRecording() {
    if (!this.session) {
      throw new Error('No active recording session');
    }

    const { sessionName, outputDir } = this.options;
    const sessionDuration = (new Date() - this.sessionStart) / 1000;

    // Collect all data
    const data = {
      session: {
        name: sessionName,
        url: this.session.url,
        startTime: this.sessionStart.toISOString(),
        endTime: new Date().toISOString(),
        duration: `${sessionDuration.toFixed(2)}s`
      },
      apiCalls: this.networkMonitor.getApiCalls(),
      interactions: this.interactionMonitor.getInteractions(),
      events: this.consoleMonitor.getEvents()
    };

    // Generate reports
    const reportDir = path.join(outputDir, sessionName);
    
    await JsonReporter.generate(data, reportDir);
    await MarkdownReporter.generate(data, reportDir);
    await EndpointReporter.generate(data, reportDir);

    logger.info(`\n📊 Reports generated in: ${reportDir}`);
    logger.info(`   - full_report.json`);
    logger.info(`   - ai_analysis.md`);
    logger.info(`   - api_endpoints.json`);

    return reportDir;
  }

  getRecordedData() {
    return {
      apiCalls: this.networkMonitor.getApiCalls(),
      interactions: this.interactionMonitor.getInteractions(),
      events: this.consoleMonitor.getEvents()
    };
  }
}

module.exports = WebsiteEventRecorder;
