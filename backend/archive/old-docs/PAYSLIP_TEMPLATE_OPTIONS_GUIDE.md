no# 📝 Payslip Template Options - Complete Guide

**Feature Status**: ✅ **IMPLEMENTED AND ACTIVE**  
**Date**: October 26, 2025

---

## 🎯 Overview

The Modern Pay Management System now includes **comprehensive payslip template management**, allowing Admin/HR to:
- Use the default Indian statutory template
- Create custom templates
- Select templates during payslip generation
- Configure template fields, styling, and layout

---

## 📋 Default Template Features

### Company Information Fields
- Company Name
- Address, City, State, Pincode
- PAN Number
- TAN Number
- PF Number
- ESIC Number
- Company Logo support

### Employee Information Fields
- Employee ID
- Full Name
- Designation
- Department
- Date of Joining
- PAN Number
- UAN Number (Universal Account Number for PF)
- PF Number
- ESI Number
- Bank Account Number
- Bank Name

### Pay Period Information
- Pay Period (e.g., "October 2025")
- Pay Period Start Date
- Pay Period End Date
- Pay Date
- Payslip Number (auto-generated)

### Earnings Section (11 Fields)
1. **Basic Salary** ✅ Required
2. **House Rent Allowance (HRA)** ✅ Required
3. **Transport Allowance** ⭕ Optional
4. **Medical Allowance** ⭕ Optional
5. **Food Allowance** ⭕ Optional
6. **Communication Allowance** ⭕ Optional
7. **Special Allowance** ⭕ Optional
8. **Other Allowances** ⭕ Optional
9. **Overtime Pay** ⭕ Optional
10. **Bonus** ⭕ Optional
11. **Arrears** ⭕ Optional

**Gross Earnings**: Automatic sum of all earnings

### Deductions Section (9 Fields)
1. **Provident Fund (PF)** ✅ Required
2. **ESI Contribution** ⭕ Optional
3. **Professional Tax** ✅ Required
4. **TDS (Income Tax)** ⭕ Optional
5. **Loan/Advance Deduction** ⭕ Optional
6. **Medical Insurance** ⭕ Optional
7. **NPS Contribution** ⭕ Optional
8. **Voluntary PF** ⭕ Optional
9. **Other Deductions** ⭕ Optional

**Total Deductions**: Automatic sum of all deductions

### Attendance Summary
- Total Working Days
- Present Days
- Absent Days
- LOP (Loss of Pay) Days
- Paid Days
- Overtime Hours
- Weekly Offs
- Holidays

### Summary Section
- **Gross Earnings** (bold)
- **Total Deductions** (bold)
- **Net Pay** (bold & highlighted)
- **Net Pay in Words** (Indian format: crores, lakhs, thousands)

### Footer Elements
- Generation Date
- Disclaimer: "This is a computer-generated payslip and does not require a signature."
- Company Signature (optional)

### Styling Configuration
- **Primary Color**: #2196F3 (Blue)
- **Secondary Color**: #FFC107 (Amber)
- **Font Family**: Arial, sans-serif
- **Font Size**: 12px
- **Header Background**: #f5f5f5 (Light gray)
- **Border Color**: #ddd

---

## 🎨 Template Management API

### Available Endpoints

| Endpoint | Method | Purpose | Access |
|----------|--------|---------|--------|
| `/api/payslip-templates` | GET | List all templates | Admin/HR |
| `/api/payslip-templates/active` | GET | Get active templates only | Admin/HR |
| `/api/payslip-templates/:id` | GET | Get single template | Admin/HR |
| `/api/payslip-templates` | POST | Create new template | Admin |
| `/api/payslip-templates/:id` | PUT | Update template | Admin |
| `/api/payslip-templates/:id` | DELETE | Delete template | Admin |
| `/api/payslip-templates/:id/duplicate` | POST | Duplicate template | Admin |
| `/api/payslip-templates/:id/set-default` | POST | Set as default | Admin |
| `/api/payslip-templates/:id/toggle-status` | POST | Activate/Deactivate | Admin |
| `/api/payslip-templates/default/template` | GET | Get default template structure | Admin/HR |

---

## 🚀 How to Use Template Options

### For Admin/HR:

#### 1. **Generate Payslips with Template Selection**

1. Navigate to **Payslip Management** → **Generate Tab**
2. Select **Month** and **Year**
3. **Choose Template** (NEW!):
   - Select "Use Default Template" (recommended)
   - Or select any custom template from the dropdown
4. Select employees
5. Click **Generate**

#### 2. **Create Custom Template**

Navigate to **Admin** → **Payslip Template Configuration**

**Template Structure**:
```json
{
  "name": "Custom Executive Template",
  "description": "Template for executive-level employees",
  "version": "1.0",
  "isDefault": false,
  "isActive": true,
  
  "companyInfo": { ... },
  "employeeInfo": { ... },
  "earnings": {
    "fields": [
      { "name": "basicSalary", "label": "Basic", "required": true },
      { "name": "hra", "label": "HRA", "required": true },
      { "name": "executiveAllowance", "label": "Executive Allowance", "required": false }
    ]
  },
  "deductions": { ... },
  "styling": {
    "primaryColor": "#4CAF50",
    "fontFamily": "Roboto"
  }
}
```

#### 3. **Template Variants Available**

##### Basic Template
- Minimal fields (Basic, HRA, PF, PT only)
- Simple layout
- Fast generation
- Ideal for: Small businesses, contract workers

##### Standard Template (Default)
- 11 earnings + 9 deductions
- Complete attendance summary
- Indian statutory compliance
- Ideal for: Most organizations

##### Detailed Template
- All fields visible
- Extensive breakdowns
- Notes section
- Ideal for: Large enterprises

##### Executive Template
- Custom allowances
- Premium styling
- Detailed benefits breakdown
- Ideal for: Senior management

---

## 🔧 Template Selection in UI

### Frontend Implementation

**Generate Dialog** now includes:

```jsx
<FormControl fullWidth>
  <InputLabel>Payslip Template (Optional)</InputLabel>
  <Select
    value={filters.templateId}
    onChange={(e) => setFilters({ ...filters, templateId: e.target.value })}
  >
    <MenuItem value="">Use Default Template</MenuItem>
    {templates.map((template) => (
      <MenuItem key={template.id} value={template.id}>
        {template.name} {template.isDefault && '(Default)'}
      </MenuItem>
    ))}
  </Select>
</FormControl>
<Typography variant="caption">
  Select a custom template or leave blank to use the default Indian payslip template
</Typography>
```

**Features**:
- ✅ Dropdown shows all active templates
- ✅ Default template clearly marked
- ✅ Optional selection (blank = use default)
- ✅ Template info loaded on page load
- ✅ Persists during generation

---

## 📊 Template Data Flow

```
Admin Creates Template
        ↓
Saved in Database (payslip_templates table)
        ↓
Loaded in UI (Active templates only)
        ↓
Admin Selects Template During Generation
        ↓
Backend: payslipTemplateService.getTemplateById()
        ↓
Applied to PayslipCalculationService
        ↓
Payslip Generated with Custom Template
        ↓
PDF Generated with Template Styling
```

---

## 🎯 Template Benefits

### For Admin/HR:
1. **Flexibility**: Create templates for different employee categories
2. **Consistency**: Standardize payslip format across organization
3. **Customization**: Adjust fields based on business needs
4. **Branding**: Apply company colors and styling
5. **Compliance**: Ensure all statutory fields are present

### For Employees:
1. **Clarity**: Consistent format for easy understanding
2. **Professional**: Branded, well-designed payslips
3. **Complete**: All necessary information included
4. **Accurate**: Template validation ensures no missing data

---

## ✅ Template Validation

The system automatically validates:
- ✅ **Required fields** present (Basic, HRA, PF, PT)
- ✅ **Field types** correct (currency, number, text)
- ✅ **Company info** complete
- ✅ **Employee info** complete
- ✅ **Styling** valid (colors, fonts)
- ✅ **JSON structure** valid

Invalid templates are **rejected** with detailed error messages.

---

## 🔐 Security & Permissions

### Template Management
- **Create/Edit/Delete**: Admin only
- **View**: Admin, HR
- **Use during generation**: Admin, HR

### Template Data
- Stored securely in database
- Audit trail: createdBy, updatedBy tracked
- Soft delete: Templates never permanently deleted
- Version control: Version field tracks changes

---

## 📈 Advanced Template Options

### Custom Fields
Add custom fields to templates:
```json
{
  "name": "performanceBonus",
  "label": "Performance Bonus",
  "type": "currency",
  "required": false,
  "calculation": "percentage",
  "percentage": 10,
  "basedOn": "basicSalary"
}
```

### Conditional Fields
Show fields based on conditions:
```json
{
  "name": "esic",
  "label": "ESIC",
  "showIf": {
    "field": "grossSalary",
    "operator": "<=",
    "value": 21000
  }
}
```

### Styling Options
```json
{
  "styling": {
    "primaryColor": "#2196F3",
    "secondaryColor": "#FFC107",
    "fontFamily": "Arial, Roboto, sans-serif",
    "fontSize": "12px",
    "headerBackground": "#f5f5f5",
    "borderColor": "#ddd",
    "logoPosition": "left",
    "layout": "two-column"
  }
}
```

---

## 🚦 Current Implementation Status

### ✅ Completed Features:
- [x] Default template with 11 earnings + 9 deductions
- [x] Template CRUD operations (service layer)
- [x] Template API endpoints (11 endpoints)
- [x] Template validation
- [x] Template import/export (JSON)
- [x] Template duplication
- [x] Set default template
- [x] Activate/Deactivate templates
- [x] **Frontend template selector** (NEW!)
- [x] **Load active templates in UI** (NEW!)
- [x] **Pass templateId to generation API** (NEW!)
- [x] Template-based PDF generation
- [x] Template styling in PDF

### ⏳ Future Enhancements (Optional):
- [ ] Template preview in UI
- [ ] Drag-and-drop field ordering
- [ ] Visual template builder
- [ ] Multi-language templates
- [ ] HTML email templates
- [ ] Custom formula builder
- [ ] Template marketplace

---

## 🎯 Quick Start: Using Templates

### Scenario 1: Use Default Template
```
1. Navigate to Payslip Management → Generate
2. Select month, year
3. Leave template dropdown as "Use Default Template"
4. Select employees
5. Generate ✅
```

### Scenario 2: Use Custom Template
```
1. Admin creates custom template (via Template Configuration)
2. Navigate to Payslip Management → Generate
3. Select month, year
4. Select custom template from dropdown
5. Select employees
6. Generate ✅
```

### Scenario 3: Create New Template
```
1. Navigate to Admin → Payslip Template Configuration
2. Click "Create New Template"
3. Define fields, styling, layout
4. Save
5. Template available in Generate dropdown ✅
```

---

## 📞 API Usage Examples

### Generate with Custom Template
```javascript
POST /api/payslips/generate
{
  "employeeIds": ["uuid1", "uuid2"],
  "month": 10,
  "year": 2025,
  "templateId": "template-uuid-here"  // ← NEW!
}
```

### Generate with Default Template
```javascript
POST /api/payslips/generate
{
  "employeeIds": ["uuid1", "uuid2"],
  "month": 10,
  "year": 2025
  // No templateId = uses default
}
```

### Get Active Templates
```javascript
GET /api/payslip-templates/active

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Default Indian Template",
      "isDefault": true,
      "isActive": true
    },
    {
      "id": "uuid2",
      "name": "Executive Template",
      "isDefault": false,
      "isActive": true
    }
  ]
}
```

---

## 🎊 Summary

**Payslip Template Options** are now fully integrated!

✅ **Backend**: Template service with CRUD operations  
✅ **API**: 11 template management endpoints  
✅ **Frontend**: Template selector in Generate dialog  
✅ **Default Template**: Comprehensive Indian statutory template  
✅ **Validation**: Automatic template validation  
✅ **Security**: Role-based access control  
✅ **PDF Generation**: Template-aware PDF rendering  

**Ready to use**: Navigate to Payslip Management and start generating payslips with template options! 🚀

---

*Last Updated: October 26, 2025*  
*Feature Status: PRODUCTION READY* ✨
