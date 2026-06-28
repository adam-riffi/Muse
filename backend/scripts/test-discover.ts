import { CodexDiscoveryError, discoverImages } from '../src/adapters/codex.js';

// Standalone live check of the Codex discovery seam: runs one real discovery and prints the parsed
// ImageCandidate[]. Run with: npm run -w @muse/backend discover -- "<brief>"
async function main(): Promise<void> {
  const brief = process.argv.slice(2).join(' ').trim();
  if (brief === '') {
    console.error('Usage: npm run -w @muse/backend discover -- "<brief>"');
    process.exitCode = 1;
    return;
  }

  console.error(`Discovering images for: "${brief}"`);
  console.error('(this invokes the real Codex CLI and may take a while)\n');

  try {
    const candidates = await discoverImages({ brief });
    console.log(JSON.stringify(candidates, null, 2));
    console.error(`\n\u2713 Parsed ${candidates.length} candidate(s).`);
  } catch (error) {
    if (error instanceof CodexDiscoveryError) {
      console.error('\n\u2717 Discovery failed to parse. Raw Codex output:\n');
      console.error(error.rawOutput);
    } else {
      console.error('\n\u2717 Discovery failed:', error);
    }
    process.exitCode = 1;
  }
}

void main();
