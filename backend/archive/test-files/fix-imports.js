const fs = require('fs');
const path = require('path');

// Define the path mappings for different component types
const pathMappings = {
  // From features subdirectories to project root
  'features': {
    '../contexts/AuthContext': '../../../contexts/AuthContext',
    '../services/': '../../../services/',
    '../utils/': '../../../utils/',
    '../hooks/': '../../../hooks/',
    '../../hooks/': '../../../hooks/',
    '../../services/': '../../../services/',
  }
};

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
        console.log(`Updated ${oldPath} -> ${newPath} in ${filePath}`);
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Updated: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

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
  console.log('🔧 Fixing import paths in features components...');
  
  const jsFiles = findJSFiles(featuresDir);
  console.log(`Found ${jsFiles.length} JavaScript files to process`);
  
  jsFiles.forEach(file => {
    updateImports(file, pathMappings.features);
  });
  
  console.log('✅ Import path fixing complete!');
} else {
  console.error('❌ Features directory not found:', featuresDir);
}
