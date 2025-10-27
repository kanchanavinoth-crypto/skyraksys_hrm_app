/**
 * Payslip Template Manager
 * Admin interface to create, edit, and manage payslip templates
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Visibility as PreviewIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../../contexts/AuthContext';
import http from '../../../http-common';

const PayslipTemplateManager = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { isAdmin } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Form state for new/edit template
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    version: '1.0',
    isActive: true,
    earnings: [],
    deductions: [],
    logoEnabled: true,
    logoPosition: 'left',
    showCompanyName: true,
    layout: {
      sections: 'standard', // 'standard', 'compact', 'detailed'
      columnLayout: 'two-column', // 'single-column', 'two-column', 'three-column'
      showBorders: true,
      showGridLines: false
    },
    footer: {
      showDisclaimer: true,
      disclaimerText: 'This is a computer-generated payslip and does not require a signature.',
      showSignatures: true,
      showGeneratedDate: true,
      showCompanyStamp: false,
      alignment: 'left' // 'left', 'center', 'right'
    },
    styling: {
      primaryColor: '#2196F3',
      secondaryColor: '#FFC107',
      fontFamily: 'Arial',
      fontSize: '12px',
      logoWidth: '100px',
      logoHeight: '50px'
    }
  });

  // Predefined field options
  const earningsOptions = [
    { name: 'basicSalary', label: 'Basic Salary', required: true },
    { name: 'hra', label: 'House Rent Allowance (HRA)', required: true },
    { name: 'transportAllowance', label: 'Transport Allowance', required: false },
    { name: 'medicalAllowance', label: 'Medical Allowance', required: false },
    { name: 'foodAllowance', label: 'Food Allowance', required: false },
    { name: 'communicationAllowance', label: 'Communication Allowance', required: false },
    { name: 'specialAllowance', label: 'Special Allowance', required: false },
    { name: 'otherAllowance', label: 'Other Allowances', required: false },
    { name: 'overtimePay', label: 'Overtime Pay', required: false },
    { name: 'bonus', label: 'Bonus', required: false },
    { name: 'arrears', label: 'Arrears', required: false }
  ];

  const deductionsOptions = [
    { name: 'providentFund', label: 'Provident Fund (PF)', required: true },
    { name: 'esic', label: 'ESI Contribution', required: false },
    { name: 'professionalTax', label: 'Professional Tax', required: true },
    { name: 'tds', label: 'TDS (Income Tax)', required: false },
    { name: 'loanDeduction', label: 'Loan/Advance Deduction', required: false },
    { name: 'medicalPremium', label: 'Medical Insurance', required: false },
    { name: 'nps', label: 'NPS Contribution', required: false },
    { name: 'voluntaryPF', label: 'Voluntary PF', required: false },
    { name: 'otherDeductions', label: 'Other Deductions', required: false }
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await http.get('/payslip-templates');
      if (response.data.success) {
        // API returns: { success: true, data: { templates: [...], pagination: {...} } }
        setTemplates(response.data.data.templates || []);
      }
    } catch (error) {
      console.error('Load templates error:', error);
      enqueueSnackbar('Failed to load templates', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      setLoading(true);
      
      // Build template data structure
      const templateData = {
        name: formData.name,
        description: formData.description,
        version: formData.version,
        isDefault: false,
        isActive: formData.isActive,
        companyInfo: {
          fields: ['name', 'address', 'city', 'state', 'pincode', 'pan', 'tan', 'pfNumber', 'esicNumber'],
          logo: formData.logoEnabled,
          logoPosition: formData.logoPosition,
          showCompanyName: formData.showCompanyName
        },
        employeeInfo: {
          fields: [
            'employeeId', 'name', 'designation', 'department', 'dateOfJoining',
            'panNumber', 'uanNumber', 'pfNumber', 'esiNumber', 'bankAccountNumber', 'bankName'
          ]
        },
        payPeriodInfo: {
          fields: ['payPeriod', 'payPeriodStart', 'payPeriodEnd', 'payDate', 'payslipNumber']
        },
        earnings: {
          title: 'Earnings',
          fields: formData.earnings.map(field => ({
            name: field.name,
            label: field.label,
            type: 'currency',
            required: field.required
          })),
          showTotal: true,
          totalLabel: 'Gross Earnings'
        },
        deductions: {
          title: 'Deductions',
          fields: formData.deductions.map(field => ({
            name: field.name,
            label: field.label,
            type: 'currency',
            required: field.required
          })),
          showTotal: true,
          totalLabel: 'Total Deductions'
        },
        attendance: {
          title: 'Attendance Summary',
          fields: [
            { name: 'totalWorkingDays', label: 'Total Working Days', type: 'number' },
            { name: 'presentDays', label: 'Present Days', type: 'number' },
            { name: 'absentDays', label: 'Absent Days', type: 'number' },
            { name: 'lopDays', label: 'LOP Days', type: 'number' },
            { name: 'paidDays', label: 'Paid Days', type: 'number' },
            { name: 'overtimeHours', label: 'Overtime Hours', type: 'number' }
          ]
        },
        summary: {
          fields: [
            { name: 'grossEarnings', label: 'Gross Earnings', type: 'currency', bold: true },
            { name: 'totalDeductions', label: 'Total Deductions', type: 'currency', bold: true },
            { name: 'netPay', label: 'Net Pay', type: 'currency', bold: true, highlight: true }
          ],
          showInWords: true
        },
        layout: formData.layout || {
          sections: 'standard',
          columnLayout: 'two-column',
          showBorders: true,
          showGridLines: false
        },
        footer: {
          fields: [],
          showDisclaimer: formData.footer?.showDisclaimer !== false,
          disclaimerText: formData.footer?.disclaimerText || 'This is a computer-generated payslip and does not require a signature.',
          showSignatures: formData.footer?.showSignatures !== false,
          showGeneratedDate: formData.footer?.showGeneratedDate !== false,
          showCompanyStamp: formData.footer?.showCompanyStamp || false,
          alignment: formData.footer?.alignment || 'left'
        },
        styling: formData.styling
      };
      
      const response = await http.post('/payslip-templates', templateData);
      
      if (response.data.success) {
        enqueueSnackbar('Template created successfully', { variant: 'success' });
        setCreateDialog(false);
        resetForm();
        loadTemplates();
      }
    } catch (error) {
      console.error('Create template error:', error);
      enqueueSnackbar(
        error.response?.data?.message || 'Failed to create template',
        { variant: 'error' }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTemplate = async () => {
    try {
      setLoading(true);
      
      const response = await http.put(`/payslip-templates/${selectedTemplate.id}`, {
        name: formData.name,
        description: formData.description,
        isActive: formData.isActive
      });
      
      if (response.data.success) {
        enqueueSnackbar('Template updated successfully', { variant: 'success' });
        setEditDialog(false);
        resetForm();
        loadTemplates();
      }
    } catch (error) {
      console.error('Update template error:', error);
      enqueueSnackbar('Failed to update template', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await http.delete(`/payslip-templates/${templateId}`);
      
      if (response.data.success) {
        enqueueSnackbar('Template deleted successfully', { variant: 'success' });
        loadTemplates();
      }
    } catch (error) {
      console.error('Delete template error:', error);
      enqueueSnackbar('Failed to delete template', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateTemplate = async (templateId) => {
    try {
      setLoading(true);
      
      // Get the original template to create a unique name
      const originalTemplate = templates.find(t => t.id === templateId);
      if (!originalTemplate) {
        throw new Error('Template not found');
      }
      
      // Generate unique name with timestamp
      const timestamp = new Date().getTime();
      const newName = `${originalTemplate.name} (Copy ${timestamp})`;
      
      const response = await http.post(`/payslip-templates/${templateId}/duplicate`, {
        name: newName
      });
      
      if (response.data.success) {
        enqueueSnackbar('Template duplicated successfully', { variant: 'success' });
        loadTemplates();
      }
    } catch (error) {
      console.error('Duplicate template error:', error);
      enqueueSnackbar('Failed to duplicate template', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (templateId) => {
    try {
      setLoading(true);
      const response = await http.post(`/payslip-templates/${templateId}/set-default`);
      
      if (response.data.success) {
        enqueueSnackbar('Default template updated', { variant: 'success' });
        loadTemplates();
      }
    } catch (error) {
      console.error('Set default error:', error);
      enqueueSnackbar('Failed to set default template', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (templateId) => {
    try {
      setLoading(true);
      const response = await http.post(`/payslip-templates/${templateId}/toggle-status`);
      
      if (response.data.success) {
        enqueueSnackbar('Template status updated', { variant: 'success' });
        loadTemplates();
      }
    } catch (error) {
      console.error('Toggle status error:', error);
      enqueueSnackbar('Failed to update status', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportTemplate = async (templateId, templateName) => {
    try {
      const response = await http.get(`/payslip-templates/${templateId}`);
      
      if (response.data.success) {
        const templateData = response.data.data;
        const jsonStr = JSON.stringify(templateData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${templateName.replace(/\s+/g, '_')}_template.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        enqueueSnackbar('Template exported successfully', { variant: 'success' });
      }
    } catch (error) {
      console.error('Export template error:', error);
      enqueueSnackbar('Failed to export template', { variant: 'error' });
    }
  };

  const handleOpenCreate = () => {
    resetForm();
    // Set default fields
    setFormData({
      ...formData,
      earnings: earningsOptions.filter(e => e.required),
      deductions: deductionsOptions.filter(d => d.required)
    });
    setCreateDialog(true);
  };

  const handleOpenEdit = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      version: '1.0', // Default version
      isActive: template.isActive,
      // Map from backend structure to frontend structure
      earnings: template.earningsFields || [],
      deductions: template.deductionsFields || [],
      // Extract styling from stored JSON
      styling: template.styling || {
        primaryColor: '#2196F3',
        secondaryColor: '#FFC107',
        fontFamily: 'Arial',
        fontSize: '12px',
        logoWidth: '100px',
        logoHeight: '50px'
      },
      // Logo configuration (if exists)
      logoEnabled: template.styling?.logoEnabled || false,
      logoPosition: template.styling?.logoPosition || 'left',
      showCompanyName: template.styling?.showCompanyName !== false,
      // Layout configuration (if exists)
      layout: template.styling?.layout || {
        sections: 'standard',
        columnLayout: 'two-column',
        showBorders: true,
        showGridLines: false
      },
      // Footer configuration (if exists)
      footer: template.styling?.footer || {
        showDisclaimer: true,
        disclaimerText: 'This is a computer-generated payslip and does not require a signature.',
        showSignatures: true,
        showGeneratedDate: true,
        showCompanyStamp: false,
        alignment: 'left'
      }
    });
    setEditDialog(true);
  };

  const handleOpenView = (template) => {
    setSelectedTemplate(template);
    setViewDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      version: '1.0',
      isActive: true,
      earnings: [],
      deductions: [],
      logoEnabled: true,
      logoPosition: 'left',
      showCompanyName: true,
      layout: {
        sections: 'standard',
        columnLayout: 'two-column',
        showBorders: true,
        showGridLines: false
      },
      footer: {
        showDisclaimer: true,
        disclaimerText: 'This is a computer-generated payslip and does not require a signature.',
        showSignatures: true,
        showGeneratedDate: true,
        showCompanyStamp: false,
        alignment: 'left'
      },
      styling: {
        primaryColor: '#2196F3',
        secondaryColor: '#FFC107',
        fontFamily: 'Arial',
        fontSize: '12px',
        logoWidth: '100px',
        logoHeight: '50px'
      }
    });
    setSelectedTemplate(null);
  };

  const toggleEarningsField = (field) => {
    const exists = formData.earnings.find(e => e.name === field.name);
    if (exists) {
      if (field.required) {
        enqueueSnackbar('This field is required and cannot be removed', { variant: 'warning' });
        return;
      }
      setFormData({
        ...formData,
        earnings: formData.earnings.filter(e => e.name !== field.name)
      });
    } else {
      setFormData({
        ...formData,
        earnings: [...formData.earnings, field]
      });
    }
  };

  const toggleDeductionsField = (field) => {
    const exists = formData.deductions.find(d => d.name === field.name);
    if (exists) {
      if (field.required) {
        enqueueSnackbar('This field is required and cannot be removed', { variant: 'warning' });
        return;
      }
      setFormData({
        ...formData,
        deductions: formData.deductions.filter(d => d.name !== field.name)
      });
    } else {
      setFormData({
        ...formData,
        deductions: [...formData.deductions, field]
      });
    }
  };

  if (!isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">You do not have permission to manage templates.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Payslip Template Manager
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Create and manage payslip templates for your organization
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
        >
          Create Template
        </Button>
      </Box>

      {/* Templates Grid */}
      <Grid container spacing={3}>
        {templates.map((template) => (
          <Grid item xs={12} md={6} lg={4} key={template.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Typography variant="h6" gutterBottom>
                    {template.name}
                  </Typography>
                  <Tooltip title={template.isDefault ? 'Default Template' : 'Set as Default'}>
                    <IconButton
                      size="small"
                      onClick={() => !template.isDefault && handleSetDefault(template.id)}
                      disabled={template.isDefault}
                    >
                      {template.isDefault ? <StarIcon color="primary" /> : <StarBorderIcon />}
                    </IconButton>
                  </Tooltip>
                </Box>
                
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {template.description}
                </Typography>
                
                <Box mt={2} mb={2}>
                  <Chip
                    label={template.isActive ? 'Active' : 'Inactive'}
                    color={template.isActive ? 'success' : 'default'}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={`v${template.version}`}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                
                <Typography variant="caption" color="textSecondary">
                  Created: {new Date(template.createdAt).toLocaleDateString()}
                </Typography>
              </CardContent>
              
              <CardActions>
                <Tooltip title="View Details">
                  <IconButton size="small" onClick={() => handleOpenView(template)}>
                    <PreviewIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => handleOpenEdit(template)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Duplicate">
                  <IconButton size="small" onClick={() => handleDuplicateTemplate(template.id)}>
                    <DuplicateIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Export JSON">
                  <IconButton size="small" onClick={() => handleExportTemplate(template.id, template.name)}>
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={template.isActive ? 'Deactivate' : 'Activate'}>
                  <Switch
                    size="small"
                    checked={template.isActive}
                    onChange={() => handleToggleStatus(template.id)}
                  />
                </Tooltip>
                {!template.isDefault && (
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {templates.length === 0 && !loading && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No templates found
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Create your first payslip template to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
          >
            Create Template
          </Button>
        </Paper>
      )}

      {/* Create Template Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Payslip Template</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Template Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Version"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Earnings Fields ({formData.earnings.length} selected)
              </Typography>
              <List dense>
                {earningsOptions.map((field) => (
                  <ListItem key={field.name}>
                    <Checkbox
                      checked={formData.earnings.some(e => e.name === field.name)}
                      onChange={() => toggleEarningsField(field)}
                      disabled={field.required}
                    />
                    <ListItemText
                      primary={field.label}
                      secondary={field.required ? 'Required' : 'Optional'}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Deductions Fields ({formData.deductions.length} selected)
              </Typography>
              <List dense>
                {deductionsOptions.map((field) => (
                  <ListItem key={field.name}>
                    <Checkbox
                      checked={formData.deductions.some(d => d.name === field.name)}
                      onChange={() => toggleDeductionsField(field)}
                      disabled={field.required}
                    />
                    <ListItemText
                      primary={field.label}
                      secondary={field.required ? 'Required' : 'Optional'}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Company Logo Configuration
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.logoEnabled}
                    onChange={(e) => setFormData({ ...formData, logoEnabled: e.target.checked })}
                  />
                }
                label="Show Company Logo in Payslip Header"
              />
            </Grid>
            
            {formData.logoEnabled && (
              <>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Logo Position</InputLabel>
                    <Select
                      value={formData.logoPosition}
                      onChange={(e) => setFormData({ ...formData, logoPosition: e.target.value })}
                      label="Logo Position"
                    >
                      <MenuItem value="left">Left</MenuItem>
                      <MenuItem value="center">Center</MenuItem>
                      <MenuItem value="right">Right</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.showCompanyName}
                        onChange={(e) => setFormData({ ...formData, showCompanyName: e.target.checked })}
                      />
                    }
                    label="Show Company Name"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Logo Width (e.g., 100px)"
                    value={formData.styling.logoWidth}
                    onChange={(e) => setFormData({
                      ...formData,
                      styling: { ...formData.styling, logoWidth: e.target.value }
                    })}
                    helperText="Recommended: 80px - 150px"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Logo Height (e.g., 50px)"
                    value={formData.styling.logoHeight}
                    onChange={(e) => setFormData({
                      ...formData,
                      styling: { ...formData.styling, logoHeight: e.target.value }
                    })}
                    helperText="Recommended: 40px - 80px"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="caption">
                      <strong>Note:</strong> Upload your company logo in Company Settings. 
                      The logo will be automatically included in generated payslips if enabled.
                      Supported formats: PNG, JPG, SVG (transparent background recommended).
                    </Typography>
                  </Alert>
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Styling
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Primary Color"
                type="color"
                value={formData.styling.primaryColor}
                onChange={(e) => setFormData({
                  ...formData,
                  styling: { ...formData.styling, primaryColor: e.target.value }
                })}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Secondary Color"
                type="color"
                value={formData.styling.secondaryColor}
                onChange={(e) => setFormData({
                  ...formData,
                  styling: { ...formData.styling, secondaryColor: e.target.value }
                })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Layout & Sections
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Section Style</InputLabel>
                <Select
                  value={formData.layout?.sections || 'standard'}
                  onChange={(e) => setFormData({
                    ...formData,
                    layout: { ...formData.layout, sections: e.target.value }
                  })}
                  label="Section Style"
                >
                  <MenuItem value="standard">Standard (Balanced)</MenuItem>
                  <MenuItem value="compact">Compact (Space-saving)</MenuItem>
                  <MenuItem value="detailed">Detailed (Comprehensive)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Column Layout</InputLabel>
                <Select
                  value={formData.layout?.columnLayout || 'two-column'}
                  onChange={(e) => setFormData({
                    ...formData,
                    layout: { ...formData.layout, columnLayout: e.target.value }
                  })}
                  label="Column Layout"
                >
                  <MenuItem value="single-column">Single Column (Full Width)</MenuItem>
                  <MenuItem value="two-column">Two Columns (Side by Side)</MenuItem>
                  <MenuItem value="three-column">Three Columns (Compact)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.layout?.showBorders !== false}
                    onChange={(e) => setFormData({
                      ...formData,
                      layout: { ...formData.layout, showBorders: e.target.checked }
                    })}
                  />
                }
                label="Show Section Borders"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.layout?.showGridLines || false}
                    onChange={(e) => setFormData({
                      ...formData,
                      layout: { ...formData.layout, showGridLines: e.target.checked }
                    })}
                  />
                }
                label="Show Grid Lines"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Footer Configuration
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.footer?.showDisclaimer !== false}
                    onChange={(e) => setFormData({
                      ...formData,
                      footer: { ...formData.footer, showDisclaimer: e.target.checked }
                    })}
                  />
                }
                label="Show Disclaimer Text"
              />
            </Grid>
            
            {formData.footer?.showDisclaimer !== false && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Disclaimer Text"
                  value={formData.footer?.disclaimerText || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    footer: { ...formData.footer, disclaimerText: e.target.value }
                  })}
                  placeholder="This is a computer-generated payslip..."
                />
              </Grid>
            )}
            
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.footer?.showSignatures !== false}
                    onChange={(e) => setFormData({
                      ...formData,
                      footer: { ...formData.footer, showSignatures: e.target.checked }
                    })}
                  />
                }
                label="Show Signature Lines"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.footer?.showGeneratedDate !== false}
                    onChange={(e) => setFormData({
                      ...formData,
                      footer: { ...formData.footer, showGeneratedDate: e.target.checked }
                    })}
                  />
                }
                label="Show Generated Date"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.footer?.showCompanyStamp || false}
                    onChange={(e) => setFormData({
                      ...formData,
                      footer: { ...formData.footer, showCompanyStamp: e.target.checked }
                    })}
                  />
                }
                label="Show Company Stamp"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Footer Alignment</InputLabel>
                <Select
                  value={formData.footer?.alignment || 'left'}
                  onChange={(e) => setFormData({
                    ...formData,
                    footer: { ...formData.footer, alignment: e.target.value }
                  })}
                  label="Footer Alignment"
                >
                  <MenuItem value="left">Left Aligned</MenuItem>
                  <MenuItem value="center">Center Aligned</MenuItem>
                  <MenuItem value="right">Right Aligned</MenuItem>
                  <MenuItem value="justified">Justified</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateTemplate}
            disabled={loading || !formData.name || formData.earnings.length === 0}
          >
            Create Template
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Template</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Template Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Version"
                value={formData.version}
                onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateTemplate} disabled={loading}>
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Template Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Template Details</DialogTitle>
        <DialogContent>
          {selectedTemplate && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedTemplate.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                {selectedTemplate.description}
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Version:</Typography>
                  <Typography variant="body2">{selectedTemplate.version}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Status:</Typography>
                  <Chip
                    label={selectedTemplate.isActive ? 'Active' : 'Inactive'}
                    color={selectedTemplate.isActive ? 'success' : 'default'}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Earnings Fields:</Typography>
                  <Box mt={1}>
                    {selectedTemplate.templateData?.earnings?.fields?.map((field, idx) => (
                      <Chip key={idx} label={field.label} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Deductions Fields:</Typography>
                  <Box mt={1}>
                    {selectedTemplate.templateData?.deductions?.fields?.map((field, idx) => (
                      <Chip key={idx} label={field.label} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PayslipTemplateManager;
