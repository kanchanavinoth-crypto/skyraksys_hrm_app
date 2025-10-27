// Clear any existing tokens to ensure clean login
console.log('🔄 Clearing any existing authentication tokens...');
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');

console.log('✅ Tokens cleared!');
console.log('');
console.log('🔑 Please use these credentials to log in:');
console.log('📧 Email: admin@company.com');
console.log('🔒 Password: Kx9mP7qR2nF8sA5t');
console.log('');
console.log('💡 Instructions:');
console.log('1. Navigate to the login page in your frontend application');
console.log('2. Enter the credentials above');
console.log('3. Click login to authenticate');
console.log('');
console.log('✨ After login, you should have access to all dashboard features!');
