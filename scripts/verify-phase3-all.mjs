import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

const ARTIFACTS_DIR = '/Users/trongnsi/.gemini/antigravity/brain/7341c9ee-9281-4a4f-9003-872dc37da366';
const PORT = 5174;
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function waitServer(url, timeoutMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode === 200 || res.statusCode === 304) resolve();
          else reject();
        });
        req.on('error', reject);
      });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  throw new Error('Server timeout');
}

function runChrome(args, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const chrome = spawn(
      CHROME_PATH,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--user-data-dir=/Users/trongnsi/Desktop/Pet/guivutru/scratch/chrome-profile-phase3',
        ...args,
      ],
      { stdio: 'inherit' }
    );

    const timer = setTimeout(() => {
      chrome.kill('SIGKILL');
      resolve();
    }, timeoutMs);

    chrome.on('close', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function run() {
  console.log('Starting Vite server on port', PORT);
  const vite = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
    stdio: 'ignore',
  });

  try {
    await waitServer(`http://localhost:${PORT}`);
    console.log('Vite server running on port', PORT);

    // 1. Capture Share Card at 1080x1920 (standalone route)
    const shareCardOut = `${ARTIFACTS_DIR}/dieu-uoc-test-dalat-123.png`;
    console.log('1. Capturing 1080x1920 Share Card PNG...');
    await runChrome([
      '--window-size=1080,1920',
      '--hide-scrollbars',
      `--screenshot=${shareCardOut}`,
      `http://localhost:${PORT}/dev/share-card`,
    ], 10000);
    console.log('Saved Share Card PNG to:', shareCardOut);

    // 2. Capture Success Screen at 390x844
    const successScreenOut = `${ARTIFACTS_DIR}/sealed_success_390px.png`;
    console.log('2. Capturing Success Screen at 390px...');
    await runChrome([
      '--window-size=390,844',
      '--force-prefers-reduced-motion', // Jumps directly to success screen
      `--screenshot=${successScreenOut}`,
      `http://localhost:${PORT}/dev/sealed-success`,
    ], 10000);
    console.log('Saved Success Screen screenshot to:', successScreenOut);

    console.log('\nAll captures completed successfully!');
  } finally {
    vite.kill('SIGTERM');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
