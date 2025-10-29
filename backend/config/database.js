const { logger } = require('./logger');

// Custom query logger with timing
const queryLogger = (sql, timing) => {
  const duration = timing || 0;
  
  // Log slow queries (>100ms)
  if (duration > 100) {
    logger.warn(`🐌 Slow Query (${duration}ms): ${sql.substring(0, 200)}...`);
  } else if (process.env.LOG_ALL_QUERIES === 'true') {
    logger.debug(`⚡ Query (${duration}ms): ${sql.substring(0, 200)}...`);
  }
};

module.exports = {
  development: {
    username: process.env.DB_USER || 'hrm_user',
    password: process.env.DB_PASSWORD || 'hrm_password_2025',
    database: process.env.DB_NAME || 'skyraksys_hrm',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    dialect: process.env.DB_DIALECT || 'postgres',
    storage: process.env.DB_STORAGE || null, // For SQLite
    logging: process.env.ENABLE_QUERY_LOGGING === 'true' ? queryLogger : false,
    benchmark: true, // Enable query timing
    pool: {
      max: 10,
      min: 2,
      acquire: 60000,
      idle: 30000
    },
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true // Soft deletes
    }
  },
  test: {
    username: process.env.DB_USER || 'hrm_user',
    password: process.env.DB_PASSWORD || 'hrm_password_2025',
    database: process.env.DB_NAME_TEST || 'skyraksys_hrm_test',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 5432,
    dialect: process.env.DB_DIALECT || 'postgres',
    storage: process.env.DB_STORAGE || null, // For SQLite
    logging: false
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 30000
    },
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true
    },
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  }
};
