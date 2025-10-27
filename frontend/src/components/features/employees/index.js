// Employee Components
export { default as EmployeeList } from './EmployeeList';
export { default as EmployeeProfile } from './EmployeeProfileModern'; // Modern redesigned version
export { default as EmployeeProfileLegacy } from './EmployeeProfile'; // Legacy version
export { default as EmployeeForm } from './EmployeeForm';
export { default as EmployeeEdit } from './EmployeeEdit';
export { default as EmployeeRecords } from './EmployeeRecords';

// Re-export from main employees folder for backward compatibility
export { default as EmployeeListLegacy } from '../../../employees/EmployeeList';
