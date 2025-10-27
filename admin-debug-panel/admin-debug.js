// Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Global state
let currentData = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    refreshDashboard();
    loadEmployees();
});

// Tab switching
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update sections
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    
    // Load data for the tab
    switch(tabName) {
        case 'dashboard':
            refreshDashboard();
            break;
        case 'employees':
            loadEmployees();
            break;
        case 'departments':
            loadDepartments();
            break;
        case 'positions':
            loadPositions();
            break;
        case 'users':
            loadUsers();
            break;
        case 'leaves':
            loadLeaves();
            break;
        case 'timesheets':
            loadTimesheets();
            break;
        case 'payslips':
            loadPayslips();
            break;
    }
}

// Toast notifications
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast toast-${type} active`;
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

// API helpers
async function apiGet(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        const data = await response.json();
        return data.data || data;
    } catch (error) {
        console.error('API Error:', error);
        showToast(`Error: ${error.message}`, 'error');
        return null;
    }
}

async function apiPost(endpoint, body) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        showToast(`Error: ${error.message}`, 'error');
        return null;
    }
}

async function apiPut(endpoint, body) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        showToast(`Error: ${error.message}`, 'error');
        return null;
    }
}

async function apiDelete(endpoint) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE'
        });
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        showToast(`Error: ${error.message}`, 'error');
        return null;
    }
}

// Dashboard
async function refreshDashboard() {
    try {
        const [employees, users, departments, leaves, timesheets, payslips] = await Promise.all([
            apiGet('/employees'),
            apiGet('/auth/users'),
            apiGet('/departments'),
            apiGet('/leaves'),
            apiGet('/timesheets'),
            apiGet('/payslips')
        ]);
        
        document.getElementById('totalEmployees').textContent = employees?.length || 0;
        document.getElementById('totalUsers').textContent = users?.length || 0;
        document.getElementById('totalDepartments').textContent = departments?.length || 0;
        document.getElementById('pendingLeaves').textContent = 
            leaves?.filter(l => l.status === 'pending').length || 0;
        
        // Current month timesheets
        const currentMonth = new Date().getMonth();
        const monthTimesheets = timesheets?.filter(t => 
            new Date(t.createdAt).getMonth() === currentMonth
        ).length || 0;
        document.getElementById('monthTimesheets').textContent = monthTimesheets;
        
        document.getElementById('totalPayslips').textContent = payslips?.length || 0;
        
        showToast('Dashboard refreshed', 'success');
    } catch (error) {
        showToast('Error loading dashboard', 'error');
    }
}

// Employees
async function loadEmployees() {
    const tbody = document.getElementById('employeesTable');
    tbody.innerHTML = '<tr><td colspan="9" class="loading">Loading...</td></tr>';
    
    const employees = await apiGet('/employees');
    currentData.employees = employees;
    
    if (!employees || employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No employees found</td></tr>';
        return;
    }
    
    tbody.innerHTML = employees.map(emp => `
        <tr>
            <td>${emp.id.substring(0, 8)}...</td>
            <td><strong>${emp.employeeId}</strong></td>
            <td>${emp.firstName} ${emp.lastName}</td>
            <td>${emp.email}</td>
            <td>${emp.department?.name || 'N/A'}</td>
            <td>${emp.position?.title || 'N/A'}</td>
            <td><span class="badge badge-${emp.status === 'Active' ? 'success' : 'danger'}">${emp.status}</span></td>
            <td>${new Date(emp.hireDate).toLocaleDateString()}</td>
            <td class="action-btns">
                <button class="btn btn-sm btn-primary" onclick='viewEmployee(${JSON.stringify(emp).replace(/'/g, "&apos;")})'>👁️</button>
                <button class="btn btn-sm btn-warning" onclick='editEmployee("${emp.id}")'>✏️</button>
                <button class="btn btn-sm btn-danger" onclick='deleteEmployee("${emp.id}")'>🗑️</button>
            </td>
        </tr>
    `).join('');
}

function searchEmployees() {
    const searchTerm = document.getElementById('employeeSearch').value.toLowerCase();
    const filtered = currentData.employees.filter(emp => 
        emp.firstName.toLowerCase().includes(searchTerm) ||
        emp.lastName.toLowerCase().includes(searchTerm) ||
        emp.email.toLowerCase().includes(searchTerm) ||
        emp.employeeId.toLowerCase().includes(searchTerm)
    );
    
    const tbody = document.getElementById('employeesTable');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state">No employees found</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(emp => `
        <tr>
            <td>${emp.id.substring(0, 8)}...</td>
            <td><strong>${emp.employeeId}</strong></td>
            <td>${emp.firstName} ${emp.lastName}</td>
            <td>${emp.email}</td>
            <td>${emp.department?.name || 'N/A'}</td>
            <td>${emp.position?.title || 'N/A'}</td>
            <td><span class="badge badge-${emp.status === 'Active' ? 'success' : 'danger'}">${emp.status}</span></td>
            <td>${new Date(emp.hireDate).toLocaleDateString()}</td>
            <td class="action-btns">
                <button class="btn btn-sm btn-primary" onclick='viewEmployee(${JSON.stringify(emp).replace(/'/g, "&apos;")})'>👁️</button>
                <button class="btn btn-sm btn-warning" onclick='editEmployee("${emp.id}")'>✏️</button>
                <button class="btn btn-sm btn-danger" onclick='deleteEmployee("${emp.id}")'>🗑️</button>
            </td>
        </tr>
    `).join('');
}

function viewEmployee(employee) {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modalContent');
    
    content.innerHTML = `
        <h2>Employee Details</h2>
        <div class="json-viewer">${JSON.stringify(employee, null, 2)}</div>
        <div style="margin-top: 20px;">
            <button class="btn btn-primary" onclick="closeModal()">Close</button>
        </div>
    `;
    
    modal.classList.add('active');
}

function openAddEmployeeModal() {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modalContent');
    
    content.innerHTML = `
        <h2>Add New Employee</h2>
        <form onsubmit="addEmployee(event)">
            <div class="form-group">
                <label>Employee ID *</label>
                <input type="text" name="employeeId" required>
            </div>
            <div class="form-group">
                <label>First Name *</label>
                <input type="text" name="firstName" required>
            </div>
            <div class="form-group">
                <label>Last Name *</label>
                <input type="text" name="lastName" required>
            </div>
            <div class="form-group">
                <label>Email *</label>
                <input type="email" name="email" required>
            </div>
            <div class="form-group">
                <label>Phone</label>
                <input type="tel" name="phone">
            </div>
            <div class="form-group">
                <label>Hire Date *</label>
                <input type="date" name="hireDate" required>
            </div>
            <div class="form-group">
                <label>Status</label>
                <select name="status">
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Terminated">Terminated</option>
                </select>
            </div>
            <div class="action-btns">
                <button type="submit" class="btn btn-success">Save</button>
                <button type="button" class="btn btn-danger" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;
    
    modal.classList.add('active');
}

async function addEmployee(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    const result = await apiPost('/employees', data);
    if (result && result.success) {
        showToast('Employee added successfully', 'success');
        closeModal();
        loadEmployees();
    }
}

async function deleteEmployee(id) {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    
    const result = await apiDelete(`/employees/${id}`);
    if (result && result.success) {
        showToast('Employee deleted', 'success');
        loadEmployees();
    }
}

// Departments
async function loadDepartments() {
    const tbody = document.getElementById('departmentsTable');
    tbody.innerHTML = '<tr><td colspan="6" class="loading">Loading...</td></tr>';
    
    const departments = await apiGet('/departments');
    currentData.departments = departments;
    
    if (!departments || departments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No departments found</td></tr>';
        return;
    }
    
    tbody.innerHTML = departments.map(dept => `
        <tr>
            <td>${dept.id.substring(0, 8)}...</td>
            <td><strong>${dept.name}</strong></td>
            <td>${dept.description || 'N/A'}</td>
            <td><span class="badge badge-${dept.isActive ? 'success' : 'danger'}">${dept.isActive ? 'Active' : 'Inactive'}</span></td>
            <td>${dept.employees?.length || 0}</td>
            <td class="action-btns">
                <button class="btn btn-sm btn-warning" onclick='editDepartment("${dept.id}")'>✏️</button>
                <button class="btn btn-sm btn-danger" onclick='deleteDepartment("${dept.id}")'>🗑️</button>
            </td>
        </tr>
    `).join('');
}

function openAddDepartmentModal() {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modalContent');
    
    content.innerHTML = `
        <h2>Add New Department</h2>
        <form onsubmit="addDepartment(event)">
            <div class="form-group">
                <label>Name *</label>
                <input type="text" name="name" required>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea name="description" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label>Status</label>
                <select name="isActive">
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                </select>
            </div>
            <div class="action-btns">
                <button type="submit" class="btn btn-success">Save</button>
                <button type="button" class="btn btn-danger" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;
    
    modal.classList.add('active');
}

async function addDepartment(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    data.isActive = data.isActive === 'true';
    
    const result = await apiPost('/departments', data);
    if (result && result.success) {
        showToast('Department added successfully', 'success');
        closeModal();
        loadDepartments();
    }
}

async function deleteDepartment(id) {
    if (!confirm('Are you sure you want to delete this department?')) return;
    
    const result = await apiDelete(`/departments/${id}`);
    if (result && result.success) {
        showToast('Department deleted', 'success');
        loadDepartments();
    }
}

// Positions
async function loadPositions() {
    const tbody = document.getElementById('positionsTable');
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Loading...</td></tr>';
    
    const positions = await apiGet('/positions');
    currentData.positions = positions;
    
    if (!positions || positions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No positions found</td></tr>';
        return;
    }
    
    tbody.innerHTML = positions.map(pos => `
        <tr>
            <td>${pos.id.substring(0, 8)}...</td>
            <td><strong>${pos.title}</strong></td>
            <td>${pos.description || 'N/A'}</td>
            <td><span class="badge badge-info">${pos.level || 'N/A'}</span></td>
            <td><span class="badge badge-${pos.isActive ? 'success' : 'danger'}">${pos.isActive ? 'Active' : 'Inactive'}</span></td>
            <td>${pos.employees?.length || 0}</td>
            <td class="action-btns">
                <button class="btn btn-sm btn-warning" onclick='editPosition("${pos.id}")'>✏️</button>
                <button class="btn btn-sm btn-danger" onclick='deletePosition("${pos.id}")'>🗑️</button>
            </td>
        </tr>
    `).join('');
}

function openAddPositionModal() {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modalContent');
    
    content.innerHTML = `
        <h2>Add New Position</h2>
        <form onsubmit="addPosition(event)">
            <div class="form-group">
                <label>Title *</label>
                <input type="text" name="title" required>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea name="description" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label>Level</label>
                <select name="level">
                    <option value="Entry">Entry</option>
                    <option value="Junior">Junior</option>
                    <option value="Mid">Mid</option>
                    <option value="Senior">Senior</option>
                    <option value="Lead">Lead</option>
                    <option value="Executive">Executive</option>
                </select>
            </div>
            <div class="form-group">
                <label>Status</label>
                <select name="isActive">
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                </select>
            </div>
            <div class="action-btns">
                <button type="submit" class="btn btn-success">Save</button>
                <button type="button" class="btn btn-danger" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;
    
    modal.classList.add('active');
}

async function addPosition(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    data.isActive = data.isActive === 'true';
    
    const result = await apiPost('/positions', data);
    if (result && result.success) {
        showToast('Position added successfully', 'success');
        closeModal();
        loadPositions();
    }
}

async function deletePosition(id) {
    if (!confirm('Are you sure you want to delete this position?')) return;
    
    const result = await apiDelete(`/positions/${id}`);
    if (result && result.success) {
        showToast('Position deleted', 'success');
        loadPositions();
    }
}

// Users
async function loadUsers() {
    const tbody = document.getElementById('usersTable');
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Loading...</td></tr>';
    
    const users = await apiGet('/auth/users');
    currentData.users = users;
    
    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No users found</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id.substring(0, 8)}...</td>
            <td>${user.firstName} ${user.lastName}</td>
            <td>${user.email}</td>
            <td><span class="badge badge-${getRoleBadgeColor(user.role)}">${user.role.toUpperCase()}</span></td>
            <td><span class="badge badge-${user.isActive ? 'success' : 'danger'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
            <td>${user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</td>
            <td class="action-btns">
                <button class="btn btn-sm btn-primary" onclick='viewUser(${JSON.stringify(user).replace(/'/g, "&apos;")})'>👁️</button>
                <button class="btn btn-sm btn-warning" onclick='resetPassword("${user.id}")'>🔑</button>
            </td>
        </tr>
    `).join('');
}

function getRoleBadgeColor(role) {
    const colors = {
        admin: 'danger',
        hr: 'warning',
        manager: 'info',
        employee: 'success'
    };
    return colors[role] || 'success';
}

function viewUser(user) {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modalContent');
    
    content.innerHTML = `
        <h2>User Details</h2>
        <div class="json-viewer">${JSON.stringify(user, null, 2)}</div>
        <div style="margin-top: 20px;">
            <button class="btn btn-primary" onclick="closeModal()">Close</button>
        </div>
    `;
    
    modal.classList.add('active');
}

async function resetPassword(userId) {
    const newPassword = prompt('Enter new password:');
    if (!newPassword) return;
    
    const result = await apiPut(`/auth/users/${userId}/reset-password`, {
        newPassword,
        forceChange: true
    });
    
    if (result && result.success) {
        showToast('Password reset successfully', 'success');
    }
}

// Leaves
async function loadLeaves() {
    const tbody = document.getElementById('leavesTable');
    tbody.innerHTML = '<tr><td colspan="8" class="loading">Loading...</td></tr>';
    
    const leaves = await apiGet('/leaves');
    currentData.leaves = leaves;
    
    if (!leaves || leaves.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No leave requests found</td></tr>';
        return;
    }
    
    tbody.innerHTML = leaves.map(leave => `
        <tr>
            <td>${leave.id.substring(0, 8)}...</td>
            <td>${leave.employee?.firstName} ${leave.employee?.lastName}</td>
            <td>${leave.leaveType}</td>
            <td>${new Date(leave.startDate).toLocaleDateString()}</td>
            <td>${new Date(leave.endDate).toLocaleDateString()}</td>
            <td>${leave.totalDays}</td>
            <td><span class="badge badge-${getLeaveStatusColor(leave.status)}">${leave.status.toUpperCase()}</span></td>
            <td class="action-btns">
                <button class="btn btn-sm btn-success" onclick='approveLeave("${leave.id}")'>✓</button>
                <button class="btn btn-sm btn-danger" onclick='rejectLeave("${leave.id}")'>✗</button>
            </td>
        </tr>
    `).join('');
}

function getLeaveStatusColor(status) {
    const colors = {
        pending: 'warning',
        approved: 'success',
        rejected: 'danger',
        cancelled: 'danger'
    };
    return colors[status] || 'warning';
}

async function approveLeave(id) {
    const result = await apiPut(`/leaves/${id}/approve`, {});
    if (result && result.success) {
        showToast('Leave approved', 'success');
        loadLeaves();
    }
}

async function rejectLeave(id) {
    const result = await apiPut(`/leaves/${id}/reject`, {});
    if (result && result.success) {
        showToast('Leave rejected', 'success');
        loadLeaves();
    }
}

// Timesheets
async function loadTimesheets() {
    const tbody = document.getElementById('timesheetsTable');
    tbody.innerHTML = '<tr><td colspan="7" class="loading">Loading...</td></tr>';
    
    const timesheets = await apiGet('/timesheets');
    currentData.timesheets = timesheets;
    
    if (!timesheets || timesheets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No timesheets found</td></tr>';
        return;
    }
    
    tbody.innerHTML = timesheets.map(ts => `
        <tr>
            <td>${ts.id.substring(0, 8)}...</td>
            <td>${ts.employee?.firstName} ${ts.employee?.lastName}</td>
            <td>Week ${ts.weekNumber}, ${ts.year}</td>
            <td>${ts.totalHours || 0}h</td>
            <td><span class="badge badge-${ts.status === 'submitted' ? 'success' : 'warning'}">${ts.status.toUpperCase()}</span></td>
            <td>${ts.submittedAt ? new Date(ts.submittedAt).toLocaleDateString() : 'Not submitted'}</td>
            <td class="action-btns">
                <button class="btn btn-sm btn-primary" onclick='viewTimesheet(${JSON.stringify(ts).replace(/'/g, "&apos;")})'>👁️</button>
            </td>
        </tr>
    `).join('');
}

function viewTimesheet(timesheet) {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modalContent');
    
    content.innerHTML = `
        <h2>Timesheet Details</h2>
        <div class="json-viewer">${JSON.stringify(timesheet, null, 2)}</div>
        <div style="margin-top: 20px;">
            <button class="btn btn-primary" onclick="closeModal()">Close</button>
        </div>
    `;
    
    modal.classList.add('active');
}

// Payslips
async function loadPayslips() {
    const tbody = document.getElementById('payslipsTable');
    tbody.innerHTML = '<tr><td colspan="8" class="loading">Loading...</td></tr>';
    
    const payslips = await apiGet('/payslips');
    currentData.payslips = payslips;
    
    if (!payslips || payslips.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No payslips found</td></tr>';
        return;
    }
    
    tbody.innerHTML = payslips.map(payslip => `
        <tr>
            <td>${payslip.id.substring(0, 8)}...</td>
            <td>${payslip.employee?.firstName} ${payslip.employee?.lastName}</td>
            <td>${payslip.month}/${payslip.year}</td>
            <td>₹${payslip.basicSalary?.toLocaleString()}</td>
            <td>₹${payslip.grossSalary?.toLocaleString()}</td>
            <td>₹${payslip.totalDeductions?.toLocaleString()}</td>
            <td><strong>₹${payslip.netSalary?.toLocaleString()}</strong></td>
            <td class="action-btns">
                <button class="btn btn-sm btn-primary" onclick='viewPayslip(${JSON.stringify(payslip).replace(/'/g, "&apos;")})'>👁️</button>
                <button class="btn btn-sm btn-success" onclick='downloadPayslip("${payslip.id}")'>📥</button>
            </td>
        </tr>
    `).join('');
}

function viewPayslip(payslip) {
    const modal = document.getElementById('modal');
    const content = document.getElementById('modalContent');
    
    content.innerHTML = `
        <h2>Payslip Details</h2>
        <div class="json-viewer">${JSON.stringify(payslip, null, 2)}</div>
        <div style="margin-top: 20px;">
            <button class="btn btn-primary" onclick="closeModal()">Close</button>
        </div>
    `;
    
    modal.classList.add('active');
}

// Bulk Operations
async function seedDemoData() {
    if (!confirm('This will create demo data. Continue?')) return;
    
    showToast('Seeding demo data...', 'success');
    
    // Seed departments
    const departments = [
        { name: 'Engineering', description: 'Software Development' },
        { name: 'Human Resources', description: 'HR Department' },
        { name: 'Sales', description: 'Sales Team' }
    ];
    
    for (const dept of departments) {
        await apiPost('/departments', dept);
    }
    
    // Seed positions
    const positions = [
        { title: 'Software Developer', level: 'Mid' },
        { title: 'HR Manager', level: 'Senior' },
        { title: 'Sales Executive', level: 'Junior' }
    ];
    
    for (const pos of positions) {
        await apiPost('/positions', pos);
    }
    
    showToast('Demo data seeded successfully!', 'success');
    refreshDashboard();
}

async function clearAllData() {
    if (!confirm('⚠️ WARNING: This will delete ALL data. Are you absolutely sure?')) return;
    if (!confirm('This action cannot be undone. Type YES to confirm:') !== 'YES') return;
    
    showToast('Clearing all data...', 'error');
    
    // Note: Implement backend endpoints for bulk delete
    showToast('Clear operation not implemented yet', 'warning');
}

async function exportData() {
    const allData = {
        employees: currentData.employees,
        departments: currentData.departments,
        positions: currentData.positions,
        users: currentData.users,
        leaves: currentData.leaves,
        timesheets: currentData.timesheets,
        payslips: currentData.payslips,
        exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hrm-data-export-${Date.now()}.json`;
    link.click();
    
    showToast('Data exported successfully', 'success');
}

// SQL Console
async function executeSQL() {
    const query = document.getElementById('sqlQuery').value;
    if (!query.trim()) {
        showToast('Please enter a SQL query', 'error');
        return;
    }
    
    // Note: Implement backend endpoint for SQL execution
    showToast('SQL console not implemented yet - requires backend endpoint', 'warning');
    
    const resultDiv = document.getElementById('sqlResult');
    resultDiv.innerHTML = `
        <h3>Query Result:</h3>
        <div class="json-viewer">SQL console requires backend implementation at /api/debug/sql</div>
    `;
}

// Modal helpers
function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

// Close modal on outside click
document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') {
        closeModal();
    }
});

// Stub functions for edit operations (to be implemented)
function editEmployee(id) { showToast('Edit functionality coming soon', 'warning'); }
function editDepartment(id) { showToast('Edit functionality coming soon', 'warning'); }
function editPosition(id) { showToast('Edit functionality coming soon', 'warning'); }
function downloadPayslip(id) { showToast('Download functionality coming soon', 'warning'); }
