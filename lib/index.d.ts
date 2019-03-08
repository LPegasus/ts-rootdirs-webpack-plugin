import * as webpack from 'webpack';
export default class TypeScriptRootDirsWebpackResolverPlugin implements webpack.ResolvePlugin {
    private projectRoot;
    private rootDirs?;
    private extensions;
    constructor(tsconfigFilename?: string, projectRoot?: string);
    apply(resolver: any): void;
}
