import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

const ARTIFACTS_DIR = '/Users/trongnsi/.gemini/antigravity/brain/7341c9ee-9281-4a4f-9003-872dc37da366';
const PORT = 4188;

function takeScreenshot(url, outPath, width = 390, height = 844) {
  return new Promise((resolve, reject) => {
    const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    const chrome = spawn(
      chromePath,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--user-data-dir=/Users/trongnsi/Desktop/Pet/guivutru/scratch/chrome-profile',
        `--window-size=${width},${height}`,
        `--screenshot=${outPath}`,
        url,
      ],
      { stdio: 'inherit' }
    );

    const timer = setTimeout(() => {
      chrome.kill('SIGKILL');
      resolve();
    }, 8000);

    chrome.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else resolve(); // continue even if warning
    });
  });
}

async function run() {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
  };

  const distDir = '/Users/trongnsi/Desktop/Pet/guivutru/dist';
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    let filePath = distDir + reqPath;
    if (reqPath === '/' || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = distDir + '/index.html';
    }
    const ext = String(filePath.slice(filePath.lastIndexOf('.'))).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    try {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    } catch {
      res.writeHead(404);
      res.end();
    }
  });

  await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
  console.log(`Static server running on http://127.0.0.1:${PORT}`);

  try {
    // 1. Landing full page mobile (to capture footer with Ingrid Darling)
    console.log('Capturing footer 390px...');
    await takeScreenshot(`http://127.0.0.1:${PORT}/`, `${ARTIFACTS_DIR}/footer_390px.png`, 390, 1600);

    // 2. Step 2 mobile 390px initial (right fade visible on sticker picker)
    console.log('Capturing Step 2 mobile initial (right fade)...');
    await takeScreenshot(`http://127.0.0.1:${PORT}/viet?step=2`, `${ARTIFACTS_DIR}/step2_sticker_fade_390px.png`, 390, 844);

    // 3. Step 2 mobile mid-scroll (both left and right fades visible)
    console.log('Capturing Step 2 mobile mid-scroll...');
    await takeScreenshot(`http://127.0.0.1:${PORT}/viet?step=2&scroll=mid`, `${ARTIFACTS_DIR}/step2_scrolled_mid_390px.png`, 390, 844);

    // 4. Step 2 mobile end-scroll (left fade visible, right fade hidden)
    console.log('Capturing Step 2 mobile end-scroll...');
    await takeScreenshot(`http://127.0.0.1:${PORT}/viet?step=2&scroll=end`, `${ARTIFACTS_DIR}/step2_scrolled_end_390px.png`, 390, 844);

    // 5. Step 2 light mode mobile 390px
    console.log('Capturing Step 2 light mode...');
    await takeScreenshot(`http://127.0.0.1:${PORT}/viet?step=2&theme=light`, `${ARTIFACTS_DIR}/step2_light_mode_390px.png`, 390, 844);

    // 6. Step 2 tablet 768px
    console.log('Capturing Step 2 tablet 768px...');
    await takeScreenshot(`http://127.0.0.1:${PORT}/viet?step=2`, `${ARTIFACTS_DIR}/step2_768px.png`, 768, 900);

    // 7. Step 2 desktop 1280px
    console.log('Capturing Step 2 desktop 1280px...');
    await takeScreenshot(`http://127.0.0.1:${PORT}/viet?step=2`, `${ARTIFACTS_DIR}/step2_1280px.png`, 1280, 900);

    console.log('All screenshots captured successfully!');
  } finally {
    server.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
