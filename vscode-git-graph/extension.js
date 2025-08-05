const vscode = require('vscode');
const cp = require('child_process');

function activate(context) {
  let disposable = vscode.commands.registerCommand('ethos.showGitGraph', () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage('No workspace folder open.');
      return;
    }
    const cwd = workspaceFolders[0].uri.fsPath;
    cp.exec('git log --graph --decorate --oneline --all', { cwd }, (err, stdout, stderr) => {
      if (err) {
        vscode.window.showErrorMessage('Failed to run git log: ' + stderr);
        return;
      }
      const panel = vscode.window.createWebviewPanel(
        'ethosGitGraph',
        'Ethos Git Graph',
        vscode.ViewColumn.Active,
        {}
      );
      const escaped = stdout.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      panel.webview.html = `<!DOCTYPE html><html><body><pre>${escaped}</pre></body></html>`;
    });
  });

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
