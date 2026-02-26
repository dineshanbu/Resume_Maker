const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file));
        }
    });
    return arrayOfFiles;
}

const allJsFiles = getAllFiles(srcDir).filter(f => f.endsWith('.js'));
const controllerFiles = allJsFiles.filter(f => f.includes('\\controllers\\') || f.includes('/controllers/'));
const routeFiles = allJsFiles.filter(f => f.includes('\\routes\\') || f.includes('/routes/'));

const exportedControllers = {};

controllerFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const exportsMatch = content.match(/exports\.([a-zA-Z0-9_]+)\s*=/g);
    const moduleExportsMatch = content.match(/module\.exports\s*=\s*\{([^}]+)\}/);

    const funcs = [];
    if (exportsMatch) {
        exportsMatch.forEach(ex => funcs.push(ex.replace('exports.', '').replace('=', '').trim()));
    }
    if (moduleExportsMatch) {
        const names = moduleExportsMatch[1].split(',').map(s => s.trim().split(':')[0].trim());
        funcs.push(...names.filter(n => n));
    }

    exportedControllers[file] = { funcs: [...new Set(funcs)], unused: [] };
});

const allRouteCode = routeFiles.map(f => fs.readFileSync(f, 'utf-8')).join('\n');

Object.keys(exportedControllers).forEach(file => {
    exportedControllers[file].funcs.forEach(func => {
        const regex = new RegExp(`\\b${func}\\b`);
        if (!allRouteCode.match(regex)) {
            exportedControllers[file].unused.push(func);
        }
    });
});

const unusedControllers = {};
Object.keys(exportedControllers).forEach(file => {
    if (exportedControllers[file].unused.length > 0 && path.basename(file) !== 'auth.controller.js') {
        unusedControllers[path.basename(file)] = exportedControllers[file].unused;
    }
});

console.log(JSON.stringify(unusedControllers, null, 2));
