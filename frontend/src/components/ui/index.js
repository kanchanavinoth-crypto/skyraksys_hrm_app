import React from 'react';

/**
 * Loading Spinner Component
 */
export const LoadingSpinner = ({ size = 'md', text = 'Loading...', className = '' }) => {
  const sizeClasses = {
    sm: 'spinner-border-sm',
    md: '',
    lg: 'spinner-border-lg'
  };

  return (
    <div className={`text-center py-4 ${className}`}>
      <div className={`spinner-border ${sizeClasses[size]}`} role="status">
        <span className="sr-only">Loading...</span>
      </div>
      {text && <p className="mt-3 text-muted">{text}</p>}
    </div>
  );
};

/**
 * Page Header Component
 */
export const PageHeader = ({ title, subtitle, icon, children }) => (
  <div className="page-header">
    <div className="container">
      <h1 className="page-title">
        {icon && <i className={`${icon} mr-3`}></i>}
        {title}
      </h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
      {children}
    </div>
  </div>
);

/**
 * Statistics Card Component
 */
export const StatCard = ({ icon, title, value, className = '', iconColor = 'text-primary' }) => (
  <div className={`stat-card ${className}`}>
    {icon && <i className={`${icon} fa-2x ${iconColor} mb-2`}></i>}
    <h3 className="stat-number">{value}</h3>
    <p className="stat-label">{title}</p>
  </div>
);

/**
 * Alert Component
 */
export const Alert = ({ type = 'info', icon, children, dismissible = false, onDismiss }) => {
  const iconMap = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-triangle',
    warning: 'fas fa-exclamation-circle',
    info: 'fas fa-info-circle'
  };

  const alertClass = `alert alert-${type === 'error' ? 'danger' : type}`;

  return (
    <div className={alertClass} role="alert">
      <div className="d-flex align-items-center">
        <i className={`${icon || iconMap[type]} mr-2`}></i>
        <div className="flex-grow-1">{children}</div>
        {dismissible && (
          <button
            type="button"
            className="close"
            onClick={onDismiss}
            aria-label="Close"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * Badge Component
 */
export const Badge = ({ children, variant = 'primary', className = '' }) => (
  <span className={`badge badge-${variant} ${className}`}>
    {children}
  </span>
);

/**
 * Empty State Component
 */
export const EmptyState = ({ 
  icon = 'fas fa-inbox', 
  title = 'No Data Found', 
  description, 
  action,
  className = '' 
}) => (
  <div className={`text-center py-5 ${className}`}>
    <i className={`${icon} fa-3x text-muted mb-3`}></i>
    <h5 className="text-muted">{title}</h5>
    {description && <p className="text-muted">{description}</p>}
    {action}
  </div>
);

/**
 * Confirmation Modal Component
 */
export const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
      <div className="modal-backdrop fade show" onClick={onClose}></div>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="close" onClick={onClose}>
              <span>&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <p>{message}</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {cancelText}
            </button>
            <button type="button" className={`btn btn-${variant}`} onClick={onConfirm}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Form Group Component
 */
export const FormGroup = ({ 
  label, 
  required = false, 
  error, 
  children, 
  className = '',
  helpText 
}) => (
  <div className={`form-group ${className}`}>
    {label && (
      <label className="form-label">
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </label>
    )}
    {children}
    {helpText && <small className="form-text text-muted">{helpText}</small>}
    {error && <div className="invalid-feedback d-block">{error}</div>}
  </div>
);

/**
 * Input Component
 */
export const Input = ({ 
  type = 'text', 
  value, 
  onChange, 
  onBlur,
  placeholder, 
  disabled = false,
  required = false,
  error,
  className = '',
  ...props 
}) => (
  <input
    type={type}
    className={`form-control ${error ? 'is-invalid' : ''} ${className}`}
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    onBlur={onBlur}
    placeholder={placeholder}
    disabled={disabled}
    required={required}
    {...props}
  />
);

/**
 * Textarea Component
 */
export const Textarea = ({ 
  value, 
  onChange, 
  onBlur,
  placeholder, 
  rows = 3,
  disabled = false,
  required = false,
  error,
  className = '',
  ...props 
}) => (
  <textarea
    className={`form-control ${error ? 'is-invalid' : ''} ${className}`}
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    onBlur={onBlur}
    placeholder={placeholder}
    rows={rows}
    disabled={disabled}
    required={required}
    {...props}
  />
);

/**
 * Select Component
 */
export const Select = ({ 
  value, 
  onChange, 
  onBlur,
  options = [],
  placeholder = 'Select an option',
  disabled = false,
  required = false,
  error,
  className = '',
  ...props 
}) => (
  <select
    className={`form-control ${error ? 'is-invalid' : ''} ${className}`}
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
    onBlur={onBlur}
    disabled={disabled}
    required={required}
    {...props}
  >
    <option value="">{placeholder}</option>
    {options.map((option, index) => (
      <option key={index} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

/**
 * Button Component
 */
export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  icon,
  ...props 
}) => {
  const sizeClasses = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg'
  };

  return (
    <button
      type={type}
      className={`btn btn-${variant} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <span className="spinner-border spinner-border-sm mr-2" role="status"></span>
          Loading...
        </>
      ) : (
        <>
          {icon && <i className={`${icon} mr-2`}></i>}
          {children}
        </>
      )}
    </button>
  );
};

/**
 * Card Component
 */
export const Card = ({ 
  title, 
  subtitle,
  children, 
  className = '', 
  headerIcon,
  headerAction 
}) => (
  <div className={`card ${className}`}>
    {(title || headerAction) && (
      <div className="card-header d-flex justify-content-between align-items-center">
        <div>
          {title && (
            <h5 className="mb-0">
              {headerIcon && <i className={`${headerIcon} mr-2`}></i>}
              {title}
            </h5>
          )}
          {subtitle && <small className="text-muted">{subtitle}</small>}
        </div>
        {headerAction}
      </div>
    )}
    <div className="card-body">
      {children}
    </div>
  </div>
);

/**
 * Data Table Component
 */
export const DataTable = ({ 
  columns, 
  data = [], 
  loading = false,
  emptyMessage = 'No data available',
  className = '',
  onRowClick,
  selectedRowIndex
}) => {
  if (loading) {
    return <LoadingSpinner text="Loading data..." />;
  }

  if (data.length === 0) {
    return <EmptyState title={emptyMessage} />;
  }

  return (
    <div className={`table-responsive ${className}`}>
      <table className="table table-hover">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index}>
                {column.icon && <i className={`${column.icon} mr-1`}></i>}
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`${selectedRowIndex === rowIndex ? 'table-active' : ''} ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick && onRowClick(row, rowIndex)}
            >
              {columns.map((column, colIndex) => (
                <td key={colIndex}>
                  {column.render ? column.render(row[column.key], row, rowIndex) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
