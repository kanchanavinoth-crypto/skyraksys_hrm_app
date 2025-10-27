const PDFDocument = require('pdfkit-table');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const db = require('../models');
const PayslipTemplate = db.PayslipTemplate;

const fetchImage = async (url) => {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data, 'binary');
    } catch (error) {
        console.error(`Failed to fetch image from ${url}:`, error);
        // Check for local file as a fallback
        const localPath = path.join(__dirname, '..', url);
        if (fs.existsSync(localPath)) {
            return fs.readFileSync(localPath);
        }
        return null;
    }
};

const generatePayslipPDF = async (payrollData, res) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payslip_${payrollData.employee.id}_${payrollData.month}_${payrollData.year}.pdf`);
    doc.pipe(res);

    try {
        // 1. Fetch the payslip template
        const template = await PayslipTemplate.findOne();
        if (!template) {
            throw new Error('Payslip template not found.');
        }

        // 2. Header Section
        if (template.companyLogo) {
            const logoImage = await fetchImage(template.companyLogo);
            if (logoImage) {
                doc.image(logoImage, 50, 45, { width: 100 });
            }
        }
        doc.fontSize(20).text(template.companyName, { align: 'right' });
        doc.fontSize(10).text(template.companyAddress, { align: 'right' });
        doc.fontSize(10).text(template.companyContact, { align: 'right' });
        doc.moveDown(2);

        // 3. Payslip Title
        doc.fontSize(18).font('Helvetica-Bold').text('Payslip', { align: 'center' });
        doc.fontSize(12).font('Helvetica').text(`For the month of ${payrollData.month}, ${payrollData.year}`, { align: 'center' });
        doc.moveDown(2);

        // 4. Employee Details Section
        if (template.showEmployeeDetails) {
            const employeeDetails = {
                'Employee ID': payrollData.employee.id,
                'Employee Name': `${payrollData.employee.firstName} ${payrollData.employee.lastName}`,
                'Pay Period': `${payrollData.payPeriodStart} to ${payrollData.payPeriodEnd}`,
                'Pay Date': payrollData.paidAt || 'N/A',
            };
            const table = {
                headers: [{label: "Employee Information", align: "left", headerColor: "#CCCCCC"}],
                rows: Object.entries(employeeDetails).map(([key, value]) => [key, value]),
            };
            await doc.table(table, {
                prepareHeader: () => doc.font('Helvetica-Bold').fontSize(12),
                prepareRow: (row, i) => doc.font('Helvetica').fontSize(10),
                hideHeader: true,
                columnsSize: [ 150, 350 ],
                padding: 5,
            });
            doc.moveDown();
        }

        // 5. Earnings and Deductions Tables
        const earnings = payrollData.components.filter(c => c.type === 'earning');
        const deductions = payrollData.components.filter(c => c.type === 'deduction');

        const earningsTable = {
            headers: ['Earnings', 'Amount'],
            rows: earnings.map(c => [c.name, c.amount.toFixed(2)])
        };
        earningsTable.rows.push(['Gross Salary', payrollData.grossSalary.toFixed(2)]);

        const deductionsTable = {
            headers: ['Deductions', 'Amount'],
            rows: deductions.map(c => [c.name, c.amount.toFixed(2)])
        };
        deductionsTable.rows.push(['Total Deductions', payrollData.totalDeductions.toFixed(2)]);

        const tableOptions = {
            prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
            prepareRow: (row, i) => doc.font('Helvetica').fontSize(9),
            padding: 5,
        };

        if (template.showEarningsBreakdown && template.showDeductionsBreakdown) {
             // Side-by-side tables
            const earningsX = 50;
            const deductionsX = 320;
            const tableWidth = 230;

            await doc.table(earningsTable, { ...tableOptions, x: earningsX, width: tableWidth });
            await doc.table(deductionsTable, { ...tableOptions, x: deductionsX, width: tableWidth });
            doc.moveDown(earningsTable.rows.length > deductionsTable.rows.length ? earningsTable.rows.length : deductionsTable.rows.length);

        } else if (template.showEarningsBreakdown) {
            await doc.table(earningsTable, tableOptions);
            doc.moveDown();
        } else if (template.showDeductionsBreakdown) {
            await doc.table(deductionsTable, tableOptions);
            doc.moveDown();
        }


        // 6. Net Salary
        doc.font('Helvetica-Bold').fontSize(14).text(`Net Salary: ${payrollData.netSalary.toFixed(2)}`, { align: 'right' });
        doc.moveDown();

        // 7. Leave Balance
        if (template.showLeaveBalance && payrollData.employee.leaveBalance) {
            doc.font('Helvetica').fontSize(10).text(`Leave Balance: ${payrollData.employee.leaveBalance} days`);
            doc.moveDown();
        }

        // 8. Footer
        if (template.footerText) {
            doc.fontSize(8).text(template.footerText, { align: 'center' });
        }

    } catch (error) {
        console.error('Error generating PDF:', error);
        doc.end(); // End the document stream on error
        // We can't send another response if headers are already sent.
        // The client will receive a potentially broken PDF.
        // Logging is the most important action here.
    } finally {
        doc.end();
    }
};

module.exports = { generatePayslipPDF };
