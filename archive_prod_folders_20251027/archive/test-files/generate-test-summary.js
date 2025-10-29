const fs = require('fs');
const path = require('path');

class TestResultAnalyzer {
    constructor() {
        this.reportDir = './test-results';
        this.screenshotDir = './test-screenshots';
    }

    async generateSummary() {
        console.log('📊 EXCEL BUSINESS USE CASES - COMPREHENSIVE TEST RESULTS ANALYSIS');
        console.log('================================================================\n');

        try {
            // Find the latest test report
            const reports = fs.readdirSync(this.reportDir)
                .filter(file => file.endsWith('.json'))
                .map(file => {
                    const filePath = path.join(this.reportDir, file);
                    const stats = fs.statSync(filePath);
                    return { file, path: filePath, time: stats.mtime };
                })
                .sort((a, b) => b.time - a.time);

            if (reports.length === 0) {
                console.log('❌ No test reports found');
                return;
            }

            const latestReport = reports[0];
            console.log(`📄 Latest Report: ${latestReport.file}`);
            console.log(`🕒 Generated: ${latestReport.time.toISOString()}\n`);

            const reportData = JSON.parse(fs.readFileSync(latestReport.path, 'utf8'));
            
            // Display summary
            console.log('🎯 TEST EXECUTION SUMMARY:');
            console.log('-'.repeat(40));
            console.log(`📊 Total Tests: ${reportData.summary.totalTests}`);
            console.log(`✅ Passed: ${reportData.summary.passed}`);
            console.log(`❌ Failed: ${reportData.summary.failed}`);
            console.log(`⏭️  Skipped: ${reportData.summary.skipped}`);
            console.log(`📈 Success Rate: ${reportData.summary.successRate}`);
            console.log(`⏱️  Duration: ${reportData.summary.duration}\n`);

            // Analyze by section
            this.analyzeBySection(reportData.results);

            // Show successful tests
            this.showSuccessfulTests(reportData.results);

            // Show failed tests
            this.showFailedTests(reportData.results);

            // Screenshot analysis
            this.analyzeScreenshots();

            // Recommendations
            this.generateRecommendations(reportData);

        } catch (error) {
            console.error('💥 Error analyzing test results:', error.message);
        }
    }

    analyzeBySection(results) {
        console.log('📋 RESULTS BY SECTION:');
        console.log('-'.repeat(40));
        
        const sections = {};
        results.forEach(result => {
            const section = result.section || 'Unknown';
            if (!sections[section]) {
                sections[section] = { total: 0, passed: 0, failed: 0, skipped: 0 };
            }
            sections[section].total++;
            sections[section][result.status.toLowerCase()]++;
        });

        Object.keys(sections).forEach(section => {
            const stats = sections[section];
            const successRate = ((stats.passed / stats.total) * 100).toFixed(1);
            console.log(`\n📁 ${section}:`);
            console.log(`   Total: ${stats.total} | ✅ ${stats.passed} | ❌ ${stats.failed} | ⏭️ ${stats.skipped} | 📈 ${successRate}%`);
        });
        console.log('');
    }

    showSuccessfulTests(results) {
        const passedTests = results.filter(r => r.status === 'PASSED');
        
        console.log('🎉 SUCCESSFUL TESTS:');
        console.log('-'.repeat(40));
        
        if (passedTests.length === 0) {
            console.log('❌ No tests passed\n');
            return;
        }

        passedTests.forEach(test => {
            console.log(`✅ [${test.testId}] ${test.scenario}`);
            console.log(`   Result: ${test.actualResult}`);
            console.log(`   Duration: ${test.duration}ms\n`);
        });
    }

    showFailedTests(results) {
        const failedTests = results.filter(r => r.status === 'FAILED');
        
        console.log('⚠️  FAILED TESTS ANALYSIS:');
        console.log('-'.repeat(40));
        
        if (failedTests.length === 0) {
            console.log('🎉 No tests failed\n');
            return;
        }

        // Group failures by common error patterns
        const errorPatterns = {};
        failedTests.forEach(test => {
            const error = test.error || 'Unknown error';
            const pattern = this.categorizeError(error);
            if (!errorPatterns[pattern]) {
                errorPatterns[pattern] = [];
            }
            errorPatterns[pattern].push(test);
        });

        Object.keys(errorPatterns).forEach(pattern => {
            const tests = errorPatterns[pattern];
            console.log(`\n🔍 ${pattern} (${tests.length} tests):`);
            tests.slice(0, 3).forEach(test => { // Show first 3 examples
                console.log(`   ❌ [${test.testId}] ${test.scenario}`);
                console.log(`      Error: ${test.error || 'No specific error'}`);
                console.log(`      Result: ${test.actualResult}`);
            });
            if (tests.length > 3) {
                console.log(`   ... and ${tests.length - 3} more similar failures`);
            }
        });
        console.log('');
    }

    categorizeError(error) {
        if (error.includes('Login form not found') || error.includes('Email input field not found')) {
            return 'Login Form Issues';
        }
        if (error.includes('Waiting failed') || error.includes('timeout')) {
            return 'Timeout/Loading Issues';
        }
        if (error.includes('not fully implemented') || error.includes('SKIPPED')) {
            return 'Not Implemented';
        }
        if (error.includes('navigation') || error.includes('module')) {
            return 'Navigation Issues';
        }
        if (error.includes('credentials') || error.includes('password')) {
            return 'Authentication Issues';
        }
        return 'Other Issues';
    }

    analyzeScreenshots() {
        if (!fs.existsSync(this.screenshotDir)) {
            console.log('📸 No screenshots directory found\n');
            return;
        }

        const screenshots = fs.readdirSync(this.screenshotDir).filter(f => f.endsWith('.png'));
        console.log('📸 SCREENSHOT ANALYSIS:');
        console.log('-'.repeat(40));
        console.log(`📊 Total Screenshots: ${screenshots.length}`);
        
        // Analyze screenshot patterns
        const patterns = {
            login: screenshots.filter(s => s.includes('LOGIN')).length,
            loginFailed: screenshots.filter(s => s.includes('LOGIN_FAILED')).length,
            testResults: screenshots.filter(s => s.includes('test_result')).length,
            passwordChange: screenshots.filter(s => s.includes('PASSWORD_CHANGE')).length
        };

        console.log(`🔐 Login Screenshots: ${patterns.login}`);
        console.log(`❌ Failed Login Screenshots: ${patterns.loginFailed}`);
        console.log(`📋 Test Result Screenshots: ${patterns.testResults}`);
        console.log(`🔑 Password Change Screenshots: ${patterns.passwordChange}`);
        console.log('');
    }

    generateRecommendations(reportData) {
        console.log('💡 RECOMMENDATIONS FOR IMPROVEMENT:');
        console.log('-'.repeat(40));

        const successRate = parseFloat(reportData.summary.successRate);
        
        if (successRate < 20) {
            console.log('🚨 CRITICAL: Very low success rate - fundamental issues need addressing');
            console.log('   • Check if frontend and backend servers are running');
            console.log('   • Verify login credentials are correct');
            console.log('   • Review UI selectors in test automation');
        } else if (successRate < 50) {
            console.log('⚠️  LOW: Significant issues need attention');
            console.log('   • Focus on fixing authentication and navigation issues');
            console.log('   • Implement missing functionality for skipped tests');
        } else if (successRate < 80) {
            console.log('📈 MODERATE: Good progress, some refinements needed');
            console.log('   • Address remaining failed test cases');
            console.log('   • Optimize test execution timing');
        } else {
            console.log('🎉 EXCELLENT: High success rate achieved');
            console.log('   • Focus on edge cases and error scenarios');
            console.log('   • Consider adding more comprehensive test coverage');
        }

        console.log('\n🎯 NEXT STEPS:');
        console.log('   1. Review failed test screenshots for UI issues');
        console.log('   2. Implement missing admin and employee functionalities');
        console.log('   3. Improve error handling in test automation');
        console.log('   4. Add more robust wait conditions for dynamic content');
        console.log('   5. Create test data cleanup and setup procedures\n');

        // Business functionality status
        console.log('🏢 BUSINESS FUNCTIONALITY STATUS:');
        console.log('-'.repeat(40));
        
        const functionalityStatus = {
            'Admin Login': this.checkFunctionality(reportData.results, 'Admin Login'),
            'Employee Login': this.checkFunctionality(reportData.results, 'Employee Login'),
            'Employee Creation': this.checkFunctionality(reportData.results, 'Create New Employee'),
            'Timesheet Module': this.checkFunctionality(reportData.results, 'Timesheet'),
            'Leave Management': this.checkFunctionality(reportData.results, 'Leave'),
            'Payslip Module': this.checkFunctionality(reportData.results, 'Payslip')
        };

        Object.keys(functionalityStatus).forEach(func => {
            const status = functionalityStatus[func];
            const icon = status === 'PASSED' ? '✅' : status === 'FAILED' ? '❌' : '⏭️';
            console.log(`${icon} ${func}: ${status}`);
        });

        console.log('\n📈 OVERALL ASSESSMENT:');
        console.log(`Your HRM system shows ${successRate}% functionality coverage.`);
        console.log('The comprehensive test automation has successfully identified:');
        console.log('• Working authentication systems');
        console.log('• Existing business modules');
        console.log('• Areas requiring development attention');
        console.log('• UI/UX improvement opportunities\n');
    }

    checkFunctionality(results, keyword) {
        const relevantTests = results.filter(r => 
            r.scenario.includes(keyword) || r.section.includes(keyword.split(' ')[0])
        );
        
        if (relevantTests.length === 0) return 'NOT TESTED';
        
        const hasPass = relevantTests.some(t => t.status === 'PASSED');
        const hasFail = relevantTests.some(t => t.status === 'FAILED');
        
        if (hasPass && !hasFail) return 'PASSED';
        if (hasPass && hasFail) return 'PARTIAL';
        if (hasFail) return 'FAILED';
        return 'SKIPPED';
    }
}

// Run the analysis
if (require.main === module) {
    const analyzer = new TestResultAnalyzer();
    analyzer.generateSummary().catch(console.error);
}

module.exports = TestResultAnalyzer;
