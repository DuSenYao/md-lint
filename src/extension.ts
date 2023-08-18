import {
  DocumentFormattingEditProvider,
  ExtensionContext,
  TextDocument,
  FormattingOptions,
  CancellationToken,
  ProviderResult,
  TextEdit,
  languages,
  workspace,
  Range,
  window
} from 'vscode';
import { lintMarkdown } from '@lint-md/core';
import { LoggingService } from './LoggingService';

class MarkdownDocumentFormatter implements DocumentFormattingEditProvider {
  provideDocumentFormattingEdits(
    document: TextDocument,
    options: FormattingOptions,
    token: CancellationToken
  ): ProviderResult<TextEdit[]>;
  provideDocumentFormattingEdits(document: TextDocument): ProviderResult<TextEdit[]>;

  provideDocumentFormattingEdits(
    document: TextDocument,
    options?: FormattingOptions,
    token?: CancellationToken
  ): ProviderResult<TextEdit[]> {
    const { languageId, fileName } = document;
    if (languageId !== 'markdown' || !fileName) {
      return;
    }
    const firstLine = document.lineAt(0);
    const lastLine = document.lineAt(document.lineCount - 1);
    let range = new Range(firstLine.range.start, lastLine.range.end);
    const text = document.getText(range);
    const { fixedResult } = lintMarkdown(text, {}, true);
    const result = fixedResult?.result ?? text;
    return [TextEdit.replace(range, result)];
  }
}

export function activate(context: ExtensionContext) {
  const loggingService = new LoggingService();

  context.subscriptions.push(
    languages.registerDocumentFormattingEditProvider(
      { scheme: 'file', language: 'markdown' },
      new MarkdownDocumentFormatter()
    )
  );

  // 在保存文件时，自动修复
  workspace.onDidSaveTextDocument((document: TextDocument) => {
    workspace.fs.readFile(document.uri).then(value => {
      let { fixedResult } = lintMarkdown(value.toString(), {}, true);
      workspace.fs.writeFile(document.uri, new TextEncoder().encode(fixedResult?.result ?? ''));
      loggingService.logMessage(`文件 ${document.fileName} 已保存，自动修复完成。`);
    });
  });
}

export function deactivate() {}
