/**
 * React Performance Optimization Implementation Script
 * Systematically applies React.memo, useCallback, useMemo optimizations
 * Phase 2 of Frontend Refactoring
 */

const fs = require('fs');
const path = require('path');

// Performance optimization patterns to apply
const OPTIMIZATION_PATTERNS = {
  // React.memo wrapper for functional components
  reactMemo: {
    pattern: /^(function|const)\s+(\w+)\s*=?\s*\(([^)]*)\)\s*=>\s*{/,
    replacement: (match, type, componentName, props) => {
      return `const ${componentName} = React.memo((${props}) => {`;
    }
  },
  
  // useCallback for event handlers
  useCallback: {
    pattern: /const\s+(\w*(?:handler|Handler|onClick|onSubmit|onChange|onSelect|handle\w+))\s*=\s*\(([^)]*)\)\s*=>\s*{/g,
    replacement: 'const $1 = useCallback(($2) => {',
    dependencies: []
  },
  
  // useMemo for expensive calculations
  useMemo: {
    pattern: /const\s+(\w*(?:filtered|sorted|processed|computed|calculated)\w*)\s*=\s*([^;]+);/g,
    replacement: 'const $1 = useMemo(() => $2, []);'
  }
};

// Function to analyze and optimize a React component
function optimizeReactComponent(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  // Check if it's a React component file
  if (!content.includes('import React') && !content.includes('from \'react\'')) {
    return false;
  }
  
  // Add React import if missing but React features are used
  if (!content.includes('import React') && (content.includes('useState') || content.includes('useEffect'))) {
    content = 'import React, { ' + content.match(/import\s*{\s*([^}]+)\s*}\s*from\s*[\'"]react[\'"];?/)?.[1] + ' } from \'react\';\n' + content.replace(/import\s*{\s*[^}]+\s*}\s*from\s*[\'"]react[\'"];?\n?/, '');
    hasChanges = true;
  }
  
  // Add React hooks imports if not present
  const neededHooks = [];
  if (content.includes('useCallback') && !content.includes('useCallback')) neededHooks.push('useCallback');
  if (content.includes('useMemo') && !content.includes('useMemo')) neededHooks.push('useMemo');
  
  if (neededHooks.length > 0) {
    const reactImportMatch = content.match(/import React(?:,\s*{\s*([^}]*)\s*})?\s*from\s*[\'"]react[\'"];?/);
    if (reactImportMatch) {
      const existingHooks = reactImportMatch[1] ? reactImportMatch[1].split(',').map(h => h.trim()) : [];
      const allHooks = [...new Set([...existingHooks, ...neededHooks])];
      const newImport = `import React, { ${allHooks.join(', ')} } from 'react';`;
      content = content.replace(reactImportMatch[0], newImport);
      hasChanges = true;
    }
  }
  
  // Apply React.memo to main component export
  const componentExportMatch = content.match(/export\s+default\s+function\s+(\w+)/);
  if (componentExportMatch) {
    const componentName = componentExportMatch[1];
    if (!content.includes(`React.memo(${componentName})`)) {
      content = content.replace(
        new RegExp(`export\\s+default\\s+${componentName};?`), 
        `export default React.memo(${componentName});`
      );
      hasChanges = true;
    }
  }
  
  // Apply useCallback to event handlers
  const handlerMatches = content.matchAll(/const\s+(\w*(?:handle|Handle|onClick|onSubmit|onChange|onSelect)\w*)\s*=\s*\(([^)]*)\)\s*=>\s*{/g);
  for (const match of handlerMatches) {
    if (!content.includes(`useCallback`)) {
      continue; // Skip if useCallback is not imported
    }
    
    const [fullMatch, handlerName, params] = match;
    if (!content.includes(`useCallback((${params}) => {`)) {
      const replacement = `const ${handlerName} = useCallback((${params}) => {`;
      content = content.replace(fullMatch, replacement);
      
      // Add dependency array (empty for now, will be manually optimized later)
      const closingBraceMatch = content.match(new RegExp(`const\\s+${handlerName}\\s*=\\s*useCallback\\([^}]+}\\s*\\)`));
      if (closingBraceMatch && !content.includes(`, [])`)) {
        content = content.replace(closingBraceMatch[0], closingBraceMatch[0] + ', []');
      }
      hasChanges = true;
    }
  }
  
  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Optimized React component: ${path.relative(process.cwd(), filePath)}`);
    return true;
  }
  
  return false;
}

// Function to add loading context integration
function integrateLoadingContext(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  // Check if loading context should be added
  if (content.includes('useState') && content.includes('loading') && !content.includes('useLoading')) {
    // Add useLoading import
    if (!content.includes('useLoading')) {
      const contextImportMatch = content.match(/import.*from\s*[\'"]\.\.\/.*contexts/);
      if (contextImportMatch) {
        content = content.replace(
          contextImportMatch[0],
          contextImportMatch[0] + '\nimport { useLoading } from \'../../../contexts/LoadingContext\';'
        );
      } else {
        // Add after React import
        content = content.replace(
          /import React[^;]+;/,
          '$&\nimport { useLoading } from \'../../../contexts/LoadingContext\';'
        );
      }
      hasChanges = true;
    }
    
    // Replace local loading state with context
    if (content.includes('useState') && content.includes('loading')) {
      content = content.replace(
        /const\s*\[\s*loading\s*,\s*setLoading\s*\]\s*=\s*useState\([^)]*\);?/,
        '// Loading state managed by LoadingContext\n  const { isLoading, setLoading } = useLoading();'
      );
      hasChanges = true;
    }
  }
  
  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Integrated LoadingContext: ${path.relative(process.cwd(), filePath)}`);
    return true;
  }
  
  return false;
}

// Function to add notification context integration
function integrateNotificationContext(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  // Check if notifications should be added
  if (content.includes('alert') || content.includes('console.log') || content.includes('toast')) {
    // Add useNotification import
    if (!content.includes('useNotification')) {
      const contextImportMatch = content.match(/import.*from\s*[\'"]\.\.\/.*contexts/);
      if (contextImportMatch) {
        content = content.replace(
          contextImportMatch[0],
          contextImportMatch[0] + '\nimport { useNotification } from \'../../../contexts/NotificationContext\';'
        );
      } else {
        // Add after React import
        content = content.replace(
          /import React[^;]+;/,
          '$&\nimport { useNotification } from \'../../../contexts/NotificationContext\';'
        );
      }
      hasChanges = true;
    }
    
    // Add useNotification hook usage
    if (!content.includes('const { showNotification }')) {
      const componentStart = content.match(/function\s+\w+.*{|const\s+\w+.*=.*=>\s*{/);
      if (componentStart) {
        const insertPoint = componentStart.index + componentStart[0].length;
        content = content.slice(0, insertPoint) + 
          '\n  const { showNotification } = useNotification();' + 
          content.slice(insertPoint);
        hasChanges = true;
      }
    }
  }
  
  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Integrated NotificationContext: ${path.relative(process.cwd(), filePath)}`);
    return true;
  }
  
  return false;
}

// Function to recursively find React component files
function findReactComponents(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git')) {
      findReactComponents(fullPath, files);
    } else if ((item.endsWith('.js') || item.endsWith('.jsx')) && 
               (item.includes('Component') || item.includes('Dashboard') || 
                item.includes('Management') || item.includes('Form') || 
                item.includes('Profile') || item.includes('List'))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Main execution
async function main() {
  console.log('🚀 Starting React Performance Optimization Implementation...\n');
  
  const frontendDir = path.join(__dirname, 'frontend', 'src', 'components');
  const componentFiles = findReactComponents(frontendDir);
  
  let optimizedCount = 0;
  let loadingIntegrated = 0;
  let notificationIntegrated = 0;
  
  console.log(`Found ${componentFiles.length} React component files to optimize:\n`);
  
  for (const file of componentFiles) {
    console.log(`Processing: ${path.relative(process.cwd(), file)}`);
    
    // Apply React optimizations
    if (optimizeReactComponent(file)) {
      optimizedCount++;
    }
    
    // Integrate loading context
    if (integrateLoadingContext(file)) {
      loadingIntegrated++;
    }
    
    // Integrate notification context
    if (integrateNotificationContext(file)) {
      notificationIntegrated++;
    }
  }
  
  console.log('\n📊 Optimization Summary:');
  console.log(`✅ React optimizations applied: ${optimizedCount} files`);
  console.log(`⏳ LoadingContext integrated: ${loadingIntegrated} files`);
  console.log(`🔔 NotificationContext integrated: ${notificationIntegrated} files`);
  console.log('\n🎉 Phase 2 React Optimization Implementation Complete!');
}

// Run the optimization
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { optimizeReactComponent, integrateLoadingContext, integrateNotificationContext };
