import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  NetworkCheck as NetworkIcon,
  Cached as CacheIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { 
  usePerformanceMonitor, 
  useAPIPerformanceMonitor, 
  useMemoryMonitor 
} from '../../../hooks/usePerformanceMonitor';
import { getPerformanceMetrics } from '../../../services/optimizedAPI';

/**
 * Performance Dashboard Component
 * Real-time monitoring of application performance
 */
const PerformanceDashboard = () => {
  const [apiMetrics, setApiMetrics] = useState(null);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const { memoryInfo, getMemoryUsagePercent } = useMemoryMonitor();
  const memoryUsagePercent = getMemoryUsagePercent();

  // Fetch API performance metrics
  useEffect(() => {
    const fetchMetrics = () => {
      if (isMonitoring) {
        const metrics = getPerformanceMetrics();
        setApiMetrics(metrics);
      }
    };

    fetchMetrics();
    
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchMetrics, 2000); // Update every 2 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring, autoRefresh]);

  const getPerformanceScore = () => {
    if (!apiMetrics) return 0;
    
    let score = 100;
    
    // Penalize high error rate
    const errorRate = parseFloat(apiMetrics.errorRate);
    if (errorRate > 5) score -= 20;
    if (errorRate > 10) score -= 30;
    
    // Penalize slow average response time
    if (apiMetrics.averageResponseTime > 500) score -= 15;
    if (apiMetrics.averageResponseTime > 1000) score -= 25;
    
    // Penalize high memory usage
    if (memoryUsagePercent > 70) score -= 10;
    if (memoryUsagePercent > 85) score -= 20;
    
    // Reward good cache hit rate
    const cacheHitRate = parseFloat(apiMetrics.cacheHitRate);
    if (cacheHitRate > 50) score += 5;
    if (cacheHitRate > 70) score += 10;
    
    return Math.max(0, Math.min(100, score));
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const formatBytes = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const performanceScore = getPerformanceScore();

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          🚀 Performance Dashboard
        </Typography>
        <Box display="flex" gap={1} alignItems="center">
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                size="small"
              />
            }
            label="Auto Refresh"
          />
          <Tooltip title="Refresh Metrics">
            <IconButton onClick={() => setApiMetrics(getPerformanceMetrics())}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="View Details">
            <IconButton onClick={() => setDetailsOpen(true)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Performance Alert */}
      {performanceScore < 60 && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          icon={<WarningIcon />}
        >
          Performance issues detected. Check API response times and memory usage.
        </Alert>
      )}

      {performanceScore >= 80 && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          icon={<CheckIcon />}
        >
          Application performance is excellent! All metrics within optimal range.
        </Alert>
      )}

      {/* Key Metrics Overview */}
      <Grid container spacing={3} mb={4}>
        {/* Overall Performance Score */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <SpeedIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Performance Score</Typography>
              </Box>
              <Box textAlign="center">
                <Typography 
                  variant="h3" 
                  color={getScoreColor(performanceScore)}
                  fontWeight="bold"
                >
                  {performanceScore}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Out of 100
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={performanceScore}
                  color={getScoreColor(performanceScore)}
                  sx={{ mt: 1, height: 8, borderRadius: 4 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* API Performance */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <NetworkIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">API Performance</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" mb={1}>
                {apiMetrics ? `${Math.round(apiMetrics.averageResponseTime)}ms` : '---'}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Average Response Time
              </Typography>
              <Chip
                label={`${apiMetrics?.requestsPerSecond || 0} req/s`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Cache Performance */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <CacheIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Cache Performance</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" mb={1}>
                {apiMetrics?.cacheHitRate || '0%'}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Cache Hit Rate
              </Typography>
              <Chip
                label={`${apiMetrics?.cacheSize || 0} cached`}
                size="small"
                color="success"
                variant="outlined"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Memory Usage */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <MemoryIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Memory Usage</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" mb={1}>
                {memoryUsagePercent.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={1}>
                JS Heap Usage
              </Typography>
              <LinearProgress
                variant="determinate"
                value={memoryUsagePercent}
                color={memoryUsagePercent > 80 ? 'error' : memoryUsagePercent > 60 ? 'warning' : 'success'}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Metrics */}
      <Grid container spacing={3}>
        {/* API Metrics Table */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2} display="flex" alignItems="center">
                <TimelineIcon sx={{ mr: 1 }} />
                API Metrics Details
              </Typography>
              {apiMetrics && (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Metric</strong></TableCell>
                        <TableCell align="right"><strong>Value</strong></TableCell>
                        <TableCell align="right"><strong>Status</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Total Requests</TableCell>
                        <TableCell align="right">{apiMetrics.totalRequests.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          <Chip label="Active" size="small" color="info" />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Cache Hits</TableCell>
                        <TableCell align="right">{apiMetrics.cacheHits.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={parseInt(apiMetrics.cacheHitRate) > 50 ? "Good" : "Low"} 
                            size="small" 
                            color={parseInt(apiMetrics.cacheHitRate) > 50 ? "success" : "warning"} 
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Slow Requests</TableCell>
                        <TableCell align="right">{apiMetrics.slowRequests}</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={apiMetrics.slowRequests < 5 ? "Good" : "High"} 
                            size="small" 
                            color={apiMetrics.slowRequests < 5 ? "success" : "error"} 
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Failed Requests</TableCell>
                        <TableCell align="right">{apiMetrics.failedRequests}</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={parseFloat(apiMetrics.errorRate) < 5 ? "Good" : "High"} 
                            size="small" 
                            color={parseFloat(apiMetrics.errorRate) < 5 ? "success" : "error"} 
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Error Rate</TableCell>
                        <TableCell align="right">{apiMetrics.errorRate}</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={parseFloat(apiMetrics.errorRate) < 5 ? "Excellent" : "Needs Attention"} 
                            size="small" 
                            color={parseFloat(apiMetrics.errorRate) < 5 ? "success" : "error"} 
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Memory Details */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>
                Memory Details
              </Typography>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Used JS Heap Size
                </Typography>
                <Typography variant="h6">
                  {formatBytes(memoryInfo.usedJSHeapSize)}
                </Typography>
              </Box>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Total JS Heap Size
                </Typography>
                <Typography variant="h6">
                  {formatBytes(memoryInfo.totalJSHeapSize)}
                </Typography>
              </Box>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  JS Heap Size Limit
                </Typography>
                <Typography variant="h6">
                  {formatBytes(memoryInfo.jsHeapSizeLimit)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={memoryUsagePercent}
                color={memoryUsagePercent > 80 ? 'error' : memoryUsagePercent > 60 ? 'warning' : 'success'}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary" mt={1} display="block">
                Memory usage: {memoryUsagePercent.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Performance Configuration</DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            This dashboard monitors real-time application performance including:
          </Typography>
          <ul>
            <li>API response times and request patterns</li>
            <li>Memory usage and garbage collection</li>
            <li>Cache hit rates and effectiveness</li>
            <li>Component render performance</li>
          </ul>
          <Typography variant="body2" color="text.secondary" mt={2}>
            Performance data is collected automatically and updated every 2 seconds when auto-refresh is enabled.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PerformanceDashboard;
