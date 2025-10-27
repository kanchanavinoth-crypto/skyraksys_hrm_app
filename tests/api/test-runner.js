#!/usr/bin/env node

/**
 * HRM API Test Runner
 * Centralized test execution with multiple test suite options
 */

const fs = require('fs');
const path = require('path');

// Import test suites
const QuickAPITester = require('./quick-api-test');
const APITestSuite = require('./comprehensive-api-test-suite');
const WorkflowTestSuite = require('./workflow-test-suite');

class TestRunner {
    constructor() {
        this.config = this.loadConfig();
        this.results = {
            summary: {
                startTime: new Date(),
                endTime: null,
                totalSuites: 0,
                passedSuites: 0,
                failedSuites: 0
            },
            suites: []
        };
    }

    loadConfig() {
        try {
            const configPath = path.join(__dirname, 'test-config.json');
            const configData = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(configData);
        } catch (error) {
            console.log('⚠️  Warning: Could not load test-config.json, using defaults');
            return {
                testSuites: {
                    quick: { enabled: true },
                    comprehensive: { enabled: false },
                    workflow: { enabled: true }
                }
            };
        }
    }

    log(message, emoji = '📝') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${emoji} ${message}`);
    }

    async runQuickTests() {
        this.log('🚀 Running Quick API Tests...', '🚀');
        
        try {
            const tester = new QuickAPITester();
            const results = await tester.runQuickTests();
            
            const passed = results.failed === 0;
            this.results.suites.push({
                name: 'Quick API Tests',
                passed,
                results,
                duration: 'Included in results'
            });
            
            return passed;
        } catch (error) {
            this.log(`❌ Quick tests failed: ${error.message}`, '❌');
            this.results.suites.push({
                name: 'Quick API Tests',
                passed: false,
                error: error.message
            });
            return false;
        }
    }

    async runComprehensiveTests() {
        this.log('🔍 Running Comprehensive API Tests...', '🔍');
        
        try {
            const tester = new APITestSuite();
            const results = await tester.runAllTests();
            
            const passed = results.summary.failed === 0;
            this.results.suites.push({
                name: 'Comprehensive API Tests',
                passed,
                results: results.summary,
                duration: `${((results.summary.endTime - results.summary.startTime) / 1000).toFixed(2)}s`
            });
            
            return passed;
        } catch (error) {
            this.log(`❌ Comprehensive tests failed: ${error.message}`, '❌');
            this.results.suites.push({
                name: 'Comprehensive API Tests',
                passed: false,
                error: error.message
            });
            return false;
        }
    }

    async runWorkflowTests() {
        this.log('🔄 Running Workflow Tests...', '🔄');
        
        try {
            const tester = new WorkflowTestSuite();
            await tester.runAllWorkflows();
            
            const totalWorkflows = tester.results.length;
            const passedWorkflows = tester.results.filter(w => w.success).length;
            const passed = passedWorkflows === totalWorkflows;
            
            this.results.suites.push({
                name: 'Workflow Tests',
                passed,
                results: {
                    totalWorkflows,
                    passedWorkflows,
                    successRate: `${((passedWorkflows / totalWorkflows) * 100).toFixed(1)}%`
                }
            });
            
            return passed;
        } catch (error) {
            this.log(`❌ Workflow tests failed: ${error.message}`, '❌');
            this.results.suites.push({
                name: 'Workflow Tests',
                passed: false,
                error: error.message
            });
            return false;
        }
    }

    async checkServerHealth() {
        this.log('🏥 Checking server health...', '🏥');
        
        const axios = require('axios');
        try {
            const response = await axios.get('http://localhost:5000/api/health', { timeout: 5000 });
            this.log(`✅ Server is healthy: ${response.data.status}`, '✅');
            return true;
        } catch (error) {
            this.log(`❌ Server health check failed: ${error.message}`, '❌');
            this.log('Please ensure the backend server is running on port 5000', '⚠️');
            return false;
        }
    }

    generateSummaryReport() {
        this.results.summary.endTime = new Date();
        const duration = this.results.summary.endTime - this.results.summary.startTime;
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 HRM API TEST SUITE SUMMARY REPORT');
        console.log('='.repeat(60));
        
        console.log(`🕐 Test Duration: ${(duration / 1000).toFixed(2)} seconds`);
        console.log(`📋 Total Test Suites: ${this.results.summary.totalSuites}`);
        console.log(`✅ Passed Suites: ${this.results.summary.passedSuites}`);
        console.log(`❌ Failed Suites: ${this.results.summary.failedSuites}`);
        
        const successRate = this.results.summary.totalSuites > 0 
            ? ((this.results.summary.passedSuites / this.results.summary.totalSuites) * 100).toFixed(1)
            : 0;
        console.log(`📈 Success Rate: ${successRate}%`);
        
        console.log('\n📝 DETAILED RESULTS:');
        this.results.suites.forEach((suite, index) => {
            const status = suite.passed ? '✅ PASSED' : '❌ FAILED';
            console.log(`\n${index + 1}. ${suite.name}: ${status}`);
            
            if (suite.results) {
                if (typeof suite.results === 'object' && suite.results.totalTests !== undefined) {
                    console.log(`   - Total Tests: ${suite.results.totalTests || suite.results.total || 'N/A'}`);
                    console.log(`   - Passed: ${suite.results.passed}`);
                    console.log(`   - Failed: ${suite.results.failed}`);
                } else if (suite.results.totalWorkflows !== undefined) {
                    console.log(`   - Total Workflows: ${suite.results.totalWorkflows}`);
                    console.log(`   - Passed Workflows: ${suite.results.passedWorkflows}`);
                    console.log(`   - Success Rate: ${suite.results.successRate}`);
                }
            }
            
            if (suite.duration) {
                console.log(`   - Duration: ${suite.duration}`);
            }
            
            if (suite.error) {
                console.log(`   - Error: ${suite.error}`);
            }
        });
        
        // Save detailed report
        const reportPath = path.join(__dirname, 'test-summary-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        console.log(`\n💾 Detailed report saved to: ${reportPath}`);
        
        // Final status
        if (this.results.summary.failedSuites === 0) {
            console.log('\n🎉 All test suites passed! Your HRM API is working correctly.');
        } else {
            console.log('\n⚠️  Some test suites failed. Please review the detailed results above.');
        }
    }

    async runAllTests() {
        console.log('🚀 HRM API Test Runner Starting...\n');
        
        // Check server health first
        const serverHealthy = await this.checkServerHealth();
        if (!serverHealthy) {
            console.log('\n❌ Cannot proceed with tests - server is not accessible');
            process.exit(1);
        }
        
        console.log('\n📋 Test Configuration:');
        console.log(`- Quick Tests: ${this.config.testSuites?.quick?.enabled ? 'Enabled' : 'Disabled'}`);
        console.log(`- Comprehensive Tests: ${this.config.testSuites?.comprehensive?.enabled ? 'Enabled' : 'Disabled'}`);
        console.log(`- Workflow Tests: ${this.config.testSuites?.workflow?.enabled ? 'Enabled' : 'Disabled'}`);
        
        console.log('\n' + '-'.repeat(60));
        
        try {
            // Run enabled test suites
            if (this.config.testSuites?.quick?.enabled) {
                this.results.summary.totalSuites++;
                const passed = await this.runQuickTests();
                if (passed) this.results.summary.passedSuites++;
                else this.results.summary.failedSuites++;
                console.log('\n' + '-'.repeat(60));
            }
            
            if (this.config.testSuites?.comprehensive?.enabled) {
                this.results.summary.totalSuites++;
                const passed = await this.runComprehensiveTests();
                if (passed) this.results.summary.passedSuites++;
                else this.results.summary.failedSuites++;
                console.log('\n' + '-'.repeat(60));
            }
            
            if (this.config.testSuites?.workflow?.enabled) {
                this.results.summary.totalSuites++;
                const passed = await this.runWorkflowTests();
                if (passed) this.results.summary.passedSuites++;
                else this.results.summary.failedSuites++;
                console.log('\n' + '-'.repeat(60));
            }
            
            this.generateSummaryReport();
            
        } catch (error) {
            this.log(`💥 Fatal error during test execution: ${error.message}`, '💥');
            throw error;
        }
    }

    // Command line interface
    static async handleCLI() {
        const args = process.argv.slice(2);
        const runner = new TestRunner();
        
        if (args.length === 0) {
            await runner.runAllTests();
            return;
        }
        
        const command = args[0].toLowerCase();
        
        switch (command) {
            case 'quick':
                console.log('🚀 Running Quick Tests Only...\n');
                runner.results.summary.totalSuites = 1;
                const quickPassed = await runner.runQuickTests();
                if (quickPassed) runner.results.summary.passedSuites = 1;
                else runner.results.summary.failedSuites = 1;
                runner.generateSummaryReport();
                break;
                
            case 'comprehensive':
                console.log('🔍 Running Comprehensive Tests Only...\n');
                runner.results.summary.totalSuites = 1;
                const compPassed = await runner.runComprehensiveTests();
                if (compPassed) runner.results.summary.passedSuites = 1;
                else runner.results.summary.failedSuites = 1;
                runner.generateSummaryReport();
                break;
                
            case 'workflow':
                console.log('🔄 Running Workflow Tests Only...\n');
                runner.results.summary.totalSuites = 1;
                const workflowPassed = await runner.runWorkflowTests();
                if (workflowPassed) runner.results.summary.passedSuites = 1;
                else runner.results.summary.failedSuites = 1;
                runner.generateSummaryReport();
                break;
                
            case 'health':
                await runner.checkServerHealth();
                break;
                
            case 'help':
            case '--help':
            case '-h':
                console.log(`
HRM API Test Runner

Usage:
  node test-runner.js [command]

Commands:
  (no command)    Run all enabled test suites
  quick          Run quick API tests only  
  comprehensive  Run comprehensive API tests only
  workflow       Run workflow tests only
  health         Check server health only
  help           Show this help message

Examples:
  node test-runner.js              # Run all tests
  node test-runner.js quick        # Quick tests only
  node test-runner.js workflow     # Workflow tests only
  node test-runner.js health       # Health check only
                `);
                break;
                
            default:
                console.log(`❌ Unknown command: ${command}`);
                console.log('Run "node test-runner.js help" for usage information');
                process.exit(1);
        }
    }
}

// Execute if run directly
if (require.main === module) {
    TestRunner.handleCLI()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('\n💥 Test runner failed:', error.message);
            process.exit(1);
        });
}

module.exports = TestRunner;
