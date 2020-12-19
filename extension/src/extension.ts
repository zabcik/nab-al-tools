'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as NABfunctions from './NABfunctions';  //Our own functions
import * as DebugTests from './DebugTests';
import { XlfHighlighter } from './XlfHighlighter';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {


    const hl = new XlfHighlighter();

    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "nab-al-tools" is now active!');

    // The command has been defined in the package.json file
    // The commandId parameter must match the command field in package.json

    let commandlist = [
        vscode.commands.registerCommand('nab.RefreshXlfFilesFromGXlf', () => { NABfunctions.refreshXlfFilesFromGXlf(); }),
        vscode.commands.registerCommand('nab.FindNextUnTranslatedText', () => { NABfunctions.findNextUnTranslatedText(); }),
        vscode.commands.registerCommand('nab.FindAllUnTranslatedText', () => { NABfunctions.findAllUnTranslatedText(); }),
        vscode.commands.registerCommand('nab.FindMultipleTargets', () => { NABfunctions.findMultipleTargets(); }),
        vscode.commands.registerTextEditorCommand('nab.FindTranslatedTexts', () => { NABfunctions.findTranslatedTexts(); }),
        vscode.commands.registerTextEditorCommand('nab.FindSourceOfTranslatedTexts', () => { NABfunctions.findSourceOfTranslatedTexts(); }),
        vscode.commands.registerCommand('nab.UninstallDependencies', () => { NABfunctions.uninstallDependencies(); }),
        vscode.commands.registerCommand('nab.SignAppFile', () => { NABfunctions.signAppFile(); }),
        vscode.commands.registerCommand('nab.DeployAndRunTestToolNoDebug', () => { NABfunctions.deployAndRunTestTool(true); }),
        vscode.commands.registerCommand('nab.DeployAndRunTestTool', () => { NABfunctions.deployAndRunTestTool(false); }),
        vscode.commands.registerCommand('nab.SortXlfFiles', () => { NABfunctions.sortXlfFiles(); }),
        vscode.commands.registerCommand('nab.MatchFromXlfFile', () => { NABfunctions.matchFromXlfFile(); }),
        vscode.commands.registerCommand('nab.CopySourceToTarget', () => { NABfunctions.copySourceToTarget(); }),
        vscode.commands.registerCommand('nab.SuggestToolTips', () => { NABfunctions.suggestToolTips(); }),
        vscode.commands.registerCommand('nab.ShowSuggestedToolTip', () => { NABfunctions.showSuggestedToolTip(); }),
        vscode.commands.registerCommand('nab.GenerateToolTipDocumentation', () => { NABfunctions.generateToolTipDocumentation(); }),
        vscode.commands.registerCommand('nab.MatchTranslations', () => { NABfunctions.matchTranslations(); }),
        vscode.commands.registerCommand('nab.downloadBaseAppTranslationFiles', () => { NABfunctions.downloadBaseAppTranslationFiles(); }),
        vscode.commands.registerCommand('nab.matchTranslationsFromBaseApplication', () => { NABfunctions.matchTranslationsFromBaseApplication(); }),
        vscode.commands.registerCommand('nab.UpdateGXlfFile', () => { NABfunctions.updateGXlf(); }),
        vscode.commands.registerCommand('nab.UpdateAllXlfFiles', () => { NABfunctions.updateAllXlfFiles(); }),

        vscode.debug.onDidStartDebugSession(debugSession => DebugTests.handleStartDebugSession(debugSession)),
        vscode.debug.onDidTerminateDebugSession(debugSession => DebugTests.handleTerminateDebugSession(debugSession)),
        vscode.workspace.onDidChangeTextDocument(e => hl.onDidChangeTextDocument(e)),
        vscode.window.onDidChangeActiveTextEditor(editor => hl.onDidChangeActiveTextEditor(editor))
    ];


    context.subscriptions.concat(commandlist);
    //context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}