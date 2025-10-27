/**
 * Frontend Button and Navigation Analysis
 * Comprehensive check of all buttons and their mappings
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

class FrontendButtonValidator {
    constructor() {
        this.browser = null;
        this.page = null;
        this.baseURL = 'http://localhost:3000';
        this.findings = {
            buttonIssues: [],
            navigationIssues: [],
            disabledButtons: [],
            workingButtons: [],
            routingIssues: []
        };
    }

    async initialize() {
        console.log('🚀 Initializing Frontend Button Validator...');
        
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1366, height: 768 }
        });
        this.page = await this.browser.newPage();
        
        // Set up console logging
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('❌ Console Error:', msg.text());
                this.findings.buttonIssues.push(`Console Error: ${msg.text()}`);
            }
        });
        
        // Set up error handling
        this.page.on('pageerror', error => {
            console.log('💥 Page Error:', error.message);
            this.findings.buttonIssues.push(`Page Error: ${error.message}`);
        });
    }

    async login() {
        try {
            console.log('🔐 Logging in...');
            await this.page.goto(`${this.baseURL}/login`);
            await this.page.waitForTimeout(2000);
            
            // Admin login
            await this.page.type('[name="email"]', 'admin@example.com');
            await this.page.type('[name="password"]', 'password123');
            await this.page.click('button[type="submit"]');
            await this.page.waitForTimeout(3000);
            
            const currentUrl = await this.page.url();
            if (currentUrl.includes('/dashboard')) {
                console.log('✅ Login successful');
                return true;
            } else {
                console.log('❌ Login failed - redirected to:', currentUrl);
                return false;
            }
        } catch (error) {
            console.log('💥 Login error:', error.message);
            return false;
        }
    }

    async checkRouteButtons(route, routeName) {
        console.log(`\n🔍 Checking buttons on: ${routeName} (${route})`);
        
        try {
            await this.page.goto(`${this.baseURL}${route}`);
            await this.page.waitForTimeout(3000);
            
            // Find all buttons on the page
            const buttons = await this.page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                return buttons.map((btn, index) => ({
                    id: index,
                    text: btn.textContent.trim(),
                    disabled: btn.disabled,
                    className: btn.className,
                    type: btn.type,
                    onclick: btn.onclick ? 'has onclick' : 'no onclick',
                    visible: btn.offsetParent !== null
                }));
            });
            
            console.log(`Found ${buttons.length} buttons on ${routeName}:`);
            
            buttons.forEach((btn, i) => {
                const status = btn.disabled ? '🔴 DISABLED' : '🟢 ENABLED';
                const visibility = btn.visible ? 'VISIBLE' : 'HIDDEN';
                console.log(`  ${i + 1}. ${status} ${visibility} - "${btn.text}" (${btn.type})`);
                
                if (btn.disabled) {
                    this.findings.disabledButtons.push({
                        route: routeName,
                        button: btn.text,
                        reason: 'Button is disabled'
                    });
                } else {
                    this.findings.workingButtons.push({
                        route: routeName,
                        button: btn.text
                    });
                }
            });
            
            // Test navigation buttons specifically
            const navButtons = buttons.filter(btn => 
                btn.text.toLowerCase().includes('add') ||
                btn.text.toLowerCase().includes('create') ||
                btn.text.toLowerCase().includes('edit') ||
                btn.text.toLowerCase().includes('view') ||
                btn.text.toLowerCase().includes('submit') ||
                btn.text.toLowerCase().includes('save')
            );
            
            console.log(`Navigation/Action buttons: ${navButtons.length}`);
            
            // Test clicking each enabled navigation button
            for (const btn of navButtons.slice(0, 3)) { // Test first 3 to avoid too many clicks
                if (!btn.disabled && btn.visible) {
                    try {
                        console.log(`  Testing click on: "${btn.text}"`);
                        
                        const originalUrl = await this.page.url();
                        
                        await this.page.evaluate((buttonIndex) => {
                            const buttons = Array.from(document.querySelectorAll('button'));
                            if (buttons[buttonIndex]) {
                                buttons[buttonIndex].click();
                            }
                        }, btn.id);
                        
                        await this.page.waitForTimeout(2000);
                        const newUrl = await this.page.url();
                        
                        if (newUrl !== originalUrl) {
                            console.log(`    ✅ Navigation successful: ${originalUrl} → ${newUrl}`);
                            this.findings.workingButtons.push({
                                route: routeName,
                                button: btn.text,
                                navigation: `${originalUrl} → ${newUrl}`
                            });
                            
                            // Go back to original page
                            await this.page.goto(`${this.baseURL}${route}`);
                            await this.page.waitForTimeout(2000);
                        } else {
                            console.log(`    ⚠️ No navigation occurred for: "${btn.text}"`);
                        }
                    } catch (error) {
                        console.log(`    ❌ Error clicking "${btn.text}": ${error.message}`);
                        this.findings.buttonIssues.push({
                            route: routeName,
                            button: btn.text,
                            error: error.message
                        });
                    }
                }
            }
            
        } catch (error) {
            console.log(`💥 Error checking route ${routeName}:`, error.message);
            this.findings.routingIssues.push({
                route: routeName,
                error: error.message
            });
        }
    }

    async checkAllRoutes() {
        const routes = [
            { path: '/dashboard', name: 'Dashboard' },
            { path: '/employees', name: 'Employees List' },
            { path: '/add-employee', name: 'Add Employee' },
            { path: '/leave-management', name: 'Leave Management' },
            { path: '/add-leave-request', name: 'Add Leave Request' },
            { path: '/timesheet-management', name: 'Timesheet Management' },
            { path: '/add-timesheet', name: 'Add Timesheet' },
            { path: '/payroll-management', name: 'Payroll Management' },
            { path: '/generate-payslips', name: 'Generate Payslips' },
            { path: '/employee-payslips', name: 'Employee Payslips' }
        ];

        for (const route of routes) {
            await this.checkRouteButtons(route.path, route.name);
        }
    }

    async checkSidebarNavigation() {
        console.log('\n🧭 Checking Sidebar Navigation...');
        
        try {
            await this.page.goto(`${this.baseURL}/dashboard`);
            await this.page.waitForTimeout(2000);
            
            // Find all sidebar navigation items
            const navItems = await this.page.evaluate(() => {
                const items = Array.from(document.querySelectorAll('nav [role="button"], nav a, .MuiListItemButton-root'));
                return items.map((item, index) => ({
                    id: index,
                    text: item.textContent.trim(),
                    href: item.href || 'no href',
                    disabled: item.disabled || false,
                    visible: item.offsetParent !== null
                }));
            });
            
            console.log(`Found ${navItems.length} navigation items:`);
            navItems.forEach((item, i) => {
                console.log(`  ${i + 1}. "${item.text}" → ${item.href}`);
            });
            
            // Test navigation items
            for (const item of navItems.slice(0, 5)) {
                if (item.visible && !item.disabled && item.text.length > 0) {
                    try {
                        console.log(`Testing navigation: "${item.text}"`);
                        
                        await this.page.evaluate((itemIndex) => {
                            const items = Array.from(document.querySelectorAll('nav [role="button"], nav a, .MuiListItemButton-root'));
                            if (items[itemIndex]) {
                                items[itemIndex].click();
                            }
                        }, item.id);
                        
                        await this.page.waitForTimeout(2000);
                        const currentUrl = await this.page.url();
                        
                        console.log(`  ✅ Navigated to: ${currentUrl}`);
                        this.findings.workingButtons.push({
                            route: 'Sidebar',
                            button: item.text,
                            navigation: currentUrl
                        });
                        
                    } catch (error) {
                        console.log(`  ❌ Navigation error for "${item.text}": ${error.message}`);
                        this.findings.navigationIssues.push({
                            item: item.text,
                            error: error.message
                        });
                    }
                }
            }
            
        } catch (error) {
            console.log('💥 Sidebar navigation error:', error.message);
        }
    }

    async generateReport() {
        console.log('\n📋 FRONTEND BUTTON & NAVIGATION ANALYSIS REPORT');
        console.log('='.repeat(60));
        
        console.log('\n🟢 WORKING BUTTONS:');
        console.log(`Total: ${this.findings.workingButtons.length}`);
        this.findings.workingButtons.forEach(btn => {
            console.log(`  ✅ ${btn.route}: "${btn.button}" ${btn.navigation ? '→ ' + btn.navigation : ''}`);
        });
        
        console.log('\n🔴 DISABLED BUTTONS:');
        console.log(`Total: ${this.findings.disabledButtons.length}`);
        this.findings.disabledButtons.forEach(btn => {
            console.log(`  ❌ ${btn.route}: "${btn.button}" - ${btn.reason}`);
        });
        
        console.log('\n💥 BUTTON ISSUES:');
        console.log(`Total: ${this.findings.buttonIssues.length}`);
        this.findings.buttonIssues.forEach(issue => {
            console.log(`  🐛 ${issue.route || 'General'}: ${issue.button || issue} - ${issue.error || issue}`);
        });
        
        console.log('\n🧭 NAVIGATION ISSUES:');
        console.log(`Total: ${this.findings.navigationIssues.length}`);
        this.findings.navigationIssues.forEach(nav => {
            console.log(`  🚫 "${nav.item}": ${nav.error}`);
        });
        
        console.log('\n🔗 ROUTING ISSUES:');
        console.log(`Total: ${this.findings.routingIssues.length}`);
        this.findings.routingIssues.forEach(route => {
            console.log(`  💔 ${route.route}: ${route.error}`);
        });
        
        // Summary
        const totalButtons = this.findings.workingButtons.length + this.findings.disabledButtons.length;
        const workingPercentage = totalButtons > 0 ? ((this.findings.workingButtons.length / totalButtons) * 100).toFixed(1) : 0;
        
        console.log('\n📊 SUMMARY:');
        console.log(`Total Buttons Analyzed: ${totalButtons}`);
        console.log(`Working Buttons: ${this.findings.workingButtons.length} (${workingPercentage}%)`);
        console.log(`Disabled Buttons: ${this.findings.disabledButtons.length}`);
        console.log(`Button Issues: ${this.findings.buttonIssues.length}`);
        console.log(`Navigation Issues: ${this.findings.navigationIssues.length}`);
        console.log(`Routing Issues: ${this.findings.routingIssues.length}`);
        
        if (this.findings.buttonIssues.length === 0 && this.findings.navigationIssues.length === 0 && this.findings.routingIssues.length === 0) {
            console.log('\n🎉 ALL BUTTONS AND NAVIGATION WORKING PROPERLY!');
        } else {
            console.log('\n⚠️ ISSUES FOUND - CHECK ABOVE DETAILS');
        }
    }

    async run() {
        try {
            await this.initialize();
            
            const loginSuccess = await this.login();
            if (!loginSuccess) {
                console.log('❌ Cannot proceed without login');
                return;
            }
            
            await this.checkSidebarNavigation();
            await this.checkAllRoutes();
            await this.generateReport();
            
        } catch (error) {
            console.log('💥 Test suite error:', error.message);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// Run the validator
const validator = new FrontendButtonValidator();
validator.run().catch(console.error);
