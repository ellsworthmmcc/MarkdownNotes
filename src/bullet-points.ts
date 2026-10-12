export type BulletAction = 
  | {kind: 'newBullet'; prefix: string }
  | {kind: 'removeBullet' };

const bulletRegex = /^(?<indent>\s*)(?<marker>[-*+]) (?<content>.*)$/;


/**
 * Decides what Enter should do on a line.
 * @returns an action, or null if default Enter should run.
 */
export function analyzeLine(line: string, cursorCol: number): BulletAction | null {
  const match = bulletRegex.exec(line);
  if (!match?.groups) return null;

  const {indent, marker, content} = match.groups;

  const markerAndSpaceLength = 2;
  const contentStart = indent.length + markerAndSpaceLength;

  // cursor is before the content, behave like normal enter
  if (cursorCol < contentStart) return null;

  // only whitespace, end list
  if (content.trim() === '') return { kind: 'removeBullet'};
  
  // normal bullet, start the next one the same way
  return { kind: 'newBullet', prefix: `${indent}${marker} `};
}