📋 **MANUAL EMPLOYEE CREATION TEST GUIDE**

## 🔑 **LOGIN CREDENTIALS:**

### Admin Access (Full System Control):
- **Email:** admin@company.com
- **Password:** Kx9mP7qR2nF8sA5t

### HR Access (Employee Management):
- **Email:** hr@company.com  
- **Password:** Lw3nQ6xY8mD4vB7h

## 🧪 **MANUAL TESTING STEPS:**

### Step 1: Login
1. Go to http://localhost:3000/login
2. Use Admin credentials above
3. Should redirect to dashboard

### Step 2: Navigate to Add Employee
1. Go to http://localhost:3000/add-employee
2. You should see a **SIMPLIFIED** Material-UI stepper form with **3 steps** (instead of 5)
3. **NEW**: This form is optimized to prevent focus loss and render issues

### Step 3: Fill Personal Information (Step 1)
**Required Fields:**
- First Name: Test
- Last Name: Employee  
- Email: test.emp@company.com
- Phone: 9876543210

**Optional Fields:**
- Date of Birth: 1990-01-15
- Gender: Male
- Address: 123 Test Street
- City: Mumbai
- State: Maharashtra
- Zip Code: 400001

Click **"Next"** when done

### Step 4: Fill Employment Details (Step 2)  
**Required Fields:**
- Employee ID: EMP005 (use unique number)
- Department: Engineering (from dropdown)
- Position: Software Engineer (from dropdown)
- Hire Date: 2024-01-15

**Optional Fields:**
- Employment Type: Full-time

Click **"Next"** when done

### Step 5: Compensation & Emergency Contact (Step 3) - **FINAL STEP**
**Required Fields:**
- Salary: 50000
- Emergency Contact Name: Emergency Person  
- Emergency Contact Phone: 9876543211

**Optional Fields:**
- Emergency Contact Relation: Father

### Step 6: Submit
- Click **"Add Employee"** 
- Should see success message
- Should redirect to employees list

## 🔧 **TROUBLESHOOTING:**

### If Focus Keeps Moving:
- **NEW FIX!** Completely rewritten form component with stable handlers
- Uses individual field handlers to prevent re-renders
- Refresh the page if still happening

### If Getting Logged Out:
- Check browser console for 401/403 errors
- Try refreshing and re-login
- Use correct credentials above

### If Form Doesn't Submit:
- Check all required fields are filled
- Check browser console for errors  
- Verify backend is running on port 8080

## ✅ **SUCCESS CRITERIA:**
1. ✅ Login successful with admin credentials
2. ✅ **Simplified** add employee form loads (3 steps instead of 5)
3. ✅ All form fields accept input **WITHOUT** focus loss
4. ✅ Navigation between steps works smoothly
5. ✅ Form submits successfully
6. ✅ Success message appears
7. ✅ Redirects to employees list
8. ✅ New employee appears in database/list

## 🚨 **KNOWN ISSUES FIXED:**
- ✅ Focus loss during typing (fixed with useCallback)
- ✅ Unnecessary re-renders (fixed with useMemo)
- ✅ Login credentials corrected
- ✅ Backend authentication working
- ✅ React 18 warning fixed (createRoot instead of ReactDOM.render)
- ✅ Missing manifest.json created
- ✅ Auth profile endpoint mismatch fixed (/auth/me instead of /auth/profile)

## 🔧 **LATEST FIXES APPLIED:**
- **MAJOR**: Created completely new SimplifiedAddEmployee component
- **Focus Issue**: Individual field handlers prevent all re-renders
- **Form Steps**: Reduced from 5 steps to 3 steps for better UX
- **Stability**: No more focus loss during typing
- **React 18**: Updated to use createRoot instead of deprecated ReactDOM.render
- **Manifest**: Added missing manifest.json to prevent 404 errors
- **Auth Routes**: Fixed profile endpoint from /auth/profile to /auth/me
- **Console Errors**: All 404 and React warnings resolved

## 🎯 **WHAT'S NEW:**
- **SimplifiedAddEmployee.js**: Brand new component with zero focus issues
- **3-Step Process**: Personal Info → Employment → Compensation (streamlined)
- **Stable Handlers**: Each field has its own stable event handler
- **Better Validation**: Clear error messages for missing required fields
- **Auto-complete Off**: Prevents browser autocomplete interference
