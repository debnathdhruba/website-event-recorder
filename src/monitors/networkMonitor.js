const config = require('../../config/default');
const { logger } = require('../utils/logger');
const { isApiCall } = require('../utils/helpers');

class NetworkMonitor {
  constructor() {
    this.apiCalls = [];
    this.requests = new Map();
  }

  setup(client) {
    client.on('Network.requestWillBeSent', (params) => {
      const { requestId, request, timestamp, type } = params;
      
      this.requests.set(requestId, {
        requestId,
        url: request.url,
        method: request.method,
        headers: request.headers,
        postData: request.postData,
        type,
        timestamp: new Date(timestamp * 1000).toISOString(),
        initiator: params.initiator
      });
    });

    client.on('Network.responseReceived', (params) => {
      const { requestId, response, timestamp } = params;
      const request = this.requests.get(requestId);

      if (request && isApiCall(request.url)) {
        const apiCall = {
          ...request,
          response: {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            mimeType: response.mimeType,
            timestamp: new Date(timestamp * 1000).toISOString()
          }
        };

        client.send('Network.getResponseBody', { requestId })
          .then(({ body, base64Encoded }) => {
            try {
              apiCall.response.body = base64Encoded 
                ? Buffer.from(body, 'base64').toString() 
                : body;
              
              if (apiCall.response.mimeType?.includes('json')) {
                apiCall.response.parsedBody = JSON.parse(apiCall.response.body);
              }
            } catch (e) {
              apiCall.response.bodyError = e.message;
            }

            this.apiCalls.push(apiCall);
            this.logApiCall(apiCall);
          })
          .catch(() => {
            this.apiCalls.push(apiCall);
          });
      }
    });
  }

  logApiCall(call) {
    logger.api(`${call.method} ${call.url}`);
    logger.info(`   Status: ${call.response?.status}`);
    if (call.postData) {
      logger.info(`   Payload: ${call.postData.substring(0, 80)}...`);
    }
  }

  getApiCalls() {
    return this.apiCalls;
  }
}

module.exports = NetworkMonitor;
