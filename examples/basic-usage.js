const WebsiteEventRecorder = require('../src/recorder');

async function example() {
  const recorder = new WebsiteEventRecorder({
    headless: false,
    sessionName: 'example_session',
    outputDir: './recordings'
  });

  try {
    console.log('Starting recording...');
    const session = await recorder.startRecording('https://jsonplaceholder.typicode.com');

    // Simulate some waiting time
    console.log('Recording for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    console.log('Stopping recording...');
    await recorder.stopRecording();
    await session.browser.close();

    console.log('✅ Recording complete!');
  } catch (error) {
    console.error('Error:', error);
  }
}

example();
