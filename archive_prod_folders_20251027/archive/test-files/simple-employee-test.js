const puppeteer = require('puppeteer');

class SimpleEmployeeTest {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    async run() {
        try {
            console.log('🚀 Simple Employee Creation Test');
            console.log('================================');

            // Launch browser
            this.browser = await puppeteer.launch({
                headless: false,
                defaultViewport: { width: 1366, height: 768 },
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });

            this.page = await this.browser.newPage();
            
            // Login as admin
            console.log('🔐 Logging in as admin...');
            await this.page.goto('http://localhost:3000/login');
            await this.page.waitForSelector('input[name="email"]');
            
            await this.page.type('input[name="email"]', 'admin@company.com');
            await this.page.type('input[name="password"]', 'Kx9mP7qR2nF8sA5t');
            await this.page.click('button[type="submit"]');
            await this.page.waitForNavigation();
            
            console.log('✅ Admin login successful');
            console.log('📍 Current URL:', await this.page.url());
            
            // Wait a bit for page to load
            await this.page.waitForTimeout(3000);
            
            // Check what navigation elements are available
            console.log('🔍 Inspecting navigation structure...');
            
            const navElements = await this.page.evaluate(() => {
                const elements = [];
                
                // Look for navigation elements
                const navs = document.querySelectorAll('nav, .sidebar, [role="navigation"], .MuiList-root');
                navs.forEach(nav => {
                    const text = nav.textContent;
                    if (text && text.length > 0) {
                        elements.push({
                            type: 'navigation',
                            text: text.substring(0, 200),
                            hasEmployees: text.toLowerCase().includes('employees')
                        });
                    }
                });
                
                // Look for employee-related links
                const employeeLinks = document.querySelectorAll('a[href*="employee"], a[href="/employees"]');
                employeeLinks.forEach(link => {
                    elements.push({
                        type: 'employee_link',
                        href: link.href,
                        text: link.textContent
                    });
                });
                
                // Look for buttons with employee text
                const buttons = document.querySelectorAll('button');
                buttons.forEach(btn => {
                    if (btn.textContent.toLowerCase().includes('employee')) {
                        elements.push({
                            type: 'employee_button',
                            text: btn.textContent
                        });
                    }
                });
                
                return elements;
            });
            
            console.log('📋 Found navigation elements:');
            navElements.forEach((el, i) => {
                console.log(`  ${i + 1}. ${el.type}: ${el.text || el.href}`);
            });
            
            // Try direct navigation to /employees
            console.log('🔍 Trying direct navigation to /employees...');
            await this.page.goto('http://localhost:3000/employees');
            await this.page.waitForTimeout(2000);
            
            console.log('📍 Current URL after navigation:', await this.page.url());
            
            // Check if we're on employees page
            const pageContent = await this.page.evaluate(() => {
                return {
                    title: document.title,
                    url: window.location.href,
                    bodyText: document.body.textContent.substring(0, 500),
                    hasAddButton: !!document.querySelector('button:contains("Add"), button:contains("New"), button:contains("Create")')
                };
            });
            
            console.log('📄 Page analysis:');
            console.log(`  Title: ${pageContent.title}`);
            console.log(`  URL: ${pageContent.url}`);
            console.log(`  Has Add Button: ${pageContent.hasAddButton}`);
            console.log(`  Body preview: ${pageContent.bodyText.substring(0, 200)}...`);
            
            // Try to navigate to add-employee directly
            console.log('🔍 Trying direct navigation to /add-employee...');
            await this.page.goto('http://localhost:3000/add-employee');
            await this.page.waitForTimeout(2000);
            
            console.log('📍 Current URL:', await this.page.url());
            
            // Check what form elements exist on add-employee page
            const formAnalysis = await this.page.evaluate(() => {
                const inputs = Array.from(document.querySelectorAll('input')).map(input => ({
                    name: input.name,
                    type: input.type,
                    placeholder: input.placeholder
                }));
                
                const buttons = Array.from(document.querySelectorAll('button')).map(btn => ({
                    text: btn.textContent,
                    type: btn.type
                }));
                
                return {
                    inputs: inputs.slice(0, 10), // First 10 inputs
                    buttons: buttons.slice(0, 10), // First 10 buttons
                    hasForm: !!document.querySelector('form'),
                    bodyText: document.body.textContent.substring(0, 300)
                };
            });
            
            console.log('📄 Add Employee page analysis:');
            console.log(`  Has Form: ${formAnalysis.hasForm}`);
            console.log(`  Input fields found: ${formAnalysis.inputs.length}`);
            formAnalysis.inputs.forEach((input, i) => {
                console.log(`    ${i + 1}. ${input.name || 'unnamed'} (${input.type}) - ${input.placeholder || 'no placeholder'}`);
            });
            console.log(`  Buttons found: ${formAnalysis.buttons.length}`);
            formAnalysis.buttons.forEach((btn, i) => {
                console.log(`    ${i + 1}. "${btn.text}" (${btn.type})`);
            });
            
            // Take a screenshot
            await this.page.screenshot({ path: 'current-page-analysis.png', fullPage: true });
            console.log('📷 Screenshot saved: current-page-analysis.png');
            
            console.log('\n✅ Analysis complete!');
            console.log('\n📊 Summary:');
            console.log('- Admin login: ✅ Working');
            console.log('- Navigation structure: ✅ Analyzed');
            console.log(`- Employee menu items: ${navElements.filter(el => el.hasEmployees).length} found`);
            console.log(`- Form elements on /add-employee: ${formAnalysis.inputs.length} inputs, ${formAnalysis.buttons.length} buttons`);
            
        } catch (error) {
            console.log(`❌ Test failed: ${error.message}`);
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// Run the test
const test = new SimpleEmployeeTest();
test.run();
