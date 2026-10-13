import { defineConfig } from '@vscode/test-cli';

export default defineConfig([
  { label: 'minimum', files: 'out/test/**/*.test.js', version: '1.85.0', mocha: { timeout: 20000 } },
  { label: 'latest', files: 'out/test/**/*.test.js', version: 'stable', mocha: { timeout: 20000 } },
]);