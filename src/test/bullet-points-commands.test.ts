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

function cursorOf(editor: vscode.TextEditor): [number, number] {
  return [editor.selection.active.line, editor.selection.active.character];
}

async function pressEnter() {
  await vscode.commands.executeCommand('notes-in-markdown.onEnter');
}

async function pressTab() {
  await vscode.commands.executeCommand('notes-in-markdown.onTab');
}

type SettingKey = 'continueOnEnter' | 'splitOnEnter' | 'removeEmptyOnEnter' | 'indentOnTab';

// settings changed by the current test, so teardown only resets those
const touched = new Set<SettingKey>();

async function updateSetting(key: SettingKey, value: unknown) {
  // wait for the change event, so the extension's cache is cleared before the test continues
  const changed = new Promise<void>(resolve => {
    const sub = vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration(`notesInMarkdown.bullets.${key}`)) {
        sub.dispose();
        resolve();
      }
    });
    // no event fires if the value didn't actually change, so don't hang
    setTimeout(() => { sub.dispose(); resolve(); }, 1000);
  });

  await vscode.workspace
    .getConfiguration('notesInMarkdown.bullets')
    .update(key, value, vscode.ConfigurationTarget.Global);
  await changed;
}

async function setSetting(key: SettingKey, value: unknown) {
  touched.add(key);
  await updateSetting(key, value);
}

suite('bullet commands', () => {
  teardown(async () => {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    // passing undefined removes the user override, restoring the package.json default
    for (const key of touched) {
      await updateSetting(key, undefined);
    }
    touched.clear();
  });

  suite('smartEnter', () => {
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
      assert.deepStrictEqual(cursorOf(editor), [1, 2]);
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

      test('a non-boolean setting value uses its default', async () => {
        await setSetting('continueOnEnter', 'no');
        const editor = await openDoc('- hello');
        placeCursor(editor, 0, 7);
        await pressEnter();
        // default is true, so the bullet still continues
        assert.strictEqual(text(editor), '- hello\n- ');
      });

      test('a bad setting does not affect other Enter settings', async () => {
        await setSetting('continueOnEnter', 'no');
        await setSetting('splitOnEnter', false);
        const editor = await openDoc('- foobar');
        placeCursor(editor, 0, 5);
        await pressEnter();
        // splitOnEnter is valid and off, so it is still honored
        assert.strictEqual(text(editor), '- foo\nbar');
      });
    });
  });

  suite('smartTab', () => {
    test('Tab after the marker indents the line by the editor setting', async () => {
      const editor = await openDoc('- hello');
      editor.options = { tabSize: 4, insertSpaces: true };
      placeCursor(editor, 0, 2);
      await pressTab();
      assert.strictEqual(text(editor), '    - hello');
      assert.deepStrictEqual(cursorOf(editor), [0, 6]);
    });

    test('Tab mid-bullet indents the line and keeps the cursor in place', async () => {
      const editor = await openDoc('- hello');
      editor.options = { tabSize: 4, insertSpaces: true };
      placeCursor(editor, 0, 5);
      await pressTab();
      assert.strictEqual(text(editor), '    - hello');
      assert.deepStrictEqual(cursorOf(editor), [0, 9]);
    });

    test('Tab at the end of a bullet indents the line', async () => {
      const editor = await openDoc('- hello');
      editor.options = { tabSize: 4, insertSpaces: true };
      placeCursor(editor, 0, 7);
      await pressTab();
      assert.strictEqual(text(editor), '    - hello');
    });

    test('Tab respects tabSize', async () => {
      const editor = await openDoc('- hello');
      editor.options = { tabSize: 2, insertSpaces: true };
      placeCursor(editor, 0, 7);
      await pressTab();
      assert.strictEqual(text(editor), '  - hello');
    });

    test('Tab respects insertSpaces: false', async () => {
      const editor = await openDoc('- hello');
      editor.options = { tabSize: 4, insertSpaces: false };
      placeCursor(editor, 0, 2);
      await pressTab();
      assert.strictEqual(text(editor), '\t- hello');
    });

    test('Tab on the marker is a normal tab', async () => {
      const editor = await openDoc('- hello');
      editor.options = { tabSize: 4, insertSpaces: false };
      placeCursor(editor, 0, 1);
      await pressTab();
      assert.strictEqual(text(editor), '-\t hello');
    });

    test('Tab on a plain line is a normal tab', async () => {
      const editor = await openDoc('hello');
      editor.options = { tabSize: 4, insertSpaces: false };
      placeCursor(editor, 0, 5);
      await pressTab();
      assert.strictEqual(text(editor), 'hello\t');
    });

    test('a non-empty selection falls back to a normal tab', async () => {
      const editor = await openDoc('- hello');
      editor.options = { tabSize: 4, insertSpaces: false };
      editor.selection = new vscode.Selection(0, 2, 0, 7);
      await pressTab();
      // default Tab on a single-line selection replaces the selection with a tab;
      // the smart indent would have produced '\t- hello'
      assert.strictEqual(text(editor), '- \t');
    });

    test('multiple cursors at bullet starts: all lines indent', async () => {
      const editor = await openDoc('- a\n- b');
      editor.options = { tabSize: 2, insertSpaces: true };
      editor.selections = [
        new vscode.Selection(0, 2, 0, 2),
        new vscode.Selection(1, 2, 1, 2),
      ];
      await pressTab();
      assert.strictEqual(text(editor), '  - a\n  - b');
    });

    test('multiple cursors, one outside bullet content: falls back for all', async () => {
      const editor = await openDoc('- a\nplain');
      editor.options = { tabSize: 4, insertSpaces: false };
      editor.selections = [
        new vscode.Selection(0, 3, 0, 3),
        new vscode.Selection(1, 5, 1, 5),
      ];
      await pressTab();
      assert.strictEqual(text(editor), '- a\t\nplain\t');
    });

    test('one Undo reverts the indent', async () => {
      const editor = await openDoc('- hello');
      editor.options = { tabSize: 4, insertSpaces: true };
      placeCursor(editor, 0, 7);
      await pressTab();
      await vscode.commands.executeCommand('undo');
      assert.strictEqual(text(editor), '- hello');
    });

    suite('settings', () => {
      test('indentOnTab off: Tab after the marker is a normal tab', async () => {
        await setSetting('indentOnTab', false);
        const editor = await openDoc('- hello');
        editor.options = { tabSize: 4, insertSpaces: false };
        placeCursor(editor, 0, 2);
        await pressTab();
        assert.strictEqual(text(editor), '- \thello');
      });

    test('a bad indentOnTab value uses its default', async () => {
      await setSetting('indentOnTab', 'no');
      const editor = await openDoc('- hello');
      editor.options = { tabSize: 4, insertSpaces: true };
      placeCursor(editor, 0, 2);
      await pressTab();
      // default is true, so the line indents
      assert.strictEqual(text(editor), '    - hello');
    });

    test('a bad setting for another feature does not break Tab', async () => {
      await setSetting('continueOnEnter', 'no');
      const editor = await openDoc('- hello');
      editor.options = { tabSize: 4, insertSpaces: true };
      placeCursor(editor, 0, 2);
      await pressTab();
      assert.strictEqual(text(editor), '    - hello');
    });
    });
  });
});