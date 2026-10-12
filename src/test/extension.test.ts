// src/test/extension.test.ts
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('extension', () => {
  test('registers notes-for-markdown.onEnter', async () => {
    const ext = vscode.extensions.getExtension('ellsworthmmcc.notes-for-markdown');
    assert.ok(ext, 'extension not found');
    await ext.activate();

    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('notes-for-markdown.onEnter'));
  });
});