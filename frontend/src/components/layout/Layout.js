import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  alpha,
  Collapse,
  Paper,
  Stack,
  Chip,
  Badge,
  Button
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  EventNote as LeaveIcon,
  Schedule as TimesheetIcon,
  AccountBalance as PayrollIcon,
  Assignment as ProjectIcon,
  Settings as SettingsIcon,
  Assessment as ReportsIcon,
  SupervisorAccount as ManagerIcon,
  ExpandLess,
  ExpandMore,
  AdminPanelSettings as AdminIcon,
  Menu as MenuIcon,
  Add,
  Folder,
  Work as WorkIcon,
  Person as PersonIcon,
  AccountBalanceWallet,
  ListAlt,
  CalendarToday,
  History,
  CheckCircle,
  CheckCircleOutline,
  Receipt,
  Description,
  FileCopy,
  Tune,
  BugReport,
  Business as BusinessIcon,
  Notifications,
  Help,
  Logout as LogoutIcon,
  Assessment // ✅ ADD THIS LINE - Import Assessment separately for Performance icons
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 280;

const Layout = () => {
  const { user, logout, isAdmin, isHR, isManager } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();
  
  // State management
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openGroups, setOpenGroups] = useState({
    dashboards: true,
    employees: true,
    leave: false,
    timesheet: false,
    payroll: false,
    projects: false,
    admin: false,
    reports: false
  });

  // Handler functions
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
  };

  const handleGroupClick = (group) => {
    setOpenGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  // Menu structure based on role
  const getMenuStructure = () => {
    if (isAdmin() || isHR()) {
      return [
        {
          id: 'dashboards',
          label: 'Dashboards',
          icon: <DashboardIcon />,
          items: [
            { label: 'Overview', path: '/admin-dashboard', icon: <DashboardIcon /> },
            { label: 'Performance', path: '/performance-dashboard', icon: <Assessment /> }
          ]
        },
        {
          id: 'employees',
          label: 'Employee Management',
          icon: <PeopleIcon />,
          items: [
            { label: 'All Employees', path: '/employees', icon: <PeopleIcon /> },
            { label: 'Add New Employee', path: '/employees/add', icon: <Add /> },
            { label: 'Employee Records', path: '/employee-records', icon: <Folder /> },
            { label: 'Positions', path: '/position-management', icon: <WorkIcon /> }
          ]
        },
        {
          id: 'leave',
          label: 'Leave Management',
          icon: <LeaveIcon />,
          items: [
            { label: 'Leave Requests', path: '/leave-management', icon: <CheckCircleOutline /> },
            { label: 'Leave Balances', path: '/admin/leave-balances', icon: <AccountBalanceWallet /> },
            { label: 'My Leave Requests', path: '/leave-requests', icon: <ListAlt /> },
            { label: 'Apply for Leave', path: '/add-leave-request', icon: <Add /> }
          ]
        },
        {
          id: 'timesheet',
          label: 'Timesheet & Attendance',
          icon: <TimesheetIcon />,
          items: [
            { label: 'Timesheet Approvals', path: '/timesheets/approvals', icon: <CheckCircleOutline /> },
            { label: 'My Timesheet', path: '/timesheets', icon: <TimesheetIcon /> },
            { label: 'Timesheet History', path: '/timesheets/history', icon: <History /> }
          ]
        },
        {
          id: 'payroll',
          label: 'Payroll',
          icon: <PayrollIcon />,
          items: [
            { label: 'Payroll Management', path: '/payroll-management', icon: <PayrollIcon /> },
            { label: 'Payslip Templates', path: '/admin/payslip-templates', icon: <FileCopy /> },
            { label: 'My Payslips', path: '/employee-payslips', icon: <Receipt /> }
          ]
        },
        {
          id: 'projects',
          label: 'Projects & Tasks',
          icon: <ProjectIcon />,
          items: [
            { label: 'All Projects', path: '/project-task-config', icon: <ProjectIcon /> }
          ]
        },
        {
          id: 'reports',
          label: 'Reports & Analytics',
          icon: <ReportsIcon />,
          items: [
            { label: 'All Reports', path: '/reports', icon: <ReportsIcon /> },
            { label: 'Consolidated Reports', path: '/admin/consolidated-reports', icon: <Assessment /> }
          ]
        },
        {
          id: 'admin',
          label: 'Administration',
          icon: <AdminIcon />,
          items: [
            { label: 'User Management', path: '/user-management', icon: <ManagerIcon /> },
            { label: 'System Settings', path: '/settings', icon: <SettingsIcon /> },
            { label: 'My Profile', path: '/my-profile', icon: <PersonIcon /> }
          ]
        }
      ];
    }

    if (isManager()) {
      return [
        {
          id: 'dashboards',
          label: 'Dashboard',
          icon: <DashboardIcon />,
          items: [
            { label: 'Overview', path: '/manager-dashboard', icon: <DashboardIcon /> },
            { label: 'Team Performance', path: '/performance-dashboard', icon: <Assessment /> }
          ]
        },
        {
          id: 'team',
          label: 'My Team',
          icon: <PeopleIcon />,
          items: [
            { label: 'Team Members', path: '/employees', icon: <PeopleIcon /> }
          ]
        },
        {
          id: 'approvals',
          label: 'Approvals',
          icon: <CheckCircleOutline />,
          items: [
            { label: 'Leave Requests', path: '/leave-management', icon: <LeaveIcon /> },
            { label: 'Timesheets', path: '/timesheets/approvals', icon: <TimesheetIcon /> }
          ]
        },
        {
          id: 'leave',
          label: 'My Leave',
          icon: <LeaveIcon />,
          items: [
            { label: 'My Leave Requests', path: '/leave-requests', icon: <ListAlt /> },
            { label: 'Apply for Leave', path: '/add-leave-request', icon: <Add /> }
          ]
        },
        {
          id: 'timesheet',
          label: 'My Timesheet',
          icon: <TimesheetIcon />,
          items: [
            { label: 'Current Timesheet', path: '/timesheets', icon: <TimesheetIcon /> },
            { label: 'History', path: '/timesheets/history', icon: <History /> }
          ]
        },
        {
          id: 'projects',
          label: 'Projects',
          icon: <ProjectIcon />,
          items: [
            { label: 'My Projects', path: '/project-task-config', icon: <ProjectIcon /> }
          ]
        },
        {
          id: 'profile',
          label: 'My Profile',
          icon: <PersonIcon />,
          items: [
            { label: 'Personal Info', path: '/my-profile', icon: <PersonIcon /> },
            { label: 'My Payslips', path: '/employee-payslips', icon: <Receipt /> }
          ]
        }
      ];
    }

    // Employee menu
    return [
      {
        id: 'dashboard',
        label: 'My Dashboard',
        icon: <DashboardIcon />,
        items: [
          { label: 'Overview', path: '/employee-dashboard', icon: <DashboardIcon /> }
        ]
      },
      {
        id: 'profile',
        label: 'My Profile',
        icon: <PersonIcon />,
        items: [
          { label: 'Personal Information', path: '/my-profile', icon: <PersonIcon /> },
          { label: 'My Payslips', path: '/employee-payslips', icon: <PayrollIcon /> }
        ]
      },
      {
        id: 'leave',
        label: 'Leave',
        icon: <LeaveIcon />,
        items: [
          { label: 'My Leave Requests', path: '/leave-requests', icon: <LeaveIcon /> },
          { label: 'Apply for Leave', path: '/add-leave-request', icon: <Add /> }
          ]
        },
        {
          id: 'timesheet',
          label: 'Timesheet',
          icon: <TimesheetIcon />,
          items: [
            { label: 'My Timesheet', path: '/timesheets', icon: <TimesheetIcon /> },
            { label: 'Timesheet History', path: '/timesheets/history', icon: <History /> }
          ]
        },
        {
          id: 'tasks',
          label: 'My Tasks',
          icon: <ProjectIcon />,
          items: [
            { label: 'Assigned Tasks', path: '/project-task-config', icon: <ProjectIcon /> }
          ]
        }
      ];
    };

    const menuStructure = getMenuStructure();

    const modernDrawerContent = (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'transparent' }}>
        {/* Header */}
        <Paper 
          elevation={0}
          sx={{ 
            p: 3, 
            background: '#ffffff',
            borderRadius: 0,
            borderBottom: '1px solid #e2e8f0'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar 
              sx={{ 
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                width: 48, 
                height: 48,
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
              }}
            >
              <BusinessIcon sx={{ color: 'white', fontSize: 28 }} />
            </Avatar>
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: theme.palette.text.primary, 
                  fontWeight: 'bold',
                }}
              >
                SKYRAKSYS
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontWeight: 'medium',
                  fontSize: '0.75rem'
                }}
              >
                Human Resource Management
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Navigation Items */}
        <Box sx={{ flexGrow: 1, p: 2, bgcolor: 'transparent', overflow: 'auto' }}>
          <List sx={{ pt: 0 }}>
            {menuStructure.map((group) => (
              <React.Fragment key={group.id}>
                <ListItemButton 
                  onClick={() => handleGroupClick(group.id)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    mb: 0.5,
                    borderRadius: 2,
                    color: theme.palette.text.primary,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08)
                    }
                  }}
                >
                  <ListItemIcon sx={{ color: theme.palette.primary.main, minWidth: 40 }}>
                    {group.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={group.label}
                    primaryTypographyProps={{
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}
                  />
                  {openGroups[group.id] ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                
                <Collapse in={openGroups[group.id]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {group.items.map((item) => (
                      <ListItemButton
                        key={item.path}
                        component={NavLink}
                        to={item.path}
                        sx={{
                          pl: 4,
                          py: 1,
                          borderRadius: 2,
                          ml: 1,
                          mr: 1,
                          color: theme.palette.text.secondary,
                          '&.active': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.12),
                            borderLeft: `4px solid ${theme.palette.primary.main}`,
                            color: theme.palette.primary.main,
                            fontWeight: 600
                          },
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.06)
                          }
                        }}
                      >
                        <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={item.label}
                          primaryTypographyProps={{
                            fontSize: '0.875rem'
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              </React.Fragment>
            ))}
          </List>
        </Box>

        {/* Footer */}
        <Box sx={{ p: 2, textAlign: 'center', borderTop: `1px solid ${theme.palette.divider}`, bgcolor: 'transparent' }}>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
            © 2025 SKYRAKSYS HRM v2.0
          </Typography>
        </Box>
      </Box>
    );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Enhanced App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          {/* Logo and Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <Avatar 
              sx={{ 
                bgcolor: 'primary.main', 
                mr: 2,
                width: 32,
                height: 32,
                fontSize: '1rem'
              }}
            >
              S
            </Avatar>
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                fontWeight: 'bold',
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              SKYRAKSYS HRM
            </Typography>
          </Box>

          {/* User Profile Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              label={user?.role?.toUpperCase() || 'USER'} 
              size="small"
              sx={{ 
                bgcolor: 'primary.main', 
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.75rem'
              }} 
            />
            
            <IconButton
              size="large"
              edge="end"
              aria-label="notifications"
              color="inherit"
              sx={{ mr: 1 }}
            >
              <Badge badgeContent={4} color="error">
                <Notifications />
              </Badge>
            </IconButton>

            <Button
              onClick={handleProfileMenuOpen}
              sx={{ 
                color: 'text.primary',
                textTransform: 'none',
                borderRadius: 2,
                px: 2,
                '&:hover': { bgcolor: 'action.hover' }
              }}
              startIcon={
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32,
                    bgcolor: 'primary.main'
                  }}
                >
                  {user?.firstName?.charAt(0) || 'U'}
                </Avatar>
              }
              endIcon={<ExpandMore />}
            >
              <Box sx={{ textAlign: 'left', ml: 1 }}>
                <Typography variant="body2" fontWeight="medium">
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Enhanced Sidebar Navigation */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              background: `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
              color: theme.palette.text.primary,
              borderRight: `1px solid ${theme.palette.divider}`,
            },
          }}
        >
          {modernDrawerContent}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              background: `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.background.default, 0.95)} 100%)`,
              color: theme.palette.text.primary,
              borderRight: `1px solid ${theme.palette.divider}`,
              boxShadow: '2px 0 8px rgba(0,0,0,0.04)'
            },
          }}
          open
        >
          {modernDrawerContent}
        </Drawer>
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        slotProps={{
          paper: {
            elevation: 3,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              minWidth: 200,
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem 
          onClick={() => {
            handleProfileMenuClose();
            navigate('/my-profile');
          }} 
          sx={{ py: 1.5 }}
        >
          <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: 'primary.main' }}>
            {user?.firstName?.charAt(0) || 'U'}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              View Profile
            </Typography>
          </Box>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Account Settings
        </MenuItem>
        
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <Notifications fontSize="small" />
          </ListItemIcon>
          Notifications
        </MenuItem>
        
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <Help fontSize="small" />
          </ListItemIcon>
          Help & Support
        </MenuItem>
        
        <Divider />
        
        <MenuItem 
          onClick={handleLogout}
          sx={{ 
            color: 'error.main',
            '&:hover': { bgcolor: 'error.light', color: 'error.contrastText' }
          }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              Sign Out
            </Typography>
            <Typography variant="caption">
              Sign out of your account
            </Typography>
          </Box>
        </MenuItem>
      </Menu>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 7, md: 8 },
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
