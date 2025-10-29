// Debug script to test leave request validation
const dayjs = require('dayjs');

function debugLeaveValidation() {
  console.log('🔍 DEBUGGING LEAVE REQUEST VALIDATION');
  console.log('=====================================');
  
  // Sample leave request data
  const leaveRequest = {
    leaveType: 'annual',
    startDate: dayjs().add(1, 'day'), // Tomorrow
    endDate: dayjs().add(3, 'day'),   // 3 days from now
    reason: 'Going on vacation',
    workingDays: 3
  };
  
  const leaveTypes = [
    {
      value: 'annual',
      label: 'Annual Leave',
      advanceNotice: 7
    },
    {
      value: 'sick',
      label: 'Sick Leave',
      advanceNotice: 0
    }
  ];
  
  const leaveBalances = {
    annual: { total: 25, used: 8, remaining: 17 },
    sick: { total: 12, used: 2, remaining: 10 }
  };
  
  console.log('\n📋 LEAVE REQUEST DATA:');
  console.log('======================');
  console.log('Leave Type:', leaveRequest.leaveType);
  console.log('Start Date:', leaveRequest.startDate.format('YYYY-MM-DD'));
  console.log('End Date:', leaveRequest.endDate.format('YYYY-MM-DD'));
  console.log('Working Days:', leaveRequest.workingDays);
  console.log('Reason:', leaveRequest.reason);
  console.log('Reason Length:', leaveRequest.reason.length);
  
  console.log('\n🔍 VALIDATION CHECKS:');
  console.log('=====================');
  
  const errors = {};
  
  // Check 1: Leave type
  if (!leaveRequest.leaveType) {
    errors.leaveType = 'Please select a leave type';
    console.log('❌ Leave Type: Not selected');
  } else {
    console.log('✅ Leave Type: Selected (' + leaveRequest.leaveType + ')');
  }
  
  // Check 2: Start date
  if (!leaveRequest.startDate) {
    errors.startDate = 'Start date is required';
    console.log('❌ Start Date: Not provided');
  } else {
    console.log('✅ Start Date: Provided (' + leaveRequest.startDate.format('YYYY-MM-DD') + ')');
  }
  
  // Check 3: End date
  if (!leaveRequest.endDate) {
    errors.endDate = 'End date is required';
    console.log('❌ End Date: Not provided');
  } else {
    console.log('✅ End Date: Provided (' + leaveRequest.endDate.format('YYYY-MM-DD') + ')');
  }
  
  // Check 4: Date order
  if (leaveRequest.startDate && leaveRequest.endDate && leaveRequest.startDate.isAfter(leaveRequest.endDate)) {
    errors.endDate = 'End date must be after start date';
    console.log('❌ Date Order: End date is before start date');
  } else if (leaveRequest.startDate && leaveRequest.endDate) {
    console.log('✅ Date Order: End date is after start date');
  }
  
  // Check 5: Reason
  if (!leaveRequest.reason || !leaveRequest.reason.trim()) {
    errors.reason = 'Reason for leave is required';
    console.log('❌ Reason: Not provided');
  } else if (leaveRequest.reason.trim().length < 10) {
    errors.reason = 'Please provide a more detailed reason (minimum 10 characters)';
    console.log('❌ Reason: Too short (' + leaveRequest.reason.length + ' chars, need 10+)');
  } else {
    console.log('✅ Reason: Adequate length (' + leaveRequest.reason.length + ' chars)');
  }
  
  // Check 6: Leave balance
  if (leaveRequest.leaveType && leaveRequest.workingDays > 0) {
    const balance = leaveBalances[leaveRequest.leaveType];
    if (balance && leaveRequest.workingDays > balance.remaining) {
      errors.balance = `Insufficient ${leaveRequest.leaveType} leave balance. You have ${balance.remaining} days remaining.`;
      console.log('❌ Balance: Insufficient (' + leaveRequest.workingDays + ' requested, ' + balance.remaining + ' available)');
    } else if (balance) {
      console.log('✅ Balance: Sufficient (' + leaveRequest.workingDays + ' requested, ' + balance.remaining + ' available)');
    }
  }
  
  // Check 7: Advance notice
  if (leaveRequest.leaveType && leaveRequest.startDate) {
    const leaveTypeInfo = leaveTypes.find(lt => lt.value === leaveRequest.leaveType);
    if (leaveTypeInfo) {
      const daysUntilLeave = leaveRequest.startDate.diff(dayjs(), 'day');
      console.log('Days until leave:', daysUntilLeave);
      console.log('Required advance notice:', leaveTypeInfo.advanceNotice);
      
      if (daysUntilLeave < leaveTypeInfo.advanceNotice) {
        errors.advanceNotice = `${leaveTypeInfo.label} requires ${leaveTypeInfo.advanceNotice} days advance notice`;
        console.log('❌ Advance Notice: Insufficient (' + daysUntilLeave + ' days, need ' + leaveTypeInfo.advanceNotice + ')');
      } else {
        console.log('✅ Advance Notice: Sufficient (' + daysUntilLeave + ' days, need ' + leaveTypeInfo.advanceNotice + ')');
      }
    }
  }
  
  console.log('\n🎯 VALIDATION RESULT:');
  console.log('=====================');
  const errorCount = Object.keys(errors).length;
  if (errorCount === 0) {
    console.log('✅ ALL VALIDATIONS PASSED - Form can be submitted');
  } else {
    console.log('❌ VALIDATION FAILED - ' + errorCount + ' error(s) found:');
    Object.entries(errors).forEach(([field, message]) => {
      console.log('   • ' + field + ': ' + message);
    });
  }
  
  console.log('\n💡 COMMON ISSUES & SOLUTIONS:');
  console.log('=============================');
  console.log('1. Advance Notice: Annual leave needs 7 days notice');
  console.log('   Solution: Select start date at least 7 days in future');
  console.log('2. Reason Too Short: Minimum 10 characters required');
  console.log('   Solution: Provide detailed reason for leave');
  console.log('3. Insufficient Balance: Check available leave days');
  console.log('   Solution: Reduce leave duration or choose different leave type');
}

debugLeaveValidation();
