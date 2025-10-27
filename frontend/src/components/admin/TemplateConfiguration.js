import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  Accordion, AccordionSummary, AccordionDetails, Chip, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  Divider, Alert, Tabs, Tab
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon, Add as AddIcon, Delete as DeleteIcon,
  Edit as EditIcon, Save as SaveIcon, Preview as PreviewIcon,
  Download as DownloadIcon, Upload as UploadIcon
} from '@mui/icons-material';
import { DEFAULT_PAYSLIP_TEMPLATE, getAllTemplates, getTemplateById } from '../../config/payslipTemplates';
import { useNotification } from '../../contexts/NotificationContext';

const TemplateConfiguration = () => {
  const { showNotification } = useNotification();
  const [selectedTemplate, setSelectedTemplate] = useState(DEFAULT_PAYSLIP_TEMPLATE);
  const [templates, setTemplates] = useState(getAllTemplates());
  const [editMode, setEditMode] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [openFieldDialog, setOpenFieldDialog] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const [fieldSection, setFieldSection] = useState('earnings');

  // Field form state
  const [fieldForm, setFieldForm] = useState({
    key: '',
    label: '',
    required: false,
    editable: true,
    type: 'currency',
    calculation: 'fixed',
    percentage: 0,
    maxAmount: 0,
    description: ''
  });

  const handleTemplateChange = (templateId) => {
    const template = getTemplateById(templateId);
    setSelectedTemplate(template);
    setEditMode(false);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAddField = (section) => {
    setFieldSection(section);
    setFieldForm({
      key: '',
      label: '',
      required: false,
      editable: true,
      type: 'currency',
      calculation: 'fixed',
      percentage: 0,
      maxAmount: 0,
      description: ''
    });
    setCurrentField(null);
    setOpenFieldDialog(true);
  };

  const handleEditField = (field, section) => {
    setFieldSection(section);
    setFieldForm({ ...field });
    setCurrentField(field);
    setOpenFieldDialog(true);
  };

  const handleSaveField = () => {
    if (!fieldForm.key || !fieldForm.label) {
      showNotification('Field key and label are required', 'error');
      return;
    }

    const updatedTemplate = { ...selectedTemplate };
    const sectionFields = [...updatedTemplate.structure[fieldSection].fields];

    if (currentField) {
      // Edit existing field
      const index = sectionFields.findIndex(f => f.key === currentField.key);
      if (index >= 0) {
        sectionFields[index] = { ...fieldForm };
      }
    } else {
      // Add new field
      if (sectionFields.find(f => f.key === fieldForm.key)) {
        showNotification('Field key already exists', 'error');
        return;
      }
      sectionFields.push({ ...fieldForm });
    }

    updatedTemplate.structure[fieldSection].fields = sectionFields;
    setSelectedTemplate(updatedTemplate);
    setOpenFieldDialog(false);
    showNotification('Field saved successfully', 'success');
  };

  const handleDeleteField = (fieldKey, section) => {
    const updatedTemplate = { ...selectedTemplate };
    updatedTemplate.structure[section].fields = updatedTemplate.structure[section].fields
      .filter(f => f.key !== fieldKey);
    setSelectedTemplate(updatedTemplate);
    showNotification('Field deleted successfully', 'success');
  };

  const handleSaveTemplate = async () => {
    try {
      // Here you would save to backend
      // await templateService.saveTemplate(selectedTemplate);
      showNotification('Template saved successfully', 'success');
      setEditMode(false);
    } catch (error) {
      showNotification('Failed to save template', 'error');
    }
  };

  const handleExportTemplate = () => {
    const dataStr = JSON.stringify(selectedTemplate, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${selectedTemplate.id}_template.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportTemplate = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedTemplate = JSON.parse(e.target.result);
          setSelectedTemplate(importedTemplate);
          showNotification('Template imported successfully', 'success');
        } catch (error) {
          showNotification('Invalid template file', 'error');
        }
      };
      reader.readAsText(file);
    }
  };

  const renderFieldsTable = (fields, section) => (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Key</TableCell>
            <TableCell>Label</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Calculation</TableCell>
            <TableCell>Required</TableCell>
            <TableCell>Editable</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {fields.map((field) => (
            <TableRow key={field.key}>
              <TableCell>{field.key}</TableCell>
              <TableCell>{field.label}</TableCell>
              <TableCell>{field.type || 'currency'}</TableCell>
              <TableCell>
                {field.calculation}
                {field.percentage && ` (${field.percentage}%)`}
              </TableCell>
              <TableCell>
                <Chip 
                  label={field.required ? 'Yes' : 'No'} 
                  color={field.required ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Chip 
                  label={field.editable ? 'Yes' : 'No'} 
                  color={field.editable ? 'primary' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <IconButton 
                  size="small" 
                  onClick={() => handleEditField(field, section)}
                  disabled={!editMode}
                >
                  <EditIcon />
                </IconButton>
                <IconButton 
                  size="small" 
                  onClick={() => handleDeleteField(field.key, section)}
                  disabled={!editMode}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Payslip Template Configuration
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Select Template</InputLabel>
                <Select
                  value={selectedTemplate.id}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  label="Select Template"
                >
                  {templates.map((template) => (
                    <MenuItem key={template.id} value={template.id}>
                      {template.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant={editMode ? "contained" : "outlined"}
                  onClick={() => setEditMode(!editMode)}
                >
                  {editMode ? 'Exit Edit Mode' : 'Edit Template'}
                </Button>
                {editMode && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveTemplate}
                  >
                    Save Template
                  </Button>
                )}
                <Button
                  variant="outlined"
                  startIcon={<PreviewIcon />}
                  onClick={() => {/* Open preview dialog */}}
                >
                  Preview
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportTemplate}
                >
                  Export
                </Button>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                >
                  Import
                  <input
                    type="file"
                    hidden
                    accept=".json"
                    onChange={handleImportTemplate}
                  />
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Basic Info" />
        <Tab label="Company Info" />
        <Tab label="Earnings Fields" />
        <Tab label="Deductions Fields" />
        <Tab label="Calculations" />
        <Tab label="Validation Rules" />
      </Tabs>

      {/* Basic Info Tab */}
      {tabValue === 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Template Information</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Template ID"
                  value={selectedTemplate.id}
                  disabled={!editMode}
                  onChange={(e) => setSelectedTemplate({
                    ...selectedTemplate,
                    id: e.target.value
                  })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Template Name"
                  value={selectedTemplate.name}
                  disabled={!editMode}
                  onChange={(e) => setSelectedTemplate({
                    ...selectedTemplate,
                    name: e.target.value
                  })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Version"
                  value={selectedTemplate.version}
                  disabled={!editMode}
                  onChange={(e) => setSelectedTemplate({
                    ...selectedTemplate,
                    version: e.target.value
                  })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedTemplate.isActive}
                      disabled={!editMode}
                      onChange={(e) => setSelectedTemplate({
                        ...selectedTemplate,
                        isActive: e.target.checked
                      })}
                    />
                  }
                  label="Active Template"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Company Info Tab */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Company Information</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Company Name"
                  value={selectedTemplate.companyInfo.name}
                  disabled={!editMode}
                  onChange={(e) => setSelectedTemplate({
                    ...selectedTemplate,
                    companyInfo: {
                      ...selectedTemplate.companyInfo,
                      name: e.target.value
                    }
                  })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Address"
                  value={selectedTemplate.companyInfo.address}
                  disabled={!editMode}
                  onChange={(e) => setSelectedTemplate({
                    ...selectedTemplate,
                    companyInfo: {
                      ...selectedTemplate.companyInfo,
                      address: e.target.value
                    }
                  })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={selectedTemplate.companyInfo.email}
                  disabled={!editMode}
                  onChange={(e) => setSelectedTemplate({
                    ...selectedTemplate,
                    companyInfo: {
                      ...selectedTemplate.companyInfo,
                      email: e.target.value
                    }
                  })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Contact"
                  value={selectedTemplate.companyInfo.contact}
                  disabled={!editMode}
                  onChange={(e) => setSelectedTemplate({
                    ...selectedTemplate,
                    companyInfo: {
                      ...selectedTemplate.companyInfo,
                      contact: e.target.value
                    }
                  })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Website"
                  value={selectedTemplate.companyInfo.website}
                  disabled={!editMode}
                  onChange={(e) => setSelectedTemplate({
                    ...selectedTemplate,
                    companyInfo: {
                      ...selectedTemplate.companyInfo,
                      website: e.target.value
                    }
                  })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="GST Number"
                  value={selectedTemplate.companyInfo.gst || ''}
                  disabled={!editMode}
                  onChange={(e) => setSelectedTemplate({
                    ...selectedTemplate,
                    companyInfo: {
                      ...selectedTemplate.companyInfo,
                      gst: e.target.value
                    }
                  })}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Earnings Fields Tab */}
      {tabValue === 2 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Earnings Fields</Typography>
              {editMode && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleAddField('earnings')}
                >
                  Add Field
                </Button>
              )}
            </Box>
            {renderFieldsTable(selectedTemplate.structure.earnings.fields, 'earnings')}
          </CardContent>
        </Card>
      )}

      {/* Deductions Fields Tab */}
      {tabValue === 3 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Deductions Fields</Typography>
              {editMode && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleAddField('deductions')}
                >
                  Add Field
                </Button>
              )}
            </Box>
            {renderFieldsTable(selectedTemplate.structure.deductions.fields, 'deductions')}
          </CardContent>
        </Card>
      )}

      {/* Calculations Tab */}
      {tabValue === 4 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Calculation Rules</Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              These formulas are used for automatic calculations. You can modify them to suit your organization's requirements.
            </Alert>
            {Object.entries(selectedTemplate.calculations).map(([key, calc]) => (
              <Accordion key={key}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>{key}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Formula"
                        value={calc.formula}
                        disabled={!editMode}
                        helperText={calc.description}
                      />
                    </Grid>
                    {calc.condition && (
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Condition"
                          value={calc.condition}
                          disabled={!editMode}
                          helperText="Condition when this formula applies"
                        />
                      </Grid>
                    )}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Validation Rules Tab */}
      {tabValue === 5 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Validation Rules</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Field</TableCell>
                    <TableCell>Rule</TableCell>
                    <TableCell>Value/Condition</TableCell>
                    <TableCell>Message</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedTemplate.validation.rules.map((rule, index) => (
                    <TableRow key={index}>
                      <TableCell>{rule.field}</TableCell>
                      <TableCell>{rule.rule}</TableCell>
                      <TableCell>
                        {rule.value !== undefined && rule.value}
                        {rule.min !== undefined && `${rule.min} - ${rule.max}`}
                        {rule.compareField && rule.compareField}
                      </TableCell>
                      <TableCell>{rule.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Field Dialog */}
      <Dialog open={openFieldDialog} onClose={() => setOpenFieldDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentField ? 'Edit Field' : 'Add New Field'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Field Key"
                value={fieldForm.key}
                onChange={(e) => setFieldForm({ ...fieldForm, key: e.target.value })}
                disabled={!!currentField}
                helperText="Unique identifier for this field"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Display Label"
                value={fieldForm.label}
                onChange={(e) => setFieldForm({ ...fieldForm, label: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Field Type</InputLabel>
                <Select
                  value={fieldForm.type}
                  onChange={(e) => setFieldForm({ ...fieldForm, type: e.target.value })}
                  label="Field Type"
                >
                  <MenuItem value="currency">Currency</MenuItem>
                  <MenuItem value="number">Number</MenuItem>
                  <MenuItem value="text">Text</MenuItem>
                  <MenuItem value="date">Date</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Calculation Type</InputLabel>
                <Select
                  value={fieldForm.calculation}
                  onChange={(e) => setFieldForm({ ...fieldForm, calculation: e.target.value })}
                  label="Calculation Type"
                >
                  <MenuItem value="fixed">Fixed Amount</MenuItem>
                  <MenuItem value="percentage">Percentage</MenuItem>
                  <MenuItem value="formula">Formula</MenuItem>
                  <MenuItem value="variable">Variable</MenuItem>
                  <MenuItem value="slab">Slab Based</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {fieldForm.calculation === 'percentage' && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Percentage"
                  type="number"
                  value={fieldForm.percentage}
                  onChange={(e) => setFieldForm({ ...fieldForm, percentage: parseFloat(e.target.value) || 0 })}
                />
              </Grid>
            )}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Max Amount"
                type="number"
                value={fieldForm.maxAmount}
                onChange={(e) => setFieldForm({ ...fieldForm, maxAmount: parseFloat(e.target.value) || 0 })}
                helperText="Maximum amount for this field (0 for no limit)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={fieldForm.description}
                onChange={(e) => setFieldForm({ ...fieldForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={fieldForm.required}
                    onChange={(e) => setFieldForm({ ...fieldForm, required: e.target.checked })}
                  />
                }
                label="Required Field"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={fieldForm.editable}
                    onChange={(e) => setFieldForm({ ...fieldForm, editable: e.target.checked })}
                  />
                }
                label="Editable"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFieldDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveField} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TemplateConfiguration;