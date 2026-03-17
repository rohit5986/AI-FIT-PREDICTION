import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

async function runCommand(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}`));
    });
  });
}

async function main() {
  const scrapedDir = path.resolve('data/scraped');
  const entries = await fs.readdir(scrapedDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name)
    .sort();

  for (const fileName of files) {
    const fullPath = path.join(scrapedDir, fileName);
    const raw = await fs.readFile(fullPath, 'utf8');
    const parsed = JSON.parse(raw);

    const url = String(parsed.url || '').trim();
    const brandId = String(parsed.brandId || '').trim();
    const category = String(parsed.category || '').trim();

    if (!url || !brandId || !['top', 'bottom'].includes(category)) {
      console.log(`Skipping ${fileName}: missing required metadata`);
      continue;
    }

    const limit = Number(parsed.productCount) > 0 ? String(parsed.productCount) : '30';
    const currency = String(parsed.currency || 'INR').trim() || 'INR';

    console.log(`Refreshing ${fileName} ...`);
    await runCommand('node', [
      'scripts/scrapeListings.mjs',
      '--url',
      url,
      '--brandId',
      brandId,
      '--category',
      category,
      '--currency',
      currency,
      '--out',
      path.join('data', 'scraped', fileName),
      '--limit',
      limit
    ]);
  }

  console.log('All scraped files refreshed successfully.');
}

main().catch((error) => {
  console.error('Refresh failed:', error.message);
  process.exit(1);
});
