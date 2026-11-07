# Inventaire du retrait du mode clair

Inventaire réalisé avant le retrait du mode clair, après la capture de référence
`snapshots/ref-avant-retrait`. Les numéros de ligne ci-dessous sont ceux de cet
inventaire et peuvent changer après les modifications.

## Valeurs sombres de référence

Le bloc `:root` de `src/styles/theme.css` concorde avec la table de recoupement
fournie : aucune divergence de valeur.

| Jeton | Valeur sombre exacte |
| --- | --- |
| `surface-base` | `#0b0806` |
| `surface-raised` | `#1a110b` |
| `surface-green` | `#0e2a1a` |
| `surface-green-glow` | `#164229` |
| `surface-deep` | `#0a1f14` |
| `surface-warm` | `#2b1a06` |
| `surface-warm-soft` | `#1f1409` |
| `surface-header` | `rgb(11 8 6 / 92%)` |
| `text-rgb` | `251 246 234` |
| `text-strong` | `rgb(251 246 234)` |
| `text-on-dark` | `rgb(251 246 234 / 92%)` |
| `text-muted` | `rgb(251 246 234 / 68%)` |
| `text-subtle` | `rgb(251 246 234 / 48%)` |
| `line-rgb` | `255 211 107` |
| `border-gold` | `rgb(255 211 107 / 16%)` |
| `accent-text`, `focus-color` | `#ffd36b` |
| `gold-text-gradient` | `var(--gold-gradient)` |
| `shadow-plate` | `0 30px 60px -20px rgb(0 0 0 / 60%)` |
| `text-shadow-soft` | `0 2px 24px rgb(0 0 0 / 45%)` |
| `curtain-shadow` | `rgb(0 0 0 / 55%)` |
| `steam-core`, `steam-edge` | `rgb(255 244 224 / 38%)`, `rgb(255 211 107 / 10%)` |
| `glow-gold` | `rgb(245 169 18 / 12%)` |
| `light-blend`, `light-core`, `light-mid` | `screen`, `rgb(255 188 78 / 17%)`, `rgb(255 188 78 / 6%)` |
| `veil-center`, `veil-edge` | `#0e2a1a`, `#0a1f14` |
| `feat-bg-0` à `feat-bg-6` | `#1a110b`, `#0e2a1a`, `#0b0806`, `#2b1a06`, `#0a1f14`, `#1f1409`, `#0b0806` |

## Occurrences et actions prévues

| Fichier / occurrences repérées | Action |
| --- | --- |
| `src/App.tsx` : import et wrapper `ThemeProvider` | Supprimer l’import et le wrapper. |
| `src/components/layout/Header.tsx` : import et deux rendus `ThemeToggle` (navigation desktop et pied du menu mobile) | Supprimer les trois occurrences; aucun `ThemeToggle` n’est rendu par le composant Footer. |
| `src/components/ui/ThemeToggle.tsx`, `src/lib/ThemeProvider.tsx` | Supprimer les fichiers devenus inutilisés. |
| `src/components/home/Incontournables.tsx` : imports `getFeaturedBackgrounds`, `cssColor`, `useTheme`; lecture de `resolvedTheme`; références dans l’animation et ses dépendances | Lire une constante de couleurs littérales; supprimer les imports et dépendances de thème; garder les animations. |
| `src/data/featured.ts` : `getFeaturedBackgrounds` et sept noms `surface-*` | Remplacer par `featuredBackgrounds` constant contenant les sept hex sombres listés ci-dessus. |
| `src/data/sections.ts` : sept entrées `surface-*` et les valeurs `ivory` | Remplacer les surfaces nommées par leurs hex sombres; remplacer `ivory` par `#fbf6ea`; conserver `assertSeams`. |
| `src/components/home/HeroStage.tsx` : import et appels `cssColor`, valeur de fond issue des sections, `data-surface` | Utiliser directement la couleur hex des sections; conserver `data-surface`, consommé par l’ActionBar. |
| `src/components/faq/Faq.tsx` : `prevBg="surface-raised"` et `data-surface="light"` | Remplacer `prevBg` par `#1a110b`; conserver le marqueur de surface utilisé par l’ActionBar. |
| `src/components/find-us/FindUs.tsx` : `bgStart` et `bgEnd` égaux à `surface-raised` | Remplacer chaque valeur par `#1a110b`. |
| `src/components/layout/SectionShell.tsx` : conversion de jetons CSS et attribut `data-surface` | Rendre directement les couleurs hex des appels; garder `data-surface`, utilisé par l’ActionBar. |
| `src/components/SectionShell.tsx`, `src/components/home/Hero.tsx`, `src/components/home/Marquee.tsx`, `src/components/order-tiles/OrderTiles.tsx`, `src/components/layout/Footer.tsx`, `src/pages/FindUsPage.tsx` | Les occurrences `data-surface` servent au calcul de contraste/état de l’ActionBar (`src/components/layout/ActionBar.tsx`); les conserver, elles ne sélectionnent pas le thème. |
| `src/components/layout/ActionBar.tsx` : sélection `[data-surface]` | Conserver : ce consommateur prouve que les marqueurs de surface ne sont pas inutilisés. |
| `src/lib/theme-colors.ts` | Supprimer après retrait des imports. |
| `src/main.tsx` : imports de `theme.css` et `theme-light.css` | Supprimer les deux imports. |
| `src/styles/theme.css` | Supprimer le fichier. Son bloc de variables est remplacé par les littéraux sombres ci-dessus là où ils étaient consommés; les règles de bascule disparaissent. |
| `src/styles/theme-light.css` | Supprimer le fichier. |
| `src/styles/tokens.css` : déclarations déjà littérales de `text-on-dark`, `text-muted`, `text-subtle`, `border-gold`; 17 usages de `text-on-dark`, `text-muted`, `border-gold`; `color-scheme: dark` | Garder les quatre déclarations littérales; remplacer les usages par leurs valeurs exactes; garder `color-scheme: dark` (déjà présent avant le retrait). Le focus reste `var(--gold-300)`. |
| `src/pages/AmbiancePage.css` : usages des couleurs `text-muted` (lignes 185, 353, 382, 556, 720), `text-subtle` (404), `border-gold` (587, 730) | Remplacer par les littéraux `rgb(251 246 234 / 68%)`, `rgb(251 246 234 / 48%)`, `rgb(255 211 107 / 16%)`. |
| `src/styles/touches.css`, `src/styles/tokens.css` : styles `.steam-wisp`, `.cursor-light`, `.hero-glow`, `.hero-veil` | Vérifier et préserver les règles de rendu sombres; les variables `--steam-on` et `--steam-scroll` sont des paramètres d’animation, pas des jetons de couleur. |
| `index.html` : script inline, marqueurs Vite, `klb-theme`, réglage `data-theme` et meta dynamique | Supprimer le script et les marqueurs; garder uniquement le `<meta name="theme-color" content="#0b0806">` statique. |
| `vite.config.ts` : `loadEnv` et plugin `klb-theme-html-env` | Supprimer uniquement l’injection des variables de thème; conserver le reste de la configuration Vite. |
| `.env.example` : `VITE_ENABLE_LIGHT_MODE`, `VITE_DEFAULT_THEME` | Supprimer ces deux lignes; conserver les variables de site. |
| `.env.local` ignoré : `VITE_ENABLE_LIGHT_MODE`, `VITE_DEFAULT_THEME` (et aucune autre ligne) | Supprimer les deux lignes; supprimer le fichier s’il devient vide. |
| `package.json` : `snap:light` et `--theme dark` dans `snap:compare` | Supprimer `snap:light`; garder `snap:baseline` et `snap:compare` sans option de thème. |
| `scripts/visual-snapshot.mjs` : `--theme`, `klb-theme` dans le stockage local, `colorScheme` forcé | Retirer toute sélection/force de thème; conserver l’outil générique de captures et comparaisons. Les vues menu ouvert et accueil fenêtre sont incluses. |
| `docs/THEME.md`, `docs/theme-inventory.md`, `docs/THEME-REVIEW.md` | Supprimer ces documents de thème obsolètes. |
| `docs/Direction.md` : mention statique du meta `theme-color` | Conserver : elle décrit le meta sombre statique gardé dans le HTML. |
| `README.md`, `docs/CONTENU.md` | Ces fichiers n’existent pas dans le dépôt; aucune occurrence à retirer. |
| `index.html.onedrive-backup` : meta `theme-color` statique | Conserver ce fichier de sauvegarde sans modification. |

Les autres variables CSS de mise en page, d’espacement, de mouvement et les
couleurs d’identité déjà définies dans `tokens.css` ne sont pas des mécanismes
de thème clair et restent inchangées.
