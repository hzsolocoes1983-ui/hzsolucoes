import { promises as fs } from 'fs';
import path from 'path';

async function main() {
  const projectRoot = process.cwd();
  const src = path.join(projectRoot, 'static.json');
  const distDir = path.join(projectRoot, 'dist');
  const dest = path.join(distDir, 'static.json');

  try {
    // Ensure dist exists
    await fs.mkdir(distDir, { recursive: true });

    // Read and write static.json
    const data = await fs.readFile(src);
    await fs.writeFile(dest, data);
    console.log(`[copy-static-json] Copiado para: ${dest}`);
  } catch (err) {
    console.error('[copy-static-json] Falha ao copiar static.json:', err.message);
    process.exitCode = 1;
  }
}

main();