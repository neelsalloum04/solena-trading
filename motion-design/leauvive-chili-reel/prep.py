"""Montage de la vidéo source : coupes + vitesses, recadrage 9:16, upscale 1080x1920,
débruitage/netteté/couleurs, export image par image (out/vframes) + segments.js pour index.html."""
import json, os, subprocess, sys
SRC = sys.argv[1] if len(sys.argv) > 1 else 'source/original.mov'
# (début, fin, vitesse) en secondes de la vidéo source
SEG = [
 (0.00, 1.90, 1.0), (2.00, 4.00, 1.3), (4.00, 7.00, 1.3), (7.00, 9.00, 2.0), (9.00, 12.50, 1.4),
 (12.50, 15.50, 2.5), (15.50, 17.50, 1.2), (17.50, 20.50, 2.0), (20.60, 22.55, 1.0), (22.65, 24.95, 1.0),
 (25.05, 31.50, 1.6), (31.62, 36.25, 2.5), (36.35, 38.12, 1.0), (38.22, 40.75, 1.8), (40.85, 42.02, 1.0),
 (42.12, 43.25, 1.0), (43.35, 45.92, 1.0), (46.02, 47.30, 1.0)]
os.makedirs('out/vframes', exist_ok=True)
fc, outs, t, cuts = [], [], 0.0, []
for i, (a, b, s) in enumerate(SEG):
    fc.append(f"[0:v]trim={a}:{b},setpts=(PTS-STARTPTS)/{s}[v{i}]"); outs.append(f"[v{i}]")
    cuts.append(round(t, 3)); t += (b - a) / s
fc.append(''.join(outs) + f"concat=n={len(SEG)}:v=1:a=0,fps=30,crop=394:700:0:56,"
          "hqdn3d=1.5:1.5:4:4,scale=1080:1920:flags=lanczos,unsharp=5:5:0.9:5:5:0.0,"
          "eq=contrast=1.06:saturation=1.15:brightness=0.01[out]")
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', SRC, '-filter_complex', ';'.join(fc), '-map', '[out]',
                '-q:v', '2', 'out/vframes/%05d.jpg'], check=True)
n = len(os.listdir('out/vframes'))
open('out/segments.js', 'w').write(f"window.CUTS={json.dumps(cuts)};window.VLEN={t:.3f};window.NF={n};")
print('frames', n, 'durée vidéo', round(t, 2), 'coupes', cuts)
