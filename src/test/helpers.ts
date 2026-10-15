import * as fs from 'fs';
import * as path from 'path';
import { BulletOptions } from '../bullet-points';

const PREFIX = 'notesInMarkdown.bullets.';

function loadProperties(): Record<string, { default?: unknown }> {
  // compiled file lives in out/test/, so the project root is two levels up
  const pkg = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8')
  );
  return pkg.contributes?.configuration?.properties ?? {};
}

export function loadManifestDefaults(): BulletOptions {
  const props = loadProperties();
  const bool = (key: keyof BulletOptions): boolean => {
    const value = props[PREFIX + key]?.default;
    if (typeof value !== 'boolean') {
      throw new Error(`package.json has no boolean default for ${PREFIX}${key}`);
    }
    return value;
  };

  return {
    continueOnEnter: bool('continueOnEnter'),
    splitOnEnter: bool('splitOnEnter'),
    removeEmptyOnEnter: bool('removeEmptyOnEnter'),
    indentOnTab: bool('indentOnTab'),
    removeOnShiftTab: bool('removeOnShiftTab'),
  };
}

export function manifestOptionKeys(): string[] {
  return Object.keys(loadProperties())
    .filter(k => k.startsWith(PREFIX))
    .map(k => k.slice(PREFIX.length));
}