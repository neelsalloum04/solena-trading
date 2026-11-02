# Vidéo motion design – ecomstartprofits.com

`ecomstartprofits-motion.mp4` : vidéo verticale 1080×1920, 30 i/s, environ 43 s, avec effets sonores.

Déroulé : conversation par SMS → recherche de www.ecomstartprofits.com → page d’accueil (« en 48 heures chrono ») → formulaire (prénom, nom, e-mail) → étape 2, tarifs et commande → « Validé, votre boutique est en création, prête dans 48 heures » → « 48 heures plus tard… » → ouverture de l’app Shopify, « Commence à vendre » et notifications de commandes → écran final avec l’appel à l’action.

## Modifier et refaire le rendu
- `index.html` : toutes les scènes (HTML/CSS) et la timeline GSAP. Les textes, les couleurs et les durées se changent ici.
  Ouvre le fichier dans un navigateur pour voir l’aperçu (`index.html?t=12` pour aller directement à 12 s).
- `node render.cjs` : capture image par image avec Playwright, synthèse audio (`sfx.py`), puis encodage avec ffmpeg vers `out/`.
- `node render.cjs --stills 3,10.5` : exporte des images fixes pour vérifier un moment précis.
