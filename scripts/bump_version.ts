import fs from 'fs';
import path from 'path';

/**
 * Automates version increments across the MissionRx codebase.
 * Usage:
 *   npx tsx scripts/bump_version.ts           # Automatically bumps patch version (e.g. 3.3.1 -> 3.3.2)
 *   npx tsx scripts/bump_version.ts 3.4.0     # Sets explicit version
 */

const rootDir = path.resolve(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');
const versionFilePath = path.join(rootDir, 'lib', 'version.ts');

const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const currentVersion = pkg.version || '3.3.0';

let nextVersion = process.argv[2]?.trim();

if (!nextVersion) {
  const parts = currentVersion.split('.').map((n: string) => parseInt(n, 10) || 0);
  if (parts.length === 3) {
    parts[2] += 1;
    nextVersion = parts.join('.');
  } else {
    nextVersion = `${currentVersion}.1`;
  }
}

// 1. Update package.json
pkg.version = nextVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

// 2. Update lib/version.ts
const today = new Date().toISOString().split('T')[0];
const versionFileContent = `/**
 * MissionRx System Version Source of Truth
 *
 * Update this file (or run \`npm run bump-version\`) to update the platform version
 * everywhere across the application (Navigation, Headers, Footers, Compliance, Backups).
 */

export const APP_VERSION = '${nextVersion}';
export const APP_VERSION_LABEL = \`v\${APP_VERSION} Live\`;
export const APP_VERSION_FULL = \`Version \${APP_VERSION}\`;
export const APP_BUILD_DATE = '${today}';
`;

fs.writeFileSync(versionFilePath, versionFileContent, 'utf8');

console.log(`\n🎉 Version successfully updated from ${currentVersion} -> ${nextVersion}!`);
console.log(`📁 Files synchronized:`);
console.log(`   - package.json -> ${nextVersion}`);
console.log(`   - lib/version.ts -> ${nextVersion} (${today})\n`);
