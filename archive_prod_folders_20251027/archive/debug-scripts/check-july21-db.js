const { Sequelize } = require('./backend/node_modules/sequelize');
const models = require('./backend/models');
const { Timesheet, Project, Task, Employee } = models;

async function checkJuly21Timesheets() {
    try {
        console.log('🔍 Checking database for July 21-27, 2025 timesheets...\n');

        // Check timesheets for the specific week
        const timesheets = await Timesheet.findAll({
            where: {
                weekStartDate: '2025-07-21'
            },
            include: [
                { model: Project, as: 'project' },
                { model: Task, as: 'task' },
                { model: Employee, as: 'employee' }
            ],
            order: [['createdAt', 'ASC']]
        });

        console.log(`📊 Found ${timesheets.length} timesheet(s) for July 21-27, 2025:`);

        if (timesheets.length === 0) {
            console.log('❌ No timesheets found for this week');
        } else {
            timesheets.forEach((ts, index) => {
                console.log(`\n📋 Timesheet ${index + 1}:`);
                console.log('   ID:', ts.id);
                console.log('   Employee:', ts.employee?.firstName, ts.employee?.lastName);
                console.log('   Project:', ts.project?.name);
                console.log('   Task:', ts.task?.name);
                console.log('   Status:', ts.status);
                console.log('   Total Hours:', ts.totalHoursWorked);
                console.log('   Week:', ts.weekStartDate, 'to', ts.weekEndDate);
                console.log('   Created:', new Date(ts.createdAt).toLocaleString());
                console.log('   Updated:', new Date(ts.updatedAt).toLocaleString());
                if (ts.submittedAt) {
                    console.log('   Submitted:', new Date(ts.submittedAt).toLocaleString());
                }
            });
        }

        // Also check if there are any timesheets for this employee in July 2025
        console.log('\n🗓️  Checking all July 2025 timesheets...');
        const julyTimesheets = await Timesheet.findAll({
            where: {
                year: 2025,
                weekStartDate: {
                    [Sequelize.Op.gte]: '2025-07-01',
                    [Sequelize.Op.lt]: '2025-08-01'
                }
            },
            include: [
                { model: Project, as: 'project' },
                { model: Task, as: 'task' },
                { model: Employee, as: 'employee' }
            ],
            order: [['weekStartDate', 'ASC'], ['createdAt', 'ASC']]
        });

        console.log(`📅 Found ${julyTimesheets.length} timesheet(s) for entire July 2025:`);

        if (julyTimesheets.length > 0) {
            const weekGroups = {};
            julyTimesheets.forEach(ts => {
                const week = ts.weekStartDate;
                if (!weekGroups[week]) {
                    weekGroups[week] = [];
                }
                weekGroups[week].push(ts);
            });

            Object.keys(weekGroups).forEach(week => {
                const weekTimesheets = weekGroups[week];
                console.log(`\n   Week ${week}:`);
                weekTimesheets.forEach((ts, index) => {
                    console.log(`     ${index + 1}. ${ts.employee?.firstName} ${ts.employee?.lastName} - ${ts.project?.name} - ${ts.task?.name} (${ts.status})`);
                });
            });
        }

        console.log('\n✅ Database check completed');

    } catch (error) {
        console.error('💥 Database check failed:', error.message);
        console.error('Error details:', error);
    } finally {
        process.exit(0);
    }
}

checkJuly21Timesheets();