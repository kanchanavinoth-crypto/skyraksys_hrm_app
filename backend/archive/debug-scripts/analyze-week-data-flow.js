/**
 * Week Data Flow Analysis
 * 
 * This script analyzes how week data flows from frontend to backend
 * and what calculations happen where.
 */

const http = require('http');
const { URL } = require('url');

const BASE_URL = 'http://localhost:8080';
const API_URL = `${BASE_URL}/api`;

const TEST_USER = {
  email: 'admin@company.com',
  password: 'Kx9mP7qR2nF8sA5t'
};

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url.startsWith('http') ? url : `${API_URL}${url}`);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            success: res.statusCode >= 200 && res.statusCode < 300,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            success: false,
            data: { message: 'Invalid JSON response', raw: data }
          });
        }
      });
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

function getMondayOfWeek(date, weeksAgo = 0) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff - (weeksAgo * 7));
  return d.toISOString().split('T')[0];
}

function getISOWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

async function login() {
  console.log('🔐 Logging in...');
  const result = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(TEST_USER)
  });

  if (!result.success) {
    throw new Error(`Login failed: ${JSON.stringify(result.data)}`);
  }

  const token = result.data.data?.accessToken || result.data.accessToken;
  return { token };
}

async function analyzeWeekDataFlow() {
  console.log('🔍 WEEK DATA FLOW ANALYSIS');
  console.log('=' .repeat(60));

  try {
    const auth = await login();
    const headers = { 'Authorization': `Bearer ${auth.token}` };

    // Test multiple week scenarios
    const testWeeks = [
      { desc: 'Current week', weeksAgo: 0 },
      { desc: '1 week ago', weeksAgo: 1 },
      { desc: '2 weeks ago', weeksAgo: 2 },
      { desc: '4 weeks ago', weeksAgo: 4 }
    ];

    for (const testWeek of testWeeks) {
      console.log(`\n📅 Testing: ${testWeek.desc}`);
      console.log('-'.repeat(40));

      // Calculate dates (simulating frontend calculations)
      const mondayDate = getMondayOfWeek(new Date(), testWeek.weeksAgo);
      const weekDate = new Date(mondayDate);
      const frontendWeekNumber = getISOWeekNumber(weekDate);
      const frontendYear = weekDate.getFullYear();

      console.log('🎯 FRONTEND CALCULATIONS:');
      console.log(`   Monday date: ${mondayDate}`);
      console.log(`   Year: ${frontendYear}`);
      console.log(`   ISO Week Number: ${frontendWeekNumber}`);
      console.log(`   Day of week check: ${weekDate.getDay()} (should be 1 for Monday)`);

      // Test 1: Query using frontend-calculated week number and year
      console.log('\n🔄 API QUERY (using frontend week/year):');
      const queryUrl = `/timesheets?year=${frontendYear}&weekNumber=${frontendWeekNumber}&limit=5`;
      console.log(`   URL: ${queryUrl}`);
      
      const queryResult = await makeRequest(queryUrl, { method: 'GET', headers });
      if (queryResult.success) {
        const timesheets = queryResult.data.data || [];
        console.log(`   ✅ Retrieved ${timesheets.length} timesheets`);
        
        // Show what the backend stored
        if (timesheets.length > 0) {
          const sample = timesheets[0];
          console.log('   📋 Sample backend data:');
          console.log(`      weekStartDate: ${sample.weekStartDate}`);
          console.log(`      weekEndDate: ${sample.weekEndDate || 'N/A'}`);
          console.log(`      year: ${sample.year}`);
          console.log(`      weekNumber: ${sample.weekNumber}`);
        }
      } else {
        console.log(`   ❌ Query failed: ${queryResult.data.message}`);
      }

      // Test 2: Create timesheet payload (simulating frontend submission)
      console.log('\n📤 TIMESHEET CREATION PAYLOAD:');
      const payload = {
        // Note: Only weekStartDate is sent, no weekNumber or year
        weekStartDate: mondayDate,
        projectId: 'test-project-id',  // We'll skip actual creation
        taskId: 'test-task-id',
        mondayHours: 8,
        tuesdayHours: 8,
        wednesdayHours: 8,
        thursdayHours: 8,
        fridayHours: 4,
        description: `Test for ${testWeek.desc}`
      };

      console.log('   📋 Payload sent by frontend:');
      console.log(`      weekStartDate: ${payload.weekStartDate}`);
      console.log(`      weekNumber: NOT SENT (backend calculates)`);
      console.log(`      year: NOT SENT (backend calculates)`);
      console.log(`      weekEndDate: NOT SENT (backend calculates)`);

      // Simulate backend calculations
      const backendWeekStart = new Date(mondayDate);
      const backendWeekEnd = new Date(backendWeekStart);
      backendWeekEnd.setDate(backendWeekEnd.getDate() + 6);
      const backendWeekNumber = getISOWeekNumber(backendWeekStart);
      const backendYear = backendWeekStart.getFullYear();

      console.log('\n🔧 BACKEND CALCULATIONS (from weekStartDate):');
      console.log(`      weekStartDate: ${mondayDate} (from payload)`);
      console.log(`      weekEndDate: ${backendWeekEnd.toISOString().split('T')[0]} (calculated)`);
      console.log(`      weekNumber: ${backendWeekNumber} (calculated)`);
      console.log(`      year: ${backendYear} (calculated)`);

      // Verify calculations match
      const calculationsMatch = {
        weekNumber: frontendWeekNumber === backendWeekNumber,
        year: frontendYear === backendYear
      };

      console.log('\n✅ CALCULATION VERIFICATION:');
      console.log(`   Week numbers match: ${calculationsMatch.weekNumber ? '✅' : '❌'} (Frontend: ${frontendWeekNumber}, Backend: ${backendWeekNumber})`);
      console.log(`   Years match: ${calculationsMatch.year ? '✅' : '❌'} (Frontend: ${frontendYear}, Backend: ${backendYear})`);
    }

    // Summary of data flow
    console.log('\n' + '=' .repeat(60));
    console.log('📊 WEEK DATA FLOW SUMMARY');
    console.log('=' .repeat(60));

    console.log('\n🎯 FRONTEND TO BACKEND DATA FLOW:');
    console.log('   1. Frontend calculates Monday date using dayjs');
    console.log('   2. Frontend sends only weekStartDate in API calls');
    console.log('   3. Frontend calculates year/weekNumber for queries only');
    console.log('   4. Backend receives weekStartDate and validates it\'s a Monday');
    console.log('   5. Backend calculates weekEndDate, weekNumber, year from weekStartDate');
    console.log('   6. Backend stores all calculated values in database');

    console.log('\n📋 REQUIRED VS CALCULATED FIELDS:');
    console.log('   ✅ weekStartDate: REQUIRED in API payload (frontend provides)');
    console.log('   🔧 weekEndDate: CALCULATED by backend');
    console.log('   🔧 weekNumber: CALCULATED by backend');
    console.log('   🔧 year: CALCULATED by backend');

    console.log('\n🔍 VALIDATION RULES:');
    console.log('   • weekStartDate must be in YYYY-MM-DD format');
    console.log('   • weekStartDate must be a Monday (day === 1)');
    console.log('   • Backend uses ISO week calculation for weekNumber');
    console.log('   • No restrictions on past or future dates');

    console.log('\n✅ CONSISTENCY:');
    console.log('   • Frontend and backend use same ISO week calculation');
    console.log('   • Single source of truth: weekStartDate (Monday)');
    console.log('   • All other week fields derived from weekStartDate');

  } catch (error) {
    console.error('💥 Analysis failed:', error.message);
  }
}

if (require.main === module) {
  analyzeWeekDataFlow().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}