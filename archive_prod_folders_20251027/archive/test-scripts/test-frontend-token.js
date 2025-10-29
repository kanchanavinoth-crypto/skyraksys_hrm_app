// Quick browser console test to check token storage
console.log('=== TOKEN DEBUG ===');
console.log('accessToken:', localStorage.getItem('accessToken'));
console.log('token:', localStorage.getItem('token'));
console.log('refreshToken:', localStorage.getItem('refreshToken'));
console.log('==================');

// If accessToken exists, make a test request
const token = localStorage.getItem('accessToken');
if (token) {
  fetch('/api/projects', {
    headers: { Authorization: `Bearer ${token}` }
  })
  .then(response => {
    console.log('API Test Response Status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('API Test Response Data:', data);
  })
  .catch(error => {
    console.error('API Test Error:', error);
  });
} else {
  console.log('No accessToken found - please login first');
}