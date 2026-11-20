"""Montage optimisé pour le watch time Instagram :
accroche sur le plat dès la 1re image, chaque étape en temps réel ou en ralenti fluide (interpolation),
sans les passages répétitifs, fondus enchaînés doux, recadrage 9:16 sans bordures, upscale 1080x1920.
Sortie : out/vframes/*.jpg + out/segments.js (utilisé par index.html et cover.html)."""
import json, os, shutil, subprocess, sys

SRC = sys.argv[1] if len(sys.argv) > 1 else 'source/original.mov'
FPS = 30
XF = 8  # durée des fondus enchaînés, en images
SEG = [  # (début, fin, vitesse, tag) en secondes de la vidéo source ; vitesse < 1 = ralenti interpolé
    (40.85, 42.02, 0.50, 'hook'),     # accroche : la cuillère de chili sur le riz
    (2.00, 3.90, 0.65, 'oil'),
    (4.00, 6.70, 0.80, 'onion'),
    (9.00, 12.20, 0.95, 'spice'),
    (15.50, 16.40, 0.65, 'tomcorn'), (16.40, 17.70, 0.60, 'tomcorn'),
    (20.60, 22.55, 0.65, 'beans'), (22.65, 23.95, 1.00, 'beans'),
    (28.90, 30.00, 0.90, 'mix'), (30.20, 31.45, 0.65, 'mix'),
    (36.40, 38.10, 0.70, 'rice'), (38.20, 39.60, 1.00, 'rice'),
    (40.05, 40.75, 0.70, 'final'), (42.12, 43.25, 0.50, 'final'), (43.35, 45.80, 0.85, 'final'),
]
GRADE = ("crop=382:679:8:60,hqdn3d=1.5:1.5:4:4,scale=1080:1920:flags=lanczos,"
         "unsharp=5:5:0.9:5:5:0.0,eq=contrast=1.06:saturation=1.15:brightness=0.01,format=yuv420p")

fc, segs, L, prev = [], [], 0, '[v0]'
for i, (a, b, s, tag) in enumerate(SEG):
    n = round((b - a) / s * FPS)
    mi = "minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1" if s < 1 else "fps=30"
    fc.append(f"[0:v]trim={a}:{b},setpts=(PTS-STARTPTS)/{s},{mi},tpad=stop_mode=clone:stop_duration=0.3,"
              f"trim=end_frame={n},setpts=PTS-STARTPTS,{GRADE},settb=1/{FPS}[v{i}]")
    x = 0 if i == 0 else (1 if SEG[i - 1][3] == 'hook' else XF)  # coupe franche juste après l'accroche
    start = L - x
    if i:
        fc.append(f"{prev}[v{i}]xfade=transition=fade:duration={x / FPS:.4f}:offset={start / FPS:.4f}[x{i}]")
        prev = f"[x{i}]"
    segs.append({'t': round(start / FPS, 4), 'd': round(n / FPS, 4), 'a': a, 'b': b, 's': s, 'tag': tag})
    L = start + n

shutil.rmtree('out/vframes', ignore_errors=True)
os.makedirs('out/vframes')
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', SRC, '-filter_complex', ';'.join(fc), '-map', prev,
                '-q:v', '2', 'out/vframes/%05d.jpg'], check=True)
nf = len(os.listdir('out/vframes'))
open('out/segments.js', 'w').write(f"window.SEGS={json.dumps(segs)};window.VLEN={L / FPS:.4f};window.NF={nf};")
print('images', nf, '| durée vidéo', round(L / FPS, 2), 's |', ' '.join(f"{g['tag']}@{g['t']}" for g in segs))
