const config = require('../../config/default');

function isApiCall(url) {
  // Check against patterns
  const matchesPattern = config.apiPatterns.some(pattern => pattern.test(url));
  
  // Check if not a static resource
  const ext = url.split('.').pop().split('?')[0];
  const notStatic = !config.excludeExtensions.includes(ext);
  
  return matchesPattern || (notStatic && url.includes('api'));
}

function groupByEndpoint(apiCalls) {
  const grouped = {};
  apiCalls.forEach(call => {
    try {
      const url = new URL(call.url);
      const endpoint = url.pathname;
      if (!grouped[endpoint]) grouped[endpoint] = [];
      grouped[endpoint].push(call);
    } catch (e) {
      // Skip invalid URLs
    }
  });
  return grouped;
}

function generateBackendInsights(apiCalls) {
  let insights = '';
  
  const methods = [...new Set(apiCalls.map(c => c.method))];
  insights += `- **HTTP Methods Used**: ${methods.join(', ')}\n`;

  const contentTypes = [...new Set(apiCalls
    .map(c => c.response?.mimeType)
    .filter(Boolean))];
  insights += `- **Response Types**: ${contentTypes.join(', ')}\n`;

  const hasAuth = apiCalls.some(c => 
    c.headers?.Authorization || c.headers?.authorization
  );
  insights += `- **Authentication**: ${hasAuth ? 'Detected (Bearer tokens or API keys in headers)' : 'None detected'}\n`;

  const restful = apiCalls.every(c => 
    ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(c.method)
  );
  insights += `- **API Style**: ${restful ? 'RESTful' : 'Mixed/Custom'}\n`;

  const hasGraphQL = apiCalls.some(c => c.url.includes('graphql'));
  if (hasGraphQL) {
    insights += `- **GraphQL**: Detected\n`;
  }

  return insights;
}

module.exports = {
  isApiCall,
  groupByEndpoint,
  generateBackendInsights
};
