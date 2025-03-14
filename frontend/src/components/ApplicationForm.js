import React, { useState, useEffect } from 'react';
import { 
  Button, TextField, Grid, Typography, Paper, 
  MenuItem, Select, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, IconButton,
  Box, CircularProgress, Alert,
  Dialog, DialogActions, DialogContent, DialogTitle
} from '@mui/material';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

const ApplicationForm = ({ open, onClose, onSubmit, initialData }) => {
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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
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

  // Reset form when dialog is opened
  useEffect(() => {
    if (open) {
      // Reset form state when dialog opens
      if (!initialData) {
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
          cover_letter_path: '',
          status: 'Applied',
          notes: ''
        });
        setCvFileName('');
        setCoverLetterFileName('');
      }
      
      // Reset UI state
      setSubmitError(null);
      setAnalysisError(null);
      setFileUploadError(null);
      setShowSalaryResults(false);
    }
  }, [open, initialData]);

  useEffect(() => {
    // Initialize form with initial data if provided
    if (initialData) {
      // Ensure all required fields have default values
      const formattedData = {
        ...initialData,
        salary_amount: initialData.salary_amount || 0,
        salary_currency: initialData.salary_currency || 'PLN',
        salary_type: initialData.salary_type || 'yearly'
      };
      
      setFormData(formattedData);
      
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
    
    // Special handling for numeric fields
    if (name === 'salary_amount') {
      // Allow only numeric input (including decimals)
      const numericValue = value === '' ? '' : parseFloat(value);
      
      setFormData(prevData => ({
        ...prevData,
        [name]: numericValue
      }));
    } else {
      setFormData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }
    
    // Reset salary results when salary inputs change
    if (['salary_amount', 'salary_currency', 'salary_type'].includes(name)) {
      setShowSalaryResults(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    
    try {
      if (typeof onSubmit === 'function') {
        const success = await onSubmit(formData);
        if (success) {
          // Form was submitted successfully
          // The dialog will be closed by the parent component
        }
      } else {
        console.error('onSubmit is not a function');
        setSubmitError('An error occurred while submitting the form.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError('Failed to submit the application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateSalary = async () => {
    // Validate salary amount
    if (!formData.salary_amount && formData.salary_amount !== 0) {
      console.error('Salary amount is required');
      return;
    }

    try {
      // Ensure salary_amount is a number
      const amount = parseFloat(formData.salary_amount);
      
      if (isNaN(amount)) {
        console.error('Invalid salary amount');
        return;
      }

      // Ensure currency and type have default values if not set
      const currency = formData.salary_currency || 'PLN';
      const type = formData.salary_type || 'yearly';

      console.log('Sending salary calculation request:', {
        amount,
        currency,
        type
      });

      const response = await axios.post('http://localhost:5000/api/calculate-yearly-salary', {
        amount: amount,
        currency: currency,
        type: type
      });
      
      console.log('Salary calculation response:', response.data);
      setSalaryResults(response.data);
      setShowSalaryResults(true);
    } catch (error) {
      console.error('Error calculating salary:', error);
    }
  };

  const analyzeJobUrl = async () => {
    if (!formData.url) {
      setAnalysisError('Please enter a job posting URL');
      return;
    }

    setAnalyzing(true);
    setAnalysisError(null);

    try {
      const response = await axios.post('http://localhost:5000/api/analyze-url', {
        url: formData.url
      });

      if (response.data) {
        // Update form data with analyzed information
        const analysisData = response.data;
        
        // Log the analysis data for debugging
        console.log('URL analysis response:', analysisData);
        
        // Ensure salary_amount is a number
        const salary_amount = analysisData.salary_amount ? parseFloat(analysisData.salary_amount) : 0;
        
        setFormData(prevData => ({
          ...prevData,
          company: analysisData.company || prevData.company,
          role: analysisData.role || prevData.role,
          salary: analysisData.salary || prevData.salary,
          salary_amount: salary_amount,
          salary_currency: analysisData.salary_currency || prevData.salary_currency,
          salary_type: analysisData.salary_type || prevData.salary_type,
          date_posted: analysisData.date_posted || prevData.date_posted
        }));

        // If we have salary information, calculate equivalents
        if (salary_amount > 0) {
          const salaryResponse = await axios.post('http://localhost:5000/api/calculate-yearly-salary', {
            amount: salary_amount,
            currency: analysisData.salary_currency || 'PLN',
            type: analysisData.salary_type || 'yearly'
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
      // Clear uploading state
      if (fileType === 'cv') {
        setCvUploading(false);
      } else {
        setCoverLetterUploading(false);
      }
    }
  };

  // Helper function to safely format numbers
  const formatNumber = (value) => {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return '0';
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      scroll="paper"
      aria-labelledby="form-dialog-title"
    >
      <DialogTitle id="form-dialog-title">
        Add New Job Application
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <form onSubmit={handleSubmit}>
          {/* URL Analysis Section */}
          <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Job Posting URL"
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  placeholder="Paste the job posting URL here"
                  variant="outlined"
                  disabled={analyzing}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={analyzeJobUrl}
                  startIcon={<AnalyticsIcon />}
                  disabled={analyzing || !formData.url}
                  fullWidth
                >
                  {analyzing ? 'Analyzing...' : 'Analyze URL'}
                </Button>
              </Grid>
              {analyzing && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <CircularProgress size={24} sx={{ mr: 1 }} />
                    <Typography variant="body2">Analyzing job posting...</Typography>
                  </Box>
                </Grid>
              )}
              {analysisError && (
                <Grid item xs={12}>
                  <Alert severity="error" sx={{ mt: 1 }}>{analysisError}</Alert>
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* Basic Information */}
          <Typography variant="h6" gutterBottom>Basic Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                required
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Salary (as listed)"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                placeholder="e.g., $100,000 - $120,000 per year"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date Posted"
                name="date_posted"
                type="date"
                value={formData.date_posted}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          {/* Salary Calculator */}
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Salary Details</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Salary Amount"
                name="salary_amount"
                type="number"
                value={formData.salary_amount}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth margin="normal" variant="outlined">
                <InputLabel id="currency-label">Currency</InputLabel>
                <Select
                  labelId="currency-label"
                  name="salary_currency"
                  value={formData.salary_currency}
                  onChange={handleChange}
                  label="Currency"
                >
                  {currencies.map((currency) => (
                    <MenuItem key={currency} value={currency}>
                      {currency}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth margin="normal" variant="outlined">
                <InputLabel id="salary-type-label">Payment Period</InputLabel>
                <Select
                  labelId="salary-type-label"
                  name="salary_type"
                  value={formData.salary_type}
                  onChange={handleChange}
                  label="Payment Period"
                >
                  {salaryTypes.map((type) => (
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
                color="primary"
                onClick={calculateSalary}
                disabled={!formData.salary_amount}
                sx={{ mt: 1 }}
              >
                Calculate Equivalents
              </Button>
              {formData.salary_amount === 0 && (
                <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                  Please enter a salary amount to calculate equivalents
                </Typography>
              )}
            </Grid>
          </Grid>

          {/* Salary Results */}
          {showSalaryResults && salaryResults && (
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle1">Salary Equivalents:</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Period</TableCell>
                      <TableCell align="right">PLN</TableCell>
                      <TableCell align="right">EUR</TableCell>
                      <TableCell align="right">USD</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row">Yearly</TableCell>
                      <TableCell align="right">{formatNumber(salaryResults?.yearly?.PLN)} PLN</TableCell>
                      <TableCell align="right">{formatNumber(salaryResults?.yearly?.EUR)} EUR</TableCell>
                      <TableCell align="right">{formatNumber(salaryResults?.yearly?.USD)} USD</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Monthly</TableCell>
                      <TableCell align="right">{formatNumber(salaryResults?.monthly?.PLN)} PLN</TableCell>
                      <TableCell align="right">{formatNumber(salaryResults?.monthly?.EUR)} EUR</TableCell>
                      <TableCell align="right">{formatNumber(salaryResults?.monthly?.USD)} USD</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Daily</TableCell>
                      <TableCell align="right">{formatNumber(salaryResults?.daily?.PLN)} PLN</TableCell>
                      <TableCell align="right">{formatNumber(salaryResults?.daily?.EUR)} EUR</TableCell>
                      <TableCell align="right">{formatNumber(salaryResults?.daily?.USD)} USD</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">Hourly</TableCell>
                      <TableCell align="right">{formatNumber(salaryResults?.hourly?.PLN)} PLN</TableCell>
                      <TableCell align="right">{formatNumber(salaryResults?.hourly?.EUR)} EUR</TableCell>
                      <TableCell align="right">{formatNumber(salaryResults?.hourly?.USD)} USD</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* File Uploads */}
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Documents</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ border: '1px dashed grey', p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>CV / Resume</Typography>
                <input
                  accept=".pdf,.doc,.docx"
                  style={{ display: 'none' }}
                  id="cv-file"
                  type="file"
                  onChange={(e) => handleFileUpload(e, 'cv')}
                />
                <label htmlFor="cv-file">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadFileIcon />}
                    disabled={cvUploading}
                  >
                    {cvUploading ? 'Uploading...' : 'Upload CV'}
                  </Button>
                </label>
                {cvFileName && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Selected file: {cvFileName}
                  </Typography>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ border: '1px dashed grey', p: 2, borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>Cover Letter</Typography>
                <input
                  accept=".pdf,.doc,.docx"
                  style={{ display: 'none' }}
                  id="cover-letter-file"
                  type="file"
                  onChange={(e) => handleFileUpload(e, 'cover_letter')}
                />
                <label htmlFor="cover-letter-file">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<UploadFileIcon />}
                    disabled={coverLetterUploading}
                  >
                    {coverLetterUploading ? 'Uploading...' : 'Upload Cover Letter'}
                  </Button>
                </label>
                {coverLetterFileName && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Selected file: {coverLetterFileName}
                  </Typography>
                )}
              </Box>
            </Grid>
            {fileUploadError && (
              <Grid item xs={12}>
                <Alert severity="error">{fileUploadError}</Alert>
              </Grid>
            )}
          </Grid>

          {/* Additional Information */}
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Additional Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date Applied"
                name="date_applied"
                type="date"
                value={formData.date_applied}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal" variant="outlined">
                <InputLabel id="status-label">Application Status</InputLabel>
                <Select
                  labelId="status-label"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label="Application Status"
                >
                  {statuses.map((status) => (
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
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                multiline
                rows={4}
                placeholder="Add any notes or comments about this application"
              />
            </Grid>
          </Grid>

          {/* Error Messages */}
          {submitError && (
            <Alert severity="error" sx={{ mt: 2 }}>{submitError}</Alert>
          )}
        </form>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          color="primary" 
          variant="contained"
          disabled={submitting || !formData.company || !formData.role || !formData.url}
        >
          {submitting ? 'Submitting...' : 'Add Application'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApplicationForm;
