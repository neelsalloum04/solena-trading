# L'Eau Vive – Chili con carne (motion design)

Pub verticale 1080×1920, 41,5 s, 30 fps : recette du chili con carne vue du dessus, style vidéo de recette virale.
Tout est original et généré par code : visuels en HTML/CSS/SVG animés avec GSAP, son synthétisé en Python (aucun sample, aucune image tierce).

- `index.html` : la scène et la timeline GSAP (ouvrir dans un navigateur pour la prévisualiser, `?t=12` pour sauter à 12 s).
- `render.cjs` : capture image par image avec Playwright, puis encode `leauvive-chili.mp4` avec ffmpeg.
- `audio.py` : bruits de cuisson synchronisés sur les cues de la timeline (grésillement, huile, chutes, haricots, poudres, sauce, cuillère, couvercle, mijotage, minuteur) + musique lo-fi chill (Rhodes, basse, batterie, vinyle).
- `assets/` : polices Baloo 2 / Pacifico, GSAP, logo L'Eau Vive.

Rendu : `node render.cjs` (nécessite Playwright/Chromium, ffmpeg, Python avec numpy + scipy).
Captures : `node render.cjs --stills 5,20,35`.
