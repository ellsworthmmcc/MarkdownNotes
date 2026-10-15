import * as vscode from 'vscode';
import { analyzeLine, shouldIndentOnTab, BulletAction, BulletOptions } from './bullet-points';

interface Plan {
  cursor: vscode.Position;
  line: vscode.TextLine;
  action: BulletAction;
}

interface CommandContext {
  editor: vscode.TextEditor;
  options: BulletOptions;
}

// Record<keyof BulletOptions, true> keeps this exhaustive at compile time
const optionKeys: Record<keyof BulletOptions, true> = {
  continueOnEnter: true,
  splitOnEnter: true,
  removeEmptyOnEnter: true,
  indentOnTab: true,
};

const SECTION = 'notesInMarkdown.bullets';

/**
 * Reads each setting independently. An invalid value only affects its own
 * setting, which falls back to the default declared in package.json.
 */
function readOptions(): BulletOptions {
  const cfg = vscode.workspace.getConfiguration(SECTION);

  const read = (key: keyof BulletOptions): boolean => {
    const value = cfg.get<unknown>(key);
    if (typeof value === 'boolean') return value;

    const fallback = cfg.inspect<boolean>(key)?.defaultValue;
    return typeof fallback === 'boolean' ? fallback : true;
  };

  return {
    continueOnEnter: read('continueOnEnter'),
    splitOnEnter: read('splitOnEnter'),
    removeEmptyOnEnter: read('removeEmptyOnEnter'),
    indentOnTab: read('indentOnTab'),
  };
}

/**
 * Shows one warning per invalid setting. Called on activation and whenever
 * the settings change, not on keypresses.
 */
export function validateSettings(): void {
  const cfg = vscode.workspace.getConfiguration(SECTION);
  for (const key of Object.keys(optionKeys)) {
    const value = cfg.get<unknown>(key);
    if (typeof value !== 'boolean') {
      warnInvalidSetting(key, value);
    }
  }
}

function warnInvalidSetting(key: string, value: unknown): void {
  const settingId = `${SECTION}.${key}`;
  const openSettings = 'Open Settings';

  // not awaited: the promise only resolves when the popup is dismissed
  void vscode.window
    .showWarningMessage(
      `Notes in Markdown: "${settingId}" must be true or false ` +
        `(got ${JSON.stringify(value)}). Using the default instead.`,
      openSettings,
    )
    .then(choice => {
      if (choice === openSettings) {
        return vscode.commands.executeCommand('workbench.action.openSettings', settingId);
      }
    });
}

/**
 * Holds the parsed options and clears them when the settings change, so
 * keypresses don't re-read configuration.
 */
export class OptionsCache implements vscode.Disposable {
  private cached: BulletOptions | undefined;
  private readonly subscription: vscode.Disposable;

  constructor() {
    this.subscription = vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration(SECTION)) {
        this.cached = undefined; // next keypress re-reads
        validateSettings();
      }
    });
  }

  get(): BulletOptions {
    return (this.cached ??= readOptions());
  }

  dispose(): void {
    this.subscription.dispose();
  }
}

/**
 * Builds the smart commands around a shared options cache.
 */
export function createCommands(options: OptionsCache) {
  // returns null when the command should fall back to the default key:
  // no editor or a non-empty selection
  const getContext = (): CommandContext | null => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return null;

    if (editor.selections.some(s => !s.isEmpty)) return null;

    return { editor, options: options.get() };
  };

  // the handler only runs when getContext() succeeds;
  // otherwise the fallback (the default key) runs
  const withContext = (
    handler: (ctx: CommandContext) => Promise<void>,
    fallback: () => Promise<void>,
  ) => async (): Promise<void> => {
    const ctx = getContext();
    return ctx ? handler(ctx) : fallback();
  };

  return {
    smartEnter: withContext(enterHandler, defaultEnter),
    smartTab: withContext(tabHandler, defaultTab),
  };
}

async function enterHandler({ editor, options }: CommandContext): Promise<void> {
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

async function tabHandler({ editor, options }: CommandContext): Promise<void> {
  // only indent if every cursor is inside a bullet's content
  const allInBullet = editor.selections.every(s =>
    shouldIndentOnTab(
      editor.document.lineAt(s.active.line).text,
      s.active.character,
      options,
    ),
  );
  if (!allInBullet) return defaultTab();

  // uses editor.tabSize / insertSpaces / detectIndentation
  await vscode.commands.executeCommand('editor.action.indentLines');
}

async function defaultEnter(): Promise<void> {
  await vscode.commands.executeCommand('default:type', { text: '\n' });
}

async function defaultTab(): Promise<void> {
  await vscode.commands.executeCommand('tab');
}