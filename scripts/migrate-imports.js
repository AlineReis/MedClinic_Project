const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const srcDir = path.join(__dirname, '../src');

walkDir(srcDir, (filePath) => {
    if (!filePath.endsWith('.ts')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // 1. Remove CSS imports
    // import "...css"; or import '...css';
    content = content.replace(/^import\s+['"][^'"]+\.css['"];?\s*$/gm, '');

    // 2. Add .js extension to relative imports
    // from "./..." or from "../..."
    // covering: import ... from "..." and export ... from "..."
    content = content.replace(/(from\s+['"])([\.][^'"]+)(['"])/g, (match, prefix, p1, suffix) => {
        if (p1.endsWith('.js')) return match;
        if (p1.endsWith('.png')) return match; // skip assets
        return `${prefix}${p1}.js${suffix}`;
    });

    // 3. Handle side-effect imports (import "./file")
    // import "./..." (but not css)
    content = content.replace(/^(import\s+['"])([\.][^'"]+)(['"])/gm, (match, prefix, p1, suffix) => {
        if (p1.endsWith('.css')) return ''; // double check (should be caught by step 1 if standalone)
        if (p1.endsWith('.js')) return match;
        return `${prefix}${p1}.js${suffix}`;
    });

    if (content !== originalContent) {
        console.log(`Updated: ${filePath}`);
        fs.writeFileSync(filePath, content, 'utf8');
    }
});
