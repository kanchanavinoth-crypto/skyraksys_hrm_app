/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - role
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the user
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address (unique)
 *         password:
 *           type: string
 *           minLength: 6
 *           description: User's password (hashed in database)
 *         role:
 *           type: string
 *           enum: [admin, hr_manager, team_lead, employee]
 *           description: User's role in the system
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Whether the user account is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         id: 1
 *         email: "admin@skyraksys.com"
 *         role: "admin"
 *         isActive: true
 *         createdAt: "2024-01-15T10:30:00Z"
 *         updatedAt: "2024-01-15T10:30:00Z"
 *     
 *     Employee:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - position
 *         - department
 *         - dateOfJoining
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the employee
 *         userId:
 *           type: integer
 *           description: Reference to the user account
 *         employeeId:
 *           type: string
 *           description: Unique employee identifier (e.g., EMP001)
 *         firstName:
 *           type: string
 *           description: Employee's first name
 *         lastName:
 *           type: string
 *           description: Employee's last name
 *         email:
 *           type: string
 *           format: email
 *           description: Employee's email address
 *         phone:
 *           type: string
 *           description: Employee's phone number
 *         dateOfBirth:
 *           type: string
 *           format: date
 *           description: Employee's date of birth
 *         dateOfJoining:
 *           type: string
 *           format: date
 *           description: Employee's joining date
 *         position:
 *           type: string
 *           description: Employee's job position
 *         department:
 *           type: string
 *           description: Employee's department
 *         managerId:
 *           type: integer
 *           description: Reference to the employee's manager
 *         salary:
 *           type: number
 *           description: Employee's base salary
 *         salaryStructure:
 *           type: object
 *           description: Detailed salary breakdown
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Whether the employee is currently active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         id: 1
 *         userId: 2
 *         employeeId: "EMP001"
 *         firstName: "John"
 *         lastName: "Doe"
 *         email: "john.doe@skyraksys.com"
 *         phone: "+1234567890"
 *         dateOfJoining: "2024-01-15"
 *         position: "Software Developer"
 *         department: "Engineering"
 *         salary: 75000
 *         isActive: true
 *     
 *     Leave:
 *       type: object
 *       required:
 *         - employeeId
 *         - leaveType
 *         - startDate
 *         - endDate
 *         - reason
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the leave request
 *         employeeId:
 *           type: integer
 *           description: Reference to the employee
 *         leaveType:
 *           type: string
 *           enum: [annual, sick, personal, maternity, paternity, emergency]
 *           description: Type of leave being requested
 *         startDate:
 *           type: string
 *           format: date
 *           description: Leave start date
 *         endDate:
 *           type: string
 *           format: date
 *           description: Leave end date
 *         reason:
 *           type: string
 *           description: Reason for taking leave
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected]
 *           default: pending
 *           description: Current status of the leave request
 *         approverId:
 *           type: integer
 *           description: Reference to the approving manager
 *         approverComments:
 *           type: string
 *           description: Comments from the approver
 *         totalDays:
 *           type: integer
 *           description: Total number of leave days
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         id: 1
 *         employeeId: 1
 *         leaveType: "annual"
 *         startDate: "2024-02-15"
 *         endDate: "2024-02-20"
 *         reason: "Family vacation"
 *         status: "pending"
 *         totalDays: 5
 *     
 *     Timesheet:
 *       type: object
 *       required:
 *         - employeeId
 *         - date
 *         - hoursWorked
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the timesheet entry
 *         employeeId:
 *           type: integer
 *           description: Reference to the employee
 *         date:
 *           type: string
 *           format: date
 *           description: Date of work
 *         hoursWorked:
 *           type: number
 *           minimum: 0
 *           maximum: 24
 *           description: Number of hours worked
 *         overtimeHours:
 *           type: number
 *           minimum: 0
 *           description: Number of overtime hours
 *         projectId:
 *           type: integer
 *           description: Reference to the project worked on
 *         taskId:
 *           type: integer
 *           description: Reference to the specific task
 *         description:
 *           type: string
 *           description: Description of work performed
 *         status:
 *           type: string
 *           enum: [draft, submitted, approved, rejected]
 *           default: draft
 *           description: Current status of the timesheet
 *         approverId:
 *           type: integer
 *           description: Reference to the approving manager
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         id: 1
 *         employeeId: 1
 *         date: "2024-01-15"
 *         hoursWorked: 8
 *         overtimeHours: 2
 *         description: "Frontend development and testing"
 *         status: "submitted"
 *     
 *     Project:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - startDate
 *         - managerId
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the project
 *         name:
 *           type: string
 *           description: Project name
 *         description:
 *           type: string
 *           description: Project description
 *         startDate:
 *           type: string
 *           format: date
 *           description: Project start date
 *         endDate:
 *           type: string
 *           format: date
 *           description: Project end date (optional)
 *         status:
 *           type: string
 *           enum: [planning, active, on_hold, completed, cancelled]
 *           default: planning
 *           description: Current project status
 *         managerId:
 *           type: integer
 *           description: Reference to the project manager
 *         budget:
 *           type: number
 *           description: Project budget
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Whether the project is currently active
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         id: 1
 *         name: "HRM System Development"
 *         description: "Development of the HR management system"
 *         startDate: "2024-01-01"
 *         status: "active"
 *         managerId: 1
 *         budget: 100000
 *         isActive: true
 *     
 *     Payslip:
 *       type: object
 *       required:
 *         - employeeId
 *         - payPeriod
 *         - basicSalary
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the payslip
 *         employeeId:
 *           type: integer
 *           description: Reference to the employee
 *         payPeriod:
 *           type: string
 *           description: Pay period (e.g., "2024-01", "January 2024")
 *         basicSalary:
 *           type: number
 *           description: Basic salary amount
 *         allowances:
 *           type: object
 *           description: Various allowances (HRA, transport, etc.)
 *         deductions:
 *           type: object
 *           description: Various deductions (tax, PF, etc.)
 *         grossSalary:
 *           type: number
 *           description: Total salary before deductions
 *         netSalary:
 *           type: number
 *           description: Final salary after deductions
 *         overtimeAmount:
 *           type: number
 *           description: Amount earned from overtime
 *         bonuses:
 *           type: number
 *           description: Any bonuses included
 *         generatedAt:
 *           type: string
 *           format: date-time
 *           description: When the payslip was generated
 *         isFinalized:
 *           type: boolean
 *           default: false
 *           description: Whether the payslip is finalized
 *       example:
 *         id: 1
 *         employeeId: 1
 *         payPeriod: "2024-01"
 *         basicSalary: 6250
 *         grossSalary: 7500
 *         netSalary: 6500
 *         generatedAt: "2024-02-01T00:00:00Z"
 *         isFinalized: true
 *     
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Whether the request was successful
 *         message:
 *           type: string
 *           description: Human-readable message
 *         data:
 *           type: object
 *           description: Response data (varies by endpoint)
 *         error:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *               description: Error code
 *             details:
 *               type: string
 *               description: Detailed error message
 *       example:
 *         success: true
 *         message: "Operation completed successfully"
 *         data: {}
 *         error: null
 * 
 * security:
 *   - bearerAuth: []
 */

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication and authorization
 *   - name: Users
 *     description: User management operations
 *   - name: Employees
 *     description: Employee management operations
 *   - name: Leaves
 *     description: Leave management system
 *   - name: Timesheets
 *     description: Time tracking and timesheet management
 *   - name: Projects
 *     description: Project and task management
 *   - name: Payroll
 *     description: Payroll and payslip management
 *   - name: Reports
 *     description: Reporting and analytics
 *   - name: System
 *     description: System health and configuration
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@skyraksys.com"
 *               password:
 *                 type: string
 *                 example: "admin123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: JWT token for authentication
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     employee:
 *                       $ref: '#/components/schemas/Employee'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Missing required fields
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               role:
 *                 type: string
 *                 enum: [admin, hr_manager, team_lead, employee]
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input or user already exists
 *       403:
 *         description: Insufficient permissions
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         employee:
 *                           $ref: '#/components/schemas/Employee'
 *       401:
 *         description: Invalid or expired token
 */

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: Get all employees
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of employees per page
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *       - in: query
 *         name: position
 *         schema:
 *           type: string
 *         description: Filter by position
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Employees retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         employees:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Employee'
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             page:
 *                               type: integer
 *                             limit:
 *                               type: integer
 *                             total:
 *                               type: integer
 *                             pages:
 *                               type: integer
 *       403:
 *         description: Insufficient permissions
 *   post:
 *     summary: Create new employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - position
 *               - department
 *               - dateOfJoining
 *               - salary
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               dateOfJoining:
 *                 type: string
 *                 format: date
 *               position:
 *                 type: string
 *               department:
 *                 type: string
 *               managerId:
 *                 type: integer
 *               salary:
 *                 type: number
 *               createUser:
 *                 type: boolean
 *                 description: Whether to create a user account for this employee
 *               userRole:
 *                 type: string
 *                 enum: [employee, team_lead, hr_manager]
 *                 description: Role for the user account (if createUser is true)
 *     responses:
 *       201:
 *         description: Employee created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Employee'
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Insufficient permissions
 */

/**
 * @swagger
 * /api/employees/{id}:
 *   get:
 *     summary: Get employee by ID
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Employee retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Employee not found
 *       403:
 *         description: Insufficient permissions
 *   put:
 *     summary: Update employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               position:
 *                 type: string
 *               department:
 *                 type: string
 *               managerId:
 *                 type: integer
 *               salary:
 *                 type: number
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Employee not found
 *       403:
 *         description: Insufficient permissions
 *   delete:
 *     summary: Delete employee (soft delete)
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Employee deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Employee not found
 *       403:
 *         description: Insufficient permissions
 */

/**
 * @swagger
 * /api/leaves:
 *   get:
 *     summary: Get leave requests
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: integer
 *         description: Filter by employee ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter by leave status
 *       - in: query
 *         name: leaveType
 *         schema:
 *           type: string
 *           enum: [annual, sick, personal, maternity, paternity, emergency]
 *         description: Filter by leave type
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter leaves starting from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter leaves ending before this date
 *     responses:
 *       200:
 *         description: Leave requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Leave'
 *   post:
 *     summary: Create leave request
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leaveType
 *               - startDate
 *               - endDate
 *               - reason
 *             properties:
 *               leaveType:
 *                 type: string
 *                 enum: [annual, sick, personal, maternity, paternity, emergency]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               reason:
 *                 type: string
 *               employeeId:
 *                 type: integer
 *                 description: Employee ID (for managers creating on behalf of employees)
 *     responses:
 *       201:
 *         description: Leave request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Leave'
 *       400:
 *         description: Invalid input data
 */

/**
 * @swagger
 * /api/leaves/{id}/approve:
 *   patch:
 *     summary: Approve leave request
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Leave request ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comments:
 *                 type: string
 *                 description: Approver comments
 *     responses:
 *       200:
 *         description: Leave request approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Leave'
 *       404:
 *         description: Leave request not found
 *       403:
 *         description: Insufficient permissions
 */

/**
 * @swagger
 * /api/leaves/{id}/reject:
 *   patch:
 *     summary: Reject leave request
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Leave request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comments
 *             properties:
 *               comments:
 *                 type: string
 *                 description: Reason for rejection
 *     responses:
 *       200:
 *         description: Leave request rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Leave'
 *       404:
 *         description: Leave request not found
 *       403:
 *         description: Insufficient permissions
 */

/**
 * @swagger
 * /api/timesheets:
 *   get:
 *     summary: Get timesheets
 *     tags: [Timesheets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: integer
 *         description: Filter by employee ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by specific date
 *       - in: query
 *         name: week
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by week starting date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, submitted, approved, rejected]
 *         description: Filter by timesheet status
 *     responses:
 *       200:
 *         description: Timesheets retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Timesheet'
 *   post:
 *     summary: Create or update timesheet entry
 *     tags: [Timesheets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - hoursWorked
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               hoursWorked:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 24
 *               overtimeHours:
 *                 type: number
 *                 minimum: 0
 *               projectId:
 *                 type: integer
 *               taskId:
 *                 type: integer
 *               description:
 *                 type: string
 *               employeeId:
 *                 type: integer
 *                 description: Employee ID (for managers entering on behalf of employees)
 *     responses:
 *       201:
 *         description: Timesheet entry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Timesheet'
 *       400:
 *         description: Invalid input data
 */

/**
 * @swagger
 * /api/timesheets/weekly:
 *   post:
 *     summary: Submit weekly timesheet
 *     tags: [Timesheets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - weekStartDate
 *               - timesheets
 *             properties:
 *               weekStartDate:
 *                 type: string
 *                 format: date
 *                 description: Monday of the week being submitted
 *               timesheets:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                       format: date
 *                     hoursWorked:
 *                       type: number
 *                     overtimeHours:
 *                       type: number
 *                     projectId:
 *                       type: integer
 *                     description:
 *                       type: string
 *     responses:
 *       200:
 *         description: Weekly timesheet submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         submittedEntries:
 *                           type: integer
 *                         totalHours:
 *                           type: number
 *                         overtimeHours:
 *                           type: number
 *       400:
 *         description: Invalid input data
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [planning, active, on_hold, completed, cancelled]
 *         description: Filter by project status
 *       - in: query
 *         name: managerId
 *         schema:
 *           type: integer
 *         description: Filter by project manager
 *     responses:
 *       200:
 *         description: Projects retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Project'
 *   post:
 *     summary: Create new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - startDate
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               managerId:
 *                 type: integer
 *               budget:
 *                 type: number
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Project'
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Insufficient permissions
 */

/**
 * @swagger
 * /api/payroll/payslips:
 *   get:
 *     summary: Get payslips
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: integer
 *         description: Filter by employee ID
 *       - in: query
 *         name: payPeriod
 *         schema:
 *           type: string
 *         description: Filter by pay period (e.g., "2024-01")
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Filter by year
 *     responses:
 *       200:
 *         description: Payslips retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Payslip'
 *   post:
 *     summary: Generate payslip
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - payPeriod
 *             properties:
 *               employeeId:
 *                 type: integer
 *               payPeriod:
 *                 type: string
 *                 description: Pay period (e.g., "2024-01")
 *               bonuses:
 *                 type: number
 *                 description: Additional bonuses for this period
 *               deductions:
 *                 type: object
 *                 description: Additional deductions
 *     responses:
 *       201:
 *         description: Payslip generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Payslip'
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Insufficient permissions
 */

/**
 * @swagger
 * /api/reports/employees:
 *   get:
 *     summary: Generate employee report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *       - in: query
 *         name: position
 *         schema:
 *           type: string
 *         description: Filter by position
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv, pdf]
 *           default: json
 *         description: Report format
 *     responses:
 *       200:
 *         description: Employee report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         totalEmployees:
 *                           type: integer
 *                         activeEmployees:
 *                           type: integer
 *                         departmentBreakdown:
 *                           type: object
 *                         positionBreakdown:
 *                           type: object
 *                         employees:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Employee'
 *       403:
 *         description: Insufficient permissions
 */

/**
 * @swagger
 * /api/reports/attendance:
 *   get:
 *     summary: Generate attendance report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Report start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Report end date
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: integer
 *         description: Specific employee ID
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *     responses:
 *       200:
 *         description: Attendance report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         summary:
 *                           type: object
 *                           properties:
 *                             totalHours:
 *                               type: number
 *                             totalOvertimeHours:
 *                               type: number
 *                             averageHoursPerDay:
 *                               type: number
 *                         attendanceData:
 *                           type: array
 *                           items:
 *                             type: object
 *       403:
 *         description: Insufficient permissions
 */

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Basic health check
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: System uptime in seconds
 */

/**
 * @swagger
 * /api/health/detailed:
 *   get:
 *     summary: Detailed system health check
 *     tags: [System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Detailed system status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 database:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                     responseTime:
 *                       type: number
 *                 memory:
 *                   type: object
 *                   properties:
 *                     used:
 *                       type: number
 *                     total:
 *                       type: number
 *                     percentage:
 *                       type: number
 *                 version:
 *                   type: string
 *                 environment:
 *                   type: string
 *       401:
 *         description: Authentication required
 */
