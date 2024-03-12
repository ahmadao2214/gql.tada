import * as fs from 'fs';
import * as ts from 'typescript';

export function check(rootFileNames: string[], options: ts.CompilerOptions) {
  const files: ts.MapLike<{ version: number }> = {};
  rootFileNames.forEach((fileName) => {
    files[fileName] = { version: 0 };
  });

  const servicesHost: ts.LanguageServiceHost = {
    getScriptFileNames: () => rootFileNames,
    getScriptVersion: (fileName) => files[fileName] && files[fileName].version.toString(),
    getScriptSnapshot: (fileName) => {
      if (!fs.existsSync(fileName)) {
        return undefined;
      }

      return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
    },
    getCurrentDirectory: () => process.cwd(),
    getCompilationSettings: () => ({
      ...options,
      jsx: ts.JsxEmit.ReactJSX,
    }),
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
  };

  const registry = ts.createDocumentRegistry();
  const services = ts.createLanguageService(servicesHost, registry);
  rootFileNames.forEach((fileName) => {
    emitFile(fileName);
  });

  function emitFile(fileName: string) {
    const diagnostics = services.getSemanticDiagnostics(fileName);
    console.error(diagnostics);
  }
}
