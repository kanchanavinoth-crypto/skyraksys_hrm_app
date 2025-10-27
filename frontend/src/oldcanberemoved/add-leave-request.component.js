import React, { Component } from "react";
import LeaveDataService from "../services/LeaveService";
import EmployeeDataService from "../services/EmployeeService";

export default class AddLeaveRequest extends Component {
  constructor(props) {
    super(props);
    this.onChangeEmployeeId = this.onChangeEmployeeId.bind(this);
    this.onChangeLeaveType = this.onChangeLeaveType.bind(this);
    this.onChangeStartDate = this.onChangeStartDate.bind(this);
    this.onChangeEndDate = this.onChangeEndDate.bind(this);
    this.onChangeReason = this.onChangeReason.bind(this);
    this.saveLeaveRequest = this.saveLeaveRequest.bind(this);
    this.newLeaveRequest = this.newLeaveRequest.bind(this);
    this.retrieveEmployees = this.retrieveEmployees.bind(this);

    this.state = {
      id: null,
      employeeId: "",
      leaveType: "Sick",
      startDate: "",
      endDate: "",
      totalDays: 0,
      reason: "",
      submitted: false,
      employees: [],
      currentUser: null // In a real app, this would come from authentication
    };
  }

  componentDidMount() {
    this.retrieveEmployees();
    // For demo purposes, we'll assume employee ID 1 is the current user
    // In a real application, this would come from authentication/session
    this.setState({
      currentUser: { id: 1, role: 'employee' }, // Demo user
      employeeId: "1" // Auto-select current user
    });
  }

  retrieveEmployees() {
    EmployeeDataService.getAll()
      .then(response => {
        this.setState({
          employees: response.data
        });
      })
      .catch(e => {
        console.log(e);
      });
  }

  onChangeEmployeeId(e) {
    this.setState({
      employeeId: e.target.value
    });
  }

  onChangeLeaveType(e) {
    this.setState({
      leaveType: e.target.value
    });
  }

  onChangeStartDate(e) {
    this.setState({
      startDate: e.target.value
    }, this.calculateDays);
  }

  onChangeEndDate(e) {
    this.setState({
      endDate: e.target.value
    }, this.calculateDays);
  }

  onChangeReason(e) {
    this.setState({
      reason: e.target.value
    });
  }

  calculateDays = () => {
    const { startDate, endDate } = this.state;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const timeDiff = end.getTime() - start.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      this.setState({
        totalDays: daysDiff > 0 ? daysDiff : 0
      });
    }
  }

  saveLeaveRequest() {
    if (!this.state.employeeId || !this.state.startDate || !this.state.endDate || !this.state.reason) {
      alert("Please fill in all required fields");
      return;
    }

    var data = {
      employeeId: parseInt(this.state.employeeId),
      leaveType: this.state.leaveType,
      startDate: this.state.startDate,
      endDate: this.state.endDate,
      totalDays: this.state.totalDays,
      reason: this.state.reason
    };

    LeaveDataService.create(data)
      .then(response => {
        this.setState({
          id: response.data.id,
          submitted: true
        });
        console.log(response.data);
      })
      .catch(e => {
        console.log(e);
        alert("Error submitting leave request. Please try again.");
      });
  }

  newLeaveRequest() {
    this.setState({
      id: null,
      leaveType: "Sick",
      startDate: "",
      endDate: "",
      totalDays: 0,
      reason: "",
      submitted: false,
      employeeId: this.state.currentUser ? this.state.currentUser.id.toString() : ""
    });
  }

  render() {
    const { employees, currentUser } = this.state;
    const isHROrManager = currentUser && (currentUser.role === 'hr' || currentUser.role === 'manager');

    return (
      <div>
        {/* Page Header */}
        <div className="page-header">
          <div className="container">
            <h1 className="page-title">
              <i className="fas fa-calendar-plus mr-3"></i>
              Leave Request
            </h1>
            <p className="page-subtitle">Submit your leave application for approval</p>
          </div>
        </div>

        <div className="container mt-4">
          <div className="submit-form">
            {this.state.submitted ? (
              <div className="card">
                <div className="card-body text-center py-5">
                  <i className="fas fa-paper-plane fa-4x text-success mb-3"></i>
                  <h4 className="text-success">Leave request submitted successfully!</h4>
                  <p className="text-muted">Your leave request has been sent for approval and you will be notified once it's processed.</p>
                  <button className="btn btn-success btn-lg" onClick={this.newLeaveRequest}>
                    <i className="fas fa-plus mr-2"></i>
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {/* Employee Selection - Only show for HR/Manager */}
                {isHROrManager && (
                  <div className="card mb-3">
                <div className="card-header">
                  <h6>Employee Selection</h6>
                </div>
                <div className="card-body">
                  <div className="form-group">
                    <label htmlFor="employeeId">Select Employee *</label>
                    <select
                      className="form-control"
                      id="employeeId"
                      required
                      value={this.state.employeeId}
                      onChange={this.onChangeEmployeeId}
                      name="employeeId"
                    >
                      <option value="">Choose an employee...</option>
                      {employees.map(employee => (
                        <option key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName} - {employee.department || 'No Department'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* For regular employees, show current user info */}
            {!isHROrManager && (
              <div className="alert alert-info">
                <strong>Requesting leave for:</strong> Current User (Employee ID: {this.state.employeeId})
              </div>
            )}

            {/* Leave Details */}
            <div className="card mb-3">
              <div className="card-header">
                <h6>Leave Details</h6>
              </div>
              <div className="card-body">
                <div className="form-group">
                  <label htmlFor="leaveType">Leave Type *</label>
                  <select
                    className="form-control"
                    id="leaveType"
                    value={this.state.leaveType}
                    onChange={this.onChangeLeaveType}
                    name="leaveType"
                  >
                    <option value="Sick">Sick Leave</option>
                    <option value="Vacation">Vacation</option>
                    <option value="Personal">Personal Leave</option>
                    <option value="Emergency">Emergency Leave</option>
                    <option value="Maternity">Maternity Leave</option>
                    <option value="Paternity">Paternity Leave</option>
                  </select>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="startDate">Start Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        id="startDate"
                        required
                        value={this.state.startDate}
                        onChange={this.onChangeStartDate}
                        name="startDate"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="endDate">End Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        id="endDate"
                        required
                        value={this.state.endDate}
                        onChange={this.onChangeEndDate}
                        name="endDate"
                        min={this.state.startDate || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="totalDays">Total Days</label>
                  <div className="input-group">
                    <input
                      type="number"
                      className="form-control"
                      id="totalDays"
                      value={this.state.totalDays}
                      readOnly
                      name="totalDays"
                    />
                    <div className="input-group-append">
                      <span className="input-group-text">days</span>
                    </div>
                  </div>
                  <small className="form-text text-muted">
                    Automatically calculated based on start and end dates
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="reason">Reason *</label>
                  <textarea
                    className="form-control"
                    id="reason"
                    required
                    value={this.state.reason}
                    onChange={this.onChangeReason}
                    name="reason"
                    rows="3"
                    placeholder="Please provide a reason for your leave request..."
                  />
                </div>
              </div>
            </div>

            <div className="text-center">
              <button 
                onClick={this.saveLeaveRequest} 
                className="btn btn-success btn-lg"
                disabled={!this.state.employeeId || !this.state.startDate || !this.state.endDate || !this.state.reason}
              >
                Submit Leave Request
              </button>
            </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
