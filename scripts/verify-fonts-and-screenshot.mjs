import { spawn } from 'child_process';
import http from 'http';

const devFontsOut = '/Users/trongnsi/.gemini/antigravity/brain/7341c9ee-9281-4a4f-9003-872dc37da366/dev_fonts_screenshot.png';
const heroOut = '/Users/trongnsi/.gemini/antigravity/brain/7341c9ee-9281-4a4f-9003-872dc37da366/hero_screenshot.png';

async function waitServer(url, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode === 200) resolve();
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

function takeScreenshot(url, outPath, width = 390, height = 900) {
  return new Promise((resolve, reject) => {
    const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    const chrome = spawn(
      chromePath,
      [
        '--headless',
        '--hide-scrollbars',
        '--no-first-run',
        '--no-default-browser-check',
        `--window-size=${width},${height}`,
        `--screenshot=${outPath}`,
        url,
      ],
      { stdio: 'inherit' }
    );

    const timer = setTimeout(() => {
      chrome.kill('SIGKILL');
      resolve();
    }, 6000);

    chrome.on('close', () => {
      clearTimeout(timer);
      resolve();
    });
  });
}

async function run() {
  // Run vite dev server so /dev/fonts route is active (DEV mode)
  const devServer = spawn('npx', ['vite', '--force', '--port', '5173'], {
    stdio: 'ignore',
  });

  try {
    await waitServer('http://localhost:5173');
    console.log('Vite dev server running on 5173');

    // 1. Take screenshot of /dev/fonts (test route requested by user)
    await takeScreenshot('http://localhost:5173/dev/fonts', devFontsOut, 430, 1800);
    console.log('Saved /dev/fonts screenshot to:', devFontsOut);

    // 2. Take screenshot of / (hero mobile 390px)
    await takeScreenshot('http://localhost:5173/', heroOut, 390, 844);
    console.log('Saved hero 390px screenshot to:', heroOut);

    // 3. Tablet 768px
    const tabletOut = '/Users/trongnsi/.gemini/antigravity/brain/7341c9ee-9281-4a4f-9003-872dc37da366/hero_768px_screenshot.png';
    await takeScreenshot('http://localhost:5173/', tabletOut, 768, 900);
    console.log('Saved hero 768px screenshot to:', tabletOut);

    // 4. Desktop 1280px
    const desktopOut = '/Users/trongnsi/.gemini/antigravity/brain/7341c9ee-9281-4a4f-9003-872dc37da366/hero_1280px_screenshot.png';
    await takeScreenshot('http://localhost:5173/', desktopOut, 1280, 900);
    console.log('Saved hero 1280px screenshot to:', desktopOut);

    // 5. Landing full page mobile (to capture footer)
    const landingFullOut = '/Users/trongnsi/.gemini/antigravity/brain/7341c9ee-9281-4a4f-9003-872dc37da366/landing_full_mobile.png';
    await takeScreenshot('http://localhost:5173/', landingFullOut, 390, 1500);
    console.log('Saved landing full mobile screenshot to:', landingFullOut);
  } finally {
    devServer.kill('SIGTERM');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
