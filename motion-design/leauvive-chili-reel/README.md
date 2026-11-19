# L'Eau Vive – Chili sin carne (reel viral)

Remontage vertical 1080×1920 (36,7 s, 30 fps) de la vidéo de recette fournie (`source/original.mov`, 394×854, 47 s).

- `prep.py` : coupes et accélérations (47 s → 33 s), recadrage 9:16, upscale 1080×1920 (lanczos), débruitage, netteté, couleurs ; export image par image dans `out/`.
- `index.html` : habillage GSAP par-dessus la vidéo : zooms « punch » et flashs à chaque coupe, sous-titres animés avec badge BIO et numéros d'étape, barre de progression, chrono, sticker « Enregistre la recette », petit logo L'Eau Vive, carte de fin L'Eau Vive (après la carte d'origine).
- `audio.py` : nouvelle bande-son générée par code (whooshs, pops, bruits de cuisson, musique lo-fi groovy) qui remplace la musique d'origine.
- `render.cjs` : capture Playwright + ffmpeg → `leauvive-chili-reel.mp4`.

Rendu : `python3 prep.py && node render.cjs` (Playwright/Chromium, ffmpeg, Python + numpy + scipy). Les polices, GSAP et le logo viennent de `../leauvive-chili/assets/`.
