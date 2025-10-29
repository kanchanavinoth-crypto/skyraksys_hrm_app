const puppeteer = require('puppeteer');

async function quickEmployeeTest() {
    console.log('🚀 Quick Employee Creation Test');
    console.log('===============================');

    let browser = null;
    try {
        // Launch browser
        browser = await puppeteer.launch({
            headless: false,
            defaultViewport: { width: 1366, height: 768 },
            args: ['--no-sandbox']
        });

        const page = await browser.newPage();
        
        // Step 1: Login as admin
        console.log('\n📍 Step 1: Admin Login');
        await page.goto('http://localhost:3000/login');
        await page.waitForSelector('input[name="email"]');
        await page.type('input[name="email"]', 'admin@company.com');
        await page.type('input[name="password"]', 'Kx9mP7qR2nF8sA5t');
        await page.click('button[type="submit"]');
        await page.waitForNavigation();
        console.log('✅ Admin logged in');

        // Step 2: Go to add employee page directly
        console.log('\n📍 Step 2: Navigate to Add Employee');
        await page.goto('http://localhost:3000/add-employee');
        await page.waitForTimeout(3000);
        console.log('✅ Navigated to add-employee page');

        // Step 3: Take screenshot and analyze
        console.log('\n📍 Step 3: Form Analysis');
        await page.screenshot({ path: 'current-form.png', fullPage: true });
        
        const formData = await page.evaluate(() => {
            const inputs = Array.from(document.querySelectorAll('input')).map(input => ({
                name: input.name || input.id || 'unnamed',
                type: input.type,
                placeholder: input.placeholder || '',
                visible: input.offsetHeight > 0
            }));
            
            const buttons = Array.from(document.querySelectorAll('button')).map(btn => ({
                text: btn.textContent.trim(),
                type: btn.type || 'button',
                disabled: btn.disabled
            }));

            return {
                url: window.location.href,
                inputs: inputs.filter(i => i.visible),
                buttons: buttons,
                hasForm: !!document.querySelector('form')
            };
        });

        console.log('📊 Form Analysis:');
        console.log('  Current URL:', formData.url);
        console.log('  Has form element:', formData.hasForm);
        console.log('  Visible inputs:', formData.inputs.length);
        console.log('  Buttons:', formData.buttons.length);

        console.log('\n📝 Input fields:');
        formData.inputs.forEach((input, i) => {
            console.log(`  ${i+1}. ${input.name} (${input.type}) - "${input.placeholder}"`);
        });

        console.log('\n🔘 Buttons:');
        formData.buttons.forEach((btn, i) => {
            console.log(`  ${i+1}. "${btn.text}" (${btn.type}) disabled=${btn.disabled}`);
        });

        // Step 4: Try to fill firstName if found
        console.log('\n📍 Step 4: Fill Test Data');
        const timestamp = Date.now();
        
        try {
            // Try to fill first name
            const firstNameInput = formData.inputs.find(i => 
                i.name.toLowerCase().includes('firstname') || 
                i.name.toLowerCase().includes('first')
            );
            
            if (firstNameInput) {
                console.log('🔤 Filling firstName...');
                await page.type(`input[name="${firstNameInput.name}"]`, `Test${timestamp}`);
                console.log('✅ FirstName filled');
            } else {
                console.log('⚠️ No firstName field found');
            }

            // Try to fill last name
            const lastNameInput = formData.inputs.find(i => 
                i.name.toLowerCase().includes('lastname') || 
                i.name.toLowerCase().includes('last')
            );
            
            if (lastNameInput) {
                console.log('🔤 Filling lastName...');
                await page.type(`input[name="${lastNameInput.name}"]`, 'Employee');
                console.log('✅ LastName filled');
            } else {
                console.log('⚠️ No lastName field found');
            }

            // Try to fill email
            const emailInput = formData.inputs.find(i => 
                i.name.toLowerCase().includes('email') || i.type === 'email'
            );
            
            if (emailInput) {
                console.log('📧 Filling email...');
                await page.type(`input[name="${emailInput.name}"]`, `test.${timestamp}@company.com`);
                console.log('✅ Email filled');
            } else {
                console.log('⚠️ No email field found');
            }

            // Take screenshot after filling
            await page.screenshot({ path: 'form-filled.png', fullPage: true });
            console.log('📷 Screenshot saved: form-filled.png');

        } catch (error) {
            console.log('❌ Error filling form:', error.message);
        }

        // Step 5: Try to submit
        console.log('\n📍 Step 5: Submit Form');
        try {
            const submitBtn = formData.buttons.find(btn => 
                btn.text.toLowerCase().includes('submit') || 
                btn.text.toLowerCase().includes('save') ||
                btn.text.toLowerCase().includes('create') ||
                btn.type === 'submit'
            );

            if (submitBtn) {
                console.log(`🔘 Clicking submit: "${submitBtn.text}"`);
                
                // Find and click the button
                await page.evaluate((btnText) => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const targetBtn = buttons.find(btn => btn.textContent.trim() === btnText);
                    if (targetBtn) targetBtn.click();
                }, submitBtn.text);

                await page.waitForTimeout(3000);
                
                const newUrl = await page.url();
                console.log('📄 URL after submit:', newUrl);
                
                await page.screenshot({ path: 'after-submit.png', fullPage: true });
                console.log('📷 Screenshot saved: after-submit.png');

                if (newUrl !== formData.url) {
                    console.log('✅ Form submission successful - URL changed');
                } else {
                    console.log('⚠️ Form submitted but URL unchanged');
                }

            } else {
                console.log('❌ No submit button found');
            }

        } catch (error) {
            console.log('❌ Error submitting form:', error.message);
        }

        console.log('\n🏁 Test Complete!');
        console.log('Screenshots saved: current-form.png, form-filled.png, after-submit.png');

    } catch (error) {
        console.log('❌ Test failed:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Run the test
quickEmployeeTest();
