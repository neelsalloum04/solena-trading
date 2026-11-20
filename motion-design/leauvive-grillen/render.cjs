// Rendu image par image (Playwright) puis encodage MP4 (ffmpeg). Usage : node render.cjs  |  node render.cjs --stills 1,5
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const ROOT = __dirname, OUT = path.join(ROOT, 'out'), FRAMES = path.join(OUT, 'frames'), FPS = 30;
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const open = async () => { const p = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
    p.on('pageerror', e => console.error('pageerror:', e.message));
    await p.goto('file://' + path.join(ROOT, 'index.html') + '?render=1'); await p.waitForFunction(() => window.READY === true); return p; };
  const page = await open(); const dur = await page.evaluate(() => window.DURATION);
  if (process.argv[2] === '--stills') {
    for (const t of process.argv[3].split(',').map(Number)) { await page.evaluate(t => window.seek(t), t); await page.screenshot({ path: path.join(OUT, `t${t}.png`) }); }
  } else {
    fs.rmSync(FRAMES, { recursive: true, force: true }); fs.mkdirSync(FRAMES, { recursive: true });
    for (let i = 0; i < Math.round(dur * FPS); i++) { await page.evaluate(t => window.seek(t), i / FPS);
      await page.screenshot({ path: path.join(FRAMES, String(i).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 94 }); }
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(FRAMES, '%05d.jpg'),
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(ROOT, 'leauvive-grillen.mp4')], { stdio: 'inherit' });
  }
  await browser.close();
})();
