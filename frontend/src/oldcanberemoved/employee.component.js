import React, { Component } from "react";
import { useParams } from "react-router-dom";
import EmployeeDataService from "../services/EmployeeService";

class Employee extends Component {
  constructor(props) {
    super(props);
    this.onChangeFirstName = this.onChangeFirstName.bind(this);
    this.onChangeLastName = this.onChangeLastName.bind(this);
    this.getEmployee = this.getEmployee.bind(this);
    this.updateEmployee = this.updateEmployee.bind(this);
    this.deleteEmployee = this.deleteEmployee.bind(this);

    this.state = {
      currentEmployee: {
        id: null,
        firstName: "",
        lastName: ""
      },
      message: ""
    };
  }

  componentDidMount() {
    this.getEmployee(this.props.id);
  }

  onChangeFirstName(e) {
    const firstName = e.target.value;

    this.setState(function(prevState) {
      return {
        currentEmployee: {
          ...prevState.currentEmployee,
          firstName: firstName
        }
      };
    });
  }

  onChangeLastName(e) {
    const lastName = e.target.value;
    
    this.setState(prevState => ({
      currentEmployee: {
        ...prevState.currentEmployee,
        lastName: lastName
      }
    }));
  }

  getEmployee(id) {
    EmployeeDataService.get(id)
      .then(response => {
        this.setState({
          currentEmployee: response.data
        });
        console.log(response.data);
      })
      .catch(e => {
        console.log(e);
      });
  }

  updateEmployee() {
    EmployeeDataService.update(
      this.state.currentEmployee.id,
      this.state.currentEmployee
    )
      .then(response => {
        console.log(response.data);
        this.setState({
          message: "The employee was updated successfully!"
        });
      })
      .catch(e => {
        console.log(e);
      });
  }

  deleteEmployee() {    
    EmployeeDataService.delete(this.state.currentEmployee.id)
      .then(response => {
        console.log(response.data);
        this.props.history.push('/employees')
      })
      .catch(e => {
        console.log(e);
      });
  }

  render() {
    const { currentEmployee } = this.state;

    return (
      <div>
        {currentEmployee ? (
          <div className="edit-form">
            <h4>Employee</h4>
            <form>
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="firstName"
                  value={currentEmployee.firstName}
                  onChange={this.onChangeFirstName}
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="lastName"
                  value={currentEmployee.lastName}
                  onChange={this.onChangeLastName}
                />
              </div>
            </form>

            <button
              className="badge badge-danger mr-2"
              onClick={this.deleteEmployee}
            >
              Delete
            </button>

            <button
              type="submit"
              className="badge badge-success"
              onClick={this.updateEmployee}
            >
              Update
            </button>
            <p>{this.state.message}</p>
          </div>
        ) : (
          <div>
            <br />
            <p>Please click on a Employee...</p>
          </div>
        )}
      </div>
    );
  }
}

// Wrapper component to use React Router v6 hooks with class component
function EmployeeWrapper() {
  const { id } = useParams();
  return <Employee id={id} />;
}

export default EmployeeWrapper;
