# THÈME KLB

## Jetons du système

### Dark (base)

- `--surface-base` → `#0b0806`
- `--surface-raised` → `#1a110b`
- `--surface-green` → `#0e2a1a`
- `--surface-green-glow` → `#164229`
- `--surface-deep` → `#0a1f14`
- `--surface-warm` → `#2b1a06`
- `--surface-warm-soft` → `#1f1409`
- `--surface-header` → `rgb(11 8 6 / 92%)`
- `--text-rgb` → `251 246 234`
- `--text-strong` → `rgb(var(--text-rgb))`
- `--text-muted` → `rgb(var(--text-rgb) / 68%)`
- `--text-subtle` → `rgb(var(--text-rgb) / 48%)`
- `--accent-text` → `#ffd36b`
- `--focus-color` → `#ffd36b`
- `--gold-text-gradient` → `var(--gold-gradient)`

### Light

- `--surface-base` → `#fbf6ea`
- `--surface-raised` → `#f2e8d0`
- `--surface-green` → `#e4ecdc`
- `--surface-deep` → `#d9e5d2`
- `--surface-warm` → `#f6e5c1`
- `--surface-warm-soft` → `#f5ead6`
- `--text-rgb` → `26 17 11`
- `--text-subtle` → `rgb(var(--text-rgb) / 60%)`
- `--accent-text` → `#9a5f06`
- `--focus-color` → `#9a5f06`
- `--gold-text-gradient` → `linear-gradient(135deg, #b9740a 0%, #8f5705 55%, #b9740a 100%)`

## Familles

- FLIP: surfaces qui changent entre noir profond et ivoire doux.
- ANCHOR: éléments restants sombres dans tous les thèmes.
- LIGHT-BY-DESIGN: sections déjà claires et conservées claires.
- POLARITÉ FIXE: boutons dorés, logos, disques et anneaux, pastilles de prix, cercles colorés.

## Règles

- P1: les constantes de palette restent figées, les jetons portent le thème.
- P2: pas de `filter: invert`, pas de `@media prefers-color-scheme` dans le CSS principal.
- P3: le thème est porté par `html[data-theme='dark' | 'light']`.
- P4: seules les zones FLIP sont converties au mode clair.
- P5: tout texte ou fond d’une zone FLIP suit directement la couche derrière.

## Ajouter une section

1. Choisir la bonne famille (`FLIP`, `ANCHOR`, `LIGHT-BY-DESIGN`).
2. Écrire la couleur de fond avec un nom de jeton dans `src/data/sections.ts`.
3. Utiliser `SectionShell` avec `bgStart` / `bgEnd` et `data-theme` si nécessaire.
4. Ne pas toucher aux composants à polarité fixe.
5. Vérifier les transitions et la cohérence avec `ThemeProvider`.
