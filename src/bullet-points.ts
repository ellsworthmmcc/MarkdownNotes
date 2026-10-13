export type BulletAction =
  | { kind: 'newBullet'; prefix: string }
  | { kind: 'removeBullet' };

export interface BulletOptions {
  continueOnEnter: boolean;
  splitOnEnter: boolean;
  removeEmptyOnEnter: boolean;
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