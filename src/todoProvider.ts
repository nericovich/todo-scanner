import * as vscode from 'vscode';
import { execFile } from 'child_process';
import * as path from 'path';

export class TodoItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly fileUri: vscode.Uri,
        public readonly line: number,
        public readonly tag: string
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);

        const relativePath = vscode.workspace.asRelativePath(fileUri);
        this.description = `${relativePath}:${line + 1}`;

        if (tag === 'FIXME' || tag === 'BUG') {
            this.iconPath = new vscode.ThemeIcon('error', new vscode.ThemeColor('errorForeground'));
        } else {
            this.iconPath = new vscode.ThemeIcon('checklist');
        }

        this.command = {
            command: 'vscode.open',
            title: 'Перейти к коду',
            arguments: [
                this.fileUri,
                { selection: new vscode.Range(line, 0, line, 0) }
            ]
        };
    }
}

export class TodoDataProvider implements vscode.TreeDataProvider<TodoItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<TodoItem | undefined | null | void> = new vscode.EventEmitter();
    readonly onDidChangeTreeData: vscode.Event<TodoItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private extensionPath: string) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: TodoItem): vscode.TreeItem {
        return element;
    }

    async getChildren(): Promise<TodoItem[]> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return [];
        }

        const projectPath = workspaceFolders[0].uri.fsPath;
        const scriptPath = path.join(this.extensionPath, 'scanner.py');

        return new Promise((resolve) => {
            // Запуск Python-скрипта
            // На Windows можно указать 'python', на macOS/Linux чаще 'python3'
            const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';

            execFile(pythonCommand, [scriptPath, projectPath], (error, stdout) => {
                if (error) {
                    vscode.window.showErrorMessage(`Ошибка Python: ${error.message}`);
                    return resolve([]);
                }

                try {
                    const rawItems: Array<{ tag: string; message: string; file: string; line: number }> = JSON.parse(stdout);
                    
                    const items = rawItems.map(item => new TodoItem(
                        `[${item.tag}] ${item.message}`,
                        vscode.Uri.file(item.file),
                        item.line,
                        item.tag
                    ));

                    resolve(items);
                } catch (e) {
                    resolve([]);
                }
            });
        });
    }
}