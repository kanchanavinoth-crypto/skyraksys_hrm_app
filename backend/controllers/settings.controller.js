const db = require('../models');
const PayslipTemplate = db.PayslipTemplate;

// GET the current payslip template settings
exports.getPayslipTemplate = async (req, res) => {
    try {
        const template = await PayslipTemplate.findOne();
        if (!template) {
            // If no template exists, create a default one
            const defaultTemplate = await PayslipTemplate.create({
                companyName: 'Your Company',
                companyAddress: '123 Main St, Anytown, USA',
                footerText: 'This is a computer-generated payslip.'
            });
            return res.json({ success: true, data: defaultTemplate });
        }
        res.json({ success: true, data: template });
    } catch (error) {
        console.error('Get Payslip Template Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch payslip template settings.' });
    }
};

// PUT to update the payslip template settings (Admin or HR only)
exports.updatePayslipTemplate = async (req, res) => {
    try {
        const [template, created] = await PayslipTemplate.findOrCreate({
            where: {}, // Finds the first one
            defaults: req.body
        });

        const updateData = { ...req.body };

        // Handle file upload
        if (req.file) {
            updateData.companyLogo = `/uploads/logos/${req.file.filename}`;
        }

        if (!created) {
            await template.update(updateData);
        }

        res.json({ success: true, message: 'Payslip template updated successfully.', data: template });
    } catch (error) {
        console.error('Update Payslip Template Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update payslip template.' });
    }
};
