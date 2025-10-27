// Quick Employee Access Diagnostic
// Run this in browser console (F12) to diagnose access issues

function diagnoseEmployeeAccess() {
    console.log('🔍 Employee Access Diagnostic Tool\n');
    
    // Check 1: Authentication Token
    const token = localStorage.getItem('accessToken');
    console.log('1. Authentication Check:');
    if (token) {
        console.log('✅ Token found in localStorage');
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('   User ID:', payload.userId);
            console.log('   Employee ID:', payload.employeeId);
            console.log('   Role:', payload.role);
            console.log('   Expires:', new Date(payload.exp * 1000).toLocaleString());
            
            if (payload.exp * 1000 < Date.now()) {
                console.log('❌ Token is EXPIRED - Please login again');
            } else {
                console.log('✅ Token is valid');
            }
        } catch (e) {
            console.log('❌ Invalid token format');
        }
    } else {
        console.log('❌ No authentication token found - Please login');
        return;
    }
    
    // Check 2: Current URL and Employee ID
    console.log('\n2. URL Analysis:');
    const currentUrl = window.location.href;
    const pathParts = window.location.pathname.split('/');
    const employeeIdFromUrl = pathParts[pathParts.length - 1];
    
    console.log('   Current URL:', currentUrl);
    console.log('   Employee ID from URL:', employeeIdFromUrl);
    
    if (employeeIdFromUrl && employeeIdFromUrl.length > 30) {
        console.log('✅ Employee ID format looks correct (UUID)');
    } else {
        console.log('⚠️  Employee ID might be invalid or missing');
    }
    
    // Check 3: Network Connectivity
    console.log('\n3. Testing Backend Connectivity:');
    fetch('http://localhost:8080/api/health')
        .then(response => {
            if (response.ok) {
                console.log('✅ Backend server is reachable');
                return response.json();
            } else {
                console.log('❌ Backend server returned error:', response.status);
            }
        })
        .then(data => {
            if (data) {
                console.log('   Backend status:', data.status);
            }
        })
        .catch(error => {
            console.log('❌ Cannot reach backend server:', error.message);
        });
    
    // Check 4: Test Employee API with current token
    console.log('\n4. Testing Employee API Access:');
    if (employeeIdFromUrl && token) {
        fetch(`http://localhost:8080/api/employees/${employeeIdFromUrl}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            console.log('   API Response Status:', response.status);
            if (response.status === 200) {
                console.log('✅ Employee data accessible');
            } else if (response.status === 401) {
                console.log('❌ Authentication failed - Please login again');
            } else if (response.status === 403) {
                console.log('❌ Access denied - Insufficient permissions');
                console.log('   Check your role permissions for this employee');
            } else if (response.status === 404) {
                console.log('❌ Employee not found - Invalid employee ID');
            } else {
                console.log('❌ Unexpected error:', response.status);
            }
            return response.json();
        })
        .then(data => {
            if (data && !data.success) {
                console.log('   Error message:', data.message);
            }
        })
        .catch(error => {
            console.log('❌ API request failed:', error.message);
        });
    }
    
    // Check 5: Local Storage Data
    console.log('\n5. Browser Storage Check:');
    const refreshToken = localStorage.getItem('refreshToken');
    console.log('   Access Token:', token ? 'Present' : 'Missing');
    console.log('   Refresh Token:', refreshToken ? 'Present' : 'Missing');
    
    // Check 6: Recommended Actions
    console.log('\n6. Recommended Actions:');
    if (!token) {
        console.log('🔧 Go to login page and sign in');
    } else {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 < Date.now()) {
            console.log('🔧 Token expired - Logout and login again');
        } else if (payload.role === 'employee') {
            console.log('🔧 Employee role - Can only access own profile');
            console.log('   Your employee ID:', payload.employeeId);
            console.log('   Trying to access:', employeeIdFromUrl);
            if (payload.employeeId !== employeeIdFromUrl) {
                console.log('❌ Access denied - You can only view your own profile');
            }
        } else {
            console.log('🔧 Higher role detected - Should have broader access');
            console.log('   If still getting errors, contact system administrator');
        }
    }
    
    console.log('\n📞 Support Information:');
    console.log('If issues persist after trying the recommended actions:');
    console.log('1. Take a screenshot of this diagnostic output');
    console.log('2. Note the specific error message you see on screen');
    console.log('3. Contact your system administrator or HR department');
}

// Auto-run diagnostic
diagnoseEmployeeAccess();

console.log('\n💡 To run this diagnostic again, type: diagnoseEmployeeAccess()');