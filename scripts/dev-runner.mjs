import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const viteBin = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');

const rawArgs = process.argv.slice(2);

// Detect build / preview / dev actions
const hasBuild = rawArgs.includes('build');
const hasPreview = rawArgs.includes('preview');

// Strip redundant keywords (run, dev, build, preview) so they aren't misinterpreted as Vite root paths
const filteredArgs = rawArgs.filter(arg => !['run', 'dev', 'build', 'preview'].includes(arg.toLowerCase()));

let viteArgs = [];

if (hasBuild) {
  viteArgs = ['build', ...filteredArgs];
  console.log('🌾 [AgriOptima AI] Executing build (vite build)...');
} else if (hasPreview) {
  viteArgs = ['preview', ...filteredArgs];
  console.log('🌾 [AgriOptima AI] Starting preview server (vite preview)...');
} else {
  viteArgs = [...filteredArgs];
  console.log('🌾 [AgriOptima AI] Starting development server (vite)...');
}

const child = spawn(process.execPath, [viteBin, ...viteArgs], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: false,
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  console.error('Failed to start AgriOptima AI server:', err);
  process.exit(1);
});
