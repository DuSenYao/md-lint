import { window } from 'vscode';

export class LoggingService {
  private outputChannel = window.createOutputChannel('md-lint');

  public logMessage(message: string): void {
    const title = new Date().toLocaleTimeString();
    this.outputChannel.appendLine(`[${title}] ${message}`);
  }
}
