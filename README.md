# 🎬 Website Event Recorder

A powerful Node.js tool that records website interactions, API calls, and generates AI-ready backend analysis reports using Playwright and Chrome DevTools Protocol (CDP).

## ✨ Features

- 🌐 **Complete API Call Recording** - Captures all network requests with full request/response data
- 👆 **User Interaction Tracking** - Records clicks, inputs, and form submissions
- 📊 **AI-Ready Reports** - Generates markdown and JSON reports perfect for AI analysis
- 🔍 **Backend Discovery** - Automatically identifies API patterns and architecture
- 🎥 **Video Recording** - Optional screen recording of the session
- 📝 **Detailed Logging** - Console output and error tracking

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd website-event-recorder

# Install dependencies
npm install

# Install Playwright browsers
npm run install-browsers
```

### Basic Usage

```bash
# Record a website
npm start -- --url https://example.com

# With custom session name
npm start -- --url https://example.com --session my-session

# Headless mode
npm start -- --url https://example.com --headless

# Show all options
npm start -- --help
```

### Programmatic Usage

```javascript
const WebsiteEventRecorder = require('./src/recorder');

(async () => {
  const recorder = new WebsiteEventRecorder({
    headless: false,
    outputDir: './recordings'
  });

  const session = await recorder.startRecording('https://example.com');
  
  // Your interactions happen here...
  
  await recorder.stopRecording();
})();
```

## 📊 Generated Reports

After recording, you'll find three files in `./recordings/[session_name]/`:

1. **full_report.json** - Complete session data with all events
2. **ai_analysis.md** - AI-friendly markdown report with insights
3. **api_endpoints.json** - Structured API endpoint documentation

## 🎯 Use Cases

- Reverse engineer API endpoints without source code access
- Generate API documentation from live websites
- Analyze competitor's backend architecture
- Create test scenarios from user interactions
- Feed to AI for backend system understanding

## ⚙️ Configuration

Create a `.env` file:

```env
DEFAULT_HEADLESS=false
DEFAULT_OUTPUT_DIR=./recordings
DEFAULT_VIDEO=true
```

## 📝 License

MIT
