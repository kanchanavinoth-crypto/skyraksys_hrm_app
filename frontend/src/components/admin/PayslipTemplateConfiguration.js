import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Preview as PreviewIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useAuth } from '../../contexts/AuthContext';
import { useLoading } from '../../contexts/LoadingContext';
import { useNotification } from '../../contexts/NotificationContext';
import { payrollService } from '../../services/payroll.service';

const PayslipTemplateConfiguration = () => {
  const { user } = useAuth();
  const { isLoading, setLoading } = useLoading();
  const { showNotification } = useNotification();

  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateDialog, setTemplateDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    isDefault: false,
    headerFields: [],
    earningsFields: [],
    deductionsFields: [],
    footerFields: [],
    styling: {
      fontFamily: 'Arial',
      fontSize: '12px',
      headerColor: '#1976d2',
      backgroundColor: '#ffffff'
    }
  });

  // Available payslip fields
  const availableFields = {
    header: [
      { id: 'companyName', label: 'Company Name', type: 'text' },
      { id: 'companyAddress', label: 'Company Address', type: 'text' },
      { id: 'payPeriod', label: 'Pay Period', type: 'text' },
      { id: 'employeeName', label: 'Employee Name', type: 'text' },
      { id: 'employeeId', label: 'Employee ID', type: 'text' },
      { id: 'department', label: 'Department', type: 'text' },
      { id: 'position', label: 'Position', type: 'text' },
      { id: 'bankAccount', label: 'Bank Account', type: 'text' }
    ],
    earnings: [
      { id: 'basicSalary', label: 'Basic Salary', type: 'currency' },
      { id: 'hra', label: 'House Rent Allowance', type: 'currency' },
      { id: 'allowances', label: 'Other Allowances', type: 'currency' },
      { id: 'overtimePay', label: 'Overtime Pay', type: 'currency' },
      { id: 'bonus', label: 'Bonus', type: 'currency' },
      { id: 'grossSalary', label: 'Gross Salary', type: 'currency', calculated: true }
    ],
    deductions: [
      { id: 'pfContribution', label: 'PF Contribution', type: 'currency' },
      { id: 'tds', label: 'TDS', type: 'currency' },
      { id: 'professionalTax', label: 'Professional Tax', type: 'currency' },
      { id: 'otherDeductions', label: 'Other Deductions', type: 'currency' },
      { id: 'totalDeductions', label: 'Total Deductions', type: 'currency', calculated: true }
    ],
    footer: [
      { id: 'netSalary', label: 'Net Salary', type: 'currency', calculated: true },
      { id: 'workingDays', label: 'Working Days', type: 'number' },
      { id: 'actualWorkingDays', label: 'Actual Working Days', type: 'number' },
      { id: 'leavesTaken', label: 'Leaves Taken', type: 'number' },
      { id: 'generatedDate', label: 'Generated Date', type: 'date' },
      { id: 'signature', label: 'Authorized Signature', type: 'text' }
    ]
  };

  // Load existing templates
  const loadTemplates = useCallback(async () => {
    setLoading('load-templates', true);
    try {
      const response = await payrollService.getPayslipTemplates();
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
      showNotification('Failed to load payslip templates', 'error');
    } finally {
      setLoading('load-templates', false);
    }
  }, [setLoading, showNotification]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleCreateTemplate = () => {
    setTemplateForm({
      name: '',
      description: '',
      isDefault: false,
      headerFields: [],
      earningsFields: [],
      deductionsFields: [],
      footerFields: [],
      styling: {
        fontFamily: 'Arial',
        fontSize: '12px',
        headerColor: '#1976d2',
        backgroundColor: '#ffffff'
      }
    });
    setSelectedTemplate(null);
    setTemplateDialog(true);
  };

  const handleEditTemplate = (template) => {
    setTemplateForm(template);
    setSelectedTemplate(template);
    setTemplateDialog(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim()) {
      showNotification('Template name is required', 'warning');
      return;
    }

    setLoading('save-template', true);
    try {
      if (selectedTemplate) {
        await payrollService.updatePayslipTemplate(selectedTemplate.id, templateForm);
        showNotification('Template updated successfully', 'success');
      } else {
        await payrollService.createPayslipTemplate(templateForm);
        showNotification('Template created successfully', 'success');
      }
      
      setTemplateDialog(false);
      loadTemplates();
    } catch (error) {
      console.error('Failed to save template:', error);
      showNotification('Failed to save template', 'error');
    } finally {
      setLoading('save-template', false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    setLoading('delete-template', true);
    try {
      await payrollService.deletePayslipTemplate(templateId);
      showNotification('Template deleted successfully', 'success');
      loadTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      showNotification('Failed to delete template', 'error');
    } finally {
      setLoading('delete-template', false);
    }
  };

  const handleSetDefaultTemplate = async (templateId) => {
    setLoading('set-default', true);
    try {
      await payrollService.setDefaultPayslipTemplate(templateId);
      showNotification('Default template set successfully', 'success');
      loadTemplates();
    } catch (error) {
      console.error('Failed to set default template:', error);
      showNotification('Failed to set default template', 'error');
    } finally {
      setLoading('set-default', false);
    }
  };

  const addFieldToSection = (section, field) => {
    setTemplateForm(prev => ({
      ...prev,
      [`${section}Fields`]: [...prev[`${section}Fields`], { ...field, id: Date.now() }]
    }));
  };

  const removeFieldFromSection = (section, fieldIndex) => {
    setTemplateForm(prev => ({
      ...prev,
      [`${section}Fields`]: prev[`${section}Fields`].filter((_, index) => index !== fieldIndex)
    }));
  };

  const handleDragEnd = (result, section) => {
    if (!result.destination) return;

    const items = Array.from(templateForm[`${section}Fields`]);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setTemplateForm(prev => ({
      ...prev,
      [`${section}Fields`]: items
    }));
  };

  const renderFieldSection = (section, title, availableFields) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        
        {/* Available Fields */}
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Available Fields:
        </Typography>
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {availableFields.map(field => (
            <Button
              key={field.id}
              size="small"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => addFieldToSection(section, field)}
              disabled={templateForm[`${section}Fields`].some(f => f.id === field.id)}
            >
              {field.label}
            </Button>
          ))}
        </Box>

        {/* Selected Fields */}
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Selected Fields:
        </Typography>
        <DragDropContext onDragEnd={(result) => handleDragEnd(result, section)}>
          <Droppable droppableId={section}>
            {(provided) => (
              <List {...provided.droppableProps} ref={provided.innerRef}>
                {templateForm[`${section}Fields`].map((field, index) => (
                  <Draggable key={field.id} draggableId={field.id.toString()} index={index}>
                    {(provided) => (
                      <ListItem
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        sx={{ border: 1, borderColor: 'grey.300', mb: 1, borderRadius: 1 }}
                      >
                        <Box {...provided.dragHandleProps}>
                          <DragIcon />
                        </Box>
                        <ListItemText primary={field.label} secondary={`Type: ${field.type}`} />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => removeFieldFromSection(section, index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </List>
            )}
          </Droppable>
        </DragDropContext>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Payslip Template Configuration
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateTemplate}
        >
          Create Template
        </Button>
      </Box>

      {/* Templates List */}
      <Grid container spacing={3}>
        {templates.map((template) => (
          <Grid item xs={12} md={6} lg={4} key={template.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Typography variant="h6">
                    {template.name}
                  </Typography>
                  {template.isDefault && (
                    <Alert severity="success" sx={{ py: 0 }}>
                      Default
                    </Alert>
                  )}
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {template.description}
                </Typography>

                <Typography variant="caption" display="block" gutterBottom>
                  Fields: {(template.headerFields?.length || 0) + 
                          (template.earningsFields?.length || 0) + 
                          (template.deductionsFields?.length || 0) + 
                          (template.footerFields?.length || 0)} total
                </Typography>

                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleEditTemplate(template)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    startIcon={<PreviewIcon />}
                    onClick={() => {
                      setSelectedTemplate(template);
                      setPreviewDialog(true);
                    }}
                  >
                    Preview
                  </Button>
                  {!template.isDefault && (
                    <>
                      <Button
                        size="small"
                        onClick={() => handleSetDefaultTemplate(template.id)}
                      >
                        Set Default
                      </Button>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Template Editor Dialog */}
      <Dialog open={templateDialog} onClose={() => setTemplateDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {selectedTemplate ? 'Edit Template' : 'Create Template'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Template Name"
                value={templateForm.name}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Description"
                value={templateForm.description}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                margin="normal"
                multiline
                rows={2}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={templateForm.isDefault}
                    onChange={(e) => setTemplateForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                  />
                }
                label="Set as Default Template"
              />
            </Grid>

            {/* Styling Options */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Styling Options
              </Typography>
              <FormControl fullWidth margin="normal">
                <InputLabel>Font Family</InputLabel>
                <Select
                  value={templateForm.styling.fontFamily}
                  onChange={(e) => setTemplateForm(prev => ({
                    ...prev,
                    styling: { ...prev.styling, fontFamily: e.target.value }
                  }))}
                >
                  <MenuItem value="Arial">Arial</MenuItem>
                  <MenuItem value="Times New Roman">Times New Roman</MenuItem>
                  <MenuItem value="Helvetica">Helvetica</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Font Size"
                value={templateForm.styling.fontSize}
                onChange={(e) => setTemplateForm(prev => ({
                  ...prev,
                  styling: { ...prev.styling, fontSize: e.target.value }
                }))}
                margin="normal"
              />
              <TextField
                fullWidth
                label="Header Color"
                type="color"
                value={templateForm.styling.headerColor}
                onChange={(e) => setTemplateForm(prev => ({
                  ...prev,
                  styling: { ...prev.styling, headerColor: e.target.value }
                }))}
                margin="normal"
              />
            </Grid>

            {/* Field Sections */}
            <Grid item xs={12}>
              {renderFieldSection('header', 'Header Fields', availableFields.header)}
              {renderFieldSection('earnings', 'Earnings Fields', availableFields.earnings)}
              {renderFieldSection('deductions', 'Deductions Fields', availableFields.deductions)}
              {renderFieldSection('footer', 'Footer Fields', availableFields.footer)}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveTemplate}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={isLoading('save-template')}
          >
            {isLoading('save-template') ? 'Saving...' : 'Save Template'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog} onClose={() => setPreviewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Template Preview</DialogTitle>
        <DialogContent>
          {selectedTemplate && (
            <Paper sx={{ p: 3, minHeight: 400 }}>
              <Typography variant="h6" align="center" gutterBottom>
                Payslip Preview - {selectedTemplate.name}
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              {/* Header Fields */}
              {selectedTemplate.headerFields?.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>Header Information</Typography>
                  <Grid container spacing={2}>
                    {selectedTemplate.headerFields.map((field, index) => (
                      <Grid item xs={6} key={index}>
                        <Typography variant="body2">
                          <strong>{field.label}:</strong> [Sample Data]
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Earnings Fields */}
              {selectedTemplate.earningsFields?.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>Earnings</Typography>
                  {selectedTemplate.earningsFields.map((field, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{field.label}</Typography>
                      <Typography variant="body2">₹ 0.00</Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Deductions Fields */}
              {selectedTemplate.deductionsFields?.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>Deductions</Typography>
                  {selectedTemplate.deductionsFields.map((field, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{field.label}</Typography>
                      <Typography variant="body2">₹ 0.00</Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Footer Fields */}
              {selectedTemplate.footerFields?.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>Summary</Typography>
                  {selectedTemplate.footerFields.map((field, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{field.label}</Typography>
                      <Typography variant="body2">[Sample Data]</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default React.memo(PayslipTemplateConfiguration);
