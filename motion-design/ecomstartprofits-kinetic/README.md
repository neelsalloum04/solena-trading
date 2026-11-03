# Vidéo 2 : kinetic typography – ecomstartprofits.com

- `ecomstartprofits-kinetic-carre.mp4` : version carrée 1080×1080, 49 s, animée en 3D, avec une musique épique.
- `ecomstartprofits-kinetic-vertical.mp4` : version verticale 1080×1920, avec le même contenu centré dans la zone sûre.

Le texte est découpé en 15 écrans. Chaque phrase a sa propre animation (mots qui montent derrière un masque, flou, impact, compteur…) et un visuel animé qui l’illustre :

1. Tu veux te lancer dans le e-commerce ? : un caddie tombe et rebondit.
2. Mais tu ne sais pas créer ta boutique ? : un navigateur en erreur et des « ? ».
3. Regarde ça ! : texte qui claque, secousse et yeux animés.
4. En 48 heures, : le compteur passe de 0 à 48 dans un anneau (premier drop de la musique).
5. On crée ta boutique Shopify avec : : apparition du logo Shopify.
6. à 10. Les 5 atouts, chacun avec son animation : trophée « Produit winner », camion de livraison, résultat de recherche qui monte en #1, téléphone 9:16, chemin de A à Z. Ils se terminent par un récapitulatif coché.
11. à 13. Les 3 étapes, avec une barre de progression : clic sur « Commander », enveloppe qui s’ouvre sur la boutique, puis « Et tu vends ! » avec notifications et confettis (second drop).
14. Commande ta boutique en ligne, on s’occupe du reste ! : l’adresse ecomstartprofits.com se tape.
15. Lien en bio ! : badge animé avec halo.

La musique épique vient de `../ecomstartprofits/music_epic.py` : piano, cordes, chœurs, cuivres, tambours taiko et coups de cuivres graves. Les effets sonores viennent de `../ecomstartprofits/sfx.py`. Tout est généré par code, donc libre de droits.

## Refaire le rendu
- `node render.cjs` : version carrée.
- `FORMAT=vertical node render.cjs` : version verticale.
- Les durées des écrans se règlent dans l’objet `F` de `index.html`.
