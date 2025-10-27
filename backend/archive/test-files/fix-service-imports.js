const fs = require('fs');
const path = require('path');

// Function to recursively find JavaScript files
function findJSFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git')) {
      findJSFiles(fullPath, files);
    } else if (item.endsWith('.js') || item.endsWith('.jsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Fix service imports in a file
function fixServiceImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Fix common service imports to use named exports
  const serviceImportPatterns = [
    {
      from: /import employeeService from ['"`]([^'"`]+\/employee\.service)['"`];?/g,
      to: "import { employeeService } from '$1';"
    },
    {
      from: /import leaveService from ['"`]([^'"`]+\/leave\.service)['"`];?/g,
      to: "import { leaveService } from '$1';"
    },
    {
      from: /import timesheetService from ['"`]([^'"`]+\/timesheet\.service)['"`];?/g,
      to: "import { timesheetService } from '$1';"
    },
    {
      from: /import projectService from ['"`]([^'"`]+\/project\.service)['"`];?/g,
      to: "import { projectService } from '$1';"
    },
    {
      from: /import taskService from ['"`]([^'"`]+\/task\.service)['"`];?/g,
      to: "import { taskService } from '$1';"
    }
  ];
  
  serviceImportPatterns.forEach(pattern => {
    if (pattern.from.test(content)) {
      content = content.replace(pattern.from, pattern.to);
      changed = true;
    }
  });
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed service imports in: ${filePath}`);
  }
  
  return changed;
}

// Main execution
const frontendDir = path.join(__dirname, 'frontend', 'src');
console.log('Searching for JavaScript files to fix service imports...');

const jsFiles = findJSFiles(frontendDir);
let totalFixed = 0;

jsFiles.forEach(file => {
  if (fixServiceImports(file)) {
    totalFixed++;
  }
});

console.log(`\n✅ Fixed service imports in ${totalFixed} files.`);
