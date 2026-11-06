# Revue de la référence sombre L1

- Date : 2026-11-06
- Référence de commit : `82f8335` (`first commit for klb`)
- Capture de référence : `snapshots/ref-commit-dark`
- Référence sombre validée : `snapshots/baseline-dark`
- Comparaison : 15 captures, pixelmatch `threshold: 0.1`; masque appliqué aux 96 premières lignes des captures 375 px.

## Comparaison finale

| Page | 375 px | 768 px | 1440 px |
| --- | ---: | ---: | ---: |
| Accueil | 0.0002 % | 0.0066 % | 0.0077 % |
| Carte | 0.0000 % | 0.0126 % | 0.0066 % |
| Ambiance | 0.0000 % | 0.0207 % | 0.0133 % |
| Nous trouver | 0.0000 % | 0.0287 % | 0.0151 % |
| 404 | 0.0000 % | 0.0481 % | 0.0289 % |

15/15 captures sont à `0.05 %` ou moins. L’écart maximum est `0.0481 %` sur `404-768.png`.

## Écarts acceptés et corrections

- Les modifications du menu mobile depuis `82f8335` (panneau bas, arrière-plan, poignée, cloche, animation, focus, fermeture, historique et actions rapides) sont du travail utilisateur post-commit. Elles sont classées MENU MOBILE. Le bandeau supérieur des captures 375 px est masqué pour la comparaison, selon la procédure.
- Le bouton `ThemeToggle` placé dans la navigation desktop et le menu mobile est une fonction L1 requise. Les petits écarts restants sur les captures desktop sont localisés au header/navigation et proviennent de ce bouton et de l’espace associé. Le toggle du menu mobile reste dans la zone masquée sur les captures 375 px.
- Les fichiers `public/images-opt/` (76 fichiers suivis dans `82f8335`) étaient absents de l’arbre de travail et ont été enregistrés comme suppressions au point de sauvegarde. C’est un changement post-commit non visuel : les comparaisons complètes des 15 captures n’ont pas montré de différence au-delà du seuil.
- La première comparaison avant correction dépassait le seuil sur six images : `home-375` 10.1579 %, `nous-trouver-375` 20.1963 %, `home-768` 9.8418 %, `nous-trouver-768` 25.5906 %, `home-1440` 12.3905 % et `nous-trouver-1440` 25.0940 %. Les différences visibles étaient dues aux surfaces LIGHT-BY-DESIGN remplacées à tort par des surfaces sombres : tuiles Commander/Sur place, FAQ et transition claire vers FindUs. Les valeurs d’origine claires ont été rétablies avant la comparaison finale.
- `home-375.png` présente `0.0002 %` d’écart. Une seconde capture identique du commit de référence, comparée à la première, reproduit exactement `0.0002 %` sur `home-375.png` et `0.0000 %` sur les 14 autres images. Ce faible écart est donc une variation reproductible de capture, non une différence propre au thème L1.

## Classification des changements de Header et tokens.css

- `src/components/layout/Header.tsx` : les blocs d’ouverture/fermeture du menu, voile, panneau, focus, historique, drag, état d’ouverture et navigation mobile sont MENU MOBILE (travail utilisateur post-commit). Les rendus des deux `ThemeToggle` sont les ajouts L1 intentionnels.
- `src/styles/tokens.css` : l’unique bloc ajouté depuis `82f8335` est le groupe responsive du menu mobile et ses règles de réduction de mouvement; il est classé MENU MOBILE.

Le dossier `snapshots/current-dark` a été copié vers `snapshots/baseline-dark` après correction. La baseline n’est pas modifiée par les comparaisons ultérieures.
