// Bundles the TypeScript sources into dist/, which is the folder Chrome loads.
// The content script becomes one bundle, so its modules import each other properly
// instead of passing objects through window globals.
import * as esbuild from 'esbuild';
import { cp, mkdir, readFile, rm } from 'node:fs/promises';

// The manifest version is what Chrome ships; package.json only names the zip. Let them
// drift and you upload a file labelled with the wrong version.
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));
if (pkg.version !== manifest.version) {
  console.error(`version mismatch: package.json ${pkg.version} vs manifest.json ${manifest.version}`);
  process.exit(1);
}

const watch = process.argv.includes('--watch');
const dev = watch || process.argv.includes('--dev');

const shared = {
  bundle: true,
  target: 'chrome120',
  logLevel: 'info',
  sourcemap: dev ? 'inline' : false,
  minify: !dev,
  legalComments: 'none'
};

async function copyStatic() {
  await cp('manifest.json', 'dist/manifest.json');
  await cp('src/options.html', 'dist/options.html');
  await cp('icons', 'dist/icons', { recursive: true });
}

await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });

const builds = [
  { entryPoints: ['src/background.ts'], outfile: 'dist/background.js', format: 'esm' },
  { entryPoints: ['src/content.ts'], outfile: 'dist/content.js', format: 'iife' },
  { entryPoints: ['src/options.ts'], outfile: 'dist/options.js', format: 'iife' }
];

if (watch) {
  const contexts = await Promise.all(builds.map((b) => esbuild.context({ ...shared, ...b })));
  await copyStatic();
  await Promise.all(contexts.map((c) => c.watch()));
  console.log('watching — reload the extension in chrome://extensions after each change');
} else {
  await Promise.all(builds.map((b) => esbuild.build({ ...shared, ...b })));
  await copyStatic();
  console.log('built dist/ — load that folder in chrome://extensions');
}
