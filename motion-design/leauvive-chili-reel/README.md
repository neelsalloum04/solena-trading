# L'Eau Vive – Chili con carne (reel Instagram)

Remontage vertical 1080×1920 (30 fps) de la vidéo de recette fournie (`source/original.mov`, 394×854, 47 s), optimisé pour le watch time :

- **Accroche dès la 1re image** : la cuillère de chili au ralenti avec le titre déjà affiché (pas de logo au début).
- **Rythme posé mais sans temps mort** : chaque étape en temps réel ou en ralenti fluide (images interpolées), les passages où on remue en boucle sont retirés, fondus enchaînés doux.
- **Fin** : plat à admirer sans texte, puis carte L'Eau Vive courte (phrase + logo + Andelnans) pour que la boucle reparte vite.
- **Son** : uniquement des bruits de cuisine générés par code (+ musique lo-fi discrète dans la version principale).

Fichiers :
- `leauvive-chili-reel.mp4` : version principale (bruits de cuisine + musique douce).
- `leauvive-chili-reel-sans-musique.mp4` : bruits de cuisine seuls, pour ajouter un son tendance dans Instagram.
- `couverture.jpg` : couverture du reel (zone 3:4 de la grille respectée).
- `LEGENDE.md` : légende prête à copier (ingrédients, étapes, astuce, hashtags) + conseils de publication.

Sources :
- `prep.py` : coupes, vitesses, ralentis interpolés, fondus, recadrage sans bordures, upscale → `out/`.
- `index.html` : habillage GSAP (titres, étapes, stickers, petit logo, sticker « Enregistre la recette », carte de fin).
- `cover.html` : couverture. `audio.py` : bande-son. `render.cjs` : rendu Playwright + ffmpeg.

Rendu : `python3 prep.py && node render.cjs` (Playwright/Chromium, ffmpeg, Python + numpy + scipy).
