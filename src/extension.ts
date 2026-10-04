import * as vscode from 'vscode';
import { TodoDataProvider } from './todoProvider';

export function activate(context: vscode.ExtensionContext) {
    // Передаем context.extensionPath, чтобы плагин знал, где лежит scanner.py
    const todoProvider = new TodoDataProvider(context.extensionPath);

    vscode.window.registerTreeDataProvider('todoTreeView', todoProvider);

    const refreshCommand = vscode.commands.registerCommand('todoScanner.refresh', () => {
        todoProvider.refresh();
    });

    const onSaveListener = vscode.workspace.onDidSaveTextDocument(() => {
        todoProvider.refresh();
    });

    context.subscriptions.push(refreshCommand, onSaveListener);
}

export function deactivate() {}