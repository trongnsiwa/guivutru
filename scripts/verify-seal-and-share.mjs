import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

const ARTIFACTS_DIR = '/Users/trongnsi/.gemini/antigravity/brain/7341c9ee-9281-4a4f-9003-872dc37da366';
const PORT = 4190;

const testNote = {
  id: 'test-dalat-123',
  content: 'Điều ước của tớ ở Đà Lạt 🌸 — ĐẶC BIỆT Ở CHỖ ĐÓ',
  paperTheme: 'tim-mong',
  stickerIds: ['🌙', '⭐', '🌸'],
  unlockAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  status: 'sealed',
  createdAt: Date.now(),
  openedAt: null,
};

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

    // Helper route to seed sessionStorage and navigate to /viet/xong
    if (reqPath === '/seed-sealed') {
      const html = `
        <!DOCTYPE html>
        <html>
        <head><title>Seeding...</title></head>
        <body>
          <script>
            sessionStorage.setItem('gvt.lastSealed', JSON.stringify(${JSON.stringify(testNote)}));
            window.location.href = '/viet/xong';
          </script>
        </body>
        </html>
      `;
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html, 'utf-8');
      return;
    }

    // Helper route to render only the 1080x1920 ShareCard for direct export
    if (reqPath === '/test-share-card') {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Share Card Export</title>
          <script>
            sessionStorage.setItem('gvt.lastSealed', JSON.stringify(${JSON.stringify(testNote)}));
          </script>
        </head>
        <body style="margin: 0; background: #0A0614;">
          <script>
            window.location.href = '/viet/xong?export=true';
          </script>
        </body>
        </html>
      `;
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html, 'utf-8');
      return;
    }

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
  console.log(`Server listening on port ${PORT}`);

  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const successScreenOut = `${ARTIFACTS_DIR}/sealed_success_390px.png`;

  function takeChromeScreenshot(url, outPath, width = 390, height = 844) {
    return new Promise((resolve) => {
      const chrome = spawn(
        chromePath,
        [
          '--headless=new',
          '--disable-gpu',
          '--no-first-run',
          '--no-default-browser-check',
          '--user-data-dir=/Users/trongnsi/Desktop/Pet/guivutru/scratch/chrome-profile-seal',
          `--window-size=${width},${height}`,
          `--screenshot=${outPath}`,
          url,
        ],
        { stdio: 'inherit' }
      );

      const timer = setTimeout(() => {
        chrome.kill('SIGKILL');
        resolve();
      }, 7000);

      chrome.on('close', () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  // 1. Capture success screen (with prefers-reduced-motion to jump straight to success screen)
  console.log('Capturing Success Screen 390px...');
  await takeChromeScreenshot(`http://127.0.0.1:${PORT}/seed-sealed`, successScreenOut, 390, 844);
  console.log('Saved success screen screenshot to:', successScreenOut);

  server.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
