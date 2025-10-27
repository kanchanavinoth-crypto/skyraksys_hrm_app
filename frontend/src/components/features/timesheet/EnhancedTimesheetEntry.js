import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Avatar,
  useTheme
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  History as HistoryIcon,
  PostAdd as EntryIcon
} from '@mui/icons-material';
import ModernTimesheetEntry from './ModernTimesheetEntry';
import TimesheetHistory from './TimesheetHistory';

/**
 * Enhanced Timesheet Entry Component with History
 * 
 * This component provides a tabbed interface for:
 * 1. Timesheet Entry (Modern, minimalistic design)
 * 2. Timesheet History
 */
const EnhancedTimesheetEntry = () => {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Simple Modern Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 3
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48 }}>
            <ScheduleIcon />
          </Avatar>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
              Timesheet Management
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Submit your weekly timesheets and view your history
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Minimal Tabs */}
      <Paper elevation={0} sx={{ mb: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange} 
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              py: 2,
              fontSize: '0.95rem',
              fontWeight: 500,
              textTransform: 'none'
            }
          }}
        >
          <Tab 
            icon={<EntryIcon />} 
            label="Timesheet Entry" 
            iconPosition="start"
            sx={{ gap: 1 }}
          />
          <Tab 
            icon={<HistoryIcon />} 
            label="My History" 
            iconPosition="start"
            sx={{ gap: 1 }}
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box>
        {currentTab === 0 && (
          <Box>
            <ModernTimesheetEntry />
          </Box>
        )}

        {currentTab === 1 && (
          <Box>
            <TimesheetHistory showHeader={false} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default EnhancedTimesheetEntry;