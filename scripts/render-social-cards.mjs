import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const svgPath = path.join(projectRoot, 'public', 'og-image.svg');
const ogPngPath = path.join(projectRoot, 'public', 'og-image.png');
const githubPreviewPath = path.join(projectRoot, 'public', 'github-social-preview.png');

async function renderSocialCards() {
  const svgContent = readFileSync(svgPath, 'utf8');

  const browser = await chromium.launch({
    headless: true,
  });

  try {
    // 1. Render og-image.png (1200x630)
    const pageOg = await browser.newPage({
      viewport: { width: 1200, height: 630 },
      deviceScaleFactor: 1,
    });

    const ogHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: 1200px;
    height: 630px;
    overflow: hidden;
    background-color: #020617;
  }
  svg {
    display: block;
    width: 1200px;
    height: 630px;
  }
</style>
</head>
<body>
${svgContent}
</body>
</html>`;

    await pageOg.setContent(ogHtml, { waitUntil: 'load' });
    const ogBuffer = await pageOg.screenshot({
      type: 'png',
      omitBackground: false,
    });
    writeFileSync(ogPngPath, ogBuffer);
    console.log(`Rendered og-image.png (${ogBuffer.length} bytes) to ${ogPngPath}`);
    await pageOg.close();

    // 2. Render github-social-preview.png (1280x640)
    const pageGh = await browser.newPage({
      viewport: { width: 1280, height: 640 },
      deviceScaleFactor: 1,
    });

    const ghHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: 1280px;
    height: 640px;
    overflow: hidden;
    background-color: #020617;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  svg {
    display: block;
    width: 1200px;
    height: 630px;
  }
</style>
</head>
<body>
${svgContent}
</body>
</html>`;

    await pageGh.setContent(ghHtml, { waitUntil: 'load' });
    const ghBuffer = await pageGh.screenshot({
      type: 'png',
      omitBackground: false,
    });
    writeFileSync(githubPreviewPath, ghBuffer);
    console.log(`Rendered github-social-preview.png (${ghBuffer.length} bytes) to ${githubPreviewPath}`);
    await pageGh.close();
  } finally {
    await browser.close();
  }
}

renderSocialCards().catch((err) => {
  console.error('Failed to render social cards:', err);
  process.exit(1);
});
