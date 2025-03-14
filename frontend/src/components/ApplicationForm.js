import React, { useState, useEffect } from 'react';
import { 
  Button, TextField, Grid, Typography, Paper, 
  MenuItem, Select, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, IconButton, Collapse,
  Box, CircularProgress, Alert, Input
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import axios from 'axios';

const ApplicationForm = ({ onSubmit, initialData }) => {
  // Form state
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
    cover_letter_path: '',
    status: 'Applied',
    notes: ''
  });

  // UI state
  const [expanded, setExpanded] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [salaryTypes, setSalaryTypes] = useState([]);
  const [salaryResults, setSalaryResults] = useState(null);
  const [showSalaryResults, setShowSalaryResults] = useState(false);
  
  // URL analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);

  // File upload state
  const [cvUploading, setCvUploading] = useState(false);
  const [coverLetterUploading, setCoverLetterUploading] = useState(false);
  const [cvFileName, setCvFileName] = useState('');
  const [coverLetterFileName, setCoverLetterFileName] = useState('');
  const [fileUploadError, setFileUploadError] = useState(null);

  useEffect(() => {
    // Initialize form with initial data if provided
    if (initialData) {
      setFormData(initialData);
      // Set file names from paths if available
      if (initialData.cv_path) {
        setCvFileName(initialData.cv_path.split('/').pop());
      }
      if (initialData.cover_letter_path) {
        setCoverLetterFileName(initialData.cover_letter_path.split('/').pop());
      }
    }

    // Fetch application statuses
    axios.get('http://localhost:5000/api/application-statuses')
      .then(response => setStatuses(response.data))
      .catch(error => console.error('Error fetching statuses:', error));
    
    // Fetch salary currencies
    axios.get('http://localhost:5000/api/salary-currencies')
      .then(response => setCurrencies(response.data))
      .catch(error => console.error('Error fetching currencies:', error));
    
    // Fetch salary types
    axios.get('http://localhost:5000/api/salary-types')
      .then(response => setSalaryTypes(response.data))
      .catch(error => console.error('Error fetching salary types:', error));
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (typeof onSubmit === 'function') {
      onSubmit(formData);
    } else {
      console.error('onSubmit is not a function');
    }
  };

  const calculateSalary = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/calculate-yearly-salary', {
        amount: formData.salary_amount,
        currency: formData.salary_currency,
        type: formData.salary_type
      });
      
      setSalaryResults(response.data);
      setShowSalaryResults(true);
    } catch (error) {
      console.error('Error calculating salary:', error);
    }
  };

  const analyzeJobUrl = async () => {
    if (!formData.url) {
      setAnalysisError('Please enter a URL to analyze');
      return;
    }
    
    setAnalyzing(true);
    setAnalysisError(null);
    
    try {
      const response = await axios.post('http://localhost:5000/api/analyze-url', {
        url: formData.url
      });
      
      // Check if there's an error in the response
      if (response.data.error) {
        setAnalysisError(response.data.error);
      } else if (response.data.error_message) {
        setAnalysisError(response.data.error_message);
      } else {
        // Update form with analysis results
        setFormData(prevData => ({
          ...prevData,
          company: response.data.company || prevData.company,
          role: response.data.role || prevData.role,
          salary: response.data.salary || prevData.salary,
          salary_amount: response.data.salary_amount || prevData.salary_amount,
          salary_currency: response.data.salary_currency || prevData.salary_currency,
          salary_type: response.data.salary_type || prevData.salary_type,
          date_posted: response.data.date_posted || prevData.date_posted
        }));
        
        // If we have salary information, calculate equivalents
        if (response.data.salary_amount > 0) {
          const salaryResponse = await axios.post('http://localhost:5000/api/calculate-yearly-salary', {
            amount: response.data.salary_amount,
            currency: response.data.salary_currency,
            type: response.data.salary_type
          });
          
          setSalaryResults(salaryResponse.data);
          setShowSalaryResults(true);
        }
      }
    } catch (error) {
      console.error('Error analyzing URL:', error);
      setAnalysisError('Failed to analyze URL. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileUpload = async (event, fileType) => {
    const file = event.target.files[0];
    if (!file) return;

    // Set uploading state
    if (fileType === 'cv') {
      setCvUploading(true);
      setCvFileName(file.name);
    } else {
      setCoverLetterUploading(true);
      setCoverLetterFileName(file.name);
    }

    setFileUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', fileType);

      const response = await axios.post('http://localhost:5000/api/upload-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        // Update form data with the file path
        setFormData(prevData => ({
          ...prevData,
          [fileType === 'cv' ? 'cv_path' : 'cover_letter_path']: response.data.path
        }));
      }
    } catch (error) {
      console.error(`Error uploading ${fileType}:`, error);
      setFileUploadError(`Failed to upload ${fileType}. Please try again.`);
    } finally {
      // Reset uploading state
      if (fileType === 'cv') {
        setCvUploading(false);
      } else {
        setCoverLetterUploading(false);
      }
    }
  };

  const formatCurrency = (value, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2">
          {initialData ? 'Edit Application' : 'Add New Application'}
        </Typography>
        <IconButton onClick={() => setExpanded(!expanded)}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      
      <Collapse in={expanded}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* URL and Analyze Button */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <TextField
                  fullWidth
                  label="Job Posting URL"
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="https://example.com/job-posting"
                />
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={analyzing ? <CircularProgress size={20} color="inherit" /> : <AnalyticsIcon />}
                  onClick={analyzeJobUrl}
                  disabled={analyzing || !formData.url}
                  sx={{ height: '56px', whiteSpace: 'nowrap' }}
                >
                  {analyzing ? 'Analyzing...' : 'Analyze URL'}
                </Button>
              </Box>
              {analysisError && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {analysisError}
                </Alert>
              )}
            </Grid>
            
            {/* Company and Role */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                required
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                variant="outlined"
              />
            </Grid>
            
            {/* Salary Fields */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Salary Amount"
                name="salary_amount"
                type="number"
                value={formData.salary_amount}
                onChange={handleChange}
                variant="outlined"
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Currency</InputLabel>
                <Select
                  label="Currency"
                  name="salary_currency"
                  value={formData.salary_currency}
                  onChange={handleChange}
                >
                  {currencies.map(currency => (
                    <MenuItem key={currency} value={currency}>{currency}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Salary Type</InputLabel>
                <Select
                  label="Salary Type"
                  name="salary_type"
                  value={formData.salary_type}
                  onChange={handleChange}
                >
                  {salaryTypes.map(type => (
                    <MenuItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1, mb: 2 }}>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={calculateSalary}
                  disabled={!formData.salary_amount}
                >
                  Calculate Equivalent Salaries
                </Button>
              </Box>
              
              {showSalaryResults && salaryResults && (
                <TableContainer component={Paper} sx={{ mt: 2, mb: 3 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Period</TableCell>
                        {currencies.map(currency => (
                          <TableCell key={currency} align="right">{currency}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row">Yearly</TableCell>
                        {currencies.map(currency => (
                          <TableCell key={currency} align="right">
                            {formatCurrency(salaryResults.yearly[currency], currency)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Monthly</TableCell>
                        {currencies.map(currency => (
                          <TableCell key={currency} align="right">
                            {formatCurrency(salaryResults.monthly[currency], currency)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row">Hourly</TableCell>
                        {currencies.map(currency => (
                          <TableCell key={currency} align="right">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: currency,
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            }).format(salaryResults.hourly[currency])}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Grid>
            
            {/* Original Salary Text Field (for backward compatibility) */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Salary (Text Format)"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                variant="outlined"
                placeholder="e.g., $100,000 per year"
              />
            </Grid>
            
            {/* Dates */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date Posted"
                name="date_posted"
                type="date"
                value={formData.date_posted}
                onChange={handleChange}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date Applied"
                name="date_applied"
                type="date"
                value={formData.date_applied}
                onChange={handleChange}
                variant="outlined"
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            
            {/* Status */}
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Status</InputLabel>
                <Select
                  label="Status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  {statuses.map(status => (
                    <MenuItem key={status} value={status}>{status}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* CV File Upload */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ border: '1px dashed #ccc', p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>CV / Resume</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<UploadFileIcon />}
                    disabled={cvUploading}
                  >
                    {cvUploading ? 'Uploading...' : 'Upload CV'}
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.doc,.docx,.txt,.rtf"
                      onChange={(e) => handleFileUpload(e, 'cv')}
                    />
                  </Button>
                  {cvFileName && (
                    <Typography variant="body2" noWrap sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {cvFileName}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>
            
            {/* Cover Letter File Upload */}
            <Grid item xs={12} sm={6}>
              <Box sx={{ border: '1px dashed #ccc', p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Cover Letter</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<UploadFileIcon />}
                    disabled={coverLetterUploading}
                  >
                    {coverLetterUploading ? 'Uploading...' : 'Upload Cover Letter'}
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.doc,.docx,.txt,.rtf"
                      onChange={(e) => handleFileUpload(e, 'cover_letter')}
                    />
                  </Button>
                  {coverLetterFileName && (
                    <Typography variant="body2" noWrap sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {coverLetterFileName}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>

            {/* File Upload Error */}
            {fileUploadError && (
              <Grid item xs={12}>
                <Alert severity="error">
                  {fileUploadError}
                </Alert>
              </Grid>
            )}
            
            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                variant="outlined"
                multiline
                rows={4}
              />
            </Grid>
            
            {/* Submit Button */}
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary" fullWidth>
                {initialData ? 'Update Application' : 'Add Application'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Collapse>
    </Paper>
  );
};

export default ApplicationForm;
