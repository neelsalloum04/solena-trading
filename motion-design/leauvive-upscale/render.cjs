// 1) rend le logo propre en PNG transparents image par image  2) améliore la vidéo et superpose le logo (musique d'origine conservée)
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const ROOT = __dirname, OUT = path.join(ROOT, 'out'), FR = path.join(OUT, 'logo'), SRC = path.join(ROOT, 'source', 'original.mov');
(async () => {
  fs.rmSync(FR, { recursive: true, force: true }); fs.mkdirSync(FR, { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1380 } });
  await p.goto('file://' + path.join(ROOT, 'logo.html')); await p.waitForFunction(() => window.READY === true);
  const n = Math.round(await p.evaluate(() => window.DURATION) * 30);
  for (let i = 0; i < n; i++) { await p.evaluate(t => window.seek(t), i / 30); await p.screenshot({ path: path.join(FR, String(i).padStart(5, '0') + '.png'), omitBackground: true }); }
  await b.close();
  if (process.argv[2] === '--logo-only') return;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', SRC, '-framerate', '30', '-i', path.join(FR, '%05d.png'), '-filter_complex',
    '[0:v]hqdn3d=1.5:1.5:3:3,unsharp=5:5:0.8:3:3:0.3,eq=contrast=1.05:saturation=1.1,format=yuv420p[b];[b][1:v]overlay=0:0:eof_action=pass:format=auto,format=yuv420p[v]',
    '-map', '[v]', '-map', '0:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-c:a', 'copy', '-movflags', '+faststart', path.join(ROOT, 'leauvive-video-hd.mp4')], { stdio: 'inherit' });
})();
