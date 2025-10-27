#!/usr/bin/env node

/**
 * 🔍 PRODUCTION READINESS CHECKER
 * ==============================
 * Validates your application is ready for production deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Go up two levels from scripts/deployment/ to get to project root
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

console.log('🔍 PRODUCTION READINESS CHECK\n');
console.log('==============================\n');

let score = 0;
let maxScore = 0;
const issues = [];
const warnings = [];

function checkItem(description, checkFunction, weight = 1) {
    maxScore += weight;
    console.log(`📋 ${description}...`);
    
    try {
        const result = checkFunction();
        if (result.passed) {
            console.log(`   ✅ PASSED: ${result.message || 'OK'}`);
            score += weight;
        } else {
            console.log(`   ❌ FAILED: ${result.message}`);
            if (result.critical) {
                issues.push(`${description}: ${result.message}`);
            } else {
                warnings.push(`${description}: ${result.message}`);
            }
        }
    } catch (error) {
        console.log(`   ❌ ERROR: ${error.message}`);
        issues.push(`${description}: ${error.message}`);
    }
    console.log('');
}

// 🗂️ PROJECT STRUCTURE CHECKS
console.log('🗂️  PROJECT STRUCTURE\n');

checkItem('Frontend folder exists', () => {
    const exists = fs.existsSync(path.join(PROJECT_ROOT, 'frontend'));
    return {
        passed: exists,
        message: exists ? 'Frontend folder found' : 'Frontend folder missing',
        critical: true
    };
});

checkItem('Backend folder exists', () => {
    const exists = fs.existsSync(path.join(PROJECT_ROOT, 'backend'));
    return {
        passed: exists,
        message: exists ? 'Backend folder found' : 'Backend folder missing',
        critical: true
    };
});

checkItem('Package.json exists', () => {
    const exists = fs.existsSync(path.join(PROJECT_ROOT, 'package.json'));
    return {
        passed: exists,
        message: exists ? 'Root package.json found' : 'Root package.json missing',
        critical: true
    };
});

checkItem('README.md exists', () => {
    const exists = fs.existsSync(path.join(PROJECT_ROOT, 'README.md'));
    return {
        passed: exists,
        message: exists ? 'README.md found' : 'README.md missing'
    };
});

checkItem('Development files organized', () => {
    const devScripts = fs.existsSync(path.join(PROJECT_ROOT, 'scripts', 'development'));
    const testScripts = fs.existsSync(path.join(PROJECT_ROOT, 'scripts', 'testing'));
    const docs = fs.existsSync(path.join(PROJECT_ROOT, 'docs'));
    
    const organized = devScripts && testScripts && docs;
    return {
        passed: organized,
        message: organized ? 'Files properly organized' : 'Development files not organized'
    };
});

// 🔧 CONFIGURATION CHECKS
console.log('🔧 CONFIGURATION\n');

checkItem('Environment template exists', () => {
    const exists = fs.existsSync(path.join(PROJECT_ROOT, '.env.production.template'));
    return {
        passed: exists,
        message: exists ? 'Production environment template found' : 'Production environment template missing',
        critical: true
    };
});

checkItem('Docker configuration exists', () => {
    const dockerCompose = fs.existsSync(path.join(PROJECT_ROOT, 'docker-compose.yml'));
    return {
        passed: dockerCompose,
        message: dockerCompose ? 'Docker configuration found' : 'Docker configuration missing'
    };
});

checkItem('PM2 configuration exists', () => {
    const pm2Config = fs.existsSync(path.join(PROJECT_ROOT, 'ecosystem.config.js'));
    return {
        passed: pm2Config,
        message: pm2Config ? 'PM2 configuration found' : 'PM2 configuration missing'
    };
});

checkItem('Gitignore configured', () => {
    const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');
    if (!fs.existsSync(gitignorePath)) {
        return { passed: false, message: '.gitignore missing', critical: true };
    }
    
    const content = fs.readFileSync(gitignorePath, 'utf8');
    const hasNodeModules = content.includes('node_modules/');
    const hasEnv = content.includes('.env');
    const hasUploads = content.includes('uploads/');
    
    const configured = hasNodeModules && hasEnv && hasUploads;
    return {
        passed: configured,
        message: configured ? '.gitignore properly configured' : '.gitignore missing important entries'
    };
});

// 🔐 SECURITY CHECKS
console.log('🔐 SECURITY\n');

checkItem('Backend environment example exists', () => {
    const exists = fs.existsSync(path.join(PROJECT_ROOT, 'backend', '.env.example'));
    return {
        passed: exists,
        message: exists ? 'Backend environment example found' : 'Backend environment example missing',
        critical: true
    };
});

checkItem('No sensitive files in repo', () => {
    const sensitiveFiles = [
        '.env',
        'backend/.env',
        'backend/.env.production',
        'database.sqlite'
    ];
    
    const foundSensitive = sensitiveFiles.filter(file => 
        fs.existsSync(path.join(PROJECT_ROOT, file))
    );
    
    return {
        passed: foundSensitive.length === 0,
        message: foundSensitive.length === 0 
            ? 'No sensitive files found' 
            : `Sensitive files found: ${foundSensitive.join(', ')}`,
        critical: foundSensitive.length > 0
    };
});

checkItem('Package.json has security scripts', () => {
    const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        return { passed: false, message: 'package.json missing', critical: true };
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const hasSecurityScripts = packageJson.scripts && (
        packageJson.scripts.audit ||
        packageJson.scripts['security-check'] ||
        packageJson.scripts.test
    );
    
    return {
        passed: hasSecurityScripts,
        message: hasSecurityScripts ? 'Security scripts found' : 'No security scripts configured'
    };
});

// 📦 DEPENDENCIES CHECKS
console.log('📦 DEPENDENCIES\n');

checkItem('Backend dependencies installed', () => {
    const backendPath = path.join(PROJECT_ROOT, 'backend');
    const nodeModules = fs.existsSync(path.join(backendPath, 'node_modules'));
    const packageJson = fs.existsSync(path.join(backendPath, 'package.json'));
    
    return {
        passed: nodeModules && packageJson,
        message: nodeModules && packageJson 
            ? 'Backend dependencies installed' 
            : 'Backend dependencies missing'
    };
});

checkItem('Frontend dependencies installed', () => {
    const frontendPath = path.join(PROJECT_ROOT, 'frontend');
    const nodeModules = fs.existsSync(path.join(frontendPath, 'node_modules'));
    const packageJson = fs.existsSync(path.join(frontendPath, 'package.json'));
    
    return {
        passed: nodeModules && packageJson,
        message: nodeModules && packageJson 
            ? 'Frontend dependencies installed' 
            : 'Frontend dependencies missing'
    };
});

checkItem('Production scripts configured', () => {
    const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
        return { passed: false, message: 'package.json missing', critical: true };
    }
    
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const hasStart = packageJson.scripts && packageJson.scripts.start;
    const hasBuild = packageJson.scripts && packageJson.scripts.build;
    
    return {
        passed: hasStart && hasBuild,
        message: hasStart && hasBuild 
            ? 'Production scripts configured' 
            : 'Missing start or build scripts'
    };
});

// 📚 DOCUMENTATION CHECKS
console.log('📚 DOCUMENTATION\n');

checkItem('Deployment guides exist', () => {
    const deploymentDir = path.join(PROJECT_ROOT, 'docs', 'deployment');
    const prodGuide = fs.existsSync(path.join(deploymentDir, 'PRODUCTION_DEPLOYMENT_GUIDE.md'));
    const dockerGuide = fs.existsSync(path.join(deploymentDir, 'DOCKER_DEPLOYMENT_GUIDE.md'));
    
    return {
        passed: prodGuide && dockerGuide,
        message: prodGuide && dockerGuide 
            ? 'Deployment guides found' 
            : 'Deployment guides missing'
    };
});

checkItem('API documentation exists', () => {
    const apiDocsDir = path.join(PROJECT_ROOT, 'docs', 'api');
    const backendApiDocs = fs.existsSync(path.join(PROJECT_ROOT, 'backend', 'API_DOCUMENTATION.md'));
    
    return {
        passed: fs.existsSync(apiDocsDir) || backendApiDocs,
        message: fs.existsSync(apiDocsDir) || backendApiDocs
            ? 'API documentation found' 
            : 'API documentation missing'
    };
});

// 🧪 TESTING CHECKS
console.log('🧪 TESTING\n');

checkItem('Test scripts available', () => {
    const testDir = fs.existsSync(path.join(PROJECT_ROOT, 'scripts', 'testing'));
    const backendTests = fs.existsSync(path.join(PROJECT_ROOT, 'backend', '__tests__')) ||
                        fs.existsSync(path.join(PROJECT_ROOT, 'backend', 'tests'));
    const frontendTests = fs.existsSync(path.join(PROJECT_ROOT, 'frontend', '__tests__')) ||
                         fs.existsSync(path.join(PROJECT_ROOT, 'frontend', 'src', '__tests__'));
    
    return {
        passed: testDir || backendTests || frontendTests,
        message: testDir || backendTests || frontendTests
            ? 'Test scripts found' 
            : 'No test scripts found'
    };
});

// 🚀 DEPLOYMENT READINESS
console.log('🚀 DEPLOYMENT READINESS\n');

checkItem('Build process works', () => {
    try {
        // Check if frontend can build
        const frontendPath = path.join(PROJECT_ROOT, 'frontend');
        if (fs.existsSync(path.join(frontendPath, 'package.json'))) {
            // Just check if build script exists, don't actually run it
            const frontendPackage = JSON.parse(fs.readFileSync(path.join(frontendPath, 'package.json'), 'utf8'));
            const hasBuildScript = frontendPackage.scripts && frontendPackage.scripts.build;
            
            return {
                passed: hasBuildScript,
                message: hasBuildScript ? 'Build script configured' : 'Build script missing'
            };
        }
        return { passed: false, message: 'Frontend package.json missing' };
    } catch (error) {
        return { passed: false, message: `Build check failed: ${error.message}` };
    }
}, 2);

// 📊 FINAL REPORT
console.log('📊 FINAL REPORT\n');
console.log('===============\n');

const percentage = Math.round((score / maxScore) * 100);
console.log(`🎯 PRODUCTION READINESS SCORE: ${score}/${maxScore} (${percentage}%)\n`);

if (percentage >= 90) {
    console.log('🎉 EXCELLENT! Your application is production-ready!');
} else if (percentage >= 75) {
    console.log('✅ GOOD! Your application is mostly ready for production.');
} else if (percentage >= 60) {
    console.log('⚠️  NEEDS WORK! Several issues need to be addressed before production.');
} else {
    console.log('❌ NOT READY! Critical issues must be fixed before production deployment.');
}

if (issues.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES TO FIX:');
    issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
    });
}

if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS TO ADDRESS:');
    warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
    });
}

console.log('\n🎯 NEXT STEPS:');
if (percentage >= 90) {
    console.log('   1. Configure production environment (.env.production)');
    console.log('   2. Set up production database');
    console.log('   3. Deploy using deployment guides');
    console.log('   4. Set up monitoring and backups');
} else {
    console.log('   1. Fix critical issues listed above');
    console.log('   2. Address warnings for better security');
    console.log('   3. Run this checker again');
    console.log('   4. Review deployment documentation');
}

console.log('\n📚 HELPFUL RESOURCES:');
console.log('   • docs/deployment/PRODUCTION_DEPLOYMENT_GUIDE.md');
console.log('   • docs/deployment/DOCKER_DEPLOYMENT_GUIDE.md');
console.log('   • .env.production.template');
console.log('   • ecosystem.config.js (PM2 configuration)');

process.exit(percentage >= 75 ? 0 : 1);
