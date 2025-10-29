/**
 * Quick Frontend Button Status Check
 * Checks button states and routing mappings
 */

const puppeteer = require('puppeteer');

class QuickButtonCheck {
    constructor() {
        this.baseURL = 'http://localhost:3000';
        this.results = {
            buttonStates: {},
            routingMappings: {},
            issues: []
        };
    }

    async quickCheck() {
        console.log('🔍 Quick Frontend Button Status Check\n');
        
        let browser;
        try {
            browser = await puppeteer.launch({ 
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            const page = await browser.newPage();
            
            // Test login page accessibility
            console.log('1. Testing Login Page...');
            await page.goto(`${this.baseURL}/login`, { waitUntil: 'networkidle0', timeout: 10000 });
            
            const loginButton = await page.$('button[type="submit"]');
            const loginButtonEnabled = await page.evaluate(btn => !btn.disabled, loginButton);
            console.log(`   Login Button: ${loginButtonEnabled ? '✅ ENABLED' : '❌ DISABLED'}`);
            
            // Try login
            console.log('2. Testing Admin Login...');
            await page.type('input[name="email"]', 'admin@example.com');
            await page.type('input[name="password"]', 'password123');
            await page.click('button[type="submit"]');
            await page.waitForTimeout(3000);
            
            const currentUrl = await page.url();
            console.log(`   Current URL after login: ${currentUrl}`);
            
            if (currentUrl.includes('/dashboard')) {
                console.log('   ✅ Login successful');
                
                // Check dashboard buttons
                console.log('3. Testing Dashboard Quick Action Buttons...');
                
                const quickActionCards = await page.$$eval('.MuiCard-root', cards => {
                    return cards.map(card => ({
                        text: card.textContent.trim(),
                        hasOnClick: card.getAttribute('style')?.includes('cursor') || card.onclick !== null,
                        visible: card.offsetParent !== null
                    }));
                });
                
                quickActionCards.forEach((card, i) => {
                    if (card.text.includes('Employee') || card.text.includes('Payroll') || card.text.includes('Leave') || card.text.includes('Timesheet')) {
                        console.log(`   ${card.hasOnClick ? '✅' : '❌'} "${card.text}" - ${card.hasOnClick ? 'CLICKABLE' : 'NOT CLICKABLE'}`);
                    }
                });
                
                // Test navigation to specific routes
                const testRoutes = [
                    { path: '/employees', name: 'Employees' },
                    { path: '/add-employee', name: 'Add Employee' },
                    { path: '/payroll-management', name: 'Payroll Management' }
                ];
                
                console.log('4. Testing Route Navigation...');
                for (const route of testRoutes) {
                    try {
                        await page.goto(`${this.baseURL}${route.path}`, { waitUntil: 'networkidle0', timeout: 8000 });
                        const routeUrl = await page.url();
                        console.log(`   ${routeUrl.includes(route.path) ? '✅' : '❌'} ${route.name}: ${routeUrl}`);
                        
                        // Check for buttons on this page
                        const buttons = await page.$$eval('button', btns => 
                            btns.map(btn => ({
                                text: btn.textContent.trim(),
                                disabled: btn.disabled,
                                visible: btn.offsetParent !== null
                            }))
                        );
                        
                        const enabledButtons = buttons.filter(b => !b.disabled && b.visible && b.text.length > 0);
                        console.log(`     Found ${enabledButtons.length} enabled buttons: ${enabledButtons.map(b => b.text).slice(0, 3).join(', ')}`);
                        
                    } catch (error) {
                        console.log(`   ❌ ${route.name}: Navigation failed - ${error.message}`);
                    }
                }
                
                // Check sidebar navigation
                console.log('5. Testing Sidebar Navigation...');
                await page.goto(`${this.baseURL}/dashboard`);
                
                const navItems = await page.$$eval('[role="button"], .MuiListItemButton-root', items => 
                    items.map(item => ({
                        text: item.textContent.trim(),
                        visible: item.offsetParent !== null
                    }))
                );
                
                const visibleNavItems = navItems.filter(item => item.visible && item.text.length > 2);
                console.log(`   Found ${visibleNavItems.length} navigation items:`);
                visibleNavItems.forEach(item => {
                    console.log(`     • ${item.text}`);
                });
                
            } else {
                console.log('   ❌ Login failed - cannot test other pages');
            }
            
        } catch (error) {
            console.log(`💥 Error during quick check: ${error.message}`);
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }

    async run() {
        await this.quickCheck();
        console.log('\n📋 Quick Check Complete!');
        console.log('\nFor detailed analysis, ensure:');
        console.log('• Frontend server is running on http://localhost:3000');
        console.log('• Backend server is running on http://localhost:8080'); 
        console.log('• Database is properly connected');
        console.log('• Admin user exists with email: admin@example.com');
    }
}

// Run the quick check
const checker = new QuickButtonCheck();
checker.run().catch(console.error);
