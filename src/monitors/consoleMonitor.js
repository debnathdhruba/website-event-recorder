class ConsoleMonitor {
  constructor() {
    this.events = [];
  }

  setup(page) {
    page.on('console', (msg) => {
      if (!msg.text().startsWith('INTERACTION:')) {
        this.events.push({
          type: 'console',
          level: msg.type(),
          text: msg.text(),
          timestamp: new Date().toISOString()
        });
      }
    });

    page.on('pageerror', (error) => {
      this.events.push({
        type: 'error',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });
  }

  getEvents() {
    return this.events;
  }
}

module.exports = ConsoleMonitor;
