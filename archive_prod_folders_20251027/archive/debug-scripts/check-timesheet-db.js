const db = require('./backend/models');

async function checkTimesheetData() {
    console.log('🔍 Checking timesheet data in database...\n');
    
    try {
        // Initialize database connection
        await db.sequelize.authenticate();
        console.log('✅ Database connection established');
        
        // Get all timesheets
        const timesheets = await db.Timesheet.findAll({
            include: ['employee', 'project', 'task'],
            order: [['workDate', 'DESC']],
            limit: 20
        });
        
        console.log(`📊 Found ${timesheets.length} timesheet records:\n`);
        
        if (timesheets.length === 0) {
            console.log('❌ No timesheet records found in database!');
            console.log('This is why the history is not showing up.');
            
            // Let's create some sample timesheet data
            console.log('\n🔧 Creating sample timesheet data...');
            
            // Get first employee
            const employee = await db.Employee.findOne();
            if (!employee) {
                console.log('❌ No employees found in database');
                return;
            }
            
            // Get first project
            const project = await db.Project.findOne();
            if (!project) {
                console.log('❌ No projects found in database');
                return;
            }
            
            // Create sample timesheets for the past few weeks
            const today = new Date();
            const sampleTimesheets = [];
            
            for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
                for (let dayOffset = 0; dayOffset < 5; dayOffset++) { // Weekdays only
                    const workDate = new Date(today);
                    workDate.setDate(today.getDate() - (weekOffset * 7) - dayOffset);
                    
                    if (workDate.getDay() !== 0 && workDate.getDay() !== 6) { // Skip weekends
                        sampleTimesheets.push({
                            employeeId: employee.id,
                            projectId: project.id,
                            workDate: workDate.toISOString().split('T')[0],
                            hoursWorked: 8,
                            description: `Work on project tasks - Week ${weekOffset + 1}, Day ${dayOffset + 1}`,
                            status: weekOffset === 0 ? 'Draft' : (weekOffset === 1 ? 'Submitted' : 'Approved'),
                            submittedAt: weekOffset > 0 ? workDate : null,
                            createdAt: new Date(),
                            updatedAt: new Date()
                        });
                    }
                }
            }
            
            // Insert sample data
            await db.Timesheet.bulkCreate(sampleTimesheets);
            console.log(`✅ Created ${sampleTimesheets.length} sample timesheet records`);
            
            // Fetch updated data
            const updatedTimesheets = await db.Timesheet.findAll({
                include: ['employee', 'project', 'task'],
                order: [['workDate', 'DESC']],
                limit: 10
            });
            
            console.log(`\n📈 Updated timesheet data (${updatedTimesheets.length} records):`);
            updatedTimesheets.forEach(ts => {
                console.log(`  ${ts.workDate}: ${ts.hoursWorked}h - ${ts.status} (${ts.employee?.name || 'N/A'})`);
            });
            
        } else {
            console.log('📈 Existing timesheet data:');
            timesheets.forEach(ts => {
                console.log(`  ${ts.workDate}: ${ts.hoursWorked}h - ${ts.status} (${ts.employee?.name || 'N/A'})`);
            });
            
            // Group by week
            const weeklyGroups = {};
            timesheets.forEach(ts => {
                const workDate = new Date(ts.workDate);
                const year = workDate.getFullYear();
                const weekNumber = getWeekNumber(workDate);
                const weekKey = `${year}-W${weekNumber}`;
                
                if (!weeklyGroups[weekKey]) {
                    weeklyGroups[weekKey] = [];
                }
                weeklyGroups[weekKey].push(ts);
            });
            
            console.log('\n📊 Grouped by week:');
            Object.entries(weeklyGroups).forEach(([week, weekTimesheets]) => {
                const totalHours = weekTimesheets.reduce((sum, ts) => sum + (ts.hoursWorked || 0), 0);
                const statuses = [...new Set(weekTimesheets.map(ts => ts.status))];
                
                console.log(`  ${week}: ${totalHours}h total, ${weekTimesheets.length} entries, statuses: [${statuses.join(', ')}]`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error checking timesheet data:', error);
    } finally {
        await db.sequelize.close();
    }
}

function getWeekNumber(date) {
    const tempDate = new Date(date.getTime());
    tempDate.setHours(0, 0, 0, 0);
    tempDate.setDate(tempDate.getDate() + 3 - (tempDate.getDay() + 6) % 7);
    const week1 = new Date(tempDate.getFullYear(), 0, 4);
    return 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

checkTimesheetData().then(() => {
    console.log('\n🎯 Database check completed!');
}).catch(err => {
    console.error('💥 Check failed:', err);
});