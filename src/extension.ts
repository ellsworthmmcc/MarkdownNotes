import * as vscode from 'vscode';
import { OptionsCache, createCommands, validateSettings } from './bullet-points-commands';

export function activate(context: vscode.ExtensionContext) {
  const options = new OptionsCache();
  const { smartEnter, smartTab, smartShiftTab } = createCommands(options);

  validateSettings();

  context.subscriptions.push(
    options,
    vscode.commands.registerCommand('notes-in-markdown.onEnter', smartEnter),
    vscode.commands.registerCommand('notes-in-markdown.onTab', smartTab),
    vscode.commands.registerCommand('notes-in-markdown.onShiftTab', smartShiftTab),
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}