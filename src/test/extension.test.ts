// src/test/extension.test.ts
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('extension', () => {
  test('registers notes-in-markdown.onEnter', async () => {
    const ext = vscode.extensions.getExtension('ellsworthmmcc.notes-in-markdown');
    assert.ok(ext, 'extension not found');
    await ext.activate();

    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('notes-in-markdown.onEnter'));
  });
});