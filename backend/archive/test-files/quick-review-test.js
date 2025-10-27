const axios = require('axios').default;

const BASE_URL = 'http://localhost:8080/api';

const quickTest = async () => {
    console.log('🔍 **QUICK EMPLOYEE REVIEW API TEST**');
    console.log('=' .repeat(50));
    
    try {
        // Step 1: Login as admin
        console.log('\n1️⃣ Testing admin login...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@company.com',
            password: 'Kx9mP7qR2nF8sA5t'
        });
        
        const token = loginResponse.data.data?.accessToken || loginResponse.data.accessToken || loginResponse.data.token;
        console.log('✅ Admin login successful');
        console.log('📝 Token:', token ? 'Received' : 'Not received');
        console.log('📊 Response structure:', JSON.stringify(loginResponse.data, null, 2));
        
        if (!token) {
            console.log('❌ No token received, cannot proceed');
            return;
        }
        
        // Step 2: Test reviews endpoint
        console.log('\n2️⃣ Testing reviews endpoint...');
        try {
            const reviewsResponse = await axios.get(`${BASE_URL}/reviews`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Reviews endpoint working');
            console.log('📊 Response:', JSON.stringify(reviewsResponse.data, null, 2));
        } catch (error) {
            console.log('❌ Reviews endpoint failed:', error.response?.data || error.message);
        }
        
        // Step 3: Test creating a review
        console.log('\n3️⃣ Testing review creation...');
        try {
            const createResponse = await axios.post(`${BASE_URL}/reviews`, {
                employeeId: 1,
                reviewPeriod: 'Q1 2025',
                reviewType: 'quarterly',
                overallRating: 4.5,
                technicalSkills: 4.0,
                communication: 4.5,
                teamwork: 5.0,
                leadership: 3.5,
                punctuality: 4.8,
                achievements: 'Excellent performance in Q1 projects',
                areasForImprovement: 'Could improve in leadership skills',
                goals: 'Lead at least 2 projects in Q2',
                reviewerComments: 'Great employee with potential for growth'
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Review creation working');
            console.log('📊 Created review:', JSON.stringify(createResponse.data, null, 2));
        } catch (error) {
            console.log('❌ Review creation failed:', error.response?.data || error.message);
        }
        
        // Step 4: Test getting reviews again
        console.log('\n4️⃣ Testing reviews list after creation...');
        try {
            const reviewsResponse = await axios.get(`${BASE_URL}/reviews`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('✅ Reviews list working');
            console.log('📊 Total reviews:', reviewsResponse.data?.reviews?.length || 0);
        } catch (error) {
            console.log('❌ Reviews list failed:', error.response?.data || error.message);
        }
        
    } catch (error) {
        console.log('❌ Login failed:', error.response?.data || error.message);
    }
};

quickTest();
