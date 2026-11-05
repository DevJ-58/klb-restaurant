# KLB Restaurant — Dossier de direction du site vitrine

Préparé le 2 novembre 2026 pour Fréjus Kouadio (DevJ). À enregistrer dans le dépôt sous `docs/DIRECTION.md` pour que Copilot le lise avant chaque phase.

## 1. Vision

Une soirée chez KLB. Le site doit donner faim avant d’avoir donné la moindre information : photos pleine puissance, texte minimal, mouvements qui racontent quelque chose (vapeur, assiettes qui tournent, cloche qui se lève).

La boldness est dépensée en un seul endroit : la cloche dorée du logo se soulève à l’ouverture et révèle le hero. Tout le reste reste discipliné, pour que ce moment reste mémorable.

Exigences posées par Fréjus : l’image prime sur le mot ; charte noir et or du logo ; mêmes mécaniques d’animation et de transition que delice.ca ; cartes de plats dessinées dans les coins ; sections non prioritaires remplacées par des sections adaptées à KLB.

## 2. Ce que fait delice.ca, et sa traduction pour KLB

Analyse faite à partir de la vidéo de navigation fournie. Les durées sont estimées à l’œil et à ajuster au rendu.

| # | Observé sur delice.ca | Traduction KLB |
| --- | --- | --- |
| 1 | Chargement : fond uni couleur de marque, titre qui se compose lettre par lettre sur un léger arc | Écran noir chaud, la cloche dorée se soulève (1,2 s) avec un filet de vapeur SVG, puis le slogan se compose lettre par lettre |
| 2 | Hero : titre à gauche, plat photographié dans une forme organique à droite, barre de 4 actions fixe en bas | Titre « Bonne cuisine, bonne ambiance. » à gauche, plat dans un masque organique à bord doré, barre fixe : Appeler, WhatsApp, Menu de ma table, Itinéraire |
| 3 | Au scroll, la photo grandit jusqu’à remplir l’écran (zoom à travers le masque), puis la section suivante arrive | Section épinglée, masque qui s’agrandit en scrub, texte suivant en fondu |
| 4 | Formes sombres organiques qui dérivent, petites photos rondes qui flottent en parallaxe | Formes or et vert feuille à très faible opacité, 3 photos rondes flottantes (flamme, dressage, service) |
| 5 | « Plaisirs du jour » : défilement horizontal épinglé, assiettes rondes à anneau crème, fond qui change de couleur à chaque carte, titre courbé en arc, assiette suivante qui se révèle en tournant | « Les incontournables » : même mécanique, anneau or, fonds qui passent noir chaud, vert forêt, espresso, ambre sombre, titre courbé |
| 6 | Compteurs dans des cercles sur fond marbré | 3 cercles de chiffres vrais uniquement : 7/7 jours, 15 h d’ouverture par jour, 3 promesses |
| 7 | Carrousel de cartes événements avec flèches | Remplacé par « Ambiance » : galerie à glisser avec curseur personnalisé |
| 8 | Bandeau géant qui défile avec bouton rond au milieu | Marquee « Cuisine de qualité, Service chaleureux, Moment inoubliable » avec bouton rond « Voir la carte » |
| 9 | Deux grands panneaux de couleur côte à côte (emporter, carte cadeau) | « Commander » (WhatsApp ou appel) et « Sur place » (menu par QR de table) |
| 10 | Page menu : onglets collés avec icônes, bascule de mode, accès rapide à gauche avec compteurs, filtres d’allergènes | Page Carte : onglets collés à icônes, accès rapide avec compteurs, filtres Végétarien et Épicé, lignes plat, description, prix en FCFA |
| 11 | Transition de page : fondu vers une couleur, titre qui se recompose | Rideau doré qui balaie l’écran, puis le titre de la page se recompose |
| 12 | Curseur rond rouge « Maintenez et déplacer » sur la galerie | Curseur or « Glissez » |

Ajout propre à KLB, demandé par Fréjus : les **cartes de plats d’angle** (composant `CornerDish`).

- Cercle de 28 à 40 vw, anneau or, découpé par les bords de la section.
- Rotation lente liée au scroll de la section.
- Au survol ou au toucher : une carte flottante avec le nom du plat, son prix et le bouton « Commander ce plat », qui ouvre WhatsApp avec le nom du plat déjà écrit.
- Emplacements : bas droite du hero, haut gauche de « À chaque faim, son assiette », haut droite de l’aperçu de la carte, bas gauche de « Nous trouver ».

## 3. Direction artistique

### Palette (tirée du logo)

Valeurs estimées à l’œil depuis le logo ; à corriger à la pipette sur le fichier source si besoin.

| Nom | Hex | Rôle |
| --- | --- | --- |
| ink | #0B0806 | Fond principal, noir chaud du logo (jamais de noir pur) |
| espresso | #1A110B | Sections alternées |
| forest | #0E2A1A | Vert profond, écho des feuilles |
| amber-deep | #2B1A06 | Fond ambre sombre des cartes d’incontournables |
| gold-300 | #FFD36B | Reflets, texte doré sur fond sombre |
| gold-500 | #F5A912 | Or principal : boutons, anneaux, détails |
| gold-700 | #B9740A | Ombres de l’or, bordures |
| ivory | #FBF6EA | Texte sur sombre ; fond de la section carte |
| leaf | #4FA23A | Accent minuscule : feuilles, pastilles végétariennes |

Dégradé or : `linear-gradient(135deg, #FFD36B 0%, #F5A912 48%, #C9800B 100%)`.

Texte sur fond sombre : ivory à 92 %, 68 % et 48 %. Bordures : `rgba(255, 211, 107, 0.16)`. Sur fond ivory, le texte est en ink. Contraste minimum 4,5:1 partout.

### Typographie

- Titres : **Fraunces** (variable, axes opsz et SOFT), en romain et en italique selon le moment. Elle porte le côté chaleureux et gourmand sans copier le script du logo.
- Interface et texte : **Manrope**.
- Le script de « Restaurant » reste dans l’image du logo ; aucune troisième police.
- Hero : `clamp(3rem, 9vw, 10rem)`, interligne 0,95, crénage −0,03em. Titres de section : `clamp(2.25rem, 5vw, 5rem)`. Texte : 1,125 rem, interligne 1,6, lignes de moins de 70 caractères.
- Pas de labels tout en majuscules ni de numérotation décorative.

### Mouvement

- Une seule bibliothèque d’animation : **GSAP + ScrollTrigger** (SplitText ou SplitType pour les lettres). Défilement fluide : **Lenis**, branché sur le ticker GSAP.
- Courbes : sortie `cubic-bezier(0.16, 1, 0.3, 1)` (GSAP `power4.out`), transitions fortes `cubic-bezier(0.76, 0, 0.24, 1)` (`power4.inOut`), transitions de page `expo.inOut`.
- Durées : micro 0,15 s, petite 0,25 s, moyenne 0,4 s, grande 0,6 à 0,9 s, loader 1,6 s.
- On n’anime que `transform` et `opacity`. Les révélations au scroll sont déclenchées une seule fois, 30 px de translation au maximum.
- `prefers-reduced-motion` : état final affiché tout de suite, pas de scrub, pas de Lenis.
- Interdits : parallax en `background-attachment: fixed`, carrousels automatiques, effets de survol qui restent collés sur mobile.

### Performance et qualité

Images en WebP ou AVIF, chargement différé sauf le hero, ratio réservé pour éviter le décalage de mise en page, objectif de chargement du hero sous 2,5 s sur 4G, 60 fps. Responsive testé à 375, 768, 1024 et 1440 px. Cibles tactiles de 44 px minimum, focus clavier doré visible.

## 4. Architecture

Pages : `/` Accueil, `/carte`, `/ambiance`, `/nous-trouver`. Navigation en deux moitiés autour du logo centré : Carte, Ambiance, logo, Nous trouver, Sur place.

Ordre des sections de l’accueil, avec un rythme volontairement varié :

1. Loader cloche
2. Hero sur ink, masque organique et zoom au scroll
3. « À chaque faim, son assiette » : texte court, formes organiques, 3 rondes flottantes, fond ink vers forest
4. « Les incontournables » : défilement horizontal épinglé, 6 cartes, fonds qui changent
5. Trois promesses : cercles de chiffres sur forest
6. « L’ambiance KLB » : galerie à glisser sur espresso
7. Aperçu de la carte sur ivory : 6 plats, bouton « Voir toute la carte »
8. « Commander » et « Sur place » : deux grands panneaux
9. Marquee géant avec bouton rond
10. « Nous trouver » : horaires avec pagination par jour et mention « Ouvert actuellement » calculée, itinéraire Google Maps
11. Pied de page

Barre d’actions fixe en bas de l’écran sur toutes les pages : Appeler, WhatsApp, Menu de ma table, Itinéraire.

## 5. Informations réelles et textes

Références confirmées par Fréjus :

- Établissement : KLB Restaurant, restaurant et cafétéria, quartier Morofé, Yamoussoukro (Côte d’Ivoire).
- Slogan du logo : « Bonne cuisine, bonne ambiance ! ». Trois promesses du logo : Cuisine de qualité, Service chaleureux, Moment inoubliable.
- Horaires : généralement tous les jours de 8 h 30 à 23 h 30 (à confirmer avec KLB).
- Téléphone et WhatsApp : +225 05 05 52 01 39, soit `+2250505520139` dans les liens.
- Itinéraire : https://maps.app.goo.gl/5AnSXfayGygUcb557
- Commander à distance : appel ou WhatsApp. Lien WhatsApp : `https://wa.me/2250505520139?text=` suivi du message encodé « Bonjour KLB, je souhaite commander : ».
- Réservation : il n’y a pas de réservation classique. Chaque table a un QR code qui ouvre le menu du système en place. Le site renvoie vers ce système avec la mention claire que c’est réservé aux clients déjà installés à une table. L’adresse du système n’est pas encore connue : variable `VITE_TABLE_MENU_URL`, bouton masqué tant qu’elle est vide.

Une recherche web sur KLB n’a rien donné de vérifiable. Aucun fait inventé : ni année de création, ni histoire du chef, ni chiffres de fréquentation. Tout texte provisoire est signalé dans le code.

Textes de l’accueil :

- Hero : « Bonne cuisine, bonne ambiance. » puis « Restaurant et cafétéria à Morofé, Yamoussoukro. »
- Section 3 : « À chaque faim, son assiette. »
- Section 4 : « Les incontournables de KLB »
- Section 5 : Cuisine de qualité, Service chaleureux, Moment inoubliable, chacune avec une phrase de dix mots maximum.
- Section 6 : « L’ambiance KLB »
- Panneau Commander : « Appelez ou écrivez-nous sur WhatsApp, on s’occupe du reste. » Boutons « Écrire sur WhatsApp » et « Appeler ».
- Panneau Sur place : « Déjà à table ? Scannez le QR code de votre table pour voir le menu et commander. » Bouton « Ouvrir le menu de ma table ».
- Pied de page : « © 2026 KLB Restaurant. Site conçu par \</DevJ>. »

## 6. Images à nommer

Dépose chaque photo dans `public/images/<dossier>/` avec exactement le nom indiqué. Pour les plats, si le vrai menu diffère, garde la logique `plat-<nom>.jpg` et envoie-moi les noms réels.

| Fichier | Dossier | Cadrage | Format |
| --- | --- | --- | --- |
| logo-klb-rond.png | brand | Logo complet sur fond transparent (le fichier reçu a un fond noir) | 1600 px min |
| logo-klb-cloche.png | brand | Cloche dorée seule, pour le loader (optionnel : Copilot la dessinera en SVG) | 800 px |
| logo-klb-monogramme.png | brand | Lettres KLB seules, pour le favicon | 512×512 |
| hero-plat-signature.jpg | hero | Plat vedette en vue 3/4, fond sombre, vapeur visible, lumière chaude | 4:5, 2000×2500 |
| hero-fond-salle.jpg | hero | Salle en soirée, légèrement floue | 16:9, 2400×1350 |
| plat-mouton-fondant.jpg | plats | Vue du dessus, assiette centrée, fond sombre | 1:1, 1600×1600 |
| plat-tilapia-four.jpg | plats | Idem | 1:1, 1600×1600 |
| plat-poulet-four.jpg | plats | Idem | 1:1, 1600×1600 |
| plat-roti-poulet-legumes.jpg | plats | Idem | 1:1, 1600×1600 |
| plat-etouffe-mouton.jpg | plats | Idem | 1:1, 1600×1600 |
| plat-poulet-saute.jpg | plats | Idem | 1:1, 1600×1600 |
| plat-filet-mignon.jpg | plats | Idem | 1:1, 1600×1600 |
| plat-maree-ecrevisses.jpg | plats | Idem | 1:1, 1600×1600 |
| plat-escargots.jpg | plats | Idem | 1:1, 1600×1600 |
| plat-gambas.jpg | plats | Idem | 1:1, 1600×1600 |
| plat-saumon-champignons.jpg | plats | Idem | 1:1, 1600×1600 |
| plat-brochettes-volaille.jpg | plats | Idem | 1:1, 1600×1600 |
| plat-choucouya.jpg | plats | Idem | 1:1, 1600×1600 |
| plat-marmite-chef.jpg | plats | Idem | 1:1, 1600×1600 |
| plat-canard-laque.jpg | plats | Idem | 1:1, 1600×1600 |
| plat-boeuf-oignons.jpg | plats | Idem | 1:1, 1600×1600 |
| plat-steak-liqueur.jpg | plats | Idem | 1:1, 1600×1600 |
| plat-cailles-gingembre.jpg | plats | Idem | 1:1, 1600×1600 |
| plat-pondeuse.jpg | plats | Idem | 1:1, 1600×1600 |
| plat-formule-plaisir.jpg | plats | Idem | 1:1, 1600×1600 |
| plat-garnitures.jpg | plats | Idem | 1:1, 1600×1600 |
| ambiance-salle-01.jpg | ambiance | Salle, plan large, tables dressées | 4:5, 1600×2000 |
| ambiance-salle-02.jpg | ambiance | Salle, autre angle, lumière du soir | 4:5, 1600×2000 |
| ambiance-salle-03.jpg | ambiance | Détail de décor ou de lumière | 3:2, 2400×1600 |
| ambiance-comptoir.jpg | ambiance | Comptoir ou espace cafétéria | 3:2, 2400×1600 |
| ambiance-terrasse.jpg | ambiance | Terrasse ou extérieur, si cela existe | 3:2, 2400×1600 |
| ambiance-detail-table.jpg | ambiance | Détail d’une table dressée | 1:1, 1600×1600 |
| equipe-chef.jpg | equipe | Portrait du chef ou cuisinier, sourire, tenue de cuisine | 1:1, 1200×1200 |
| equipe-service.jpg | equipe | Serveur ou serveuse en action | 1:1, 1200×1200 |
| cuisine-flamme.jpg | equipe | Grill ou flamme en cuisine | 1:1, 1200×1200 |
| cuisine-dressage.jpg | equipe | Mains qui dressent une assiette | 1:1, 1200×1200 |
| facade-klb.jpg | lieu | Façade ou entrée, de jour ou de nuit | 16:9, 2400×1350 |
| hero-boucle.mp4 | hero | Optionnel : boucle de 8 s sans son (vapeur, flamme), moins de 6 Mo | 1080p |

Si tu n’as pas de vraies photos pour certaines lignes, dis-le-moi : je te rédige les prompts d’images correspondants, nommés avec les mêmes noms de fichiers.

## 7. Menu

Le menu réel est dans src/data/menu.ts.

## 8. Plan d’orchestration

On avance par phases. Un prompt, une phase. Après chaque phase, tu lances `npm run dev`, tu vérifies, puis tu me renvoies une capture, une courte vidéo ou le message d’erreur. J’ajuste le prompt suivant en fonction du résultat réel.

| Phase | Objectif | Ce que tu dois voir |
| --- | --- | --- |
| 0 | Préparation (toi) : enregistrer ce dossier dans `docs/DIRECTION.md`, déposer les images disponibles, créer `.env` | Dossier prêt |
| 1 | Fondations : projet, tokens, polices, données, routing, config | Fond ink, 4 pages vides, build sans erreur |
| 2 | Coque : navigation en deux moitiés, barre d’actions fixe, curseur, transition de page, loader cloche | Ouverture avec la cloche, rideau doré entre les pages |
| 3 | Hero : titre lettre par lettre, masque organique, zoom au scroll | Le moment signature |
| 4 | « À chaque faim, son assiette » : formes, rondes flottantes, `CornerDish` | Ambiance et cartes d’angle |
| 5 | Les incontournables : défilement horizontal épinglé, fonds qui changent, texte courbé | La section la plus spectaculaire |
| 6 | Promesses, galerie à glisser, marquee | Rythme de la page d’accueil |
| 7 | Page Carte : onglets, accès rapide, filtres, lignes de plats | Menu complet utilisable |
| 8 | Commander et Sur place, Nous trouver, pied de page, pages Ambiance et Nous trouver | Site complet |
| 9 | Finitions : performance, accessibilité, mouvement réduit, SEO, responsive, déploiement Vercel | Prêt à livrer |

## 9. Prompt 1 : fondations

À coller dans Copilot en mode Agent, dossier `klb-vitrine` ouvert.

```text
Tu es un développeur front-end senior. Tu travailles dans le dossier klb-vitrine ouvert dans VS Code. Lis d’abord docs/DIRECTION.md (palette, typographies, architecture, textes, données). Ne fais que la PHASE 1 ci-dessous, rien d’autre.

OBJECTIF PHASE 1 : poser les fondations du site vitrine du restaurant KLB (Yamoussoukro). Aucune section visuelle finale dans cette phase.

1. Initialise (si absent) un projet Vite + React + TypeScript dans ce dossier. Installe : react-router-dom, gsap, @gsap/react, lenis, lucide-react, tailwindcss et @tailwindcss/vite (Tailwind v4). Aucune autre bibliothèque d’animation (ni Framer Motion, ni Anime.js).
2. Polices auto-hébergées : @fontsource-variable/fraunces et @fontsource-variable/manrope.
3. src/styles/tokens.css : variables CSS (palette, rayons, espacements, courbes d’easing, durées) exactement comme au §3 de docs/DIRECTION.md, et leur mapping Tailwind via @theme. Le fond par défaut du site est la couleur ink (#0B0806).
4. src/config/site.ts : nom, slogan, quartier, ville, horaires (8h30 à 23h30), téléphone +2250505520139, fonction qui construit le lien WhatsApp avec message pré-rempli (paramètre optionnel : nom du plat), lien Google Maps https://maps.app.goo.gl/5AnSXfayGygUcb557, tableMenuUrl lu depuis import.meta.env.VITE_TABLE_MENU_URL (vide pour l’instant : prévoir l’affichage conditionnel), réseaux sociaux (vides pour l’instant).
5. src/data/menu.ts : types MenuCategory et MenuItem et données d’exemple, copiés tels quels depuis le §7. Ajoute une fonction formatFcfa(n) qui renvoie par exemple « 4 500 F » avec espace insécable.
6. src/lib/motion.ts : enregistrement de ScrollTrigger, constantes d’easing et de durées, helper prefersReducedMotion. src/lib/lenis.ts : défilement fluide branché sur le ticker GSAP, désactivé si mouvement réduit.
7. Routing : react-router avec 4 routes (/, /carte, /ambiance, /nous-trouver), un composant Layout avec Outlet, des pages vides contenant uniquement un titre. Retour en haut de page à chaque navigation.
8. index.html : lang fr, meta viewport, title « KLB Restaurant — Bonne cuisine, bonne ambiance », meta description, theme-color #0B0806, favicon provisoire, balises Open Graph de base.
9. Crée public/images avec les sous-dossiers brand, hero, plats, ambiance, equipe, lieu, et un README.md qui liste les noms de fichiers attendus du §6. Crée le composant SmartImage : chargement différé, ratio réservé pour éviter le décalage de mise en page, attribut srcSet optionnel, et si le fichier est absent un fond en dégradé or à la place.
10. .env.example avec VITE_TABLE_MENU_URL=
11. Accessibilité de base : :focus-visible doré, lien d’évitement « Aller au contenu », prefers-reduced-motion géré globalement.

CONTRAINTES : TypeScript strict, aucun any, composants fonctionnels, composants en PascalCase, fichiers d’images en kebab-case, pas de lorem ipsum (utilise les textes du §5), pas de CSS inline sauf pour des valeurs dynamiques.

VÉRIFICATION : npm run build passe sans erreur ni avertissement TypeScript. npm run dev affiche un fond #0B0806 avec le titre de chaque page, la navigation entre les 4 routes fonctionne et le défilement Lenis est actif.

À LA FIN : liste les fichiers créés ou modifiés et toute décision que tu as dû prendre.
```
