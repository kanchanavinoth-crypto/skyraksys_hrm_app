# SQL Console - Query Templates Feature

## 🎯 New Feature: Pre-Built Query Templates

The SQL Console now includes **12 pre-built query templates** to help users quickly execute common database operations without writing SQL from scratch.

---

## 📋 Available Query Templates

### 1. 📋 View All Employees
**Purpose:** List all employees with basic information

**Query:**
```sql
SELECT id, "employeeId", "firstName", "lastName", email, status 
FROM employees 
LIMIT 20;
```

**Use Case:** Quick overview of employee records

---

### 2. 👤 Create New User
**Purpose:** Create a new user account

**Query:**
```sql
INSERT INTO users ("firstName", "lastName", email, password, role, "isActive", "createdAt", "updatedAt") 
VALUES ('John', 'Doe', 'john.doe@company.com', '$2b$10$hashedpassword', 'employee', true, NOW(), NOW());
```

**Use Case:** Add new user accounts for testing
**Note:** Requires proper password hashing (use bcrypt)

---

### 3. 🏢 View Departments with Counts
**Purpose:** List all departments with employee counts

**Query:**
```sql
SELECT d.id, d.name, d.description, COUNT(e.id) as employee_count 
FROM departments d 
LEFT JOIN employees e ON e."departmentId" = d.id 
GROUP BY d.id, d.name, d.description 
ORDER BY employee_count DESC;
```

**Use Case:** Analyze department sizes

---

### 4. 💼 View Positions with Counts
**Purpose:** List all positions with employee counts

**Query:**
```sql
SELECT p.id, p.title, p.level, COUNT(e.id) as employee_count 
FROM positions p 
LEFT JOIN employees e ON e."positionId" = p.id 
GROUP BY p.id, p.title, p.level 
ORDER BY employee_count DESC;
```

**Use Case:** Analyze position distribution

---

### 5. 🏖️ Pending Leave Requests
**Purpose:** Show all pending leave requests

**Query:**
```sql
SELECT lr.id, e."firstName", e."lastName", lr."leaveType", lr."startDate", lr."endDate", lr."numberOfDays", lr.reason 
FROM leave_requests lr 
JOIN employees e ON lr."employeeId" = e.id 
WHERE lr.status = 'Pending' AND lr."deletedAt" IS NULL 
ORDER BY lr."startDate" DESC;
```

**Use Case:** Review pending leave requests quickly

---

### 6. ⏰ Recent Timesheets
**Purpose:** View recent timesheet submissions

**Query:**
```sql
SELECT t.id, e."firstName", e."lastName", t."weekNumber", t.year, t.status, t."totalHours", t."submittedAt" 
FROM timesheets t 
JOIN employees e ON t."employeeId" = e.id 
WHERE t."deletedAt" IS NULL 
ORDER BY t.year DESC, t."weekNumber" DESC 
LIMIT 20;
```

**Use Case:** Monitor timesheet submissions

---

### 7. 💰 Recent Payslips
**Purpose:** View recent payslips

**Query:**
```sql
SELECT p.id, e."firstName", e."lastName", p.month, p.year, p."grossSalary", p."netSalary", p.status 
FROM payslips p 
JOIN employees e ON p."employeeId" = e.id 
WHERE p."deletedAt" IS NULL 
ORDER BY p.year DESC, p.month DESC 
LIMIT 20;
```

**Use Case:** Check payroll processing

---

### 8. 📊 Employee Statistics
**Purpose:** Get employee statistics by status and gender

**Query:**
```sql
SELECT 
  COUNT(*) as total_employees,
  COUNT(CASE WHEN status = 'Active' THEN 1 END) as active,
  COUNT(CASE WHEN status = 'Inactive' THEN 1 END) as inactive,
  COUNT(CASE WHEN gender = 'Male' THEN 1 END) as male,
  COUNT(CASE WHEN gender = 'Female' THEN 1 END) as female
FROM employees 
WHERE "deletedAt" IS NULL;
```

**Use Case:** Dashboard metrics and reporting

---

### 9. 🔐 Active User Accounts
**Purpose:** List all active users with last login

**Query:**
```sql
SELECT u.id, u."firstName", u."lastName", u.email, u.role, u."lastLoginAt", e."employeeId" 
FROM users u 
LEFT JOIN employees e ON u.id = e."userId" 
WHERE u."isActive" = true AND u."deletedAt" IS NULL 
ORDER BY u."lastLoginAt" DESC NULLS LAST;
```

**Use Case:** Monitor user activity and access

---

### 10. 🗄️ Database Tables
**Purpose:** List all database tables with column counts

**Query:**
```sql
SELECT table_name, 
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count 
FROM information_schema.tables t 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE' 
ORDER BY table_name;
```

**Use Case:** Database structure exploration

---

### 11. 🔍 Search Employee by Email
**Purpose:** Search employees by email pattern

**Query:**
```sql
SELECT id, "employeeId", "firstName", "lastName", email, "phoneNumber", status 
FROM employees 
WHERE email ILIKE '%@%' AND "deletedAt" IS NULL 
LIMIT 10;
```

**Use Case:** Find employees by email (modify the pattern as needed)

---

## 🎨 UI Components

### Query Template Dropdown
**Location:** Above SQL query text box

**Features:**
- 📝 Native dropdown with 12+ templates
- 🔍 Descriptive labels with emojis
- 📖 Helper text explaining purpose
- 🖱️ One-click query loading

### SQL Query Text Box
**Features:**
- 📄 Multi-line input (8 rows)
- ✏️ Editable after template selection
- 💡 Helper text for guidance
- 🧹 Clear button to reset

### Action Buttons
- ▶️ **Execute Query** - Run the SQL
- 🧹 **Clear** - Clear the text box

---

## 🚀 How to Use

### Step 1: Select Template
1. Navigate to **SQL Console** tab
2. Click the **Query Templates** dropdown
3. Select a template (e.g., "📋 View All Employees")

### Step 2: Modify (Optional)
1. Query automatically populates in text box
2. Modify as needed (change LIMIT, add WHERE, etc.)
3. Syntax highlighting not available (plain text)

### Step 3: Execute
1. Click **Execute Query** button
2. Results appear below in JSON format
3. Row count displayed

### Step 4: Clear (Optional)
1. Click **Clear** button to reset
2. Select new template or write custom query

---

## 💡 Usage Examples

### Example 1: Create Test User
```
1. Select: "👤 Create New User"
2. Modify: Change name, email, role
3. Important: Hash password first (use bcrypt)
4. Execute
```

### Example 2: Find Employees in Department
```
1. Select: "📋 View All Employees"
2. Modify: Add WHERE "departmentId" = 1
3. Execute
```

### Example 3: Check Pending Approvals
```
1. Select: "🏖️ Pending Leave Requests"
2. Execute (no modification needed)
3. Review results
```

---

## ⚙️ Technical Implementation

### Frontend Component
**File:** `frontend/src/components/admin/AdminDebugPanel.js`

**State Management:**
```javascript
const [sqlQuery, setSqlQuery] = useState('');
```

**Template Array:**
```javascript
const sqlTemplates = [
  { label: 'Template Name', value: 'SQL Query', description: 'Purpose' },
  // ... more templates
];
```

**Handler Function:**
```javascript
const handleTemplateSelect = (event) => {
  const selectedValue = event.target.value;
  if (selectedValue) {
    setSqlQuery(selectedValue);
  }
};
```

**UI Component:**
```javascript
<TextField
  select
  fullWidth
  label="📝 Query Templates"
  helperText="Select a pre-built query template to get started"
  onChange={handleTemplateSelect}
  SelectProps={{ native: true }}
>
  {sqlTemplates.map((template, index) => (
    <option key={index} value={template.value}>
      {template.label}
    </option>
  ))}
</TextField>
```

---

## 🔒 Security Features

### Built-in Protection
All queries are still subject to backend validation:

1. ✅ **Blocked Keywords:**
   - DROP DATABASE
   - DROP TABLE
   - TRUNCATE
   - ALTER TABLE

2. ✅ **Development Only:**
   - Only works when `NODE_ENV=development`
   - Automatically disabled in production

3. ✅ **Row Limits:**
   - Templates include LIMIT clauses
   - Prevents massive data dumps

---

## 📊 Template Categories

### Data Viewing (Read-Only)
- View All Employees
- View Departments with Counts
- View Positions with Counts
- Pending Leave Requests
- Recent Timesheets
- Recent Payslips
- Active User Accounts
- Database Tables
- Search Employee by Email

### Data Analysis
- Employee Statistics

### Data Modification
- Create New User (requires caution)

---

## 🎯 Benefits

### For Developers
- ✅ Quick testing without writing SQL
- ✅ Common operations pre-written
- ✅ Learn PostgreSQL syntax from examples
- ✅ Reduce typing errors

### For Admins
- ✅ No SQL knowledge required for basic tasks
- ✅ Safe starting points (templates include limits)
- ✅ Faster troubleshooting
- ✅ Consistent query patterns

### For Testing
- ✅ Seed data with user creation
- ✅ Verify data integrity
- ✅ Check relationships
- ✅ Debug issues quickly

---

## 🔮 Future Enhancements

Possible improvements:
1. 🎨 Syntax highlighting in query editor
2. 📋 Copy query to clipboard button
3. 💾 Save custom queries
4. 📊 Export results to CSV
5. 🔁 Query history
6. 📝 Query favorites/bookmarks
7. 🎓 Query builder (visual)
8. 📖 Query explanation (what it does)

---

## 🧪 Testing

### Test Template Selection
```
1. Go to SQL Console tab
2. Click dropdown
3. Select each template
4. Verify query populates correctly
5. Execute and check results
```

### Test Query Modification
```
1. Select a template
2. Modify the query (add WHERE, change LIMIT)
3. Execute modified query
4. Verify results match changes
```

### Test Clear Functionality
```
1. Select a template
2. Click Clear button
3. Verify text box is empty
4. Select another template
```

---

## 📝 Example Modifications

### Template: View All Employees
**Original:**
```sql
SELECT id, "employeeId", "firstName", "lastName", email, status 
FROM employees 
LIMIT 20;
```

**Modified to find specific department:**
```sql
SELECT id, "employeeId", "firstName", "lastName", email, status 
FROM employees 
WHERE "departmentId" = 1
LIMIT 20;
```

**Modified to find active only:**
```sql
SELECT id, "employeeId", "firstName", "lastName", email, status 
FROM employees 
WHERE status = 'Active' AND "deletedAt" IS NULL
LIMIT 50;
```

---

## 🎓 Learning Resource

These templates serve as **SQL learning examples** showing:
- ✅ JOIN syntax
- ✅ Aggregate functions (COUNT, SUM)
- ✅ GROUP BY usage
- ✅ ORDER BY patterns
- ✅ WHERE conditions
- ✅ PostgreSQL-specific syntax (ILIKE, NULLS LAST)

---

## 📚 Summary

**Total Templates:** 12
**Categories:** Data Viewing (9), Analysis (1), Modification (1), Utility (1)

**Features:**
- ✅ One-click query loading
- ✅ Editable after selection
- ✅ Safety measures enforced
- ✅ Helper text for guidance
- ✅ Clear button to reset

**Use Cases:**
- Quick data inspection
- User account creation
- Leave request review
- Timesheet monitoring
- Payroll verification
- Database exploration

---

**Last Updated:** October 24, 2025
**Status:** ✅ Implemented and Ready
**Location:** SQL Console Tab (Tab 9)
