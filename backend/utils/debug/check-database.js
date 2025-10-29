const { Timesheet } = require('./models');

async function checkDatabase() {
  try {
    const timesheets = await Timesheet.findAll();
    console.log('Total timesheets in database:', timesheets.length);
    
    if (timesheets.length > 0) {
      console.log('Sample timesheet:', timesheets[0].toJSON());
    } else {
      console.log('No timesheets found. The database might have been reset.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDatabase();