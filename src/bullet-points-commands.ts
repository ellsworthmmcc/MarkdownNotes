import * as vscode from 'vscode';
import { analyzeLine,shouldIndentOnTab, BulletAction, BulletOptions } from './bullet-points';

interface Plan {
  cursor: vscode.Position;
  line: vscode.TextLine;
  action: BulletAction;
}

export async function smartEnter(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return defaultEnter();

  if (editor.selections.some(s => !s.isEmpty)) return defaultEnter();

  let options: BulletOptions;
  try {
    options = readOptions(editor.document);
  } catch (err) {
    console.error(err);
    return defaultEnter();
  }

  // builds a plan for every cursor, if any cursor isn't on a bullet,
  // lets defaultEnter handle all of them
  const plans: Plan[] = [];
  for (const selection of editor.selections) {
    const cursor = selection.active;
    const line = editor.document.lineAt(cursor.line);
    const action = analyzeLine(line.text, cursor.character, options);

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

export async function smartTab(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return defaultTab();

  if (editor.selections.some(s => !s.isEmpty)) return defaultTab();

  let options: BulletOptions;
  try {
    options = readOptions(editor.document);
  } catch (err) {
    console.error(err);
    return defaultTab();
  }

  const allAtBulletStart = editor.selections.every(s =>
    shouldIndentOnTab(
      editor.document.lineAt(s.active.line).text,
      s.active.character,
      options,
    ),
  );
  if (!allAtBulletStart) return defaultTab();

  // uses editor.tabSize / insertSpaces / detectIndentation
  await vscode.commands.executeCommand('editor.action.indentLines');
}

function readOptions(doc: vscode.TextDocument): BulletOptions {
  const cfg = vscode.workspace.getConfiguration('notesInMarkdown.bullets', doc);

  const read = (key: keyof BulletOptions): boolean => {
    const value = cfg.get<boolean>(key); // no fallback: package.json default applies
    if (typeof value !== 'boolean') {
      throw new Error(`Setting notesInMarkdown.bullets.${key} must be a boolean`);
    }
    return value;
  };

  return {
    continueOnEnter: read('continueOnEnter'),
    splitOnEnter: read('splitOnEnter'),
    removeEmptyOnEnter: read('removeEmptyOnEnter'),
    indentOnTab: read('indentOnTab'),
  };
}

async function defaultEnter(): Promise<void> {
  await vscode.commands.executeCommand('default:type', { text: '\n'});
}

async function defaultTab(): Promise<void> {
  await vscode.commands.executeCommand('tab');
}