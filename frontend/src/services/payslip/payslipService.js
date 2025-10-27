/**
 * Payslip Generation Service
 * Handles payslip data processing and generation
 */

class PayslipService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
  }

  /**
   * Generate payslip data for an employee
   * @param {string} employeeId - Employee ID
   * @param {string} month - Month in format "YYYY-MM"
   * @param {Object} salaryData - Salary breakdown data
   * @returns {Promise<Object>} Formatted payslip data
   */
  async generatePayslip(employeeId, month, salaryData = {}) {
    try {
      const response = await fetch(`${this.baseURL}/payslips/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          employeeId,
          month,
          salaryData
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate payslip: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating payslip:', error);
      throw error;
    }
  }

  /**
   * Get payslip history for an employee
   * @param {string} employeeId - Employee ID
   * @returns {Promise<Array>} Array of payslip records
   */
  async getPayslipHistory(employeeId) {
    try {
      const response = await fetch(`${this.baseURL}/payslips/history/${employeeId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch payslip history: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching payslip history:', error);
      throw error;
    }
  }

  /**
   * Get payslip by ID
   * @param {string} payslipId - Payslip ID
   * @returns {Promise<Object>} Payslip data
   */
  async getPayslipById(payslipId) {
    try {
      const response = await fetch(`${this.baseURL}/payslips/${payslipId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch payslip: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching payslip:', error);
      throw error;
    }
  }

  /**
   * Get all payslips (admin/HR only)
   * @param {Object} filters - Optional filters for payslips
   * @returns {Promise<Array>} Array of all payslip records
   */
  async getAllPayslips(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.month) queryParams.append('month', filters.month);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.employeeId) queryParams.append('employeeId', filters.employeeId);
      
      const url = `${this.baseURL}/payslips${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch payslips: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching all payslips:', error);
      throw error;
    }
  }

  /**
   * Create a new payslip in the database
   * @param {Object} payslipData - Payslip data to create
   * @returns {Promise<Object>} Created payslip
   */
  async createPayslip(payslipData) {
    try {
      const response = await fetch(`${this.baseURL}/payslips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(payslipData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create payslip: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating payslip:', error);
      throw error;
    }
  }

  /**
   * Generate bulk payslips for multiple employees
   * @param {Object} bulkData - Bulk generation data
   * @returns {Promise<Object>} Bulk generation result
   */
  async generateBulkPayslips(bulkData) {
    try {
      const response = await fetch(`${this.baseURL}/payslips/bulk-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(bulkData)
      });

      if (!response.ok) {
        throw new Error(`Failed to generate bulk payslips: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating bulk payslips:', error);
      throw error;
    }
  }

  /**
   * Calculate earnings and deductions
   * @param {Object} employeeData - Employee data
   * @param {Object} salaryData - Salary configuration
   * @param {number} workingDays - Total working days
   * @param {number} presentDays - Days present
   * @returns {Object} Calculated payslip data
   */
  calculatePayslip(employeeData, salaryData, workingDays = 21, presentDays = 21) {
    const basicSalary = salaryData.basicSalary || 0;
    const ratio = presentDays / workingDays;

    // Calculate earnings
    const earnings = {
      basicSalary: basicSalary * ratio,
      houseRentAllowance: (salaryData.houseRentAllowance || 0) * ratio,
      conveyanceAllowance: (salaryData.conveyanceAllowance || 0) * ratio,
      medicalAllowance: (salaryData.medicalAllowance || 0) * ratio,
      specialAllowance: (salaryData.specialAllowance || 0) * ratio,
      lta: (salaryData.lta || 0) * ratio,
      shiftAllowance: (salaryData.shiftAllowance || 0) * ratio,
      internetAllowance: (salaryData.internetAllowance || 0) * ratio,
      arrears: salaryData.arrears || 0
    };

    const grossSalary = Object.values(earnings).reduce((sum, amount) => sum + amount, 0);

    // Calculate deductions
    const deductions = {
      medicalPremium: salaryData.medicalPremium || 0,
      nps: salaryData.nps || 0,
      professionalTax: this.calculateProfessionalTax(grossSalary),
      providentFund: this.calculatePF(earnings.basicSalary),
      tds: this.calculateTDS(grossSalary),
      voluntaryPF: salaryData.voluntaryPF || 0,
      esic: this.calculateESIC(grossSalary)
    };

    const totalDeductions = Object.values(deductions).reduce((sum, amount) => sum + amount, 0);
    const netPay = grossSalary - totalDeductions;

    return {
      earnings,
      deductions,
      grossSalary,
      totalDeductions,
      netPay,
      totalWorkingDays: workingDays,
      lopDays: workingDays - presentDays,
      paidDays: presentDays
    };
  }

  /**
   * Calculate Professional Tax based on gross salary
   * @param {number} grossSalary - Gross salary amount
   * @returns {number} Professional tax amount
   */
  calculateProfessionalTax(grossSalary) {
    if (grossSalary <= 21000) return 0;
    if (grossSalary <= 25000) return 150;
    return 200;
  }

  /**
   * Calculate Provident Fund (12% of basic salary)
   * @param {number} basicSalary - Basic salary amount
   * @returns {number} PF amount
   */
  calculatePF(basicSalary) {
    const pfLimit = 15000; // PF calculation limit
    const pfRate = 0.12; // 12%
    return Math.min(basicSalary, pfLimit) * pfRate;
  }

  /**
   * Calculate ESIC (0.75% of gross salary up to ₹25,000)
   * @param {number} grossSalary - Gross salary amount
   * @returns {number} ESIC amount
   */
  calculateESIC(grossSalary) {
    if (grossSalary > 25000) return 0;
    return grossSalary * 0.0075; // 0.75%
  }

  /**
   * Calculate TDS (simplified calculation)
   * @param {number} grossSalary - Gross salary amount
   * @returns {number} TDS amount
   */
  calculateTDS(grossSalary) {
    const annualSalary = grossSalary * 12;
    const exemptionLimit = 250000; // Basic exemption limit

    if (annualSalary <= exemptionLimit) return 0;
    
    // Simplified TDS calculation (5% of excess over exemption)
    const taxableAmount = annualSalary - exemptionLimit;
    const annualTDS = taxableAmount * 0.05;
    return annualTDS / 12; // Monthly TDS
  }

  /**
   * Format currency amount
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency string
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }

  /**
   * Convert number to words (Indian format)
   * @param {number} amount - Amount to convert
   * @returns {string} Amount in words
   */
  numberToWords(amount) {
    const ones = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
      'Seventeen', 'Eighteen', 'Nineteen'
    ];

    const tens = [
      '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
    ];

    const scales = ['', 'Thousand', 'Lakh', 'Crore'];

    if (amount === 0) return 'Zero Rupees Only';

    let result = '';
    let scaleIndex = 0;
    
    while (amount > 0) {
      let chunk = 0;
      
      if (scaleIndex === 0) {
        chunk = amount % 1000; // First chunk (ones, tens, hundreds)
        amount = Math.floor(amount / 1000);
      } else {
        chunk = amount % 100; // Subsequent chunks (tens, ones)
        amount = Math.floor(amount / 100);
      }

      if (chunk > 0) {
        let chunkText = '';
        
        if (scaleIndex === 0 && chunk >= 100) {
          chunkText += ones[Math.floor(chunk / 100)] + ' Hundred ';
          chunk %= 100;
        }
        
        if (chunk >= 20) {
          chunkText += tens[Math.floor(chunk / 10)] + ' ';
          chunk %= 10;
        }
        
        if (chunk > 0) {
          chunkText += ones[chunk] + ' ';
        }
        
        result = chunkText + scales[scaleIndex] + ' ' + result;
      }
      
      scaleIndex++;
    }

    return result.trim() + ' Rupees Only';
  }

  /**
   * Print payslip
   * @param {string} elementId - ID of the element to print
   */
  printPayslip(elementId = 'payslip-content') {
    const printWindow = window.open('', '_blank');
    const payslipContent = document.getElementById(elementId);
    
    if (!payslipContent) {
      console.error('Payslip content not found');
      return;
    }

    const css = `
      <style>
        @media print {
          body { margin: 0; padding: 20px; }
          .no-print { display: none !important; }
        }
        ${document.querySelector('style')?.textContent || ''}
      </style>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payslip</title>
          ${css}
        </head>
        <body>
          ${payslipContent.outerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }

  /**
   * Download payslip as PDF (requires backend support)
   * @param {string} employeeId - Employee ID
   * @param {string} month - Month
   * @returns {Promise<Blob>} PDF blob
   */
  async downloadPayslipPDF(employeeId, month) {
    try {
      const response = await fetch(`${this.baseURL}/payslips/download-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ employeeId, month })
      });

      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.statusText}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  }

  /**
   * Download payslip PDF by payslip ID
   * @param {string} payslipId - Payslip ID
   * @returns {Promise<void>} Downloads the file
   */
  async downloadPayslipByIdPDF(payslipId) {
    try {
      const response = await fetch(`${this.baseURL}/payslips/${payslipId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip_${payslipId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      throw error;
    }
  }
}

// Create and export service instance
const payslipService = new PayslipService();
export { payslipService, PayslipService };
export default payslipService;