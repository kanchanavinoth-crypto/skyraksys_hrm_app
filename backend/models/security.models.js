const { DataTypes } = require('sequelize');
const db = require('./index');
const { sequelize } = db;

/**
 * Audit Log Model for tracking sensitive operations
 * Maintains a complete audit trail of all employee data changes
 */
const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  action: {
    type: DataTypes.ENUM('CREATE', 'UPDATE', 'DELETE', 'VIEW_SENSITIVE'),
    allowNull: false
  },
  tableName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Table affected by the action'
  },
  recordId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID of the affected record'
  },
  employeeId: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Employee ID when action relates to employee data'
  },
  fieldName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Specific field that was modified'
  },
  oldValue: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Previous value (masked for sensitive fields)'
  },
  newValue: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'New value (masked for sensitive fields)'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID of user who performed the action'
  },
  userRole: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'Role of user who performed the action'
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IP address of the user'
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User agent string'
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Reason for the change (for sensitive operations)'
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID of user who approved the change (for workflow approval)'
  },
  severity: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
    allowNull: false,
    defaultValue: 'LOW'
  },
  success: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether the operation was successful'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Error message if operation failed'
  },
  sessionId: {
    type: DataTypes.STRING(128),
    allowNull: true,
    comment: 'Session ID for tracking user sessions'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'audit_logs',
  timestamps: false, // We manage createdAt manually
  indexes: [
    {
      name: 'idx_audit_logs_employee_id',
      fields: ['employeeId']
    },
    {
      name: 'idx_audit_logs_user_id',
      fields: ['userId']
    },
    {
      name: 'idx_audit_logs_action',
      fields: ['action']
    },
    {
      name: 'idx_audit_logs_created_at',
      fields: ['createdAt']
    },
    {
      name: 'idx_audit_logs_severity',
      fields: ['severity']
    },
    {
      name: 'idx_audit_logs_table_record',
      fields: ['tableName', 'recordId']
    }
  ]
});

/**
 * File Upload Security Model for tracking file uploads
 */
const FileUpload = sequelize.define('FileUpload', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Original filename'
  },
  storedFileName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Filename as stored on server'
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: 'Path where file is stored'
  },
  fileType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'MIME type of the file'
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'File size in bytes'
  },
  uploadedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID of user who uploaded the file'
  },
  employeeId: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Employee ID if file relates to employee'
  },
  purpose: {
    type: DataTypes.ENUM('PROFILE_PHOTO', 'DOCUMENT', 'RESUME', 'ID_PROOF', 'ADDRESS_PROOF', 'OTHER'),
    allowNull: false,
    // comment: 'Purpose of the file upload' // Temporarily removed due to Sequelize enum+comment bug
  },
  scanStatus: {
    type: DataTypes.ENUM('PENDING', 'CLEAN', 'INFECTED', 'ERROR'),
    allowNull: false,
    defaultValue: 'PENDING',
    // comment: 'Virus scan status' // Temporarily removed due to Sequelize enum+comment bug
  },
  scanDetails: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Details from virus scan'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether file is currently active'
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When file access expires (for temporary files)'
  },
  downloadCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of times file has been downloaded'
  },
  lastAccessedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When file was last accessed'
  }
}, {
  tableName: 'file_uploads',
  indexes: [
    {
      name: 'idx_file_uploads_employee_id',
      fields: ['employeeId']
    },
    {
      name: 'idx_file_uploads_uploaded_by',
      fields: ['uploadedBy']
    },
    {
      name: 'idx_file_uploads_purpose',
      fields: ['purpose']
    },
    {
      name: 'idx_file_uploads_scan_status',
      fields: ['scanStatus']
    },
    {
      name: 'idx_file_uploads_stored_filename',
      fields: ['storedFileName'],
      unique: true
    }
  ]
});

/**
 * Security Session Model for enhanced session tracking
 */
const SecuritySession = sequelize.define('SecuritySession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sessionId: {
    type: DataTypes.STRING(128),
    allowNull: false,
    // unique: true, // Temporarily removed due to Sequelize unique+comment bug - handled via index
    // comment: 'Unique session identifier' // Temporarily removed due to Sequelize unique+comment bug
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'ID of the logged-in user'
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: false,
    comment: 'IP address of the user'
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'User agent string'
  },
  deviceFingerprint: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Device fingerprint for additional security'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether session is currently active'
  },
  loginAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'When user logged in'
  },
  lastActivityAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Last activity timestamp'
  },
  logoutAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When user logged out'
  },
  logoutReason: {
    type: DataTypes.ENUM('USER_LOGOUT', 'SESSION_TIMEOUT', 'FORCED_LOGOUT', 'SECURITY_VIOLATION'),
    allowNull: true
  },
  riskScore: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Risk score for this session (0-100)'
  },
  locationCountry: {
    type: DataTypes.STRING(2),
    allowNull: true,
    comment: 'Country code from IP geolocation'
  },
  locationCity: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'City from IP geolocation'
  },
  warningCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of security warnings in this session'
  }
}, {
  tableName: 'security_sessions',
  indexes: [
    {
      name: 'idx_security_sessions_user_id',
      fields: ['userId']
    },
    {
      name: 'idx_security_sessions_session_id',
      fields: ['sessionId'],
      unique: true
    },
    {
      name: 'idx_security_sessions_ip_address',
      fields: ['ipAddress']
    },
    {
      name: 'idx_security_sessions_active',
      fields: ['isActive']
    },
    {
      name: 'idx_security_sessions_risk_score',
      fields: ['riskScore']
    }
  ]
});

/**
 * Setup associations
 */
AuditLog.associate = function(models) {
  // AuditLog belongs to User (the one who performed the action)
  AuditLog.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'performer'
  });
  
  // AuditLog may belong to User (the one who approved the action)
  AuditLog.belongsTo(models.User, {
    foreignKey: 'approvedBy',
    as: 'approver'
  });
};

FileUpload.associate = function(models) {
  // FileUpload belongs to User (uploader)
  FileUpload.belongsTo(models.User, {
    foreignKey: 'uploadedBy',
    as: 'uploader'
  });
  
  // FileUpload may relate to Employee
  FileUpload.belongsTo(models.Employee, {
    foreignKey: 'employeeId',
    as: 'employee'
  });
};

SecuritySession.associate = function(models) {
  // SecuritySession belongs to User
  SecuritySession.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
};

module.exports = {
  AuditLog,
  FileUpload,
  SecuritySession
};
