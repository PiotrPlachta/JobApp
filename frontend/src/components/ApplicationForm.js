import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Grid,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip
} from '@mui/material';
import { ExpandMore, ExpandLess, Info } from '@mui/icons-material';
import axios from 'axios';

const ApplicationForm = ({ onApplicationAdded }) => {
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    salary: '',
    salary_amount: 0,
    salary_currency: 'PLN',
    salary_type: 'yearly',
    url: '',
    date_posted: '',
    date_applied: new Date().toISOString().split('T')[0],
    cv_path: '',
    status: 'Applied',
    notes: ''
  });
  
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [statusOptions, setStatusOptions] = useState(['Applied']);
  const [currencyOptions, setCurrencyOptions] = useState(['PLN', 'EUR', 'USD', 'GBP']);
  const [salaryTypeOptions, setSalaryTypeOptions] = useState(['hourly', 'monthly', 'yearly']);
  const [expanded, setExpanded] = useState(false);
  const [salaryCalculation, setSalaryCalculation] = useState(null);
  const [calculatingConversion, setCalculatingConversion] = useState(false);

  // Fetch available options when component mounts
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Fetch status options
        const statusResponse = await axios.get('http://localhost:5000/api/application-statuses');
        setStatusOptions(statusResponse.data);
        
        // Fetch currency options
        const currencyResponse = await axios.get('http://localhost:5000/api/salary-currencies');
        setCurrencyOptions(currencyResponse.data);
        
        // Fetch salary type options
        const typeResponse = await axios.get('http://localhost:5000/api/salary-types');
        setSalaryTypeOptions(typeResponse.data);
      } catch (error) {
        console.error('Error fetching options:', error);
      }
    };
    
    fetchOptions();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Reset salary calculation when any salary-related field changes
    if (['salary_amount', 'salary_currency', 'salary_type'].includes(name)) {
      setSalaryCalculation(null);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
      // Just store the file name for now
      setFormData({ ...formData, cv_path: e.target.files[0].name });
    }
  };

  const analyzeUrl = async () => {
    if (!formData.url) return;
    
    setAnalyzing(true);
    try {
      const response = await axios.post('http://localhost:5000/api/analyze-url', {
        url: formData.url
      });
      
      // Update form with analyzed data
      setFormData({
        ...formData,
        company: response.data.company || formData.company,
        role: response.data.role || formData.role,
        salary: response.data.salary || formData.salary,
        salary_amount: response.data.salary_amount || formData.salary_amount,
        salary_currency: response.data.salary_currency || formData.salary_currency,
        salary_type: response.data.salary_type || formData.salary_type,
        date_posted: response.data.date_posted || formData.date_posted
      });
      
      // Calculate salary conversion
      if (response.data.salary_amount > 0) {
        calculateSalary(response.data.salary_amount, response.data.salary_currency, response.data.salary_type);
      }
    } catch (error) {
      console.error('Error analyzing URL:', error);
      alert('Failed to analyze the URL. Please fill in the details manually.');
    } finally {
      setAnalyzing(false);
    }
  };

  const calculateSalary = async (amount, currency, type) => {
    if (!amount || amount <= 0) {
      setSalaryCalculation(null);
      return;
    }
    
    setCalculatingConversion(true);
    try {
      const response = await axios.post('http://localhost:5000/api/calculate-yearly-salary', {
        amount: amount,
        currency: currency,
        type: type
      });
      
      setSalaryCalculation(response.data);
    } catch (error) {
      console.error('Error calculating salary:', error);
      alert('Failed to calculate salary conversion.');
    } finally {
      setCalculatingConversion(false);
    }
  };

  const handleCalculateSalary = () => {
    calculateSalary(formData.salary_amount, formData.salary_currency, formData.salary_type);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    
    try {
      const response = await axios.post('http://localhost:5000/api/applications', formData);
      
      // Reset form
      setFormData({
        company: '',
        role: '',
        salary: '',
        salary_amount: 0,
        salary_currency: 'PLN',
        salary_type: 'yearly',
        url: '',
        date_posted: '',
        date_applied: new Date().toISOString().split('T')[0],
        cv_path: '',
        status: 'Applied',
        notes: ''
      });
      setFile(null);
      setSalaryCalculation(null);
      
      // Notify parent component
      if (onApplicationAdded) {
        onApplicationAdded(response.data);
      }
      
      alert('Application saved successfully!');
      setExpanded(false);
    } catch (error) {
      console.error('Error saving application:', error);
      alert('Failed to save the application. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  // Format currency values for display
  const formatCurrency = (value, currency) => {
    if (value === null || value === undefined) return '-';
    
    const formatter = new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    
    return formatter.format(value);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2">
          Add New Job Application
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={expanded ? <ExpandLess /> : <ExpandMore />}
          onClick={toggleExpanded}
        >
          {expanded ? 'Hide Form' : 'Show Form'}
        </Button>
      </Box>
      
      <Collapse in={expanded} timeout="auto">
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Job URL"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                margin="normal"
                helperText="Enter the job posting URL to auto-fill details"
              />
              <Button
                variant="outlined"
                onClick={analyzeUrl}
                disabled={!formData.url || analyzing}
                sx={{ mt: 1 }}
              >
                {analyzing ? <CircularProgress size={24} /> : 'Analyze URL'}
              </Button>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Company"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Salary Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Salary Amount"
                    name="salary_amount"
                    type="number"
                    value={formData.salary_amount}
                    onChange={handleInputChange}
                    margin="normal"
                    InputProps={{ inputProps: { min: 0 } }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="currency-label">Currency</InputLabel>
                    <Select
                      labelId="currency-label"
                      name="salary_currency"
                      value={formData.salary_currency}
                      onChange={handleInputChange}
                      label="Currency"
                    >
                      {currencyOptions.map((currency) => (
                        <MenuItem key={currency} value={currency}>
                          {currency}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="salary-type-label">Salary Type</InputLabel>
                    <Select
                      labelId="salary-type-label"
                      name="salary_type"
                      value={formData.salary_type}
                      onChange={handleInputChange}
                      label="Salary Type"
                    >
                      {salaryTypeOptions.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    onClick={handleCalculateSalary}
                    disabled={!formData.salary_amount || calculatingConversion}
                    sx={{ mt: 1 }}
                  >
                    {calculatingConversion ? <CircularProgress size={24} /> : 'Calculate Equivalent Salaries'}
                  </Button>
                </Grid>
                
                {salaryCalculation && (
                  <Grid item xs={12}>
                    <TableContainer component={Paper} sx={{ mt: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Period</TableCell>
                            <TableCell>PLN</TableCell>
                            <TableCell>EUR</TableCell>
                            <TableCell>USD</TableCell>
                            <TableCell>GBP</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell>Yearly</TableCell>
                            <TableCell>{formatCurrency(salaryCalculation.yearly.PLN, 'PLN')}</TableCell>
                            <TableCell>{formatCurrency(salaryCalculation.yearly.EUR, 'EUR')}</TableCell>
                            <TableCell>{formatCurrency(salaryCalculation.yearly.USD, 'USD')}</TableCell>
                            <TableCell>{formatCurrency(salaryCalculation.yearly.GBP, 'GBP')}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Monthly</TableCell>
                            <TableCell>{formatCurrency(salaryCalculation.monthly.PLN, 'PLN')}</TableCell>
                            <TableCell>{formatCurrency(salaryCalculation.monthly.EUR, 'EUR')}</TableCell>
                            <TableCell>{formatCurrency(salaryCalculation.monthly.USD, 'USD')}</TableCell>
                            <TableCell>{formatCurrency(salaryCalculation.monthly.GBP, 'GBP')}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Hourly</TableCell>
                            <TableCell>{formatCurrency(salaryCalculation.hourly.PLN, 'PLN')}</TableCell>
                            <TableCell>{formatCurrency(salaryCalculation.hourly.EUR, 'EUR')}</TableCell>
                            <TableCell>{formatCurrency(salaryCalculation.hourly.USD, 'USD')}</TableCell>
                            <TableCell>{formatCurrency(salaryCalculation.hourly.GBP, 'GBP')}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Info fontSize="small" sx={{ mr: 0.5 }} />
                      Calculations assume 40-hour work weeks and are based on current exchange rates.
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date Posted"
                name="date_posted"
                type="date"
                value={formData.date_posted}
                onChange={handleInputChange}
                margin="normal"
                InputLabelProps={{ shrink: true }}
                helperText="Optional"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Date Applied"
                name="date_applied"
                type="date"
                value={formData.date_applied}
                onChange={handleInputChange}
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="status-label">Application Status</InputLabel>
                <Select
                  labelId="status-label"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  label="Application Status"
                >
                  {statusOptions.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                margin="normal"
                multiline
                rows={3}
                helperText="Add any notes about this application"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  CV/Resume File
                </Typography>
                <input
                  accept=".pdf,.doc,.docx"
                  style={{ display: 'none' }}
                  id="cv-file-input"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="cv-file-input">
                  <Button variant="contained" component="span">
                    Select CV File
                  </Button>
                </label>
                {file && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Selected file: {file.name}
                  </Typography>
                )}
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={submitLoading}
                sx={{ mt: 2 }}
              >
                {submitLoading ? <CircularProgress size={24} /> : 'Save Application'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default ApplicationForm;
