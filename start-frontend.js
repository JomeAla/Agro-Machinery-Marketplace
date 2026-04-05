const { spawn } = require('child_process');
const path = require('path');

const nextPath = path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');
const frontendPath = path.join(__dirname, 'apps', 'frontend');

console.log('Starting Next.js from:', nextPath);
console.log('Working directory:', frontendPath);

const child = spawn(process.execPath, [nextPath, 'dev', '-p', '3070'], {
  cwd: frontendPath,
  stdio: 'inherit',
  env: { ...process.env, NODE_PATH: path.join(__dirname, 'node_modules') }
});

child.on('error', (err) => {
  console.error('Failed to start:', err);
});

process.on('SIGINT', () => {
  child.kill();
  process.exit();
});