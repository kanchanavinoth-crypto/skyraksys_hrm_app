# SkyRakSys HRM - Technical Analysis & System Patterns

## 1. Advanced Schema Analysis

### 1.1 Salary Structure Model
```sql
CREATE TABLE salary_structures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employeeId UUID NOT NULL REFERENCES employees(id),
  basicSalary DECIMAL(10,2) NOT NULL,
  hra DECIMAL(10,2) DEFAULT 0,              -- House Rent Allowance
  allowances DECIMAL(10,2) DEFAULT 0,       -- Other allowances
  pfContribution DECIMAL(10,2) DEFAULT 0,   -- Provident Fund (12% of basic)
  tds DECIMAL(10,2) DEFAULT 0,             -- Tax Deducted at Source
  professionalTax DECIMAL(10,2) DEFAULT 0, -- State-specific professional tax
  otherDeductions DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'INR',
  effectiveFrom DATE NOT NULL,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indian Payroll Compliance Features:**
- **PF Contribution**: 12% of basic salary (employee) + 12% (employer)
- **Professional Tax**: State-specific tax (Maharashtra: ₹200/month)
- **TDS**: Tax Deducted at Source based on income slabs
- **HRA**: House Rent Allowance (40% of basic in metro, 50% in non-metro)

### 1.2 Leave Balance Tracking
```sql
CREATE TABLE leave_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employeeId UUID NOT NULL REFERENCES employees(id),
  leaveTypeId UUID NOT NULL REFERENCES leave_types(id),
  year INTEGER NOT NULL,
  totalAccrued DECIMAL(5,2) DEFAULT 0,    -- Annual entitlement
  totalTaken DECIMAL(5,2) DEFAULT 0,      -- Leaves taken
  totalPending DECIMAL(5,2) DEFAULT 0,    -- Pending approval
  balance DECIMAL(5,2) DEFAULT 0,         -- Available balance
  carryForward DECIMAL(5,2) DEFAULT 0,    -- From previous year
  UNIQUE(employeeId, leaveTypeId, year)
);
```

**Leave Calculation Logic:**
```javascript
// Auto-calculation of leave balance
const updateLeaveBalance = async (employeeId, leaveTypeId, year) => {
  const balance = await LeaveBalance.findOne({
    where: { employeeId, leaveTypeId, year }
  });
  
  const taken = await LeaveRequest.sum('totalDays', {
    where: {
      employeeId,
      leaveTypeId,
      status: 'Approved',
      startDate: {
        [Op.gte]: `${year}-01-01`,
        [Op.lte]: `${year}-12-31`
      }
    }
  });
  
  const pending = await LeaveRequest.sum('totalDays', {
    where: {
      employeeId,
      leaveTypeId,
      status: 'Pending',
      startDate: {
        [Op.gte]: `${year}-01-01`,
        [Op.lte]: `${year}-12-31`
      }
    }
  });
  
  const availableBalance = balance.totalAccrued + balance.carryForward - taken;
  
  await balance.update({
    totalTaken: taken || 0,
    totalPending: pending || 0,
    balance: Math.max(0, availableBalance)
  });
};
```

## 2. Security Architecture Deep Dive

### 2.1 JWT Token Security Implementation
```javascript
// Enhanced JWT token structure
const tokenPayload = {
  id: user.id,                    // User UUID
  email: user.email,              // User email
  role: user.role,                // Role-based access
  employeeId: user.employee?.id,  // Employee UUID for data filtering
  sessionId: generateSessionId(), // Session tracking
  permissions: getUserPermissions(user.role), // Granular permissions
  iat: Math.floor(Date.now() / 1000),        // Issued at
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // Expires in 24h
};

// Token security features
const tokenSecurity = {
  algorithm: 'HS256',             // HMAC SHA-256
  secret: process.env.JWT_SECRET, // 256-bit secret key
  issuer: 'skyraksys-hrm',       // Token issuer
  audience: 'hrm-users',         // Token audience
  clockTolerance: 60             // 60 seconds clock tolerance
};
```

### 2.2 Role-Based Permission Matrix
```javascript
const PERMISSIONS = {
  // Employee Management
  'employee.view.all': ['admin', 'hr'],
  'employee.view.team': ['manager'],
  'employee.view.self': ['employee'],
  'employee.create': ['admin', 'hr'],
  'employee.update.all': ['admin', 'hr'],
  'employee.update.team': ['manager'],
  'employee.update.self': ['employee'],
  'employee.delete': ['admin'],
  
  // Salary & Payroll
  'salary.view.all': ['admin', 'hr'],
  'salary.view.self': ['employee'],
  'salary.update': ['admin', 'hr'],
  'payroll.process': ['admin', 'hr'],
  'payroll.approve': ['admin'],
  
  // Leave Management
  'leave.view.all': ['admin', 'hr'],
  'leave.view.team': ['manager'],
  'leave.approve': ['admin', 'hr', 'manager'],
  'leave.submit': ['employee'],
  
  // Timesheet Management
  'timesheet.view.all': ['admin', 'hr'],
  'timesheet.view.team': ['manager'],
  'timesheet.approve': ['manager', 'admin', 'hr'],
  'timesheet.submit': ['employee'],
  
  // Reporting
  'reports.hr': ['admin', 'hr'],
  'reports.payroll': ['admin', 'hr'],
  'reports.attendance': ['admin', 'hr', 'manager']
};

// Permission checking middleware
const hasPermission = (permission) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    const allowedRoles = PERMISSIONS[permission] || [];
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Insufficient permissions. Required: ${permission}`
      });
    }
    
    next();
  };
};
```

### 2.3 Data Access Control Patterns
```javascript
// Field-level access control implementation
const fieldAccessRules = {
  employee: {
    admin: {
      read: ['*'],
      write: ['*']
    },
    hr: {
      read: ['*'],
      write: ['*', '!userId'] // Can't modify user association
    },
    manager: {
      read: [
        'id', 'employeeId', 'firstName', 'lastName', 'email', 'phone',
        'status', 'department', 'position', 'hireDate', 'workLocation'
      ],
      write: ['status', 'workLocation'] // Limited update rights
    },
    employee: {
      read: {
        self: [
          'id', 'employeeId', 'firstName', 'lastName', 'email', 'phone',
          'address', 'city', 'state', 'pinCode', 'emergencyContactName',
          'emergencyContactPhone', 'dateOfBirth', 'maritalStatus'
        ],
        others: ['id', 'employeeId', 'firstName', 'lastName', 'email', 'phone']
      },
      write: {
        self: [
          'phone', 'address', 'city', 'state', 'pinCode',
          'emergencyContactName', 'emergencyContactPhone'
        ]
      }
    }
  }
};

// Dynamic data filtering
const filterEmployeeData = (employee, userRole, isOwnRecord = false) => {
  const rules = fieldAccessRules.employee[userRole];
  let allowedFields = [];
  
  if (rules.read === ['*']) {
    return employee; // Admin/HR get all fields
  }
  
  if (userRole === 'employee') {
    allowedFields = isOwnRecord ? rules.read.self : rules.read.others;
  } else {
    allowedFields = rules.read;
  }
  
  const filteredData = {};
  allowedFields.forEach(field => {
    if (employee[field] !== undefined) {
      filteredData[field] = employee[field];
    }
  });
  
  return filteredData;
};
```

## 3. API Endpoint Analysis

### 3.1 Employee Management API Patterns
```javascript
// GET /api/employees - Advanced filtering and pagination
router.get('/', authenticateToken, hasPermission('employee.view.all'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      department,
      status,
      position,
      manager,
      sortBy = 'firstName',
      sortOrder = 'ASC',
      fields // Field selection for API optimization
    } = req.query;
    
    // Build dynamic where clause
    let where = {};
    
    // Role-based data filtering
    if (req.user.role === 'manager') {
      // Managers can only see their team
      const subordinates = await Employee.findAll({
        where: { managerId: req.employeeId },
        attributes: ['id']
      });
      const subordinateIds = subordinates.map(emp => emp.id);
      where.id = { [Op.in]: [...subordinateIds, req.employeeId] };
    }
    
    // Search functionality
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { employeeId: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Filter conditions
    if (department) where.departmentId = department;
    if (status) where.status = status;
    if (position) where.positionId = position;
    if (manager) where.managerId = manager;
    
    // Field selection for performance
    let attributes;
    if (fields) {
      attributes = fields.split(',').filter(field => 
        fieldAccessRules.employee[req.user.role].read.includes(field) ||
        fieldAccessRules.employee[req.user.role].read.includes('*')
      );
    }
    
    const { count, rows } = await Employee.findAndCountAll({
      where,
      attributes,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['email', 'role', 'isActive', 'lastLoginAt']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        },
        {
          model: Position,
          as: 'position',
          attributes: ['id', 'title']
        },
        {
          model: Employee,
          as: 'manager',
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: Math.min(parseInt(limit), 100), // Max 100 records
      offset: (parseInt(page) - 1) * parseInt(limit),
      distinct: true
    });
    
    // Apply field-level filtering
    const filteredEmployees = rows.map(emp => {
      const empData = emp.toJSON();
      return filterEmployeeData(empData, req.user.role, emp.id === req.employeeId);
    });
    
    res.json({
      success: true,
      data: filteredEmployees,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        totalRecords: count,
        recordsPerPage: parseInt(limit)
      }
    });
    
  } catch (error) {
    console.error('Get Employees Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
```

### 3.2 Payroll Processing API
```javascript
// POST /api/payroll/generate - Bulk payroll generation
router.post('/generate', 
  authenticateToken,
  hasPermission('payroll.process'),
  validate(payrollSchema.generate),
  async (req, res) => {
    const transaction = await db.sequelize.transaction();
    
    try {
      const { month, year, employeeIds } = req.body;
      
      // Get employees for payroll generation
      let employees;
      if (employeeIds) {
        employees = await Employee.findAll({
          where: { id: { [Op.in]: employeeIds }, status: 'Active' },
          include: [{ model: SalaryStructure, as: 'salaryStructure' }],
          transaction
        });
      } else {
        employees = await Employee.findAll({
          where: { status: 'Active' },
          include: [{ model: SalaryStructure, as: 'salaryStructure' }],
          transaction
        });
      }
      
      const generatedPayrolls = [];
      
      for (const employee of employees) {
        // Check if payroll already exists
        const existingPayroll = await Payroll.findOne({
          where: { employeeId: employee.id, month, year },
          transaction
        });
        
        if (existingPayroll) {
          continue; // Skip if already generated
        }
        
        // Calculate payroll components
        const salaryStructure = employee.salaryStructure;
        if (!salaryStructure) {
          console.warn(`No salary structure found for employee ${employee.employeeId}`);
          continue;
        }
        
        // Get working days and attendance
        const { workingDays, actualWorkingDays, leaveDays } = 
          await calculateAttendance(employee.id, month, year);
        
        // Calculate overtime
        const { overtimeHours, overtimePay } = 
          await calculateOvertime(employee.id, month, year);
        
        // Calculate gross salary
        const grossSalary = salaryStructure.basicSalary + 
                           salaryStructure.hra + 
                           salaryStructure.allowances;
        
        // Calculate pro-rated salary based on attendance
        const proRatedGross = (grossSalary / workingDays) * actualWorkingDays;
        
        // Calculate deductions
        const pfDeduction = salaryStructure.basicSalary * 0.12; // 12% PF
        const totalDeductions = pfDeduction + 
                              salaryStructure.tds + 
                              salaryStructure.professionalTax + 
                              salaryStructure.otherDeductions;
        
        // Calculate net salary
        const netSalary = proRatedGross + overtimePay - totalDeductions;
        
        // Create payroll record
        const payroll = await Payroll.create({
          employeeId: employee.id,
          payPeriodStart: `${year}-${month.toString().padStart(2, '0')}-01`,
          payPeriodEnd: new Date(year, month, 0).toISOString().split('T')[0],
          month,
          year,
          grossSalary: proRatedGross,
          totalDeductions,
          netSalary,
          workingDays,
          actualWorkingDays,
          leaveDays,
          overtimeHours,
          overtimePay,
          processedBy: req.employeeId,
          processedAt: new Date()
        }, { transaction });
        
        // Create detailed payroll components
        await PayrollComponent.bulkCreate([
          {
            payrollId: payroll.id,
            componentType: 'earnings',
            componentName: 'Basic Salary',
            amount: (salaryStructure.basicSalary / workingDays) * actualWorkingDays
          },
          {
            payrollId: payroll.id,
            componentType: 'earnings',
            componentName: 'HRA',
            amount: (salaryStructure.hra / workingDays) * actualWorkingDays
          },
          {
            payrollId: payroll.id,
            componentType: 'earnings',
            componentName: 'Allowances',
            amount: (salaryStructure.allowances / workingDays) * actualWorkingDays
          },
          {
            payrollId: payroll.id,
            componentType: 'earnings',
            componentName: 'Overtime Pay',
            amount: overtimePay
          },
          {
            payrollId: payroll.id,
            componentType: 'deductions',
            componentName: 'PF Contribution',
            amount: pfDeduction
          },
          {
            payrollId: payroll.id,
            componentType: 'deductions',
            componentName: 'TDS',
            amount: salaryStructure.tds
          },
          {
            payrollId: payroll.id,
            componentType: 'deductions',
            componentName: 'Professional Tax',
            amount: salaryStructure.professionalTax
          }
        ], { transaction });
        
        generatedPayrolls.push(payroll);
      }
      
      await transaction.commit();
      
      res.json({
        success: true,
        message: `Generated payroll for ${generatedPayrolls.length} employees`,
        data: {
          count: generatedPayrolls.length,
          payrolls: generatedPayrolls.map(p => ({
            id: p.id,
            employeeId: p.employeeId,
            netSalary: p.netSalary
          }))
        }
      });
      
    } catch (error) {
      await transaction.rollback();
      console.error('Payroll Generation Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate payroll',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Utility functions for payroll calculation
const calculateAttendance = async (employeeId, month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  // Get total working days (excluding weekends)
  const workingDays = getWorkingDays(startDate, endDate);
  
  // Get approved timesheets
  const timesheets = await Timesheet.findAll({
    where: {
      employeeId,
      workDate: {
        [Op.between]: [startDate, endDate]
      },
      status: 'Approved'
    }
  });
  
  const actualWorkingDays = timesheets.length;
  
  // Get approved leaves
  const leaves = await LeaveRequest.findAll({
    where: {
      employeeId,
      status: 'Approved',
      startDate: { [Op.lte]: endDate },
      endDate: { [Op.gte]: startDate }
    }
  });
  
  const leaveDays = leaves.reduce((total, leave) => {
    const leaveStart = new Date(Math.max(leave.startDate, startDate));
    const leaveEnd = new Date(Math.min(leave.endDate, endDate));
    return total + getWorkingDays(leaveStart, leaveEnd);
  }, 0);
  
  return { workingDays, actualWorkingDays, leaveDays };
};

const calculateOvertime = async (employeeId, month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const timesheets = await Timesheet.findAll({
    where: {
      employeeId,
      workDate: {
        [Op.between]: [startDate, endDate]
      },
      status: 'Approved',
      hoursWorked: { [Op.gt]: 8 } // Standard 8-hour workday
    }
  });
  
  const overtimeHours = timesheets.reduce((total, ts) => {
    return total + Math.max(0, ts.hoursWorked - 8);
  }, 0);
  
  // Get employee's hourly rate (basic salary / (working days * 8))
  const employee = await Employee.findByPk(employeeId, {
    include: [{ model: SalaryStructure, as: 'salaryStructure' }]
  });
  
  const workingDays = getWorkingDays(startDate, endDate);
  const hourlyRate = employee.salaryStructure.basicSalary / (workingDays * 8);
  const overtimePay = overtimeHours * hourlyRate * 1.5; // 1.5x overtime rate
  
  return { overtimeHours, overtimePay };
};

const getWorkingDays = (startDate, endDate) => {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Sunday(0) and Saturday(6)
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};
```

## 4. Frontend State Management Patterns

### 4.1 Advanced Context Implementation
```javascript
// Enhanced LoadingContext with multiple loading states
const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState({});
  const [globalLoading, setGlobalLoading] = useState(false);
  
  const setLoading = useCallback((key, status) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: status
    }));
    
    // Update global loading state
    setGlobalLoading(Object.values({
      ...loadingStates,
      [key]: status
    }).some(Boolean));
  }, [loadingStates]);
  
  const isLoading = useCallback((key) => {
    return Boolean(loadingStates[key]);
  }, [loadingStates]);
  
  const clearLoading = useCallback(() => {
    setLoadingStates({});
    setGlobalLoading(false);
  }, []);
  
  const value = useMemo(() => ({
    loadingStates,
    globalLoading,
    isLoading,
    setLoading,
    clearLoading
  }), [loadingStates, globalLoading, isLoading, setLoading, clearLoading]);
  
  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

// Usage in components
const EmployeeList = () => {
  const { isLoading, setLoading } = useLoading();
  const [employees, setEmployees] = useState([]);
  
  const loadEmployees = useCallback(async () => {
    setLoading('employees-list', true);
    try {
      const response = await employeeService.getAll();
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to load employees:', error);
    } finally {
      setLoading('employees-list', false);
    }
  }, [setLoading]);
  
  const isLoadingEmployees = isLoading('employees-list');
  
  return (
    <Box>
      {isLoadingEmployees ? (
        <CircularProgress />
      ) : (
        <ResponsiveTable data={employees} {...tableProps} />
      )}
    </Box>
  );
};
```

### 4.2 Performance Optimization Patterns
```javascript
// Memoized components for performance
const EmployeeMobileCard = React.memo(({ employee, onAction }) => {
  const statusColor = useMemo(() => {
    return employee.status === 'Active' ? 'success' : 'default';
  }, [employee.status]);
  
  const handleAction = useCallback((action) => {
    onAction?.(employee, action);
  }, [employee, onAction]);
  
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
            {employee.firstName?.[0]}{employee.lastName?.[0]}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">
              {employee.firstName} {employee.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {employee.employeeId} • {employee.department?.name}
            </Typography>
          </Box>
          <Chip
            label={employee.status}
            color={statusColor}
            size="small"
          />
        </Box>
        
        <Stack spacing={1}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Position
            </Typography>
            <Typography variant="body2">
              {employee.position?.title}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Manager
            </Typography>
            <Typography variant="body2">
              {employee.manager ? 
                `${employee.manager.firstName} ${employee.manager.lastName}` : 
                'Not assigned'
              }
            </Typography>
          </Box>
        </Stack>
        
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleAction('view')}
          >
            View
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={() => handleAction('edit')}
          >
            Edit
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
});

// Virtualized list for large datasets
import { FixedSizeList as List } from 'react-window';

const VirtualizedEmployeeList = ({ employees, height = 400 }) => {
  const Row = useCallback(({ index, style }) => (
    <div style={style}>
      <EmployeeMobileCard 
        employee={employees[index]} 
        onAction={handleEmployeeAction}
      />
    </div>
  ), [employees]);
  
  return (
    <List
      height={height}
      itemCount={employees.length}
      itemSize={200} // Height of each card
      width="100%"
    >
      {Row}
    </List>
  );
};
```

## 5. Database Optimization Strategies

### 5.1 Index Strategy
```sql
-- Performance indexes for common queries
CREATE INDEX CONCURRENTLY idx_employees_active_status 
ON employees(status) WHERE status = 'Active';

CREATE INDEX CONCURRENTLY idx_employees_department_active 
ON employees(departmentId, status) WHERE status = 'Active';

CREATE INDEX CONCURRENTLY idx_leave_requests_employee_status_date 
ON leave_requests(employeeId, status, startDate DESC);

CREATE INDEX CONCURRENTLY idx_timesheets_employee_date_status 
ON timesheets(employeeId, workDate DESC, status);

CREATE INDEX CONCURRENTLY idx_payrolls_employee_period 
ON payrolls(employeeId, year DESC, month DESC);

-- Composite indexes for complex queries
CREATE INDEX CONCURRENTLY idx_employees_search 
ON employees USING gin(
  to_tsvector('english', firstName || ' ' || lastName || ' ' || email)
);

-- Partial indexes for specific use cases
CREATE INDEX CONCURRENTLY idx_employees_managers 
ON employees(managerId) WHERE managerId IS NOT NULL;
```

### 5.2 Query Optimization Examples
```javascript
// Optimized employee search with full-text search
const searchEmployees = async (searchTerm, filters = {}) => {
  const whereClause = {
    status: 'Active'
  };
  
  if (searchTerm) {
    // Use PostgreSQL full-text search
    whereClause[Op.and] = Sequelize.literal(
      `to_tsvector('english', "firstName" || ' ' || "lastName" || ' ' || "email") @@ plainto_tsquery('english', :searchTerm)`
    );
  }
  
  // Add filters
  if (filters.department) whereClause.departmentId = filters.department;
  if (filters.position) whereClause.positionId = filters.position;
  
  return await Employee.findAll({
    where: whereClause,
    replacements: { searchTerm },
    include: [
      {
        model: Department,
        as: 'department',
        attributes: ['id', 'name']
      },
      {
        model: Position,
        as: 'position',
        attributes: ['id', 'title']
      }
    ],
    order: [
      // Relevance ranking for search results
      Sequelize.literal(`ts_rank(to_tsvector('english', "firstName" || ' ' || "lastName" || ' ' || "email"), plainto_tsquery('english', '${searchTerm}')) DESC`),
      ['firstName', 'ASC']
    ],
    limit: 50
  });
};

// Optimized payroll summary with aggregations
const getPayrollSummary = async (month, year) => {
  return await Payroll.findAll({
    where: { month, year },
    attributes: [
      'status',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
      [Sequelize.fn('SUM', Sequelize.col('grossSalary')), 'totalGross'],
      [Sequelize.fn('SUM', Sequelize.col('netSalary')), 'totalNet'],
      [Sequelize.fn('SUM', Sequelize.col('totalDeductions')), 'totalDeductions']
    ],
    group: ['status'],
    raw: true
  });
};
```

This technical analysis provides comprehensive insights into the SkyRakSys HRM system's advanced patterns, security implementation, performance optimization strategies, and detailed API structures. It serves as a complete technical reference for system understanding and future development planning.
