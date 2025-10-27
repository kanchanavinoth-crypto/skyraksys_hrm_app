import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import './PayslipTemplate.css';

const PayslipTemplate = ({ 
  employee, 
  payslipData, 
  companyInfo = {
    name: "SKYRAKSYS TECHNOLOGIES LLP",
    address: "Plot-No: 27E, G.S.T. Road, Guduvanchery, Chennai, Tamil Nadu, 603202 India",
    email: "info@skyraksys.com",
    website: "https://www.skyraksys.com",
    contact: "+91 89398 88577"
  }
}) => {
  // Default payslip data structure
  const defaultPayslipData = {
    month: "December 2024",
    totalWorkingDays: 21,
    lopDays: 0,
    paidDays: 21,
    earnings: {
      basicSalary: 15000.00,
      houseRentAllowance: 0,
      conveyanceAllowance: 0,
      medicalAllowance: 0,
      specialAllowance: 0,
      lta: 0,
      shiftAllowance: 0,
      internetAllowance: 0,
      arrears: 0
    },
    deductions: {
      medicalPremium: 0,
      nps: 0,
      professionalTax: 0,
      providentFund: 0,
      tds: 0,
      voluntaryPF: 0,
      esic: 0
    },
    paymentMode: "Online Transfer",
    disbursementDate: new Date().toLocaleDateString('en-GB')
  };

  const data = { ...defaultPayslipData, ...payslipData };
  
  // Calculate totals
  const grossSalary = Object.values(data.earnings).reduce((sum, amount) => sum + (amount || 0), 0);
  const totalDeductions = Object.values(data.deductions).reduce((sum, amount) => sum + (amount || 0), 0);
  const netPay = grossSalary - totalDeductions;

  // Convert number to words
  const numberToWords = (amount) => {
    // Simple implementation - you can use a library like 'number-to-words' for more complex cases
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    
    if (amount === 0) return 'Zero Rupees Only';
    if (amount === 15000) return 'Fifteen Thousand Rupees Only'; // Quick example
    
    return `${amount.toLocaleString()} Rupees Only`;
  };

  const formatCurrency = (amount) => {
    return amount > 0 ? `₹${amount.toFixed(2)}` : 'NA';
  };

  return (
    <div className="payslip-container" id="payslip-content">
      {/* Header */}
      <div className="payslip-header">
        <img 
          src="/assets/company/logo.png" 
          alt="Company Logo" 
          className="company-logo"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <Typography variant="h4" className="company-name">
          {companyInfo.name}
        </Typography>
        <div className="company-info">
          {companyInfo.address}<br/>
          Email: {companyInfo.email} | Web: {companyInfo.website} | Contact: {companyInfo.contact}
        </div>
        <Typography variant="h5" className="payslip-title">
          Pay Slip
        </Typography>
        <Typography variant="h6" className="payslip-month">
          {data.month}
        </Typography>
      </div>

      {/* Employee Details */}
      <TableContainer component={Paper} elevation={0} className="details-table">
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell>Employee Name</TableCell>
              <TableCell><strong>{employee?.firstName} {employee?.lastName}</strong></TableCell>
              <TableCell>Total Working Days</TableCell>
              <TableCell><strong>{data.totalWorkingDays}</strong></TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Employee ID</TableCell>
              <TableCell><strong>{employee?.employeeId || 'N/A'}</strong></TableCell>
              <TableCell>LOP Days</TableCell>
              <TableCell><strong>{data.lopDays}</strong></TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Designation</TableCell>
              <TableCell><strong>{employee?.position?.title || 'N/A'}</strong></TableCell>
              <TableCell>Paid Days</TableCell>
              <TableCell><strong>{data.paidDays}</strong></TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Department</TableCell>
              <TableCell><strong>{employee?.department?.name || 'N/A'}</strong></TableCell>
              <TableCell>Bank Name</TableCell>
              <TableCell><strong>{employee?.bankName || 'N/A'}</strong></TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Date of Joining</TableCell>
              <TableCell><strong>{employee?.hireDate ? new Date(employee.hireDate).toLocaleDateString('en-GB') : 'N/A'}</strong></TableCell>
              <TableCell>Bank A/c No</TableCell>
              <TableCell><strong>{employee?.bankAccountNumber || 'N/A'}</strong></TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Location</TableCell>
              <TableCell><strong>{employee?.workLocation || 'N/A'}</strong></TableCell>
              <TableCell>PAN</TableCell>
              <TableCell><strong>{employee?.panNumber || 'N/A'}</strong></TableCell>
            </TableRow>
            <TableRow>
              <TableCell>UAN</TableCell>
              <TableCell><strong>{employee?.universalAccountNumber || 'N/A'}</strong></TableCell>
              <TableCell>PF No</TableCell>
              <TableCell><strong>{employee?.providentFundNumber || 'N/A'}</strong></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Earnings */}
      <div className="section-title">Earnings</div>
      <TableContainer component={Paper} elevation={0} className="salary-table">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Component</strong></TableCell>
              <TableCell><strong>Amount (₹)</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Basic Salary</TableCell>
              <TableCell>{formatCurrency(data.earnings.basicSalary)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>House Rent Allowances</TableCell>
              <TableCell>{formatCurrency(data.earnings.houseRentAllowance)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Conveyance Allowances</TableCell>
              <TableCell>{formatCurrency(data.earnings.conveyanceAllowance)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Medical Allowances</TableCell>
              <TableCell>{formatCurrency(data.earnings.medicalAllowance)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Special Allowances</TableCell>
              <TableCell>{formatCurrency(data.earnings.specialAllowance)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>LTA</TableCell>
              <TableCell>{formatCurrency(data.earnings.lta)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Shift Allowances</TableCell>
              <TableCell>{formatCurrency(data.earnings.shiftAllowance)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Internet Allowances</TableCell>
              <TableCell>{formatCurrency(data.earnings.internetAllowance)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Arrears</TableCell>
              <TableCell>{formatCurrency(data.earnings.arrears)}</TableCell>
            </TableRow>
            <TableRow className="total-row">
              <TableCell><strong>Gross Salary</strong></TableCell>
              <TableCell><strong>₹{grossSalary.toFixed(2)}</strong></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Deductions */}
      <div className="section-title">Deductions</div>
      <TableContainer component={Paper} elevation={0} className="salary-table">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Component</strong></TableCell>
              <TableCell><strong>Amount (₹)</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Medical Premium Deductions</TableCell>
              <TableCell>{formatCurrency(data.deductions.medicalPremium)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>NPS under 80 CCD (2)</TableCell>
              <TableCell>{formatCurrency(data.deductions.nps)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Professional Tax</TableCell>
              <TableCell>{formatCurrency(data.deductions.professionalTax)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Provident Fund</TableCell>
              <TableCell>{formatCurrency(data.deductions.providentFund)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>TDS</TableCell>
              <TableCell>{formatCurrency(data.deductions.tds)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Voluntary Provident Fund</TableCell>
              <TableCell>{formatCurrency(data.deductions.voluntaryPF)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>ESIC</TableCell>
              <TableCell>{formatCurrency(data.deductions.esic)}</TableCell>
            </TableRow>
            <TableRow className="total-row">
              <TableCell><strong>Total Deductions</strong></TableCell>
              <TableCell><strong>₹{totalDeductions.toFixed(2)}</strong></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Net Pay */}
      <div className="section-title">Net Pay</div>
      <TableContainer component={Paper} elevation={0} className="salary-table">
        <Table size="small">
          <TableBody>
            <TableRow className="total-row net-pay-row">
              <TableCell><strong>Net Pay</strong></TableCell>
              <TableCell><strong>₹{netPay.toFixed(2)}</strong></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Payment Details */}
      <div className="section-title">Payment Details</div>
      <TableContainer component={Paper} elevation={0} className="details-table">
        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell>Rupees</TableCell>
              <TableCell><strong>{numberToWords(netPay)}</strong></TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Mode of Payment</TableCell>
              <TableCell><strong>{data.paymentMode}</strong></TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Disbursement Date</TableCell>
              <TableCell><strong>{data.disbursementDate}</strong></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Signature */}
      <div className="signature-section">
        <img 
          src="/assets/company/signature.png" 
          alt="HR Signature" 
          className="signature-image"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
        <Typography variant="body2" className="signature-text">
          Authorized Signature
        </Typography>
      </div>
    </div>
  );
};

export default PayslipTemplate;