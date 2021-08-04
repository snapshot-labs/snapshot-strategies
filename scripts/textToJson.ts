const { readFileSync, writeFileSync } = require('fs');
const path = require('path');
const glob = require('glob');

glob(path.resolve(__dirname, '../dist/**/*.md'), {}, (err, files) => {
  files.forEach((file) => {
    const fileContent = readFileSync(file, 'utf-8');
    writeFileSync(
      file,
      `
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ${JSON.stringify(fileContent)};`
    );
  });
});

// console.log(file);
