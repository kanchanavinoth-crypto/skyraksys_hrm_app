const puppeteer = require('puppeteer');

class FrontendInspector {
    constructor() {
        this.browser = null;
        this.page = null;
        this.config = {
            baseUrl: 'http://localhost:3000',
            timeout: 30000
        };
        
        // Working credentials from our fixed backend
        this.adminCreds = { 
            email: 'admin@company.com', 
            password: 'Kx9mP7qR2nF8sA5t' 
        };
    }

    async init() {
        console.log('🔍 Frontend UI Structure Inspector');
        console.log('=================================');
        
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1366, height: 768 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        this.page = await this.browser.newPage();
        await this.page.setDefaultTimeout(this.config.timeout);
        
        console.log('✅ Browser initialized for frontend inspection');
    }

    async inspectEmployeeManagement() {
        try {
            console.log('\n🔐 Step 1: Admin Login');
            await this.page.goto(this.config.baseUrl);
            await this.page.waitForSelector('input[type="email"]');
            
            // Login as admin
            await this.page.type('input[type="email"]', this.adminCreds.email);
            await this.page.type('input[type="password"]', this.adminCreds.password);
            await this.page.click('button[type="submit"]');
            await this.page.waitForNavigation();
            console.log('✅ Admin logged in successfully');

            console.log('\n🔍 Step 2: Analyzing Frontend Structure');
            
            // Inspect the current page structure
            const pageInfo = await this.page.evaluate(() => {
                return {
                    title: document.title,
                    url: window.location.href,
                    navigationLinks: Array.from(document.querySelectorAll('nav a, .nav a, .navbar a, .sidebar a')).map(link => ({
                        text: link.textContent.trim(),
                        href: link.href
                    })),
                    buttons: Array.from(document.querySelectorAll('button')).map(btn => ({
                        text: btn.textContent.trim(),
                        className: btn.className,
                        id: btn.id
                    })),
                    mainContent: document.querySelector('main, .main-content, .content, .dashboard')?.textContent?.substring(0, 200) || 'No main content found'
                };
            });

            console.log('📊 Current Page Analysis:');
            console.log(`   Title: ${pageInfo.title}`);
            console.log(`   URL: ${pageInfo.url}`);
            console.log(`   Navigation Links Found: ${pageInfo.navigationLinks.length}`);
            
            console.log('\n🔗 Navigation Options:');
            pageInfo.navigationLinks.forEach((link, idx) => {
                if (link.text && link.text.length > 0) {
                    console.log(`   ${idx + 1}. "${link.text}" → ${link.href}`);
                }
            });

            console.log('\n🔍 Step 3: Looking for Employee Management');
            
            // Try different navigation approaches
            const employeeNavAttempts = [
                { type: 'link', text: 'employees', selector: 'a[href*="employee"]' },
                { type: 'link', text: 'users', selector: 'a[href*="user"]' },
                { type: 'link', text: 'staff', selector: 'a[href*="staff"]' },
                { type: 'button', text: 'employees', selector: 'button:contains("Employee")' },
                { type: 'menu', text: 'admin', selector: '.admin-menu, .admin-nav' }
            ];

            for (const attempt of employeeNavAttempts) {
                try {
                    console.log(`🔍 Trying ${attempt.type}: ${attempt.text}`);
                    
                    // Use evaluate to find elements more reliably
                    const found = await this.page.evaluate((searchText) => {
                        // Look for links with employee-related text
                        const links = Array.from(document.querySelectorAll('a, button, .menu-item, .nav-item'));
                        const matches = links.filter(el => {
                            const text = el.textContent.toLowerCase();
                            return text.includes('employee') || 
                                   text.includes('staff') || 
                                   text.includes('user') ||
                                   text.includes('team') ||
                                   text.includes('people');
                        });
                        
                        return matches.map(el => ({
                            text: el.textContent.trim(),
                            tagName: el.tagName,
                            href: el.href || 'N/A',
                            className: el.className
                        }));
                    }, attempt.text);

                    if (found.length > 0) {
                        console.log(`✅ Found ${found.length} employee-related elements:`);
                        found.forEach((el, idx) => {
                            console.log(`     ${idx + 1}. ${el.tagName}: "${el.text}" (${el.href})`);
                        });

                        // Try clicking the first promising option
                        if (found[0]) {
                            await this.page.evaluate((elementText) => {
                                const links = Array.from(document.querySelectorAll('a, button'));
                                const target = links.find(el => el.textContent.trim() === elementText);
                                if (target) {
                                    target.click();
                                    return true;
                                }
                                return false;
                            }, found[0].text);

                            await new Promise(resolve => setTimeout(resolve, 3000));
                            
                            // Check what page we're on now
                            const currentUrl = await this.page.url();
                            console.log(`📍 Navigated to: ${currentUrl}`);
                            
                            // Look for employee management features on this page
                            await this.inspectCurrentPageForEmployeeFeatures();
                            break;
                        }
                    } else {
                        console.log(`❌ No ${attempt.text} elements found`);
                    }
                } catch (error) {
                    console.log(`⚠️  Error trying ${attempt.text}: ${error.message}`);
                }
            }

        } catch (error) {
            console.log(`💥 Inspection failed: ${error.message}`);
        }
    }

    async inspectCurrentPageForEmployeeFeatures() {
        console.log('\n📋 Analyzing Current Page for Employee Management Features:');
        
        const features = await this.page.evaluate(() => {
            const forms = Array.from(document.querySelectorAll('form')).map(form => ({
                action: form.action || 'N/A',
                method: form.method || 'GET',
                fields: Array.from(form.querySelectorAll('input, select, textarea')).map(field => ({
                    name: field.name,
                    type: field.type,
                    placeholder: field.placeholder
                }))
            }));

            const createButtons = Array.from(document.querySelectorAll('button, a')).filter(el => {
                const text = el.textContent.toLowerCase();
                return text.includes('add') || 
                       text.includes('create') || 
                       text.includes('new') ||
                       text.includes('+');
            }).map(btn => ({
                text: btn.textContent.trim(),
                tagName: btn.tagName,
                href: btn.href || 'N/A'
            }));

            const tables = Array.from(document.querySelectorAll('table')).map(table => ({
                headers: Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim()),
                rowCount: table.querySelectorAll('tr').length - 1 // subtract header row
            }));

            return {
                forms: forms,
                createButtons: createButtons,
                tables: tables,
                hasEmployeeList: document.body.textContent.toLowerCase().includes('employee') && 
                                (tables.length > 0 || document.querySelector('.employee-list, .user-list'))
            };
        });

        console.log(`📝 Forms Found: ${features.forms.length}`);
        features.forms.forEach((form, idx) => {
            console.log(`   Form ${idx + 1}: ${form.method} → ${form.action}`);
            console.log(`     Fields: ${form.fields.map(f => f.name || f.type).join(', ')}`);
        });

        console.log(`🔘 Create Buttons Found: ${features.createButtons.length}`);
        features.createButtons.forEach((btn, idx) => {
            console.log(`   ${idx + 1}. ${btn.tagName}: "${btn.text}" → ${btn.href}`);
        });

        console.log(`📊 Tables Found: ${features.tables.length}`);
        features.tables.forEach((table, idx) => {
            console.log(`   Table ${idx + 1}: ${table.headers.join(', ')} (${table.rowCount} rows)`);
        });

        console.log(`👥 Employee Management Present: ${features.hasEmployeeList ? '✅ YES' : '❌ NO'}`);

        return features;
    }

    async run() {
        try {
            await this.init();
            await this.inspectEmployeeManagement();
            
            console.log('\n🎯 Inspection Complete!');
            console.log('📋 Next Steps:');
            console.log('   1. Review the navigation structure above');
            console.log('   2. Update test automation selectors');
            console.log('   3. Re-run employee creation tests');
            
        } catch (error) {
            console.error('💥 Frontend inspection failed:', error);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

const inspector = new FrontendInspector();
inspector.run();
