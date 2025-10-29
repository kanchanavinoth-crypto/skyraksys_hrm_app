import React, { Component } from "react";
import { useSnackbar } from "notistack";
import LeaveDataService from "../services/LeaveService";
import EmployeeDataService from "../services/EmployeeService";
import ValidatedLeaveRequestForm from "./forms/ValidatedLeaveRequestForm";
import enhancedApiService from "../services/enhancedApiService";

// Functional wrapper to use hooks with class component
function AddLeaveRequestWithSnackbar(props) {
  const { enqueueSnackbar } = useSnackbar();
  return <AddLeaveRequest {...props} enqueueSnackbar={enqueueSnackbar} />;
}

class AddLeaveRequest extends Component {
  constructor(props) {
    super(props);
    this.saveLeaveRequest = this.saveLeaveRequest.bind(this);
    this.newLeaveRequest = this.newLeaveRequest.bind(this);
    this.retrieveLeaveTypes = this.retrieveLeaveTypes.bind(this);
    this.retrieveEmployees = this.retrieveEmployees.bind(this);

    this.state = {
      submitted: false,
      loading: false,
      leaveTypes: [],
      employees: [],
      currentUser: null
    };
  }

  componentDidMount() {
    this.retrieveLeaveTypes();
    this.retrieveEmployees();
    // Get current user from authentication
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    this.setState({
      currentUser: user
    });
  }

  retrieveLeaveTypes() {
    enhancedApiService.get('/leaves/meta/types')
      .then(response => {
        this.setState({
          leaveTypes: response.data.data || []
        });
      })
      .catch(error => {
        console.error('Failed to load leave types:', error);
        this.props.enqueueSnackbar('Failed to load leave types', { variant: 'error' });
      });
  }

  retrieveEmployees() {
    EmployeeDataService.getAll()
      .then(response => {
        this.setState({
          employees: response.data
        });
      })
      .catch(error => {
        console.error('Failed to load employees:', error);
        this.props.enqueueSnackbar('Failed to load employee list', { variant: 'error' });
      });
  }

  saveLeaveRequest(values) {
    this.setState({ loading: true });

    const data = {
      leaveTypeId: values.leaveTypeId,
      startDate: values.startDate,
      endDate: values.endDate,
      isStartHalfDay: values.isStartHalfDay || false,
      isEndHalfDay: values.isEndHalfDay || false,
      startHalfDayType: values.startHalfDayType || null,
      endHalfDayType: values.endHalfDayType || null,
      reason: values.reason
    };

    LeaveDataService.create(data)
      .then(response => {
        this.setState({
          submitted: true,
          loading: false
        });
        this.props.enqueueSnackbar('Leave request submitted successfully!', { variant: 'success' });
      })
      .catch(error => {
        console.error('Failed to submit leave request:', error);
        const errorMessage = error.response?.data?.message || 'Error submitting leave request. Please try again.';
        this.props.enqueueSnackbar(errorMessage, { variant: 'error' });
        this.setState({ loading: false });
      });
  }

  newLeaveRequest() {
    this.setState({
      submitted: false
    });
  }

  render() {
    const { leaveTypes, loading, submitted } = this.state;

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
            {submitted ? (
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
              <div className="card">
                <div className="card-header">
                  <h6>Leave Details</h6>
                </div>
                <div className="card-body">
                  <ValidatedLeaveRequestForm
                    onSubmit={this.saveLeaveRequest}
                    loading={loading}
                    leaveTypes={leaveTypes}
                    initialValues={{
                      leaveTypeId: '',
                      startDate: '',
                      endDate: '',
                      isStartHalfDay: false,
                      isEndHalfDay: false,
                      startHalfDayType: '',
                      endHalfDayType: '',
                      reason: ''
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default AddLeaveRequestWithSnackbar;