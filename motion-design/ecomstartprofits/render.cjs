// Renders index.html frame-by-frame with Playwright, then encodes an MP4 with ffmpeg.
// Usage:
//   node render.cjs                 -> full render (out/ecomstartprofits-motion.mp4)
//   node render.cjs --stills 1,5.2  -> PNG stills at given seconds (out/stills)
//   FORMAT=vertical node render.cjs   -> 1080x1920 version (default: square 1080x1080)
//   FPS=30 WORKERS=4 node render.cjs
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const OUT = path.join(ROOT, 'out');
const FRAMES = path.join(OUT, 'frames');
const FPS = +(process.env.FPS || 30);
const WORKERS = +(process.env.WORKERS || 4);
const VERTICAL = process.env.FORMAT === 'vertical';
const H = VERTICAL ? 1920 : 1080;
const URL = 'file://' + path.join(ROOT, 'index.html') + '?render=1' + (VERTICAL ? '&vertical=1' : '');

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1080, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('pageerror:', e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.error('console:', m.text()); });
  await page.goto(URL);
  await page.waitForFunction(() => window.READY === true, null, { timeout: 30000 });
  return page;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const args = process.argv.slice(2);

  if (args[0] === '--stills') {
    const dir = path.join(OUT, VERTICAL ? 'stills-v' : 'stills'); fs.mkdirSync(dir, { recursive: true });
    const page = await openPage(browser);
    console.log('duration', await page.evaluate(() => window.DURATION));
    for (const t of args[1].split(',').map(Number)) {
      await page.evaluate(t => window.seek(t), t);
      const f = path.join(dir, `t${t.toFixed(2)}.png`);
      await page.screenshot({ path: f });
      console.log(f);
    }
    await browser.close();
    return;
  }

  fs.rmSync(FRAMES, { recursive: true, force: true });
  fs.mkdirSync(FRAMES, { recursive: true });
  const probe = await openPage(browser);
  const duration = await probe.evaluate(() => window.DURATION);
  const sfx = await probe.evaluate(() => window.SFX);
  const music = await probe.evaluate(() => window.MUSIC);
  await probe.close();
  fs.writeFileSync(path.join(OUT, 'sfx.json'), JSON.stringify({ duration, cues: sfx, music }, null, 1));
  const total = Math.ceil(duration * FPS);
  console.log(`duration ${duration.toFixed(2)}s -> ${total} frames @${FPS}fps, ${WORKERS} workers`);

  const per = Math.ceil(total / WORKERS);
  let done = 0; const t0 = Date.now();
  await Promise.all(Array.from({ length: WORKERS }, async (_, w) => {
    const page = await openPage(browser);
    for (let i = w * per; i < Math.min(total, (w + 1) * per); i++) {
      await page.evaluate(t => window.seek(t), i / FPS);
      await page.screenshot({ path: path.join(FRAMES, `${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 94 });
      if (++done % 60 === 0) console.log(`${done}/${total}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    await page.close();
  }));
  await browser.close();

  // audio
  execFileSync('python3', [path.join(ROOT, 'sfx.py'), path.join(OUT, 'sfx.json'), path.join(OUT, 'sfx.wav')], { stdio: 'inherit' });

  const mp4 = path.join(OUT, VERTICAL ? 'ecomstartprofits-motion-vertical.mp4' : 'ecomstartprofits-motion-carre.mp4');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(FRAMES, '%05d.jpg'),
    '-i', path.join(OUT, 'sfx.wav'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', mp4], { stdio: 'inherit' });
  console.log('wrote', mp4);
})();
