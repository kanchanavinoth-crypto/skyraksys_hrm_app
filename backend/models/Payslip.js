const mongoose = require('mongoose');

const payslipSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  month: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}$/ // YYYY-MM format
  },
  payslipData: {
    // Payslip calculation data
    month: String,
    totalWorkingDays: Number,
    lopDays: Number,
    paidDays: Number,
    
    // Earnings
    earnings: {
      basicSalary: { type: Number, default: 0 },
      houseRentAllowance: { type: Number, default: 0 },
      conveyanceAllowance: { type: Number, default: 0 },
      medicalAllowance: { type: Number, default: 0 },
      specialAllowance: { type: Number, default: 0 },
      lta: { type: Number, default: 0 },
      shiftAllowance: { type: Number, default: 0 },
      internetAllowance: { type: Number, default: 0 },
      arrears: { type: Number, default: 0 }
    },
    
    // Deductions
    deductions: {
      medicalPremium: { type: Number, default: 0 },
      nps: { type: Number, default: 0 },
      professionalTax: { type: Number, default: 0 },
      providentFund: { type: Number, default: 0 },
      tds: { type: Number, default: 0 },
      voluntaryPF: { type: Number, default: 0 },
      esic: { type: Number, default: 0 }
    },
    
    // Totals
    grossSalary: { type: Number, required: true },
    totalDeductions: { type: Number, required: true },
    netPay: { type: Number, required: true },
    
    // Payment details
    paymentMode: { type: String, default: 'Online Transfer' },
    disbursementDate: String
  },
  
  // Audit fields
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'approved', 'paid'],
    default: 'draft'
  },
  
  // Notes
  notes: String
}, {
  timestamps: true
});

// Indexes
payslipSchema.index({ employee: 1, month: 1 }, { unique: true });
payslipSchema.index({ generatedAt: -1 });
payslipSchema.index({ status: 1 });

// Virtual for month display
payslipSchema.virtual('monthDisplay').get(function() {
  const [year, month] = this.month.split('-');
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
});

// Instance methods
payslipSchema.methods.approve = function() {
  this.status = 'approved';
  return this.save();
};

payslipSchema.methods.markAsPaid = function() {
  this.status = 'paid';
  return this.save();
};

// Static methods
payslipSchema.statics.findByEmployeeAndMonth = function(employeeId, month) {
  return this.findOne({ employee: employeeId, month: month });
};

payslipSchema.statics.getEmployeePayslips = function(employeeId, limit = 12) {
  return this.find({ employee: employeeId })
    .sort({ month: -1 })
    .limit(limit)
    .populate('generatedBy', 'firstName lastName');
};

// Pre-save middleware
payslipSchema.pre('save', function(next) {
  // Validate month format
  if (this.month && !/^\d{4}-\d{2}$/.test(this.month)) {
    next(new Error('Month must be in YYYY-MM format'));
  }
  
  // Ensure payslip data exists
  if (!this.payslipData) {
    next(new Error('Payslip data is required'));
  }
  
  next();
});

module.exports = mongoose.model('Payslip', payslipSchema);