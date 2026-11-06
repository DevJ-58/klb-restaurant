# Inventory du thème

| Fichier | Sélecteur / ligne | Propriété | Valeur | Famille | Décision |
| --- | --- | --- | --- | --- | --- |
| `src/styles/tokens.css` | `:root` | `--ink` | `#0b0806` | POLARITÉ FIXE | constante conservée |
| `src/styles/tokens.css` | `:root` | `--ivory` | `#fbf6ea` | POLARITÉ FIXE | constante conservée |
| `src/styles/tokens.css` | `:root` | `--forest` | `#0e2a1a` | POLARITÉ FIXE | constante conservée |
| `src/styles/tokens.css` | `:root` | `--espresso` | `#1a110b` | POLARITÉ FIXE | constante conservée |
| `src/styles/tokens.css` | `:root` | `--amber-deep` | `#2b1a06` | POLARITÉ FIXE | constante conservée |
| `src/styles/tokens.css` | `:root` | `--gold-300` | `#ffd36b` | POLARITÉ FIXE | constante conservée |
| `src/styles/tokens.css` | `:root` | `--gold-500` | `#f5a912` | POLARITÉ FIXE | constante conservée |
| `src/styles/tokens.css` | `:root` | `--gold-700` | `#b9740a` | POLARITÉ FIXE | constante conservée |
| `src/styles/theme.css` | `:root` | `--surface-base` | `#0b0806` | FLIP | jeton `surface-base` |
| `src/styles/theme.css` | `:root` | `--surface-raised` | `#1a110b` | FLIP | jeton `surface-raised` |
| `src/styles/theme.css` | `:root` | `--surface-green` | `#0e2a1a` | FLIP | jeton `surface-green` |
| `src/styles/theme.css` | `:root` | `--surface-warm` | `#2b1a06` | FLIP | jeton `surface-warm` |
| `src/styles/theme-light.css` | `html[data-theme='light']` | `--surface-base` | `#fbf6ea` | FLIP | jeton `surface-base` |
| `src/styles/theme-light.css` | `html[data-theme='light']` | `--surface-raised` | `#f2e8d0` | FLIP | jeton `surface-raised` |
| `src/data/sections.ts` | `homeSections` | `bgStart` / `bgEnd` | `surface-*` | FLIP | jeton `surface-*` |
| `src/data/featured.ts` | `getFeaturedBackgrounds` | palette | `surface-*` | FLIP | jeton `surface-*` |
| `index.html` | script d’init | `theme-color` | `#0b0806` / `#fbf6ea` | FLIP | jeton `theme-color` |
| `src/lib/ThemeProvider.tsx` | `applyTheme` | `data-theme` | `dark/light` | FLIP | thème système |

Les cas ambigus restent marqués « à trancher », notamment pour les sections finement décorées qui doivent être vérifiées visuellement après activation du mode clair. La base du système est prévu pour préserver la palette sombre actuelle tout en activant les jetons sémantiques sans modifier les dimensions ni les animations.
