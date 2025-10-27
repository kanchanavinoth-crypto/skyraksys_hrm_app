# 🎨 Default Templates & Company Logo Feature

**Status**: ✅ **COMPLETE**  
**Date**: October 26, 2025

---

## 🎯 Overview

The system now includes:
1. **4 Pre-configured Default Templates** ready to use
2. **Company Logo Support** in payslip headers with customizable positioning
3. **Seeding Script** to populate templates automatically

---

## 📋 Default Templates Included

### 1. Standard Indian Payslip ⭐ (Default)
**Purpose**: Complete template with all statutory requirements for Indian employees

**Features**:
- ✅ All 11 earning fields
- ✅ All 9 deduction fields
- ✅ Complete attendance tracking
- ✅ PF, ESIC, PT, TDS calculations
- ✅ Company logo support (left-aligned)
- ✅ Full company & employee information

**Ideal For**: Regular full-time employees, standard payroll processing

**Styling**:
- Primary Color: Blue (#2196F3)
- Secondary Color: Amber (#FFC107)
- Professional look with statutory compliance

---

### 2. Basic Employee Template 🟢
**Purpose**: Simplified template for entry-level or small business

**Features**:
- ✅ Essential earnings only (Basic + HRA + Overtime)
- ✅ Essential deductions only (PF + PT)
- ✅ Simplified attendance (3 fields)
- ✅ Company logo support (center-aligned)
- ✅ Minimal company info

**Ideal For**: Small businesses, entry-level employees, quick setup

**Styling**:
- Primary Color: Green (#4CAF50)
- Secondary Color: Light Green (#8BC34A)
- Clean, simple design

---

### 3. Executive Compensation 🟣
**Purpose**: Comprehensive template for senior management

**Features**:
- ✅ 12 earning fields including bonuses & incentives
- ✅ 9 deduction fields including NPS, insurance
- ✅ Detailed attendance with leave encashment
- ✅ Performance & retention bonuses
- ✅ Tax benefits tracking
- ✅ Company logo support (left-aligned, larger size)
- ✅ Extended employee info (grade, IFSC code)

**Ideal For**: Senior executives, management staff, directors

**Styling**:
- Primary Color: Purple (#673AB7)
- Secondary Color: Deep Purple (#9C27B0)
- Professional, premium appearance

---

### 4. Contract Worker Template 🟠
**Purpose**: Template for temporary/contractual workers

**Features**:
- ✅ Simplified payment structure (no PF/ESIC)
- ✅ Contract amount + additional payments
- ✅ Minimal deductions (TDS if applicable)
- ✅ Work summary instead of attendance
- ✅ Company logo support (left-aligned)
- ✅ Contract period tracking

**Ideal For**: Contractors, freelancers, temporary workers, consultants

**Styling**:
- Primary Color: Orange (#FF9800)
- Secondary Color: Amber (#FFC107)
- Distinctive design for non-permanent staff

---

## 🖼️ Company Logo Feature

### Configuration Options

#### 1. **Enable/Disable Logo**
- Toggle to show or hide company logo
- Useful for templates that don't need branding

#### 2. **Logo Position** (3 options)
- **Left**: Logo on left side (professional, standard)
- **Center**: Logo centered in header (balanced, formal)
- **Right**: Logo on right side (unique layout)

#### 3. **Logo Size**
- **Width**: Customizable (default: 100px)
  - Recommended: 80px - 150px
- **Height**: Customizable (default: 50px)
  - Recommended: 40px - 80px

#### 4. **Company Name Display**
- Toggle to show company name next to/below logo
- Can hide if logo already contains company name

### Logo Settings by Template

| Template | Logo Position | Size | Company Name |
|----------|---------------|------|--------------|
| Standard Indian | Left | 100x50 | Yes |
| Basic Employee | Center | 80x40 | Yes |
| Executive | Left | 120x60 | Yes |
| Contract Worker | Left | 90x45 | Yes |

---

## 🚀 How to Use Default Templates

### Method 1: Run Seeding Script

**Windows (Command Prompt)**:
```cmd
cd backend
node scripts\seed-default-templates.js
```

**Output**:
```
🌱 Starting to seed default templates...
✅ Created template: "Standard Indian Payslip"
✅ Created template: "Basic Employee Template"
✅ Created template: "Executive Compensation"
✅ Created template: "Contract Worker Template"

🎉 Default templates seeded successfully!
📋 Templates created:
   - Standard Indian Payslip
   - Basic Employee Template
   - Executive Compensation
   - Contract Worker Template

✅ Seeding complete!
```

### Method 2: Automatic on First Run
Add to your startup/initialization script:
```javascript
const { seedDefaultTemplates } = require('./scripts/seed-default-templates');
await seedDefaultTemplates();
```

---

## 🎨 Creating Template with Logo Configuration

### In Template Manager UI:

**Step 1: Basic Info**
```
Name: Custom Department Template
Description: Template for marketing department
Version: 1.0
Active: ☑
```

**Step 2: Logo Configuration**
```
☑ Show Company Logo in Payslip Header

Logo Position: [Left ▼]
☑ Show Company Name

Logo Width: 100px
Logo Height: 50px

ℹ️ Note: Upload your company logo in Company Settings
```

**Step 3: Select Fields**
- Choose earnings fields
- Choose deductions fields

**Step 4: Styling**
- Pick primary color
- Pick secondary color

**Step 5: Create**
✅ Template created with logo support!

---

## 📁 Logo File Requirements

### Supported Formats
- ✅ **PNG** (Recommended - supports transparency)
- ✅ **JPG/JPEG**
- ✅ **SVG** (Vector, scales perfectly)
- ✅ **GIF**

### Recommended Specifications
- **Dimensions**: 200x100 pixels (2:1 ratio)
- **File Size**: Under 500KB
- **Background**: Transparent (for PNG)
- **Resolution**: 72-150 DPI (for print)
- **Color Mode**: RGB

### Best Practices
- ✅ Use transparent background
- ✅ Include company name in logo if possible
- ✅ Keep design simple and recognizable
- ✅ Test on both white and colored backgrounds
- ✅ Avoid very thin lines (may not print well)

---

## 🔧 Logo Storage & Usage

### Where Logo is Stored
The company logo should be uploaded to:
- **Company Settings** → Upload Logo
- Stored in: `/uploads/company/logo.png`
- Referenced in database: Company table, `logoUrl` field

### How Logo is Used in Payslips
1. Template specifies logo should be shown
2. Payslip generation reads `companyInfo.logo = true`
3. Backend fetches logo from company settings
4. Logo is embedded in PDF at specified position
5. Size and position applied per template config

### PDF Generation with Logo
```javascript
// In PDF generation (payslip-management.routes.js)
if (template.companyInfo.logo) {
  const logoPath = company.logoUrl;
  const logoWidth = template.styling.logoWidth || '100px';
  const logoHeight = template.styling.logoHeight || '50px';
  const logoPosition = template.companyInfo.logoPosition || 'left';
  
  doc.image(logoPath, {
    fit: [parseInt(logoWidth), parseInt(logoHeight)],
    align: logoPosition
  });
}
```

---

## 📊 Template Comparison Matrix

| Feature | Standard | Basic | Executive | Contract |
|---------|----------|-------|-----------|----------|
| **Earnings Fields** | 11 | 3 | 12 | 4 |
| **Deductions Fields** | 9 | 2 | 9 | 3 |
| **Attendance Detail** | Full | Basic | Detailed | Simple |
| **Logo Support** | ✅ | ✅ | ✅ | ✅ |
| **Logo Position** | Left | Center | Left | Left |
| **Logo Size** | Medium | Small | Large | Medium |
| **Company Info** | Full | Minimal | Full | Basic |
| **Employee Info** | Standard | Basic | Extended | Contract |
| **Best For** | Regular | Entry | Senior | Temporary |
| **Complexity** | ⭐⭐⭐ | ⭐ | ⭐⭐⭐⭐ | ⭐⭐ |

---

## 🎯 Usage Scenarios

### Scenario 1: Small Startup
**Template**: Basic Employee Template
**Why**: Minimal fields, quick setup, center logo looks balanced
**Logo**: Small, centered for compact design

### Scenario 2: Large Enterprise
**Template**: Standard Indian Payslip
**Why**: Full statutory compliance, detailed tracking
**Logo**: Professional left-aligned, with company name

### Scenario 3: Executive Payroll
**Template**: Executive Compensation
**Why**: Comprehensive benefits, bonuses, tax planning
**Logo**: Larger size, premium appearance

### Scenario 4: Hiring Contractors
**Template**: Contract Worker Template
**Why**: No statutory deductions, simplified structure
**Logo**: Distinctive orange theme, clear contract indication

---

## 🔐 Template Data Structure with Logo

```json
{
  "companyInfo": {
    "fields": ["name", "address", "city", ...],
    "logo": true,              // Enable logo
    "logoPosition": "left",    // "left", "center", or "right"
    "showCompanyName": true    // Show text alongside logo
  },
  "styling": {
    "primaryColor": "#2196F3",
    "secondaryColor": "#FFC107",
    "fontFamily": "Arial, sans-serif",
    "fontSize": "12px",
    "logoWidth": "100px",      // Logo dimensions
    "logoHeight": "50px",
    "headerBackground": "#f5f5f5",
    "borderColor": "#ddd"
  }
}
```

---

## 📋 Seeding Script Details

### File Location
`backend/scripts/seed-default-templates.js`

### Features
- ✅ Creates 4 default templates
- ✅ Checks for existing templates (no duplicates)
- ✅ Skips if template with same name exists
- ✅ Sets one template as default
- ✅ Console logging for progress
- ✅ Error handling

### Functions Exported
```javascript
// Seed all default templates
const { seedDefaultTemplates } = require('./scripts/seed-default-templates');
await seedDefaultTemplates();

// Access template data
const { defaultTemplates } = require('./scripts/seed-default-templates');
console.log(defaultTemplates); // Array of 4 templates
```

### Integration Options

**Option 1: Manual Run**
```bash
node scripts/seed-default-templates.js
```

**Option 2: Add to server.js startup**
```javascript
const { seedDefaultTemplates } = require('./scripts/seed-default-templates');

db.sequelize.sync().then(async () => {
  // Seed templates on first run
  const count = await PayslipTemplate.count();
  if (count === 0) {
    await seedDefaultTemplates();
  }
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
```

**Option 3: Admin Action**
Add button in admin panel to trigger seeding

---

## ✅ Implementation Checklist

### Backend Setup
- [x] Create seed script with 4 templates
- [x] Include logo configuration in templates
- [x] Export functions for programmatic use
- [x] Add error handling

### Frontend Updates
- [x] Add logo toggle in template form
- [x] Add logo position selector
- [x] Add logo size inputs
- [x] Add company name toggle
- [x] Add help text about logo upload
- [x] Update form state management

### Documentation
- [x] Template comparison guide
- [x] Logo requirements documentation
- [x] Usage scenarios
- [x] Seeding instructions

---

## 🎉 Quick Start Guide

### For Admin:

**Step 1: Seed Default Templates**
```cmd
cd backend
node scripts\seed-default-templates.js
```

**Step 2: Upload Company Logo**
```
Navigate to: Company Settings
Upload Logo: [Browse...] → Select logo file
Save
```

**Step 3: Generate Payslip**
```
Payslip Management → Generate
Template: [Standard Indian Payslip ▼]
Select employees → Generate
```

**Step 4: View PDF**
```
✅ Payslip generated with company logo!
📄 Download PDF to see logo in header
```

---

## 🎊 Summary

**Default Templates**: 4 ready-to-use templates ✅  
**Company Logo**: Full support with positioning ✅  
**Seeding Script**: Automated template creation ✅  
**UI Integration**: Logo configuration in template manager ✅  
**Documentation**: Complete usage guide ✅  

**Run the seeding script and start generating professional payslips with your company logo!** 🚀

---

*Implementation Date: October 26, 2025*  
*Status: Production Ready* ✨
