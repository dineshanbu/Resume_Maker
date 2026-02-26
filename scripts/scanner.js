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
const modelFiles = allJsFiles.filter(f => f.includes('\\models\\') || f.includes('/models/'));
const controllerFiles = allJsFiles.filter(f => (f.includes('\\controllers\\') || f.includes('/controllers/')) && !f.includes('\\admin\\'));
const routeFiles = allJsFiles.filter(f => f.includes('\\routes\\') || f.includes('/routes/'));

console.log("Found Models:", modelFiles.length);
console.log("Found Controllers:", controllerFiles.length);
console.log("Found Routes:", routeFiles.length);

const results = {
    models: {},
    controllers: {},
    routes: {}
};

// Extremely basic AST-less parsing:
modelFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const modelNameMatch = content.match(/mongoose\.model\(['"]([^'"]+)['"]/);
    const modelName = modelNameMatch ? modelNameMatch[1] : path.basename(file, '.js');

    // Try to find fields inside Schema
    const schemaFields = [];
    const fieldRegex = /([a-zA-Z0-9_]+)\s*:\s*\{/g;
    let match;
    while ((match = fieldRegex.exec(content)) !== null) {
        if (!['type', 'required', 'default', 'ref', 'enum', 'min', 'max', 'select', 'unique', 'timestamps'].includes(match[1])) {
            schemaFields.push(match[1]);
        }
    }

    results.models[modelName] = { file, fields: [...new Set(schemaFields)], usedCount: 0, unusedFields: [] };
});

const allCodeExceptModels = allJsFiles.filter(f => !modelFiles.includes(f)).map(f => fs.readFileSync(f, 'utf-8')).join('\n');

Object.keys(results.models).forEach(model => {
    const regex = new RegExp(`\\b${model}\\b`, 'g');
    const matches = allCodeExceptModels.match(regex);
    if (matches) {
        results.models[model].usedCount = matches.length;
    }

    // Check fields
    results.models[model].fields.forEach(field => {
        const fieldRegex = new RegExp(`\\b${field}\\b`, 'g');
        if (!allCodeExceptModels.match(fieldRegex)) {
            results.models[model].unusedFields.push(field);
        }
    });
});

console.log(JSON.stringify(results.models, null, 2));
