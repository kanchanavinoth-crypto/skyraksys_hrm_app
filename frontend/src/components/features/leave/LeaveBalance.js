import React, { Component } from 'react';
import { leaveBalanceAdminService } from '../../../services/leave-balance-admin.service';

export default class LeaveBalanceAdmin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      balances: [],
      employees: [],
      leaveTypes: [],
      loading: false,
      error: '',
      success: '',
      
      // Pagination
      currentPage: 1,
      totalPages: 1,
      totalRecords: 0,
      
      // Filters
      selectedEmployee: '',
      selectedLeaveType: '',
      selectedYear: new Date().getFullYear(),
      
      // Bulk initialization
      showBulkInit: false,
      bulkInitData: {},
      
      // Individual creation
      showCreateForm: false,
      createData: {
        employeeId: '',
        leaveTypeId: '',
        year: new Date().getFullYear(),
        totalAccrued: 0,
        carryForward: 0
      },
      
      // Edit mode
      editingBalance: null,
      editData: {}
    };

    this.loadData = this.loadData.bind(this);
    this.handleFilter = this.handleFilter.bind(this);
    this.handleBulkInit = this.handleBulkInit.bind(this);
    this.handleCreate = this.handleCreate.bind(this);
    this.handleEdit = this.handleEdit.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
  }

  async componentDidMount() {
    await this.loadInitialData();
    await this.loadData();
  }

  async loadInitialData() {
    try {
      const [employeesRes, leaveTypesRes] = await Promise.all([
        leaveBalanceAdminService.getEmployees(),
        leaveBalanceAdminService.getLeaveTypes()
      ]);

      this.setState({
        employees: employeesRes.data || [],
        leaveTypes: leaveTypesRes.data || []
      });
    } catch (error) {
      this.setState({
        error: 'Failed to load initial data: ' + error.message
      });
    }
  }

  async loadData(page = 1) {
    this.setState({ loading: true, error: '' });
    
    try {
      const params = {
        page,
        limit: 10,
        year: this.state.selectedYear
      };

      if (this.state.selectedEmployee) {
        params.employeeId = this.state.selectedEmployee;
      }
      if (this.state.selectedLeaveType) {
        params.leaveTypeId = this.state.selectedLeaveType;
      }

      const response = await leaveBalanceAdminService.getAll(params);
      
      this.setState({
        balances: response.data.balances || [],
        currentPage: response.data.pagination.currentPage,
        totalPages: response.data.pagination.pages,
        totalRecords: response.data.pagination.total,
        loading: false
      });
    } catch (error) {
      this.setState({
        error: 'Failed to load leave balances: ' + error.message,
        loading: false
      });
    }
  }

  handleFilter(field, value) {
    this.setState({ [field]: value }, () => {
      this.loadData(1);
    });
  }

  async handleBulkInit() {
    this.setState({ loading: true, error: '', success: '' });

    try {
      const { bulkInitData, selectedYear } = this.state;
      
      if (Object.keys(bulkInitData).length === 0) {
        this.setState({
          error: 'Please set allocations for at least one leave type',
          loading: false
        });
        return;
      }

      await leaveBalanceAdminService.bulkInitialize({
        year: selectedYear,
        leaveAllocations: bulkInitData
      });

      this.setState({
        success: 'Leave balances initialized successfully!',
        showBulkInit: false,
        bulkInitData: {},
        loading: false
      });

      await this.loadData();
    } catch (error) {
      this.setState({
        error: 'Failed to initialize leave balances: ' + error.message,
        loading: false
      });
    }
  }

  async handleCreate() {
    this.setState({ loading: true, error: '', success: '' });

    try {
      await leaveBalanceAdminService.create(this.state.createData);
      
      this.setState({
        success: 'Leave balance created successfully!',
        showCreateForm: false,
        createData: {
          employeeId: '',
          leaveTypeId: '',
          year: new Date().getFullYear(),
          totalAccrued: 0,
          carryForward: 0
        },
        loading: false
      });

      await this.loadData();
    } catch (error) {
      this.setState({
        error: 'Failed to create leave balance: ' + error.message,
        loading: false
      });
    }
  }

  async handleEdit(balanceId) {
    this.setState({ loading: true, error: '', success: '' });

    try {
      await leaveBalanceAdminService.update(balanceId, this.state.editData);
      
      this.setState({
        success: 'Leave balance updated successfully!',
        editingBalance: null,
        editData: {},
        loading: false
      });

      await this.loadData();
    } catch (error) {
      this.setState({
        error: 'Failed to update leave balance: ' + error.message,
        loading: false
      });
    }
  }

  async handleDelete(balanceId) {
    if (!window.confirm('Are you sure you want to delete this leave balance?')) {
      return;
    }

    this.setState({ loading: true, error: '', success: '' });

    try {
      await leaveBalanceAdminService.delete(balanceId);
      
      this.setState({
        success: 'Leave balance deleted successfully!',
        loading: false
      });

      await this.loadData();
    } catch (error) {
      this.setState({
        error: 'Failed to delete leave balance: ' + error.message,
        loading: false
      });
    }
  }

  startEdit(balance) {
    this.setState({
      editingBalance: balance.id,
      editData: {
        totalAccrued: balance.totalAccrued,
        totalTaken: balance.totalTaken,
        totalPending: balance.totalPending,
        carryForward: balance.carryForward
      }
    });
  }

  cancelEdit() {
    this.setState({
      editingBalance: null,
      editData: {}
    });
  }

  render() {
    const {
      balances,
      employees,
      leaveTypes,
      loading,
      error,
      success,
      currentPage,
      totalPages,
      totalRecords,
      selectedEmployee,
      selectedLeaveType,
      selectedYear,
      showBulkInit,
      bulkInitData,
      showCreateForm,
      createData,
      editingBalance,
      editData
    } = this.state;

    return (
      <div className="container-fluid mt-3">
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <div className="row align-items-center">
                  <div className="col">
                    <h4 className="mb-0">
                      <i className="fas fa-calendar-check mr-2"></i>
                      Leave Balance Administration
                    </h4>
                  </div>
                  <div className="col-auto">
                    <button
                      className="btn btn-success mr-2"
                      onClick={() => this.setState({ showBulkInit: true })}
                      disabled={loading}
                    >
                      <i className="fas fa-plus-circle mr-1"></i>
                      Bulk Initialize
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => this.setState({ showCreateForm: true })}
                      disabled={loading}
                    >
                      <i className="fas fa-plus mr-1"></i>
                      Add Balance
                    </button>
                  </div>
                </div>
              </div>

              <div className="card-body">
                {/* Alerts */}
                {error && (
                  <div className="alert alert-danger" role="alert">
                    <i className="fas fa-exclamation-circle mr-2"></i>
                    {error}
                  </div>
                )}

                {success && (
                  <div className="alert alert-success" role="alert">
                    <i className="fas fa-check-circle mr-2"></i>
                    {success}
                  </div>
                )}

                {/* Filters */}
                <div className="row mb-3">
                  <div className="col-md-3">
                    <label htmlFor="yearFilter">Year</label>
                    <input
                      type="number"
                      id="yearFilter"
                      className="form-control"
                      value={selectedYear}
                      onChange={(e) => this.handleFilter('selectedYear', parseInt(e.target.value))}
                      min="2020"
                      max="2030"
                    />
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="employeeFilter">Employee</label>
                    <select
                      id="employeeFilter"
                      className="form-control"
                      value={selectedEmployee}
                      onChange={(e) => this.handleFilter('selectedEmployee', e.target.value)}
                    >
                      <option value="">All Employees</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} ({emp.employeeId})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="leaveTypeFilter">Leave Type</label>
                    <select
                      id="leaveTypeFilter"
                      className="form-control"
                      value={selectedLeaveType}
                      onChange={(e) => this.handleFilter('selectedLeaveType', e.target.value)}
                    >
                      <option value="">All Leave Types</option>
                      {leaveTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label>&nbsp;</label>
                    <button
                      className="btn btn-outline-secondary btn-block"
                      onClick={() => {
                        this.setState({
                          selectedEmployee: '',
                          selectedLeaveType: '',
                          selectedYear: new Date().getFullYear()
                        }, () => this.loadData(1));
                      }}
                    >
                      <i className="fas fa-sync mr-1"></i>
                      Reset
                    </button>
                  </div>
                </div>

                {/* Results Summary */}
                <div className="row mb-3">
                  <div className="col">
                    <small className="text-muted">
                      Showing {balances.length} of {totalRecords} leave balances for year {selectedYear}
                    </small>
                  </div>
                </div>

                {/* Leave Balances Table */}
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead className="thead-dark">
                      <tr>
                        <th>Employee</th>
                        <th>Leave Type</th>
                        <th>Accrued</th>
                        <th>Carry Forward</th>
                        <th>Taken</th>
                        <th>Pending</th>
                        <th>Balance</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="8" className="text-center py-4">
                            <div className="spinner-border" role="status">
                              <span className="sr-only">Loading...</span>
                            </div>
                          </td>
                        </tr>
                      ) : balances.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-4">
                            <i className="fas fa-info-circle mr-2"></i>
                            No leave balances found
                          </td>
                        </tr>
                      ) : (
                        balances.map(balance => (
                          <tr key={balance.id}>
                            <td>
                              <div>
                                <strong>{balance.employee.firstName} {balance.employee.lastName}</strong>
                                <br />
                                <small className="text-muted">{balance.employee.employeeId}</small>
                              </div>
                            </td>
                            <td>
                              <span className="badge badge-info">
                                {balance.leaveType.name}
                              </span>
                            </td>
                            <td>
                              {editingBalance === balance.id ? (
                                <input
                                  type="number"
                                  step="0.5"
                                  className="form-control form-control-sm"
                                  value={editData.totalAccrued}
                                  onChange={(e) => this.setState({
                                    editData: { ...editData, totalAccrued: parseFloat(e.target.value) }
                                  })}
                                />
                              ) : (
                                <span>{balance.totalAccrued} days</span>
                              )}
                            </td>
                            <td>
                              {editingBalance === balance.id ? (
                                <input
                                  type="number"
                                  step="0.5"
                                  className="form-control form-control-sm"
                                  value={editData.carryForward}
                                  onChange={(e) => this.setState({
                                    editData: { ...editData, carryForward: parseFloat(e.target.value) }
                                  })}
                                />
                              ) : (
                                <span>{balance.carryForward} days</span>
                              )}
                            </td>
                            <td>
                              {editingBalance === balance.id ? (
                                <input
                                  type="number"
                                  step="0.5"
                                  className="form-control form-control-sm"
                                  value={editData.totalTaken}
                                  onChange={(e) => this.setState({
                                    editData: { ...editData, totalTaken: parseFloat(e.target.value) }
                                  })}
                                />
                              ) : (
                                <span className="text-warning">{balance.totalTaken} days</span>
                              )}
                            </td>
                            <td>
                              {editingBalance === balance.id ? (
                                <input
                                  type="number"
                                  step="0.5"
                                  className="form-control form-control-sm"
                                  value={editData.totalPending}
                                  onChange={(e) => this.setState({
                                    editData: { ...editData, totalPending: parseFloat(e.target.value) }
                                  })}
                                />
                              ) : (
                                <span className="text-info">{balance.totalPending} days</span>
                              )}
                            </td>
                            <td>
                              <span className={`badge ${
                                balance.balance > 5 ? 'badge-success' : 
                                balance.balance > 0 ? 'badge-warning' : 'badge-danger'
                              }`}>
                                {balance.balance} days
                              </span>
                            </td>
                            <td>
                              {editingBalance === balance.id ? (
                                <div className="btn-group" role="group">
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => this.handleEdit(balance.id)}
                                    disabled={loading}
                                  >
                                    <i className="fas fa-save"></i>
                                  </button>
                                  <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => this.cancelEdit()}
                                  >
                                    <i className="fas fa-times"></i>
                                  </button>
                                </div>
                              ) : (
                                <div className="btn-group" role="group">
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => this.startEdit(balance)}
                                    disabled={loading}
                                  >
                                    <i className="fas fa-edit"></i>
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => this.handleDelete(balance.id)}
                                    disabled={loading}
                                  >
                                    <i className="fas fa-trash"></i>
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <nav aria-label="Leave balances pagination">
                    <ul className="pagination justify-content-center">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => this.loadData(currentPage - 1)}
                          disabled={currentPage === 1 || loading}
                        >
                          Previous
                        </button>
                      </li>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => this.loadData(page)}
                            disabled={loading}
                          >
                            {page}
                          </button>
                        </li>
                      ))}
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => this.loadData(currentPage + 1)}
                          disabled={currentPage === totalPages || loading}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Initialize Modal */}
        {showBulkInit && (
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-lg" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Bulk Initialize Leave Balances</h5>
                  <button
                    type="button"
                    className="close"
                    onClick={() => this.setState({ showBulkInit: false, bulkInitData: {} })}
                  >
                    <span>&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <p className="text-muted">
                    Set leave allocations for all active employees for year {selectedYear}.
                    This will create leave balances for employees who don't already have them.
                  </p>
                  
                  <div className="row">
                    {leaveTypes.map(type => (
                      <div key={type.id} className="col-md-6 mb-3">
                        <label htmlFor={`bulk-${type.id}`}>
                          {type.name} (days)
                        </label>
                        <input
                          type="number"
                          id={`bulk-${type.id}`}
                          className="form-control"
                          step="0.5"
                          min="0"
                          placeholder="0"
                          value={bulkInitData[type.id] || ''}
                          onChange={(e) => this.setState({
                            bulkInitData: {
                              ...bulkInitData,
                              [type.id]: e.target.value
                            }
                          })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => this.setState({ showBulkInit: false, bulkInitData: {} })}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={this.handleBulkInit}
                    disabled={loading || Object.keys(bulkInitData).length === 0}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm mr-2" role="status"></span>
                        Initializing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check mr-1"></i>
                        Initialize Balances
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Balance Modal */}
        {showCreateForm && (
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog">
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Create Leave Balance</h5>
                  <button
                    type="button"
                    className="close"
                    onClick={() => this.setState({ 
                      showCreateForm: false, 
                      createData: {
                        employeeId: '',
                        leaveTypeId: '',
                        year: new Date().getFullYear(),
                        totalAccrued: 0,
                        carryForward: 0
                      }
                    })}
                  >
                    <span>&times;</span>
                  </button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label htmlFor="createEmployee">Employee</label>
                    <select
                      id="createEmployee"
                      className="form-control"
                      value={createData.employeeId}
                      onChange={(e) => this.setState({
                        createData: { ...createData, employeeId: e.target.value }
                      })}
                      required
                    >
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} ({emp.employeeId})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="createLeaveType">Leave Type</label>
                    <select
                      id="createLeaveType"
                      className="form-control"
                      value={createData.leaveTypeId}
                      onChange={(e) => this.setState({
                        createData: { ...createData, leaveTypeId: e.target.value }
                      })}
                      required
                    >
                      <option value="">Select Leave Type</option>
                      {leaveTypes.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="createYear">Year</label>
                        <input
                          type="number"
                          id="createYear"
                          className="form-control"
                          value={createData.year}
                          onChange={(e) => this.setState({
                            createData: { ...createData, year: parseInt(e.target.value) }
                          })}
                          min="2020"
                          max="2030"
                          required
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label htmlFor="createAccrued">Accrued Days</label>
                        <input
                          type="number"
                          id="createAccrued"
                          className="form-control"
                          step="0.5"
                          min="0"
                          value={createData.totalAccrued}
                          onChange={(e) => this.setState({
                            createData: { ...createData, totalAccrued: parseFloat(e.target.value) }
                          })}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="createCarryForward">Carry Forward Days</label>
                    <input
                      type="number"
                      id="createCarryForward"
                      className="form-control"
                      step="0.5"
                      min="0"
                      value={createData.carryForward}
                      onChange={(e) => this.setState({
                        createData: { ...createData, carryForward: parseFloat(e.target.value) }
                      })}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => this.setState({ 
                      showCreateForm: false, 
                      createData: {
                        employeeId: '',
                        leaveTypeId: '',
                        year: new Date().getFullYear(),
                        totalAccrued: 0,
                        carryForward: 0
                      }
                    })}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={this.handleCreate}
                    disabled={loading || !createData.employeeId || !createData.leaveTypeId}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm mr-2" role="status"></span>
                        Creating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-plus mr-1"></i>
                        Create Balance
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal backdrop */}
        {(showBulkInit || showCreateForm) && (
          <div className="modal-backdrop fade show"></div>
        )}
      </div>
    );
  }
}
