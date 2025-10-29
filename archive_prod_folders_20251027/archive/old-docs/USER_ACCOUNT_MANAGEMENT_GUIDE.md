# User Account Management - Quick Start Guide

## 🎯 How to Access User Account Management

### Method 1: From Employee List
```
1. Navigate to /employees
2. Find the employee you want to manage
3. Click the 🔑 (key) icon in the Actions column
4. You'll be taken to the User Account Management page
```

### Method 2: From Employee Profile
```
1. Navigate to /employees/:id (any employee profile)
2. Look for the "User Account" button in the header
3. Click it to navigate to User Account Management page
```

## 🔐 User Account Management Page Features

### Page Layout
```
┌─────────────────────────────────────────────────────────┐
│ Breadcrumbs: Employees > John Doe > User Account       │
├─────────────────────────────────────────────────────────┤
│ 🔐 User Account Management            [Back to List]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌──────────────────────┐  ┌─────────────────────────┐ │
│ │ Employee Info        │  │ User Account Status     │ │
│ │ • Avatar             │  │ ✓ Active Account        │ │
│ │ • Name & ID          │  │ Login: user@example.com │ │
│ │ • Email              │  │ Role: [Admin Badge]     │ │
│ │ • Department         │  │ Status: Active          │ │
│ │ • Position           │  │ Password: Set           │ │
│ │                      │  │                         │ │
│ │                      │  │ [Manage User Account]   │ │
│ └──────────────────────┘  └─────────────────────────┘ │
│                                                         │
│ ┌───────────────────────────────────────────────────┐ │
│ │ 🛡️ Security & Access Information                  │ │
│ │ [1 Active] [✓ Can Login] [ADMIN] [ON]            │ │
│ └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 🎨 Visual Indicators

### Role Badges
- 🔴 **Admin** - Red badge with shield icon
- 🟠 **HR** - Orange badge with security icon
- 🔵 **Manager** - Blue badge with badge icon
- ⚪ **Employee** - Gray badge with person icon

### Account Status
- ✅ **Active Account** - Green success alert
- ⚠️ **No Account** - Orange warning alert
- 🔑 **Password Must Change** - Yellow chip
- ✓ **Password Set** - Green chip

## 🛠️ Available Actions

### When Account Exists
1. **Manage User Account** button opens dialog:
   - Change user role (Admin/HR/Manager/Employee)
   - Update login email
   - Reset password
   - Generate random password
   - Force password change on next login
   - Disable/Enable login

### When No Account Exists
1. **Create User Account** button opens dialog:
   - Enable login toggle
   - Set user role
   - Set login email
   - Set initial password
   - Force password change option

## 🔄 User Flows

### Creating a New User Account
```
1. Click "Create User Account"
2. Toggle "Enable User Login" to ON
3. Select user role (Employee/Manager/HR/Admin)
4. Enter login email
5. Set password (or use "Generate Random Password")
6. Toggle "Force password change on first login"
7. Click "Setup Account"
8. Page refreshes with updated account status
```

### Updating Existing Account
```
1. Click "Manage User Account"
2. Modify role, email, or password as needed
3. Use "Generate Random Password" for new password
4. Use "Reset to Default Password" (password123)
5. Click "Update Account"
6. Page refreshes with updated account status
```

### Disabling User Access
```
1. Click "Manage User Account"
2. Toggle "Enable User Login" to OFF
3. Click "Update Account"
4. User is immediately logged out
5. Page shows "No Account" status
```

## 🔒 Permissions

### Who Can Access?
- ✅ **Admin** - Full access
- ✅ **HR** - Full access
- ❌ **Manager** - No access (redirected)
- ❌ **Employee** - No access (redirected)

### What They Can Do?
| Action | Admin | HR | Manager | Employee |
|--------|-------|----|---------|---------| 
| View page | ✅ | ✅ | ❌ | ❌ |
| Create account | ✅ | ✅ | ❌ | ❌ |
| Update role | ✅ | ✅ | ❌ | ❌ |
| Reset password | ✅ | ✅ | ❌ | ❌ |
| Disable access | ✅ | ✅ | ❌ | ❌ |

## 📱 Navigation Shortcuts

### Quick Access URLs
```
Direct URL Pattern:
/employees/:id/user-account

Examples:
/employees/123/user-account
/employees/emp001/user-account
```

### Breadcrumb Navigation
```
Employees → [Employee Name] → User Account
    ↓            ↓                  ↓
  /employees  /employees/:id  /employees/:id/user-account
```

## ⚡ Quick Tips

### Password Management
- Default password after reset: `password123`
- Minimum password length: 6 characters
- Use "Generate Random Password" for secure passwords
- Always enable "Force password change" for new accounts

### Role Selection
- **Employee**: Basic access to personal info
- **Manager**: Can manage team and approve requests
- **HR**: Can manage all employees and HR processes
- **Admin**: Full system access and settings

### Best Practices
1. Always force password change for new accounts
2. Use strong passwords (generated is best)
3. Review role permissions before assigning
4. Check account status after changes
5. Use breadcrumbs for easy navigation

## 🐛 Troubleshooting

### Button Not Visible?
- Check if you're logged in as Admin or HR
- Regular employees/managers won't see the button

### Page Redirects?
- Only Admin and HR can access this page
- You'll be redirected to /employees with error message

### Changes Not Saving?
- Check console for error messages
- Verify network connection
- Ensure password meets minimum requirements
- Confirm passwords match

### Account Status Not Updating?
- Refresh the page after dialog closes
- Check if changes were saved successfully
- Verify API response in network tab

## 🎓 Training Scenarios

### Scenario 1: New Employee Onboarding
```
1. Admin creates employee record
2. Navigates to User Account Management
3. Creates user account with Employee role
4. Sets temporary password
5. Enables "Force password change"
6. Employee receives credentials
7. Employee logs in and sets new password
```

### Scenario 2: Promotion to Manager
```
1. HR navigates to employee's User Account page
2. Clicks "Manage User Account"
3. Changes role from Employee to Manager
4. Saves changes
5. Employee now has manager permissions
```

### Scenario 3: Employee Exit
```
1. HR navigates to User Account page
2. Clicks "Manage User Account"
3. Disables login
4. User immediately loses access
5. Account shows "No Account" status
```

---

## 🚀 Getting Started

**First Time?**
1. Log in as Admin or HR
2. Go to Employees list (/employees)
3. Click the 🔑 icon next to any employee
4. Explore the User Account Management page
5. Try creating or updating an account

**Need Help?**
- Check the comprehensive documentation in `USER_ACCOUNT_MANAGEMENT_SEPARATION.md`
- Contact system administrator for access issues
- Review role permissions in the main documentation

---

**Last Updated:** 2025-10-24  
**Version:** 2.0.0  
**Status:** Production Ready ✅
