const db = require('./models');

async function addBulkSubmitEndpoint() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connected');
    
    // Read the timesheet routes file and add bulk submit endpoint
    const fs = require('fs');
    const path = require('path');
    
    const routesFile = path.join(__dirname, 'routes', 'timesheet.routes.js');
    let routesContent = fs.readFileSync(routesFile, 'utf8');
    
    // Check if bulk submit endpoint already exists
    if (routesContent.includes('router.post(\'/bulk-submit\'')) {
      console.log('Bulk submit endpoint already exists');
      return;
    }
    
    // Add bulk submit endpoint before the module.exports line
    const bulkSubmitEndpoint = `
// POST bulk submit timesheets (multiple timesheets at once)
router.post('/bulk-submit', async (req, res) => {
    try {
        const { timesheetIds } = req.body;
        
        if (!timesheetIds || !Array.isArray(timesheetIds) || timesheetIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Timesheet IDs array is required'
            });
        }

        const updatedTimesheets = [];
        const errors = [];

        for (const timesheetId of timesheetIds) {
            try {
                const timesheet = await Timesheet.findByPk(timesheetId);
                
                if (!timesheet) {
                    errors.push(\`Timesheet \${timesheetId} not found\`);
                    continue;
                }

                // Only owner can submit their timesheet
                if (timesheet.employeeId !== req.employeeId) {
                    errors.push(\`You can only submit your own timesheets (\${timesheetId})\`);
                    continue;
                }

                // Can only submit if it's in Draft status
                if (timesheet.status !== 'Draft') {
                    errors.push(\`Timesheet \${timesheetId} is not in Draft status\`);
                    continue;
                }

                // Update status to Submitted
                await timesheet.update({
                    status: 'Submitted',
                    submittedAt: new Date()
                });

                updatedTimesheets.push(timesheet);
            } catch (error) {
                console.error(\`Error processing timesheet \${timesheetId}:\`, error);
                errors.push(\`Error processing timesheet \${timesheetId}: \${error.message}\`);
            }
        }

        res.json({
            success: true,
            message: \`Successfully submitted \${updatedTimesheets.length} timesheets\`,
            data: {
                submitted: updatedTimesheets.length,
                errors: errors
            }
        });
    } catch (error) {
        console.error('Bulk Submit Timesheets Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit timesheets'
        });
    }
});

`;
    
    // Insert the endpoint before the module.exports line
    const moduleExportsIndex = routesContent.lastIndexOf('module.exports = router;');
    if (moduleExportsIndex === -1) {
      console.error('Could not find module.exports line in routes file');
      return;
    }
    
    const newContent = routesContent.slice(0, moduleExportsIndex) + 
                      bulkSubmitEndpoint + 
                      routesContent.slice(moduleExportsIndex);
    
    // Write the updated content back
    fs.writeFileSync(routesFile, newContent);
    console.log('✅ Added bulk submit endpoint to timesheet routes');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

addBulkSubmitEndpoint();