import React, { useState, useCallback } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Box,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery,
  Collapse,
  Badge,
  SwipeableDrawer,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  alpha
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  EventNote as LeaveIcon,
  Schedule as TimesheetIcon,
  AttachMoney as PayrollIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  ExpandLess,
  ExpandMore,
  Add as AddIcon,
  PersonAdd as PersonAddIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Enhanced Mobile-First Navigation Component
 * Provides optimal navigation experience across all device sizes
 */
const MobileOptimizedNavigation = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin, isHR, isManager } = useAuth();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});

  // Navigation items configuration
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      roles: ['admin', 'hr', 'manager', 'employee']
    },
    {
      id: 'employees',
      label: 'Employees',
      icon: <PeopleIcon />,
      roles: ['admin', 'hr', 'manager'],
      children: [
        { id: 'employee-list', label: 'Employee List', path: '/employees' },
        { id: 'add-employee', label: 'Add Employee', path: '/add-employee' },
        { id: 'employee-reports', label: 'Reports', path: '/employee-reports' }
      ]
    },
    {
      id: 'leave',
      label: 'Leave Management',
      icon: <LeaveIcon />,
      path: '/leave',
      roles: ['admin', 'hr', 'manager', 'employee']
    },
    {
      id: 'timesheet',
      label: 'Timesheets',
      icon: <TimesheetIcon />,
      path: '/timesheet',
      roles: ['admin', 'hr', 'manager', 'employee']
    },
    {
      id: 'payroll',
      label: 'Payroll',
      icon: <PayrollIcon />,
      path: '/payroll',
      roles: ['admin', 'hr']
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <SettingsIcon />,
      path: '/settings',
      roles: ['admin', 'hr']
    }
  ];

  // Quick action items for Speed Dial
  const quickActions = [
    {
      icon: <PersonAddIcon />,
      name: 'Add Employee',
      action: () => navigate('/add-employee'),
      roles: ['admin', 'hr']
    },
    {
      icon: <CalendarIcon />,
      name: 'Request Leave',
      action: () => navigate('/request-leave'),
      roles: ['employee', 'manager']
    },
    {
      icon: <TimeIcon />,
      name: 'Log Time',
      action: () => navigate('/timesheet/new'),
      roles: ['employee', 'manager']
    }
  ];

  // Bottom navigation items for mobile
  const bottomNavItems = navigationItems
    .filter(item => !item.children && hasPermission(item.roles))
    .slice(0, 4);

  const hasPermission = useCallback((roles) => {
    if (!user?.role) return false;
    return roles.includes(user.role);
  }, [user?.role]);

  const toggleDrawer = useCallback((open) => (event) => {
    if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setMobileDrawerOpen(open);
  }, []);

  const handleMenuExpand = useCallback((menuId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  }, []);

  const handleNavigation = useCallback((path) => {
    navigate(path);
    setMobileDrawerOpen(false);
  }, [navigate]);

  const isCurrentPath = useCallback((path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  }, [location.pathname]);

  // Mobile App Bar
  const MobileAppBar = () => (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: theme.zIndex.drawer + 1,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={toggleDrawer(true)}
          sx={{ 
            mr: 2,
            minWidth: 44,
            minHeight: 44
          }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography 
          variant="h6" 
          noWrap 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontSize: { xs: '1rem', sm: '1.25rem' }
          }}
        >
          SkyrakSys HRM
        </Typography>

        <IconButton color="inherit" sx={{ minWidth: 44, minHeight: 44 }}>
          <Badge badgeContent={3} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>

        <IconButton
          color="inherit"
          onClick={() => navigate('/profile')}
          sx={{ ml: 1, minWidth: 44, minHeight: 44 }}
        >
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)' }}>
            {user?.firstName?.charAt(0) || 'U'}
          </Avatar>
        </IconButton>
      </Toolbar>
    </AppBar>
  );

  // Mobile Drawer Content
  const DrawerContent = () => (
    <Box sx={{ width: 280, pt: 1 }}>
      {/* User Profile Section */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Avatar 
          sx={{ 
            width: 60, 
            height: 60, 
            mx: 'auto', 
            mb: 1, 
            bgcolor: 'primary.main' 
          }}
        >
          {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
        </Avatar>
        <Typography variant="subtitle1" fontWeight="bold">
          {user?.firstName} {user?.lastName}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user?.role?.toUpperCase()}
        </Typography>
      </Box>

      <Divider />

      {/* Navigation Items */}
      <List sx={{ pt: 1 }}>
        {navigationItems
          .filter(item => hasPermission(item.roles))
          .map((item) => (
            <React.Fragment key={item.id}>
              <ListItemButton
                onClick={item.children ? () => handleMenuExpand(item.id) : () => handleNavigation(item.path)}
                selected={item.path && isCurrentPath(item.path)}
                sx={{
                  py: 1.5,
                  px: 2,
                  minHeight: 48,
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    borderRight: `3px solid ${theme.palette.primary.main}`,
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.95rem',
                    fontWeight: item.path && isCurrentPath(item.path) ? 'bold' : 'normal'
                  }}
                />
                {item.children && (
                  expandedMenus[item.id] ? <ExpandLess /> : <ExpandMore />
                )}
              </ListItemButton>

              {/* Submenu */}
              {item.children && (
                <Collapse in={expandedMenus[item.id]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child) => (
                      <ListItemButton
                        key={child.id}
                        onClick={() => handleNavigation(child.path)}
                        selected={isCurrentPath(child.path)}
                        sx={{
                          pl: 4,
                          py: 1,
                          minHeight: 40,
                          '&.Mui-selected': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                          }
                        }}
                      >
                        <ListItemText 
                          primary={child.label}
                          primaryTypographyProps={{
                            fontSize: '0.875rem',
                            fontWeight: isCurrentPath(child.path) ? 'bold' : 'normal'
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              )}
            </React.Fragment>
          ))}
      </List>

      <Divider sx={{ mt: 2 }} />

      {/* Logout */}
      <List>
        <ListItemButton 
          onClick={logout}
          sx={{ py: 1.5, px: 2, minHeight: 48 }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </List>
    </Box>
  );

  // Bottom Navigation for Mobile
  const MobileBottomNavigation = () => (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: theme.zIndex.appBar,
        display: { xs: 'block', md: 'none' }
      }} 
      elevation={8}
    >
      <BottomNavigation
        value={bottomNavItems.findIndex(item => isCurrentPath(item.path))}
        onChange={(event, newValue) => {
          if (bottomNavItems[newValue]) {
            handleNavigation(bottomNavItems[newValue].path);
          }
        }}
        sx={{ 
          height: 60,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 44,
            fontSize: '0.75rem'
          }
        }}
      >
        {bottomNavItems.map((item) => (
          <BottomNavigationAction
            key={item.id}
            label={item.label}
            icon={item.icon}
            sx={{
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              }
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );

  // Speed Dial for Quick Actions
  const QuickActionSpeedDial = () => {
    const [speedDialOpen, setSpeedDialOpen] = useState(false);
    const availableActions = quickActions.filter(action => hasPermission(action.roles));

    if (availableActions.length === 0) return null;

    return (
      <SpeedDial
        ariaLabel="Quick Actions"
        sx={{
          position: 'fixed',
          bottom: { xs: 80, md: 16 },
          right: 16,
          '& .MuiFab-root': {
            width: 56,
            height: 56
          }
        }}
        icon={<SpeedDialIcon />}
        open={speedDialOpen}
        onOpen={() => setSpeedDialOpen(true)}
        onClose={() => setSpeedDialOpen(false)}
      >
        {availableActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={() => {
              action.action();
              setSpeedDialOpen(false);
            }}
            sx={{
              '& .MuiSpeedDialAction-fab': {
                minWidth: 44,
                minHeight: 44
              }
            }}
          />
        ))}
      </SpeedDial>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Mobile App Bar */}
      {isMobile && <MobileAppBar />}

      {/* Mobile Drawer */}
      {isMobile && (
        <SwipeableDrawer
          anchor="left"
          open={mobileDrawerOpen}
          onClose={toggleDrawer(false)}
          onOpen={toggleDrawer(true)}
          disableBackdropTransition={!iOS}
          disableDiscovery={iOS}
          sx={{
            '& .MuiDrawer-paper': {
              width: 280,
              backgroundImage: 'none',
            }
          }}
        >
          <DrawerContent />
        </SwipeableDrawer>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: { xs: 7, sm: 8 },
          pb: { xs: 8, md: 0 },
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default
        }}
      >
        {children}
      </Box>

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileBottomNavigation />}

      {/* Quick Action Speed Dial */}
      <QuickActionSpeedDial />
    </Box>
  );
};

// iOS detection for swipeable drawer optimization
const iOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

export default MobileOptimizedNavigation;
