# Vidéo motion design – ecomstartprofits.com

- `ecomstartprofits-motion-carre.mp4` : version carrée 1080×1080 (version principale).
- `ecomstartprofits-motion-vertical.mp4` : version verticale 1080×1920.

Les deux font environ 43 s à 30 i/s, avec musique de fond et effets sonores, entièrement générés par code (`music.py`, `sfx.py`), donc libres de droits.

Déroulé : conversation par SMS → recherche sur la page Google de Chrome (suggestion ecomstartprofits.com avec le logo Shopify) → page d’accueil (« en 48 heures chrono ») → formulaire (prénom, nom, e-mail) → étape 2, tarifs et commande (« Commande validée ») → « 48 heures plus tard… » → ouverture de l’app Shopify, « Commence à vendre » et notifications de commandes → écran final qui présente l’offre (points forts, formules à 10, 37 et 67 €, garantie de 120 jours, 5/5 sur Trustpilot) avec une flèche vers le bouton sous la vidéo.

## Modifier et refaire le rendu
- `index.html` : toutes les scènes (HTML/CSS) et la timeline GSAP. Les textes, les couleurs et les durées se changent ici.
  Ouvre le fichier dans un navigateur pour voir l’aperçu (`index.html?t=12` pour aller directement à 12 s).
- `node render.cjs` : rendu carré. `FORMAT=vertical node render.cjs` : rendu vertical. Le script capture la vidéo image par image avec Playwright, génère l’audio (`sfx.py` + `music.py`, qui demande `numpy` et `scipy`), puis encode avec ffmpeg vers `out/`.
- Le volume de la musique se règle avec `MUSIC_GAIN` dans `sfx.py`.
- `node render.cjs --stills 3,10.5` : exporte des images fixes pour vérifier un moment précis.
