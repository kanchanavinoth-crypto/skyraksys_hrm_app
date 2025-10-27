const fs = require('fs');
const path = require('path');

// Function to update imports in a file
function updateImports(filePath, mappings) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    for (const [oldPath, newPath] of Object.entries(mappings)) {
      const regex = new RegExp(oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (content.includes(oldPath)) {
        content = content.replace(regex, newPath);
        updated = true;
        console.log(`Fixed ${oldPath} -> ${newPath} in ${filePath}`);
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
}

// Define corrected path mappings - fix the over-adjustment from previous script
const fixMappings = {
  // Fix the over-corrected paths back to correct ones
  '../../../../services/': '../../../services/',
  '../../../../hooks/': '../../../hooks/',
  '../../../../utils/': '../../../utils/',
  '../../../../../hooks/': '../../../hooks/',
  '../../../../../services/': '../../../services/',
};

// Function to recursively find all .js files in a directory
function findJSFiles(dir) {
  const files = [];
  
  function walkDir(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (item.endsWith('.js') && !item.endsWith('.test.js')) {
        files.push(fullPath);
      }
    }
  }
  
  walkDir(dir);
  return files;
}

// Main execution
const featuresDir = 'd:\\skyraksys_hrm\\frontend\\src\\components\\features';

if (fs.existsSync(featuresDir)) {
  console.log('🔧 Fixing over-corrected import paths...');
  
  const jsFiles = findJSFiles(featuresDir);
  console.log(`Found ${jsFiles.length} JavaScript files to fix`);
  
  jsFiles.forEach(file => {
    updateImports(file, fixMappings);
  });
  
  console.log('✅ Import path correction complete!');
} else {
  console.error('❌ Features directory not found:', featuresDir);
}
