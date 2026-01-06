const fs = require('fs').promises;
const path = require('path');

class JsonReporter {
  static async generate(data, reportDir) {
    await fs.mkdir(reportDir, { recursive: true });

    const report = {
      ...data,
      summary: {
        totalApiCalls: data.apiCalls.length,
        totalInteractions: data.interactions.length,
        totalEvents: data.events.length,
        uniqueEndpoints: [...new Set(data.apiCalls.map(c => 
          new URL(c.url).pathname
        ))].length
      }
    };

    await fs.writeFile(
      path.join(reportDir, 'full_report.json'),
      JSON.stringify(report, null, 2)
    );
  }
}

module.exports = JsonReporter;
