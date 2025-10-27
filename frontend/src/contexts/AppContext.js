import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useLocalStorage } from '../hooks';

// Action types
const APP_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_SUCCESS: 'SET_SUCCESS',
  SET_USER: 'SET_USER',
  CLEAR_MESSAGES: 'CLEAR_MESSAGES',
  SET_EMPLOYEES: 'SET_EMPLOYEES',
  ADD_EMPLOYEE: 'ADD_EMPLOYEE',
  UPDATE_EMPLOYEE: 'UPDATE_EMPLOYEE',
  DELETE_EMPLOYEE: 'DELETE_EMPLOYEE',
  SET_LEAVES: 'SET_LEAVES',
  ADD_LEAVE: 'ADD_LEAVE',
  UPDATE_LEAVE: 'UPDATE_LEAVE',
  SET_TIMESHEETS: 'SET_TIMESHEETS',
  ADD_TIMESHEET: 'ADD_TIMESHEET',
  SET_PAYSLIPS: 'SET_PAYSLIPS',
  ADD_PAYSLIP: 'ADD_PAYSLIP'
};

// Initial state
const initialState = {
  loading: false,
  error: null,
  success: null,
  user: null,
  employees: [],
  leaves: [],
  timesheets: [],
  payslips: [],
  stats: {
    totalEmployees: 0,
    activeEmployees: 0,
    totalDepartments: 0,
    pendingLeaves: 0,
    processedPayslips: 0
  }
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case APP_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case APP_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };

    case APP_ACTIONS.SET_SUCCESS:
      return { ...state, success: action.payload, loading: false };

    case APP_ACTIONS.CLEAR_MESSAGES:
      return { ...state, error: null, success: null };

    case APP_ACTIONS.SET_USER:
      return { ...state, user: action.payload };

    case APP_ACTIONS.SET_EMPLOYEES:
      return { 
        ...state, 
        employees: action.payload,
        stats: {
          ...state.stats,
          totalEmployees: action.payload.length,
          activeEmployees: action.payload.filter(emp => emp.status === 'Active').length,
          totalDepartments: [...new Set(action.payload.map(emp => emp.department).filter(Boolean))].length
        }
      };

    case APP_ACTIONS.ADD_EMPLOYEE:
      const newEmployees = [...state.employees, action.payload];
      return {
        ...state,
        employees: newEmployees,
        stats: {
          ...state.stats,
          totalEmployees: newEmployees.length,
          activeEmployees: newEmployees.filter(emp => emp.status === 'Active').length,
          totalDepartments: [...new Set(newEmployees.map(emp => emp.department).filter(Boolean))].length
        }
      };

    case APP_ACTIONS.UPDATE_EMPLOYEE:
      const updatedEmployees = state.employees.map(emp =>
        emp.id === action.payload.id ? { ...emp, ...action.payload } : emp
      );
      return {
        ...state,
        employees: updatedEmployees,
        stats: {
          ...state.stats,
          activeEmployees: updatedEmployees.filter(emp => emp.status === 'Active').length,
          totalDepartments: [...new Set(updatedEmployees.map(emp => emp.department).filter(Boolean))].length
        }
      };

    case APP_ACTIONS.DELETE_EMPLOYEE:
      const filteredEmployees = state.employees.filter(emp => emp.id !== action.payload);
      return {
        ...state,
        employees: filteredEmployees,
        stats: {
          ...state.stats,
          totalEmployees: filteredEmployees.length,
          activeEmployees: filteredEmployees.filter(emp => emp.status === 'Active').length,
          totalDepartments: [...new Set(filteredEmployees.map(emp => emp.department).filter(Boolean))].length
        }
      };

    case APP_ACTIONS.SET_LEAVES:
      return { 
        ...state, 
        leaves: action.payload,
        stats: {
          ...state.stats,
          pendingLeaves: action.payload.filter(leave => leave.status === 'Pending').length
        }
      };

    case APP_ACTIONS.ADD_LEAVE:
      const newLeaves = [...state.leaves, action.payload];
      return {
        ...state,
        leaves: newLeaves,
        stats: {
          ...state.stats,
          pendingLeaves: newLeaves.filter(leave => leave.status === 'Pending').length
        }
      };

    case APP_ACTIONS.UPDATE_LEAVE:
      const updatedLeaves = state.leaves.map(leave =>
        leave.id === action.payload.id ? { ...leave, ...action.payload } : leave
      );
      return {
        ...state,
        leaves: updatedLeaves,
        stats: {
          ...state.stats,
          pendingLeaves: updatedLeaves.filter(leave => leave.status === 'Pending').length
        }
      };

    case APP_ACTIONS.SET_TIMESHEETS:
      return { ...state, timesheets: action.payload };

    case APP_ACTIONS.ADD_TIMESHEET:
      return { ...state, timesheets: [...state.timesheets, action.payload] };

    case APP_ACTIONS.SET_PAYSLIPS:
      return { 
        ...state, 
        payslips: action.payload,
        stats: {
          ...state.stats,
          processedPayslips: action.payload.filter(payslip => payslip.status === 'Processed').length
        }
      };

    case APP_ACTIONS.ADD_PAYSLIP:
      const newPayslips = [...state.payslips, action.payload];
      return {
        ...state,
        payslips: newPayslips,
        stats: {
          ...state.stats,
          processedPayslips: newPayslips.filter(payslip => payslip.status === 'Processed').length
        }
      };

    default:
      return state;
  }
};

// Create context
const AppContext = createContext();

// Context provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [user, setUser] = useLocalStorage('user', null);

  // Auto-load user from localStorage
  useEffect(() => {
    if (user) {
      dispatch({ type: APP_ACTIONS.SET_USER, payload: user });
    }
  }, [user]);

  // Action creators
  const actions = {
    setLoading: (loading) => {
      dispatch({ type: APP_ACTIONS.SET_LOADING, payload: loading });
    },

    setError: (error) => {
      dispatch({ type: APP_ACTIONS.SET_ERROR, payload: error });
    },

    setSuccess: (message) => {
      dispatch({ type: APP_ACTIONS.SET_SUCCESS, payload: message });
    },

    clearMessages: () => {
      dispatch({ type: APP_ACTIONS.CLEAR_MESSAGES });
    },

    setUser: (userData) => {
      setUser(userData);
      dispatch({ type: APP_ACTIONS.SET_USER, payload: userData });
    },

    logout: () => {
      setUser(null);
      dispatch({ type: APP_ACTIONS.SET_USER, payload: null });
    },

    setEmployees: (employees) => {
      dispatch({ type: APP_ACTIONS.SET_EMPLOYEES, payload: employees });
    },

    addEmployee: (employee) => {
      dispatch({ type: APP_ACTIONS.ADD_EMPLOYEE, payload: employee });
    },

    updateEmployee: (employee) => {
      dispatch({ type: APP_ACTIONS.UPDATE_EMPLOYEE, payload: employee });
    },

    deleteEmployee: (employeeId) => {
      dispatch({ type: APP_ACTIONS.DELETE_EMPLOYEE, payload: employeeId });
    },

    setLeaves: (leaves) => {
      dispatch({ type: APP_ACTIONS.SET_LEAVES, payload: leaves });
    },

    addLeave: (leave) => {
      dispatch({ type: APP_ACTIONS.ADD_LEAVE, payload: leave });
    },

    updateLeave: (leave) => {
      dispatch({ type: APP_ACTIONS.UPDATE_LEAVE, payload: leave });
    },

    setTimesheets: (timesheets) => {
      dispatch({ type: APP_ACTIONS.SET_TIMESHEETS, payload: timesheets });
    },

    addTimesheet: (timesheet) => {
      dispatch({ type: APP_ACTIONS.ADD_TIMESHEET, payload: timesheet });
    },

    setPayslips: (payslips) => {
      dispatch({ type: APP_ACTIONS.SET_PAYSLIPS, payload: payslips });
    },

    addPayslip: (payslip) => {
      dispatch({ type: APP_ACTIONS.ADD_PAYSLIP, payload: payslip });
    }
  };

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the app context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Export actions for external use
export { APP_ACTIONS };
