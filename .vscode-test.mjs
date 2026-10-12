import { defineConfig } from '@vscode/test-cli';

export default defineConfig([
  { label: 'minimum', files: 'out/test/**/*.test.js', version: '1.85.0' },
  { label: 'latest', files: 'out/test/**/*.test.js', version: 'stable' },
]);