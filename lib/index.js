"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const tsconfig = __importStar(require("tsconfig"));
const path = __importStar(require("path"));
const getInnerRequest = require("enhanced-resolve/lib/getInnerRequest");
const createInnerContext = require("enhanced-resolve/lib/createInnerContext");
function PromiseAny(promiseTasks) {
    return new Promise((r, j) => {
        let failed = 0;
        promiseTasks.forEach(p => {
            p.then(r, () => {
                failed++;
                if (failed === promiseTasks.length) {
                    j();
                }
            });
        });
    });
}
class TypeScriptRootDirsWebpackResolverPlugin {
    constructor(tsconfigFilename = 'tsconfig.json', projectRoot = process.cwd()) {
        this.projectRoot = projectRoot;
        let pathEntry = path.resolve(this.projectRoot, tsconfigFilename);
        let allowJs = undefined;
        let resolveJsonModule = undefined;
        while (true) {
            let cfg = tsconfig.loadSync(pathEntry);
            if (!cfg.path) {
                break;
            }
            this.rootDirs = cfg.config.compilerOptions
                ? cfg.config.compilerOptions.rootDirs
                : undefined;
            if (allowJs === undefined && cfg.config.compilerOptions) {
                allowJs = cfg.config.compilerOptions.allowJs;
            }
            if (resolveJsonModule === undefined && cfg.config.compilerOptions) {
                resolveJsonModule = cfg.config.compilerOptions.resolveJsonModule;
            }
            if (this.rootDirs || !cfg.config.extends) {
                break;
            }
            pathEntry = path.resolve(path.parse(cfg.path).dir, cfg.config.extends);
        }
        this.extensions = [
            '.ts',
            '.tsx',
            resolveJsonModule && '.json',
            allowJs && '.js',
            allowJs && '.jsx'
        ].filter(Boolean);
    }
    apply(resolver) {
        if (!resolver.fileSystem) {
            console.error('TypeScriptRootDirsWebpackResolverPlugin should be placed in webpackConfig.resolve.plugins.');
            return;
        }
        const rootDirs = this.rootDirs;
        if (!rootDirs) {
            return;
        }
        const pathsToCheck = rootDirs.map(d => path.resolve(this.projectRoot, d));
        const fileExists = (p) => new Promise(r => {
            resolver.fileSystem.stat(p, (err, stats) => {
                if (err) {
                    r(false);
                    return;
                }
                r(stats ? stats.isFile() : false);
            });
        });
        const fileExistsWithExtensionAppend = (p) => PromiseAny([p].concat([this.extensions].map(d => p + d)).map(d => fileExists(d))).catch(() => false);
        resolver.getHook('described-resolve').tapAsync({
            name: 'TypeScriptRootDirsWebpackResolverPlugin'
        }, async (request, resolveContext, next) => {
            // 检查是否是相对路径，绝对路径或者模块路径不需要解析 rootDirs
            const req = getInnerRequest(resolver, request);
            if (req[0] !== '.') {
                return next();
            }
            const abPath = path.resolve(this.projectRoot, req);
            // 检查相对路径文件是否存在，如果存在也不需要解析 rootDirs
            if (await fileExistsWithExtensionAppend(abPath)) {
                return next();
            }
            // 找出当前 req 是否在 rootDirs 中，如果存在，则算出相对路径
            const relativePathsToCheck = pathsToCheck
                .filter(d => abPath.indexOf(d) === 0)
                .map(d => {
                return path.relative(d, abPath);
            });
            if (relativePathsToCheck.length === 0) {
                return next();
            }
            let newReq = req;
            let founded = false;
            for (let r of pathsToCheck) {
                if (founded) {
                    break;
                }
                for (let relativePath of relativePathsToCheck) {
                    const tar = path.resolve(r, relativePath);
                    if (await fileExistsWithExtensionAppend(tar)) {
                        founded = true;
                        newReq = tar;
                        break;
                    }
                }
            }
            if (!founded || newReq === req) {
                return next();
            }
            const newRequest = {
                ...request,
                request: newReq
            };
            const nextHook = resolver.getHook('resolve');
            return resolver.doResolve(nextHook, newRequest, 'some message', createInnerContext({ ...resolveContext }), (err, result) => {
                if (err) {
                    return next(err);
                }
                // if (result === undefined) {
                //   return next(null, null);
                // }
                next(null, result);
            });
        });
    }
}
exports.default = TypeScriptRootDirsWebpackResolverPlugin;
