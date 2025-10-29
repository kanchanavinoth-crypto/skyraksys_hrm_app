# 🚀 Modern Pay Management System - Quick Start Guide

## 📋 Table of Contents
1. [System Access](#system-access)
2. [Admin/HR Guide](#adminhr-guide)
3. [Employee Guide](#employee-guide)
4. [API Reference](#api-reference)
5. [Troubleshooting](#troubleshooting)

---

## 🔐 System Access

### Admin/HR Access
**URL**: `/payroll/manage`  
**Required Role**: `admin` or `hr`  
**Features**: Full payroll management capabilities

### Employee Access
**URL**: `/payslips/my`  
**Required Role**: `employee`  
**Features**: View and download own payslips

---

## 👨‍💼 Admin/HR Guide

### Step 1: Generate Payslips

#### Method A: Generate for Selected Employees
1. Navigate to **Payroll Management** → **Generate** tab
2. Select **Month** and **Year**
3. **Select employees** from the list
   - Use checkboxes to select individual employees
   - Or click "Select All" for all employees
4. Click **"Generate X Payslip(s)"**
5. Wait for confirmation message
6. Switch to **Overview** tab to see generated payslips

#### Method B: Generate for All Employees
1. Navigate to **Overview** tab
2. Select **Month**, **Year**, and optionally **Department**
3. Click **"Generate Payslips"** → **"Generate All"**
4. Confirm the action
5. System will generate payslips for all active employees

---

### Step 2: Review Payslips

1. Go to **Overview** tab
2. Use filters:
   - **Month**: Select pay period month
   - **Year**: Select pay period year
   - **Status**: Filter by Draft/Finalized/Paid
   - **Department**: Filter by department
3. View payslip list in table
4. Click **👁 View** icon to see details

**Payslip Details Include**:
- Employee information
- Earnings breakdown
- Deductions breakdown
- Gross earnings, total deductions, net pay
- Net pay in words
- Attendance summary (if available)

---

### Step 3: Finalize Payslips

**What is Finalize?**
- Locks the payslip to prevent modifications
- Changes status from "Draft" to "Finalized"
- Required before marking as paid

**How to Finalize**:
1. Find payslip with status **"Draft"**
2. Click **🔒 Lock** icon (Finalize button)
3. Confirm the action
4. Status changes to **"Finalized"**

**Bulk Finalize**:
- Select multiple payslips (checkbox)
- Click **"Bulk Finalize"** button
- All selected draft payslips will be finalized

---

### Step 4: Mark as Paid

**When to use?**
- After you've processed salary payments
- Only for payslips with status "Finalized"

**How to Mark as Paid**:
1. Find payslip with status **"Finalized"**
2. Click **💳 Payment** icon
3. Confirm the action
4. Status changes to **"Paid"**
5. Payslip is fully locked

---

### Step 5: Download & Export

#### Download Individual PDF
1. Click **📥 Download** icon next to any payslip
2. PDF will download automatically
3. File name: `payslip-PS202410EMP001.pdf`

#### Export All to Excel
1. Set filters (month, year, department)
2. Click **"Export Excel"** button
3. Excel file downloads with all filtered payslips
4. File name: `payslips-10-2024.xlsx`

**Excel Contains**:
- Employee ID
- Employee Name
- Pay Period
- Gross Earnings
- Total Deductions
- Net Pay
- Status

---

### Step 6: View Reports

1. Go to **Reports** tab (or use Overview stats)
2. Select **Month** and **Year**
3. View summary:
   - Total payslips
   - Count by status (Draft, Finalized, Paid)
   - Total payout amount
   - Department-wise breakdown
4. Export reports as needed

---

## 👨‍💼 Employee Guide

### View Your Payslips

1. Login to the system
2. Navigate to **"My Payslips"** or `/payslips/my`
3. See list of all your payslips
4. Use filters:
   - **Year**: Select year
   - **Month**: All months shown by default

---

### View Payslip Details

1. Click **👁 View** icon on any payslip
2. Dialog opens with complete details:
   - **Employee Information**: Your ID, name, designation, department
   - **Pay Period**: Month and year
   - **Earnings**: All earning components with amounts
   - **Deductions**: All deductions with amounts
   - **Summary**: Gross, Total Deductions, Net Pay
   - **In Words**: Net pay amount in words

---

### Download PDF

1. Click **📥 Download** icon
2. Or open details dialog and click **"Download PDF"**
3. PDF file downloads
4. Open and view your official payslip

**PDF Contains**:
- Company header
- Employee details
- Earnings and deductions table
- Net pay (highlighted)
- Net pay in words
- Attendance summary
- Computer-generated disclaimer

---

## 🔌 API Reference

### For Developers

Base URL: `/api/payslips`

### Public Endpoints (Authenticated)

#### Get My Payslips
```http
GET /api/payslips/my
```
**Query Params**:
- `month`: Integer (1-12)
- `year`: Integer (2020-2030)
- `page`: Integer (default: 1)
- `limit`: Integer (default: 20)

**Response**:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalRecords": 45
  }
}
```

#### Get Payslip by ID
```http
GET /api/payslips/:id
```

#### Download PDF
```http
GET /api/payslips/:id/pdf
```
**Response**: PDF file (binary)

---

### Admin/HR Endpoints

#### Generate Payslips
```http
POST /api/payslips/generate
```
**Body**:
```json
{
  "employeeIds": ["uuid1", "uuid2"],
  "month": 10,
  "year": 2024,
  "templateId": "uuid" // optional
}
```

#### Finalize Payslip
```http
PUT /api/payslips/:id/finalize
```

#### Mark as Paid
```http
PUT /api/payslips/:id/mark-paid
```

#### Export to Excel
```http
GET /api/payslips/reports/export?month=10&year=2024&format=xlsx
```

#### Get Summary Report
```http
GET /api/payslips/reports/summary?month=10&year=2024
```

---

## 🐛 Troubleshooting

### Issue: "No active salary structure found"

**Cause**: Employee doesn't have an active salary structure

**Solution**:
1. Go to Employee Management
2. Open employee profile
3. Navigate to **Compensation** tab
4. Add or activate salary structure
5. Ensure "Active" checkbox is checked
6. Save changes
7. Retry payslip generation

---

### Issue: "Payslip already exists for this period"

**Cause**: Payslip already generated for this employee-month-year

**Solutions**:
1. **View existing payslip** instead of regenerating
2. **Delete existing payslip** (if in draft):
   - Find the payslip
   - Click delete/cancel
   - Regenerate
3. **Use different month/year**

---

### Issue: Calculation seems incorrect

**Check**:
1. **Salary Structure**: Verify basic salary, allowances, deductions
2. **Attendance Data**: Check timesheets are approved
3. **Leave Days**: Verify approved leaves
4. **Working Days**: System calculates excluding weekends

**Formula**:
```
Gross Salary = (Basic Salary / Working Days) × Paid Days
Paid Days = Present Days + Approved Leave Days
```

---

### Issue: PDF not downloading

**Solutions**:
1. **Check browser pop-up settings**: Allow pop-ups for this site
2. **Clear browser cache**: Ctrl+Shift+Delete
3. **Try different browser**: Chrome, Firefox, Edge
4. **Check file downloads folder**: May have downloaded already

---

### Issue: Cannot finalize payslip

**Possible Causes**:
1. **Status not Draft**: Only draft payslips can be finalized
2. **Already Finalized**: Check current status
3. **Insufficient Permissions**: Requires Admin/HR role

---

### Issue: Excel export is empty

**Solutions**:
1. **Check filters**: Verify month, year, department filters
2. **No payslips exist**: Generate payslips first
3. **Browser compatibility**: Use Chrome or Firefox

---

## 📞 Support

### Need Help?

**Technical Issues**:
- Check browser console for errors (F12)
- Check network tab for failed API calls
- Take screenshot of error message

**Calculation Questions**:
- Refer to salary structure
- Check attendance records
- Review statutory rates (PF, ESIC, PT, TDS)

**Process Questions**:
- Re-read this guide
- Check implementation documentation
- Contact system administrator

---

## 🎓 Best Practices

### For Admin/HR

1. **Review Before Finalizing**
   - Always review draft payslips before finalizing
   - Verify calculations for new employees
   - Check attendance data is complete

2. **Generate on Time**
   - Generate payslips before month-end
   - Allow time for review and corrections
   - Finalize after salary processing

3. **Keep Records**
   - Download PDFs for archives
   - Export Excel for reporting
   - Maintain backup copies

4. **Regular Checks**
   - Verify all employees have salary structures
   - Ensure timesheets are approved on time
   - Update statutory rates annually

---

### For Employees

1. **Regular Checks**
   - Check payslips every month
   - Verify earnings and deductions
   - Download and save PDFs

2. **Report Issues**
   - Immediately report discrepancies
   - Check attendance records
   - Verify leave applications

---

## ✅ Checklist for Payroll Processing

### Monthly Payroll Checklist

- [ ] Month-end: Ensure all timesheets approved
- [ ] Verify all leave requests processed
- [ ] Check all employees have active salary structures
- [ ] Generate draft payslips
- [ ] Review calculations
- [ ] Make necessary adjustments
- [ ] Finalize payslips
- [ ] Process salary payments
- [ ] Mark payslips as paid
- [ ] Download PDFs for records
- [ ] Export Excel report
- [ ] Archive documents

---

## 🎉 You're Ready!

You now have everything you need to use the **Modern Pay Management System**.

**Quick Actions**:
- **Admin/HR**: Go to `/payroll/manage` to start
- **Employees**: Go to `/payslips/my` to view your payslips

**Questions?** Refer to the detailed implementation documentation.

---

*Last Updated: October 26, 2025*  
*System Version: 2.0*
