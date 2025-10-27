# Monitoring Guide

## Overview
This document outlines the monitoring and observability setup for the SkyRakSys HRM system.

## Monitoring Components

### 1. Application Metrics
- Request rates
- Response times
- Error rates
- CPU/Memory usage
- Database connections
- Cache hit rates

### 2. Business Metrics
- Active users
- Leave requests
- Timesheet submissions
- Project activities
- System utilization

## Monitoring Setup

### 1. Prometheus Configuration
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'skyraksys-hrm'
    static_configs:
      - targets: ['localhost:3000', 'localhost:8080']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['localhost:9187']
```

### 2. Grafana Dashboard
```json
{
  "dashboard": {
    "title": "SkyRakSys HRM Overview",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "query": "rate(http_requests_total[5m])"
      },
      {
        "title": "Response Time",
        "type": "graph",
        "query": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "query": "rate(http_requests_total{status=~\"5..\"}[5m])"
      }
    ]
  }
}
```

## Application Monitoring

### 1. Express Middleware
```javascript
const promBundle = require('express-prom-bundle');

const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  customLabels: {
    project_name: 'skyraksys_hrm',
    project_type: 'hrm_system'
  },
  promClient: {
    collectDefaultMetrics: {
      timeout: 5000
    }
  }
});

app.use(metricsMiddleware);
```

### 2. Custom Metrics
```javascript
const client = require('prom-client');

// Business metrics
const activeUsersGauge = new client.Gauge({
  name: 'active_users_total',
  help: 'Total number of active users'
});

const leaveRequestsCounter = new client.Counter({
  name: 'leave_requests_total',
  help: 'Total number of leave requests',
  labelNames: ['status']
});

const timesheetSubmissionsHistogram = new client.Histogram({
  name: 'timesheet_submission_duration_seconds',
  help: 'Time taken to submit timesheet',
  buckets: [0.1, 0.5, 1, 2, 5]
});
```

## Infrastructure Monitoring

### 1. Server Metrics
```yaml
# Node Exporter systemd service
[Unit]
Description=Node Exporter
After=network.target

[Service]
Type=simple
User=node_exporter
ExecStart=/usr/local/bin/node_exporter
Restart=always

[Install]
WantedBy=multi-user.target
```

### 2. Database Metrics
```yaml
# PostgreSQL Exporter configuration
DATA_SOURCE_NAME: "postgresql://postgres:password@localhost:5432/skyraksys_hrm?sslmode=disable"
POSTGRES_EXPORTER_OPTS: "--auto-discover-databases"
```

## Alerting Configuration

### 1. Alert Rules
```yaml
groups:
  - name: skyraksys_hrm_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High error rate detected
          description: More than 10% error rate in the last 5 minutes

      - alert: APILatencyHigh
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: API latency is high
          description: 95th percentile latency is above 2 seconds

      - alert: DatabaseConnectionsHigh
        expr: pg_stat_activity_count > 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: High database connections
          description: More than 100 active database connections
```

### 2. Alert Channels
```yaml
apiVersion: 1
kind: AlertChannel
metadata:
  name: email-alerts
spec:
  type: email
  settings:
    addresses: alerts@skyraksys.com

---
apiVersion: 1
kind: AlertChannel
metadata:
  name: slack-alerts
spec:
  type: slack
  settings:
    url: https://hooks.slack.com/services/xxx/yyy/zzz
    channel: #alerts
```

## Logging Configuration

### 1. Winston Logger Setup
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'skyraksys-hrm' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### 2. Log Aggregation
```yaml
# Filebeat configuration
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/skyraksys-hrm/*.log
  fields:
    app: skyraksys-hrm

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "skyraksys-hrm-%{+yyyy.MM.dd}"
```

## Performance Monitoring

### 1. API Performance
```javascript
const responseTime = require('response-time');

app.use(responseTime((req, res, time) => {
  const route = req.route?.path || req.path;
  apiResponseTime.observe({
    method: req.method,
    route,
    status_code: res.statusCode
  }, time);
}));
```

### 2. Database Performance
```javascript
const { performance } = require('perf_hooks');

async function monitorQueryPerformance(query, params) {
  const start = performance.now();
  try {
    const result = await db.query(query, params);
    const duration = performance.now() - start;
    queryDurationHistogram.observe({
      query_type: getQueryType(query)
    }, duration);
    return result;
  } catch (error) {
    queryErrorsCounter.inc({
      query_type: getQueryType(query)
    });
    throw error;
  }
}
```

## Monitoring Best Practices

1. **Data Collection**
   - Collect relevant metrics
   - Use appropriate metric types
   - Add context with labels
   - Monitor all components

2. **Alert Configuration**
   - Define clear thresholds
   - Avoid alert fatigue
   - Include actionable info
   - Set proper severity

3. **Dashboard Organization**
   - Logical grouping
   - Clear visualization
   - Important metrics first
   - Include trends

4. **Log Management**
   - Structured logging
   - Proper log levels
   - Regular rotation
   - Efficient querying

## References
- [API Documentation](../api/API_DOCUMENTATION.md)
- [Deployment Guide](./CICD_GUIDE.md)
- [Production Setup](../../PROD/docs/PRODUCTION_SETUP_GUIDE.md)
- [Security Guide](../development/SECURITY.md)