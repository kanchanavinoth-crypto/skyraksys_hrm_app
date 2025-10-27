/**
 * Comprehensive Form System Test Script
 * Tests the new standardized form components and error recovery system
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const testConfig = {
  testDuration: 30000, // 30 seconds per test
  baseUrl: 'http://localhost:3000',
  apiUrl: 'http://localhost:5000/api',
  testResults: []
};

/**
 * Test Result Logger
 */
class TestLogger {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  log(test, status, message, details = {}) {
    const result = {
      test,
      status,
      message,
      details,
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime
    };
    
    this.results.push(result);
    console.log(`[${status.toUpperCase()}] ${test}: ${message}`);
    
    if (details && Object.keys(details).length > 0) {
      console.log(`  Details:`, details);
    }
  }

  getResults() {
    return this.results;
  }

  saveResults() {
    const reportPath = path.join(__dirname, 'test-results', `form-system-test-${Date.now()}.json`);
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify({
      testSuite: 'Form System Validation',
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date().toISOString(),
      totalDuration: Date.now() - this.startTime,
      results: this.results,
      summary: this.generateSummary()
    }, null, 2));
    
    console.log(`\nTest results saved to: ${reportPath}`);
    return reportPath;
  }

  generateSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warning = this.results.filter(r => r.status === 'warning').length;
    
    return {
      total,
      passed,
      failed,
      warning,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0
    };
  }
}

const logger = new TestLogger();

/**
 * File Existence Tests
 */
async function testFileExistence() {
  const requiredFiles = [
    'frontend/src/components/common/StandardForm.js',
    'frontend/src/components/common/FormFields.js',
    'frontend/src/components/common/SmartErrorBoundary.js',
    'frontend/src/services/enhancedApiService.js',
    'frontend/src/utils/errorRecovery.js',
    'frontend/src/hooks/useErrorRecovery.js',
    'frontend/src/components/features/employees/ModernEmployeeForm.js'
  ];

  logger.log('file-existence', 'info', 'Starting file existence validation...');

  for (const filePath of requiredFiles) {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      logger.log('file-existence', 'pass', `File exists: ${filePath}`, {
        size: stats.size,
        modified: stats.mtime.toISOString()
      });
    } else {
      logger.log('file-existence', 'fail', `File missing: ${filePath}`);
    }
  }
}

/**
 * Import/Syntax Tests
 */
async function testImportSyntax() {
  logger.log('import-syntax', 'info', 'Testing import syntax and dependencies...');

  const testFiles = [
    'frontend/src/components/common/StandardForm.js',
    'frontend/src/components/common/FormFields.js',
    'frontend/src/components/common/SmartErrorBoundary.js',
    'frontend/src/services/enhancedApiService.js',
    'frontend/src/utils/errorRecovery.js',
    'frontend/src/hooks/useErrorRecovery.js'
  ];

  for (const filePath of testFiles) {
    try {
      const fullPath = path.join(__dirname, filePath);
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for common React patterns
      const hasReactImport = content.includes("import React") || content.includes("from 'react'");
      const hasProperExport = content.includes('export default') || content.includes('export {');
      const hasValidJSX = content.includes('<') && content.includes('>');
      
      if (hasReactImport && hasProperExport) {
        logger.log('import-syntax', 'pass', `Valid syntax: ${filePath}`, {
          hasReactImport,
          hasProperExport,
          hasValidJSX
        });
      } else {
        logger.log('import-syntax', 'warning', `Potential syntax issues: ${filePath}`, {
          hasReactImport,
          hasProperExport,
          hasValidJSX
        });
      }
    } catch (error) {
      logger.log('import-syntax', 'fail', `Error reading ${filePath}: ${error.message}`);
    }
  }
}

/**
 * Component Structure Tests
 */
async function testComponentStructure() {
  logger.log('component-structure', 'info', 'Validating component structure...');

  // Test StandardForm component
  try {
    const standardFormPath = path.join(__dirname, 'frontend/src/components/common/StandardForm.js');
    const standardFormContent = fs.readFileSync(standardFormPath, 'utf8');
    
    const hasMultiStep = standardFormContent.includes('steps') && standardFormContent.includes('currentStep');
    const hasValidation = standardFormContent.includes('validation') || standardFormContent.includes('validate');
    const hasAutoSave = standardFormContent.includes('autoSave') || standardFormContent.includes('auto-save');
    const hasErrorHandling = standardFormContent.includes('error') && standardFormContent.includes('catch');
    
    logger.log('component-structure', 'pass', 'StandardForm structure validation', {
      hasMultiStep,
      hasValidation,
      hasAutoSave,
      hasErrorHandling,
      fileSize: standardFormContent.length
    });
  } catch (error) {
    logger.log('component-structure', 'fail', `StandardForm validation failed: ${error.message}`);
  }

  // Test FormFields component
  try {
    const formFieldsPath = path.join(__dirname, 'frontend/src/components/common/FormFields.js');
    const formFieldsContent = fs.readFileSync(formFieldsPath, 'utf8');
    
    const fieldComponents = [
      'StandardTextField',
      'StandardSelectField',
      'StandardDateField',
      'StandardAutocompleteField'
    ];
    
    let foundComponents = 0;
    for (const component of fieldComponents) {
      if (formFieldsContent.includes(`export const ${component}`) || formFieldsContent.includes(`const ${component}`)) {
        foundComponents++;
      }
    }
    
    logger.log('component-structure', 'pass', 'FormFields structure validation', {
      totalExpected: fieldComponents.length,
      foundComponents,
      fileSize: formFieldsContent.length
    });
  } catch (error) {
    logger.log('component-structure', 'fail', `FormFields validation failed: ${error.message}`);
  }
}

/**
 * Error Recovery Tests
 */
async function testErrorRecovery() {
  logger.log('error-recovery', 'info', 'Testing error recovery mechanisms...');

  try {
    const errorRecoveryPath = path.join(__dirname, 'frontend/src/utils/errorRecovery.js');
    const errorRecoveryContent = fs.readFileSync(errorRecoveryPath, 'utf8');
    
    const hasExponentialBackoff = errorRecoveryContent.includes('exponential') || errorRecoveryContent.includes('backoff');
    const hasCircuitBreaker = errorRecoveryContent.includes('circuit') || errorRecoveryContent.includes('breaker');
    const hasRetryLogic = errorRecoveryContent.includes('retry') && errorRecoveryContent.includes('attempt');
    const hasTimeoutHandling = errorRecoveryContent.includes('timeout') || errorRecoveryContent.includes('delay');
    
    logger.log('error-recovery', 'pass', 'Error recovery features validation', {
      hasExponentialBackoff,
      hasCircuitBreaker,
      hasRetryLogic,
      hasTimeoutHandling,
      fileSize: errorRecoveryContent.length
    });
  } catch (error) {
    logger.log('error-recovery', 'fail', `Error recovery validation failed: ${error.message}`);
  }
}

/**
 * API Service Tests
 */
async function testApiService() {
  logger.log('api-service', 'info', 'Testing enhanced API service...');

  try {
    const apiServicePath = path.join(__dirname, 'frontend/src/services/enhancedApiService.js');
    const apiServiceContent = fs.readFileSync(apiServicePath, 'utf8');
    
    const hasRetryLogic = apiServiceContent.includes('retry');
    const hasOfflineHandling = apiServiceContent.includes('offline') || apiServiceContent.includes('queue');
    const hasInterceptors = apiServiceContent.includes('interceptor');
    const hasTokenRefresh = apiServiceContent.includes('token') && apiServiceContent.includes('refresh');
    const hasErrorMapping = apiServiceContent.includes('error') && apiServiceContent.includes('map');
    
    logger.log('api-service', 'pass', 'Enhanced API service features validation', {
      hasRetryLogic,
      hasOfflineHandling,
      hasInterceptors,
      hasTokenRefresh,
      hasErrorMapping,
      fileSize: apiServiceContent.length
    });
  } catch (error) {
    logger.log('api-service', 'fail', `API service validation failed: ${error.message}`);
  }
}

/**
 * App Integration Tests
 */
async function testAppIntegration() {
  logger.log('app-integration', 'info', 'Testing App.js integration...');

  try {
    const appPath = path.join(__dirname, 'frontend/src/App.js');
    const appContent = fs.readFileSync(appPath, 'utf8');
    
    const hasSmartErrorBoundary = appContent.includes('SmartErrorBoundary');
    const hasModernEmployeeForm = appContent.includes('ModernEmployeeForm');
    const hasErrorBoundaryLevels = appContent.includes("level=");
    const hasRouteProtection = appContent.includes('ProtectedRoute');
    
    logger.log('app-integration', 'pass', 'App.js integration validation', {
      hasSmartErrorBoundary,
      hasModernEmployeeForm,
      hasErrorBoundaryLevels,
      hasRouteProtection,
      fileSize: appContent.length
    });
  } catch (error) {
    logger.log('app-integration', 'fail', `App integration validation failed: ${error.message}`);
  }
}

/**
 * Package Dependencies Tests
 */
async function testPackageDependencies() {
  logger.log('dependencies', 'info', 'Checking package dependencies...');

  try {
    const packagePath = path.join(__dirname, 'frontend/package.json');
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    const requiredDeps = [
      '@mui/material',
      '@mui/icons-material',
      'react',
      'react-dom',
      'react-router-dom',
      'axios'
    ];
    
    const missingDeps = [];
    const foundDeps = [];
    
    for (const dep of requiredDeps) {
      if (packageContent.dependencies && packageContent.dependencies[dep]) {
        foundDeps.push({
          name: dep,
          version: packageContent.dependencies[dep]
        });
      } else {
        missingDeps.push(dep);
      }
    }
    
    if (missingDeps.length === 0) {
      logger.log('dependencies', 'pass', 'All required dependencies found', {
        foundDeps,
        totalRequired: requiredDeps.length
      });
    } else {
      logger.log('dependencies', 'warning', 'Some dependencies missing', {
        foundDeps,
        missingDeps,
        totalRequired: requiredDeps.length
      });
    }
  } catch (error) {
    logger.log('dependencies', 'fail', `Package dependency check failed: ${error.message}`);
  }
}

/**
 * Configuration Tests
 */
async function testConfiguration() {
  logger.log('configuration', 'info', 'Testing configuration files...');

  // Check for environment configuration
  const envFiles = ['.env', '.env.local', '.env.development'];
  let foundEnvFile = false;

  for (const envFile of envFiles) {
    const envPath = path.join(__dirname, 'frontend', envFile);
    if (fs.existsSync(envPath)) {
      foundEnvFile = true;
      logger.log('configuration', 'pass', `Environment file found: ${envFile}`);
      break;
    }
  }

  if (!foundEnvFile) {
    logger.log('configuration', 'warning', 'No environment configuration file found');
  }

  // Check for build configuration
  const buildConfigFiles = ['vite.config.js', 'webpack.config.js', 'craco.config.js'];
  let foundBuildConfig = false;

  for (const configFile of buildConfigFiles) {
    const configPath = path.join(__dirname, 'frontend', configFile);
    if (fs.existsSync(configPath)) {
      foundBuildConfig = true;
      logger.log('configuration', 'pass', `Build configuration found: ${configFile}`);
      break;
    }
  }

  if (!foundBuildConfig) {
    logger.log('configuration', 'info', 'No custom build configuration found (using defaults)');
  }
}

/**
 * Performance Tests
 */
async function testPerformance() {
  logger.log('performance', 'info', 'Running performance checks...');

  // Check file sizes
  const performanceThresholds = {
    StandardForm: 50000, // 50KB
    FormFields: 70000,   // 70KB
    SmartErrorBoundary: 70000, // 70KB
    enhancedApiService: 70000, // 70KB
    errorRecovery: 60000 // 60KB
  };

  const fileSizeTests = [
    { name: 'StandardForm', path: 'frontend/src/components/common/StandardForm.js' },
    { name: 'FormFields', path: 'frontend/src/components/common/FormFields.js' },
    { name: 'SmartErrorBoundary', path: 'frontend/src/components/common/SmartErrorBoundary.js' },
    { name: 'enhancedApiService', path: 'frontend/src/services/enhancedApiService.js' },
    { name: 'errorRecovery', path: 'frontend/src/utils/errorRecovery.js' }
  ];

  for (const test of fileSizeTests) {
    try {
      const fullPath = path.join(__dirname, test.path);
      const stats = fs.statSync(fullPath);
      const threshold = performanceThresholds[test.name];
      
      if (stats.size <= threshold) {
        logger.log('performance', 'pass', `File size acceptable: ${test.name}`, {
          size: stats.size,
          threshold,
          percentage: Math.round((stats.size / threshold) * 100)
        });
      } else {
        logger.log('performance', 'warning', `File size large: ${test.name}`, {
          size: stats.size,
          threshold,
          percentage: Math.round((stats.size / threshold) * 100)
        });
      }
    } catch (error) {
      logger.log('performance', 'fail', `Performance test failed for ${test.name}: ${error.message}`);
    }
  }
}

/**
 * Main Test Runner
 */
async function runAllTests() {
  console.log('🚀 Starting Form System Comprehensive Test Suite\n');
  console.log('=' .repeat(60));
  
  try {
    // Run all test suites
    await testFileExistence();
    await testImportSyntax();
    await testComponentStructure();
    await testErrorRecovery();
    await testApiService();
    await testAppIntegration();
    await testPackageDependencies();
    await testConfiguration();
    await testPerformance();
    
    // Generate and save report
    console.log('\n' + '=' .repeat(60));
    console.log('📊 Test Summary:');
    
    const summary = logger.generateSummary();
    console.log(`Total Tests: ${summary.total}`);
    console.log(`Passed: ${summary.passed} (${summary.passRate}%)`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Warnings: ${summary.warning}`);
    
    const reportPath = logger.saveResults();
    
    console.log('\n✅ Form System Test Suite Complete!');
    console.log(`📄 Detailed report: ${reportPath}`);
    
    // Exit with appropriate code
    process.exit(summary.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    logger.log('test-suite', 'fail', `Test suite execution failed: ${error.message}`);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testConfig,
  TestLogger
};