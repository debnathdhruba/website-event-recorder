require('dotenv').config();

module.exports = {
  headless: process.env.DEFAULT_HEADLESS === 'true',
  outputDir: process.env.DEFAULT_OUTPUT_DIR || './recordings',
  video: process.env.DEFAULT_VIDEO === 'true',
  viewport: {
    width: parseInt(process.env.DEFAULT_VIEWPORT_WIDTH) || 1920,
    height: parseInt(process.env.DEFAULT_VIEWPORT_HEIGHT) || 1080
  },
  apiPatterns: [
    /\/api\//,
    /\/graphql/,
    /\.json$/,
    /\/v\d+\//,
    /\/rest\//
  ],
  excludeExtensions: [
    'js', 'css', 'png', 'jpg', 'jpeg', 
    'gif', 'svg', 'woff', 'woff2', 'ttf', 'ico'
  ]
};
