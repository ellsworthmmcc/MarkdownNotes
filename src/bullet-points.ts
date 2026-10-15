export type BulletAction =
  | { kind: 'newBullet'; prefix: string }
  | { kind: 'removeBullet' };

export interface BulletOptions {
  continueOnEnter: boolean;
  splitOnEnter: boolean;
  removeEmptyOnEnter: boolean;
  indentOnTab: boolean;
  removeOnShiftTab: boolean;
}

const bulletRegex = /^(?<indent>\s*)(?<marker>[-*+]) (?!(\s*\k<marker>){2,}\s*$)(?<content>.*)$/;

/** Length of the marker plus the space after it, e.g. "- ". */
export const BULLET_PREFIX_LENGTH = 2;

/**
 * Decides what Enter should do on a line.
 * @returns an action, or null if default Enter should run.
 */
export function analyzeLine(
  line: string,
  cursorCol: number,
  options: BulletOptions,
): BulletAction | null {
  const match = bulletRegex.exec(line);
  if (!match?.groups) return null;

  const { indent, marker, content } = match.groups;

  const contentStart = indent.length + BULLET_PREFIX_LENGTH;

  // cursor is before the content, behave like normal enter
  if (cursorCol < contentStart) return null;

  // only whitespace: end list (if enabled)
  if (content.trim() === '') {
    return options.removeEmptyOnEnter ? { kind: 'removeBullet' } : null;
  }

  // end of line = continuing, mid-line = splitting
  const atEnd = cursorCol >= line.length;
  if (atEnd ? !options.continueOnEnter : !options.splitOnEnter) return null;

  return { kind: 'newBullet', prefix: `${indent}${marker} ` };
}

/**
 * Decides whether Tab should indent the whole line instead of inserting
 * a tab at the cursor. True when the cursor is anywhere in the bullet's
 * content (at or after the first character following "- ").
 */
export function shouldIndentOnTab(
  line: string,
  cursorCol: number,
  options: BulletOptions,
): boolean {
  if (!options.indentOnTab) return false;

  const match = bulletRegex.exec(line);
  if (!match?.groups) return false;

  const contentStart = match.groups.indent.length + BULLET_PREFIX_LENGTH;
  return cursorCol >= contentStart;
}

/**
 * Decides whether Shift+Tab should remove the bullet marker instead of
 * outdenting. True only for a bullet with no indentation (it can't be
 * outdented any further) when the cursor is in the bullet's content.
 */
export function shouldRemoveBulletOnShiftTab(
  line: string,
  cursorCol: number,
  options: BulletOptions,
): boolean {
  if (!options.removeOnShiftTab) return false;

  const match = bulletRegex.exec(line);
  if (!match?.groups) return false;

  // indented bullets get the normal outdent first
  if (match.groups.indent.length > 0) return false;

  return cursorCol >= BULLET_PREFIX_LENGTH;
}