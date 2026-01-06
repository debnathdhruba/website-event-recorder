const fs = require('fs').promises;
const path = require('path');
const { groupByEndpoint } = require('../utils/helpers');

class EndpointReporter {
  static async generate(data, reportDir) {
    const summary = [];
    const grouped = groupByEndpoint(data.apiCalls);

    for (const [endpoint, calls] of Object.entries(grouped)) {
      const methods = [...new Set(calls.map(c => c.method))];
      const example = calls[0];

      summary.push({
        endpoint,
        methods,
        callCount: calls.length,
        requestExample: example.postData ? 
          (example.postData.length > 1000 ? 
            example.postData.substring(0, 1000) + '...' : 
            example.postData) 
          : null,
        responseExample: example.response?.body ?
          (example.response.body.length > 1000 ? 
            example.response.body.substring(0, 1000) + '...' : 
            example.response.body)
          : null,
        statusCodes: [...new Set(calls.map(c => c.response?.status).filter(Boolean))],
        headers: example.headers
      });
    }

    await fs.writeFile(
      path.join(reportDir, 'api_endpoints.json'),
      JSON.stringify(summary, null, 2)
    );
  }
}

module.exports = EndpointReporter;
