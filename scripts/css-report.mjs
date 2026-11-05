import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import postcss from 'postcss';

const root = process.cwd();
const sourceRoot = path.join(root, 'src');
const styleRoot = path.join(sourceRoot, 'styles');
const tsxFiles = [];
const cssFiles = [];

async function collect(directory, extension, result) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) await collect(fullPath, extension, result);
    else if (entry.name.endsWith(extension)) result.push(fullPath);
  }
}

await collect(sourceRoot, '.tsx', tsxFiles);
await collect(styleRoot, '.css', cssFiles);
try {
  await readFile(path.join(sourceRoot, 'index.css'));
  cssFiles.push(path.join(sourceRoot, 'index.css'));
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

const sources = await Promise.all(tsxFiles.map((file) => readFile(file, 'utf8')));
const tsxSource = sources.join('\n');
const unusedClasses = [];
const duplicateDeclarations = [];
const duplicateVariables = new Map();
for (const filename of cssFiles) {
  const css = await readFile(filename, 'utf8');
  const rootNode = postcss.parse(css, { from: filename });
  const relativePath = path.relative(root, filename).replaceAll(path.sep, '/');
  const ruleDeclarations = new Map();
  rootNode.walkRules((rule) => {
    const selector = rule.selector;
    const declarations = ruleDeclarations.get(selector) ?? new Map();
    rule.walkDecls((declaration) => {
      const signature = `${declaration.prop}:${declaration.value}`;
      const previous = declarations.get(declaration.prop) ?? [];
      previous.push({ signature, line: declaration.source?.start?.line ?? 0 });
      declarations.set(declaration.prop, previous);
      if (declaration.prop.startsWith('--')) {
        const uses = duplicateVariables.get(declaration.prop) ?? [];
        uses.push({ file: relativePath, line: declaration.source?.start?.line ?? 0 });
        duplicateVariables.set(declaration.prop, uses);
      }
    });
    ruleDeclarations.set(selector, declarations);
  });
  for (const [selector, declarations] of ruleDeclarations) {
    for (const [property, values] of declarations) {
      if (values.length > 1) {
        duplicateDeclarations.push({
          file: relativePath,
          selector,
          property,
          lines: values.map(({ line }) => line),
        });
      }
    }
  }

  rootNode.walkRules((rule) => {
    for (const [, className] of rule.selector.matchAll(/\.([_a-zA-Z][\w-]*)/g)) {
      if (!tsxSource.includes(className)) {
        unusedClasses.push({
          file: relativePath,
          line: rule.source?.start?.line ?? 0,
          selector: `.${className}`,
        });
      }
    }
  });
}

const duplicatedVariables = Array.from(duplicateVariables, ([name, definitions]) => ({
  name,
  definitions,
})).filter(({ definitions }) => definitions.length > 1);
const report = [
  '# Rapport d’audit CSS',
  '',
  '> Rapport uniquement : aucun style n’a été modifié ni supprimé.',
  '',
  `Fichiers CSS analysés : ${cssFiles.length}. Fichiers TSX consultés : ${tsxFiles.length}.`,
  '',
  `## Classes non référencées (${unusedClasses.length})`,
  '',
  ...unusedClasses.map(({ file, line, selector }) => `- \`${file}:${line}\` — \`${selector}\``),
  '',
  `## Déclarations répétées par sélecteur (${duplicateDeclarations.length})`,
  '',
  ...duplicateDeclarations.map(({ file, selector, property, lines }) =>
    `- \`${file}\` — \`${selector}\`, propriété \`${property}\`, lignes ${lines.join(', ')}.`,
  ),
  '',
  `## Variables CSS définies plusieurs fois (${duplicatedVariables.length})`,
  '',
  ...duplicatedVariables.map(({ name, definitions }) =>
    `- \`${name}\`: ${definitions.map(({ file, line }) => `\`${file}:${line}\``).join(', ')}`,
  ),
  '',
].join('\n');
const outputPath = path.join(root, 'docs', 'css-report.md');
await writeFile(outputPath, report, 'utf8');
console.log(`Rapport CSS écrit dans ${path.relative(root, outputPath)}.`);
