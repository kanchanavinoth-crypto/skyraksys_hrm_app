const fs = require('fs');
const path = require('path');

// Fix remaining import and usage issues
function fixRemainingIssues(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  // Fix useNotification to useNotifications
  if (content.includes('useNotification')) {
    content = content.replace(/useNotification/g, 'useNotifications');
    changed = true;
  }
  
  // Fix loading state usage - replace 'loading' with 'isLoading'
  if (content.includes('loading') && !content.includes('isLoading')) {
    // Replace loading variables
    content = content.replace(/\bloading\b(?!\w)/g, 'isLoading');
    changed = true;
  }
  
  // Fix setLoading usage patterns
  if (content.includes('setLoading(')) {
    // Check if useLoading is imported but setLoading is not destructured
    if (content.includes('useLoading()') && !content.includes('setLoading')) {
      content = content.replace(
        'const { isLoading } = useLoading();',
        'const { isLoading, setLoading } = useLoading();'
      );
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed remaining issues in: ${path.relative(process.cwd(), filePath)}`);
    return true;
  }
  
  return false;
}

// Find files that need fixing
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
console.log('🔧 Fixing remaining notification and loading state issues...\n');

const frontendDir = path.join(__dirname, 'frontend', 'src');
const componentFiles = findComponentFiles(frontendDir);

let fixedCount = 0;

componentFiles.forEach(file => {
  if (fixRemainingIssues(file)) {
    fixedCount++;
  }
});

console.log(`\n📊 Fixed ${fixedCount} files with remaining issues.`);
