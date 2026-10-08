import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Sitemap & Robots SEO Verification', () => {
  const rootDir = process.cwd();
  const sitemapPath = path.join(rootDir, 'public', 'sitemap.xml');
  const robotsPath = path.join(rootDir, 'public', 'robots.txt');
  const routesJsonPath = path.join(rootDir, '_routes.json');
  const indexPath = path.join(rootDir, 'index.html');

  test('sitemap.xml exists and uses standard 0.9 namespace', () => {
    assert.ok(fs.existsSync(sitemapPath), 'public/sitemap.xml must exist');
    const content = fs.readFileSync(sitemapPath, 'utf-8');
    assert.match(content, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
    assert.match(content, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  });

  test('sitemap.xml contains exactly the 3 permitted routes with valid lastmod', () => {
    const content = fs.readFileSync(sitemapPath, 'utf-8');
    const locMatches = [...content.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);

    const expectedUrls = [
      'https://guivutru.pages.dev/',
      'https://guivutru.pages.dev/viet',
      'https://guivutru.pages.dev/gioi-thieu',
    ];

    assert.deepStrictEqual(locMatches.sort(), expectedUrls.sort(), 'Must emit ONLY the 3 approved routes');

    // Verify lastmod dates are valid YYYY-MM-DD
    const lastmodMatches = [...content.matchAll(/<lastmod>(.*?)<\/lastmod>/g)].map(m => m[1]);
    assert.strictEqual(lastmodMatches.length, 3, 'Must have 3 lastmod tags');
    for (const d of lastmodMatches) {
      assert.match(d, /^\d{4}-\d{2}-\d{2}$/, 'lastmod must be YYYY-MM-DD');
      const dateObj = new Date(d);
      assert.ok(!isNaN(dateObj.getTime()), 'lastmod must be a valid real date');
    }

    // Google ignores priority and changefreq - must not be present
    assert.ok(!content.includes('<priority>'), 'Must NOT emit <priority>');
    assert.ok(!content.includes('<changefreq>'), 'Must NOT emit <changefreq>');
  });

  test('sitemap.xml leaks NO private, authed, ephemeral, or unreleased routes', () => {
    const rawContent = fs.readFileSync(sitemapPath, 'utf-8');
    const content = rawContent.replace(/<!--[\s\S]*?-->/g, '');
    const forbidden = [
      '/toi',
      '/note',
      '/viet/xong',
      '/bau-troi',
      '/admin',
      '/dev',
    ];

    for (const route of forbidden) {
      assert.ok(!content.includes(route), `sitemap.xml must NOT leak forbidden route: ${route}`);
    }
  });

  test('robots.txt includes all required Disallow directives and Sitemap URL', () => {
    assert.ok(fs.existsSync(robotsPath), 'public/robots.txt must exist');
    const content = fs.readFileSync(robotsPath, 'utf-8');

    assert.ok(content.includes('User-agent: *'), 'Must include User-agent: *');
    assert.ok(content.includes('Allow: /'), 'Must include Allow: /');
    assert.ok(content.includes('Sitemap: https://guivutru.pages.dev/sitemap.xml'), 'Must include Sitemap directive');

    const expectedDisallows = [
      '/toi',
      '/note/',
      '/viet/xong',
      '/bau-troi',
      '/bau-troi/cua-troi',
      '/admin/bao-cao',
      '/dev/',
    ];

    for (const pathPrefix of expectedDisallows) {
      assert.ok(
        content.includes(`Disallow: ${pathPrefix}`),
        `robots.txt must explicitly Disallow: ${pathPrefix}`
      );
    }
  });

  test('_routes.json excludes /sitemap.xml and /robots.txt from Functions', () => {
    assert.ok(fs.existsSync(routesJsonPath), '_routes.json must exist');
    const routesConfig = JSON.parse(fs.readFileSync(routesJsonPath, 'utf-8'));

    assert.ok(Array.isArray(routesConfig.exclude), 'exclude must be an array');
    assert.ok(routesConfig.exclude.includes('/sitemap.xml'), 'exclude must contain /sitemap.xml');
    assert.ok(routesConfig.exclude.includes('/robots.txt'), 'exclude must contain /robots.txt');
  });

  test('index.html maintains index, follow meta tag and no per-route meta hacks', () => {
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    assert.ok(indexContent.includes('<meta name="robots" content="index, follow" />'), 'index.html must have robots index, follow');
  });
});
