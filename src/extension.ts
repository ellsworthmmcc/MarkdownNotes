import * as vscode from 'vscode';
import { smartEnter, smartTab } from './bullet-points-commands';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
    vscode.commands.registerCommand('notes-in-markdown.onEnter', smartEnter),
    vscode.commands.registerCommand('notes-in-markdown.onTab', smartTab),
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
