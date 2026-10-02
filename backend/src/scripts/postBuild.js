const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const MEDUSA_SERVER_PATH = path.join(process.cwd(), '.medusa', 'server');

// Check if .medusa/server exists - if not, build process failed
if (!fs.existsSync(MEDUSA_SERVER_PATH)) {
  throw new Error('.medusa/server directory not found. This indicates the Medusa build process failed. Please check for build errors.');
}

const isCommandAvailable = (cmd) => {
  try {
    execSync(`which ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

// Priority based on active runtime, available lockfiles and installed binaries
const PACKAGE_MANAGERS = [
  { lockfile: 'package-lock.json', name: 'npm', install: 'npm ci --omit=dev' },
  { lockfile: 'pnpm-lock.yaml', name: 'pnpm', install: 'pnpm i --prod --frozen-lockfile' },
  { lockfile: 'yarn.lock', name: 'yarn', install: 'yarn install --production --frozen-lockfile' },
];

// Check if current runner gave a hint
const userAgent = process.env.npm_config_user_agent || '';
let preferredName = null;
if (userAgent.startsWith('pnpm')) preferredName = 'pnpm';
else if (userAgent.startsWith('yarn')) preferredName = 'yarn';
else if (userAgent.startsWith('npm')) preferredName = 'npm';

// Find candidates where lockfile exists AND binary is available
const candidates = PACKAGE_MANAGERS.filter((pm) =>
  fs.existsSync(path.join(process.cwd(), pm.lockfile)) && isCommandAvailable(pm.name)
);

let detected = null;
if (preferredName) {
  detected = candidates.find((c) => c.name === preferredName);
}

if (!detected && candidates.length > 0) {
  detected = candidates[0];
}

// Fallback: if no lockfile matched an installed binary, try any lockfile that exists
if (!detected) {
  detected = PACKAGE_MANAGERS.find((pm) =>
    fs.existsSync(path.join(process.cwd(), pm.lockfile))
  );
}

if (!detected) {
  throw new Error(
    `No supported package manager found in ${process.cwd()}. Expected one of: ` +
    PACKAGE_MANAGERS.map((pm) => pm.lockfile).join(', ')
  );
}

fs.copyFileSync(
  path.join(process.cwd(), detected.lockfile),
  path.join(MEDUSA_SERVER_PATH, detected.lockfile)
);

// Copy .env if it exists
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  fs.copyFileSync(
    envPath,
    path.join(MEDUSA_SERVER_PATH, '.env')
  );
}

// Copy .npmrc if it exists
const npmrcPath = path.join(process.cwd(), '.npmrc');
if (fs.existsSync(npmrcPath)) {
  fs.copyFileSync(
    npmrcPath,
    path.join(MEDUSA_SERVER_PATH, '.npmrc')
  );
}

// Install dependencies
console.log(`Installing dependencies in .medusa/server with ${detected.name}...`);
execSync(detected.install, {
  cwd: MEDUSA_SERVER_PATH,
  stdio: 'inherit'
});
