import * as vscode from 'vscode';
import { analyzeLine, BulletAction } from './bullet-points';

interface Plan {
  cursor: vscode.Position;
  line: vscode.TextLine;
  action: BulletAction;
}

export async function smartEnter(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return defaultEnter();

  if (editor.selections.some(s => !s.isEmpty)) return defaultEnter();

  // builds a plan for every cursor, if any cursor isn't on a bullet,
  // lets defaultEnter handle all of them
  const plans: Plan[] = [];
  for (const selection of editor.selections) {
    const cursor = selection.active;
    const line = editor.document.lineAt(cursor.line);
    const action = analyzeLine(line.text, cursor.character);

    if (!action) return defaultEnter();
    plans.push({ cursor, line, action });
  }

  await editor.edit(editBuilder => {
    for (const { cursor, line, action } of plans) {
      switch (action.kind) {
        case 'newBullet':
          editBuilder.insert(cursor, '\n' + action.prefix);
          break;
        case 'removeBullet':
          editBuilder.replace(line.range, '\n');
          break;
      }
    }
  });
}

async function defaultEnter(): Promise<void> {
  await vscode.commands.executeCommand('default:type', { text: '\n'});
}