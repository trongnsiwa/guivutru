import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

const ARTIFACTS_DIR = '/Users/trongnsi/.gemini/antigravity/brain/7341c9ee-9281-4a4f-9003-872dc37da366';
const PORT = 4189;

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
  console.log(`Server listening on port ${PORT}`);

  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const outPath = `${ARTIFACTS_DIR}/step2_new_placeholder.png`;

  const chrome = spawn(
    chromePath,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--user-data-dir=/Users/trongnsi/Desktop/Pet/guivutru/scratch/chrome-profile',
      '--window-size=390,844',
      `--screenshot=${outPath}`,
      `http://127.0.0.1:${PORT}/viet?step=2`,
    ],
    { stdio: 'inherit' }
  );

  await new Promise((resolve) => {
    chrome.on('close', resolve);
    setTimeout(() => {
      chrome.kill('SIGKILL');
      resolve();
    }, 6000);
  });

  server.close();
  console.log('Saved screenshot to:', outPath);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
