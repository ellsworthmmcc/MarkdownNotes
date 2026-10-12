import * as vscode from 'vscode';
import { smartEnter } from './bullet-points-commands';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
    vscode.commands.registerCommand('markdownnotes.onEnter', smartEnter)
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
