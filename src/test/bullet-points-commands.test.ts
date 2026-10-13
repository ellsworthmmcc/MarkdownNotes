import * as assert from 'assert';
import * as vscode from 'vscode';

async function openDoc(content: string): Promise<vscode.TextEditor> {
  const doc = await vscode.workspace.openTextDocument({
    language: 'markdown',
    content,
  });
  return vscode.window.showTextDocument(doc);
}

// Normalize line endings so tests pass on Windows (CRLF) and Linux/macOS (LF)
function text(editor: vscode.TextEditor): string {
  return editor.document.getText().replace(/\r\n/g, '\n');
}

function placeCursor(editor: vscode.TextEditor, line: number, col: number) {
  const pos = new vscode.Position(line, col);
  editor.selection = new vscode.Selection(pos, pos);
}

async function pressEnter() {
  await vscode.commands.executeCommand('notes-in-markdown.onEnter');
}

type SettingKey = 'continueOnEnter' | 'splitOnEnter' | 'removeEmptyOnEnter';

// settings changed by the current test, so teardown only resets those
const touched = new Set<SettingKey>();

async function updateSetting(key: SettingKey, value: unknown) {
  await vscode.workspace
    .getConfiguration('notesInMarkdown.bullets')
    .update(key, value, vscode.ConfigurationTarget.Global);
}

async function setSetting(key: SettingKey, value: unknown) {
  touched.add(key);
  await updateSetting(key, value);
}

suite('smartEnter', () => {
  teardown(async () => {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    // passing undefined removes the user override, restoring the package.json default
    for (const key of touched) {
      await updateSetting(key, undefined);
    }
    touched.clear();
  });

  test('continues a bullet', async () => {
    const editor = await openDoc('- hello');
    placeCursor(editor, 0, 7);
    await pressEnter();
    assert.strictEqual(text(editor), '- hello\n- ');
  });

  test('cursor lands after the new prefix', async () => {
    const editor = await openDoc('- hello');
    placeCursor(editor, 0, 7);
    await pressEnter();
    assert.deepStrictEqual(
      [editor.selection.active.line, editor.selection.active.character],
      [1, 2]
    );
  });

  test('splits a bullet when Enter is mid-text', async () => {
    const editor = await openDoc('- foobar');
    placeCursor(editor, 0, 5);
    await pressEnter();
    assert.strictEqual(text(editor), '- foo\n- bar');
  });

  test('preserves indentation and marker', async () => {
    const editor = await openDoc('  * nested');
    placeCursor(editor, 0, 10);
    await pressEnter();
    assert.strictEqual(text(editor), '  * nested\n  * ');
  });

  test('empty bullet is removed and cursor moves to a new line', async () => {
    const editor = await openDoc('- a\n- ');
    placeCursor(editor, 1, 2);
    await pressEnter();
    assert.strictEqual(text(editor), '- a\n\n');
    assert.strictEqual(editor.selection.active.line, 2);
  });

  test('plain line falls back to a normal newline', async () => {
    const editor = await openDoc('hello');
    placeCursor(editor, 0, 5);
    await pressEnter();
    assert.strictEqual(text(editor), 'hello\n');
  });

  test('cursor on the marker falls back to a normal newline', async () => {
    const editor = await openDoc('- hi');
    placeCursor(editor, 0, 1);
    await pressEnter();
    assert.strictEqual(text(editor), '-\n hi');
  });

  test('multiple cursors on bullets: all continue', async () => {
    const editor = await openDoc('- a\n- b');
    editor.selections = [
      new vscode.Selection(0, 3, 0, 3),
      new vscode.Selection(1, 3, 1, 3),
    ];
    await pressEnter();
    assert.strictEqual(text(editor), '- a\n- \n- b\n- ');
  });

  test('mixed cursors (one not on a bullet): falls back for all', async () => {
    const editor = await openDoc('- a\nplain');
    editor.selections = [
      new vscode.Selection(0, 3, 0, 3),
      new vscode.Selection(1, 5, 1, 5),
    ];
    await pressEnter();
    assert.strictEqual(text(editor), '- a\n\nplain\n');
  });

  test('a non-empty selection falls back', async () => {
    const editor = await openDoc('- hello');
    editor.selection = new vscode.Selection(0, 2, 0, 7);
    await pressEnter();
    assert.strictEqual(text(editor), '- \n');
  });

  test('one Undo reverts a bullet continuation', async () => {
    const editor = await openDoc('- hello');
    placeCursor(editor, 0, 7);
    await pressEnter();
    await vscode.commands.executeCommand('undo');
    assert.strictEqual(text(editor), '- hello');
  });

  suite('settings', () => {
    test('continueOnEnter off: Enter at end is a normal newline', async () => {
      await setSetting('continueOnEnter', false);
      const editor = await openDoc('- hello');
      placeCursor(editor, 0, 7);
      await pressEnter();
      assert.strictEqual(text(editor), '- hello\n');
    });

    test('splitOnEnter off: mid-text is a normal newline', async () => {
      await setSetting('splitOnEnter', false);
      const editor = await openDoc('- foobar');
      placeCursor(editor, 0, 5);
      await pressEnter();
      assert.strictEqual(text(editor), '- foo\nbar');
    });

    test('removeEmptyOnEnter off: empty bullet gets a normal newline', async () => {
      await setSetting('removeEmptyOnEnter', false);
      const editor = await openDoc('- a\n- ');
      placeCursor(editor, 1, 2);
      await pressEnter();
      assert.strictEqual(text(editor), '- a\n- \n');
    });

    test('a non-boolean setting value falls back to a normal newline', async () => {
      // requires the typeof check in readOptions plus the try/catch in smartEnter
      await setSetting('continueOnEnter', 'no');
      const editor = await openDoc('- hello');
      placeCursor(editor, 0, 7);
      await pressEnter();
      assert.strictEqual(text(editor), '- hello\n');
    });
  });
});