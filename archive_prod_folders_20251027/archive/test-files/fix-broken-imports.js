const fs = require('fs');
const path = require('path');

// Fix broken import statements
function fixBrokenImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Fix malformed context imports
  const patterns = [
    {
      from: /import\s*{\s*useAuth\s*}\s*from\s*['"`]\.\.\/\.\.\/\.\.\/contexts[^'"`]*$/gm,
      to: "import { useAuth } from '../../../contexts/AuthContext';"
    },
    {
      from: /import\s*{\s*useLoading\s*}\s*from\s*['"`]\.\.\/\.\.\/\.\.\/contexts[^'"`]*LoadingContext[^'"`]*AuthContext[^'"`]*$/gm,
      to: "import { useLoading } from '../../../contexts/LoadingContext';"
    },
    {
      from: /import\s*{\s*useNotification\s*}\s*from\s*['"`]\.\.\/\.\.\/\.\.\/contexts[^'"`]*NotificationContext[^'"`]*LoadingContext[^'"`]*$/gm,
      to: "import { useNotification } from '../../../contexts/NotificationContext';"
    },
    // Fix broken useCallback patterns
    {
      from: /const\s+(\w+)\s*=\s*useCallback\([^}]+\}\s*;\s*$/gm,
      to: (match, funcName) => {
        return match.replace(/;\s*$/, ', []);');
      }
    }
  ];
  
  patterns.forEach(pattern => {
    if (typeof pattern.to === 'function') {
      const matches = content.match(pattern.from);
      if (matches) {
        matches.forEach(match => {
          const replacement = pattern.to(match);
          content = content.replace(match, replacement);
          changed = true;
        });
      }
    } else if (pattern.from.test(content)) {
      content = content.replace(pattern.from, pattern.to);
      changed = true;
    }
  });
  
  // Fix specific import line patterns
  content = content.replace(
    /import\s*{\s*useAuth\s*}\s*from\s*['"`]\.\.\/\.\.\/\.\.\/contexts$/gm,
    "import { useAuth } from '../../../contexts/AuthContext';"
  );
  
  content = content.replace(
    /import\s*{\s*useLoading\s*}\s*from\s*['"`]\.\.\/\.\.\/\.\.\/contexts.*LoadingContext.*AuthContext.*$/gm,
    "import { useLoading } from '../../../contexts/LoadingContext';"
  );
  
  content = content.replace(
    /import\s*{\s*useNotification\s*}\s*from\s*['"`]\.\.\/\.\.\/\.\.\/contexts.*NotificationContext.*LoadingContext.*$/gm,
    "import { useNotification } from '../../../contexts/NotificationContext';"
  );
  
  // Check if any changes were made
  if (content !== fs.readFileSync(filePath, 'utf8')) {
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed imports in: ${path.relative(process.cwd(), filePath)}`);
    return true;
  }
  
  return false;
}

// Find files with import issues
function findComponentFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git')) {
      findComponentFiles(fullPath, files);
    } else if ((item.endsWith('.js') || item.endsWith('.jsx')) && 
               fullPath.includes('components/features')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Main execution
console.log('🔧 Fixing broken import statements...\n');

const frontendDir = path.join(__dirname, 'frontend', 'src');
const componentFiles = findComponentFiles(frontendDir);

let fixedCount = 0;

componentFiles.forEach(file => {
  if (fixBrokenImports(file)) {
    fixedCount++;
  }
});

console.log(`\n📊 Fixed ${fixedCount} files with broken imports.`);
