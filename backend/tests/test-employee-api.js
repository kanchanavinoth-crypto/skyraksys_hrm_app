const http = require('http');

async function testEmployeeAPI() {
  const employeeId = '85abf353-7dbb-4db0-9dee-41763eda008c';
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `/api/employees/${employeeId}`,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      // Note: In a real app, you'd need to include the auth token here
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response body:', data);
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.end();
}

testEmployeeAPI();
