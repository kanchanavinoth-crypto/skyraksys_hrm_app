module.exports = {
  apps: [
    {
      name: 'skyraksys-hrm-backend',
      script: 'server.js',
      cwd: '/opt/skyraksys-hrm/backend',
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 8080
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8080
      },
      error_file: '/var/log/skyraksys-hrm/error.log',
      out_file: '/var/log/skyraksys-hrm/out.log',
      log_file: '/var/log/skyraksys-hrm/combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 5000
    }
  ]
};
