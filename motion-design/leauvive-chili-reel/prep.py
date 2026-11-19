"""Montage de la vidéo source : coupes + vitesses, recadrage 9:16, upscale 1080x1920,
débruitage/netteté/couleurs, export image par image (out/vframes) + segments.js pour index.html."""
import json, os, subprocess, sys
SRC = sys.argv[1] if len(sys.argv) > 1 else 'source/original.mov'
# (début, fin, vitesse) en secondes de la vidéo source
SEG = [  # (début, fin, vitesse, tag)  vitesse < 1 = ralenti fluide (interpolation de mouvement)
 (0.00, 1.90, 1.0, 'hook'),
 (2.00, 2.40, 1.6, 'oil'), (2.40, 3.40, 0.55, 'oil'), (3.40, 4.00, 1.6, 'oil'),
 (4.00, 5.20, 1.3, 'onion'), (5.20, 6.20, 0.6, 'onion'), (6.20, 7.00, 1.5, 'onion'),
 (7.00, 9.00, 2.5, 'stir'), (9.00, 12.50, 1.4, 'spice'), (12.50, 15.50, 3.0, 'stir'),
 (15.50, 16.40, 0.7, 'corn'), (16.40, 17.50, 0.5, 'tomato'), (17.50, 20.50, 2.5, 'stir'),
 (20.60, 22.55, 0.7, 'beans'), (22.65, 24.95, 1.2, 'beans'), (25.05, 31.50, 1.8, 'mix'),
 (31.62, 36.25, 3.0, 'steam'), (36.35, 38.12, 0.7, 'rice'), (38.22, 40.75, 2.0, 'rice'),
 (40.85, 42.02, 0.6, 'serve'), (42.12, 43.25, 0.6, 'herb'), (43.35, 45.92, 1.0, 'final'), (46.02, 47.30, 1.0, 'brand')]
os.makedirs('out/vframes', exist_ok=True)
fc, outs, t, cuts = [], [], 0.0, []
segs = []
for i, (a, b, s, tag) in enumerate(SEG):
    mi = ",minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1" if s < 1 else ",fps=30"
    fc.append(f"[0:v]trim={a}:{b},setpts=(PTS-STARTPTS)/{s}{mi}[v{i}]"); outs.append(f"[v{i}]")
    cuts.append(round(t, 3)); segs.append({'t': round(t, 3), 'd': round((b - a) / s, 3), 's': s, 'tag': tag}); t += (b - a) / s
fc.append(''.join(outs) + f"concat=n={len(SEG)}:v=1:a=0,fps=30,crop=394:700:0:56,"
          "hqdn3d=1.5:1.5:4:4,scale=1080:1920:flags=lanczos,unsharp=5:5:0.9:5:5:0.0,"
          "eq=contrast=1.06:saturation=1.15:brightness=0.01[out]")
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', SRC, '-filter_complex', ';'.join(fc), '-map', '[out]',
                '-q:v', '2', 'out/vframes/%05d.jpg'], check=True)
n = len(os.listdir('out/vframes'))
open('out/segments.js', 'w').write(f"window.CUTS={json.dumps(cuts)};window.SEGS={json.dumps(segs)};window.VLEN={t:.3f};window.NF={n};")
print('frames', n, 'durée vidéo', round(t, 2), 'coupes', cuts)
