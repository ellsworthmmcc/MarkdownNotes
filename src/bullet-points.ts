export type BulletAction =
  | { kind: 'newBullet'; prefix: string }
  | { kind: 'removeBullet' };

export interface BulletOptions {
  continueOnEnter: boolean;
  splitOnEnter: boolean;
  removeEmptyOnEnter: boolean;
  indentOnTab: boolean;
}

const bulletRegex = /^(?<indent>\s*)(?<marker>[-*+]) (?<content>.*)$/;

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

  const markerAndSpaceLength = 2;
  const contentStart = indent.length + markerAndSpaceLength;

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
 * a tab at the cursor. True only when the cursor sits right after "- ".
 */
export function shouldIndentOnTab(
  line: string,
  cursorCol: number,
  options: BulletOptions,
): boolean {
  if (!options.indentOnTab) return false;

  const match = bulletRegex.exec(line);
  if (!match?.groups) return false;

  const markerAndSpaceLength = 2;
  return cursorCol >= (match.groups.indent.length + markerAndSpaceLength);
}