import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Grid,
  CircularProgress
} from '@mui/material';
import axios from 'axios';

const ApplicationForm = ({ onApplicationAdded }) => {
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    salary: '',
    url: '',
    date_posted: '',
    date_applied: new Date().toISOString().split('T')[0],
    cv_path: ''
  });
  
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
        date_posted: response.data.date_posted || formData.date_posted
      });
    } catch (error) {
      console.error('Error analyzing URL:', error);
      alert('Failed to analyze the URL. Please fill in the details manually.');
    } finally {
      setAnalyzing(false);
    }
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
        url: '',
        date_posted: '',
        date_applied: new Date().toISOString().split('T')[0],
        cv_path: ''
      });
      setFile(null);
      
      // Notify parent component
      if (onApplicationAdded) {
        onApplicationAdded(response.data);
      }
      
      alert('Application saved successfully!');
    } catch (error) {
      console.error('Error saving application:', error);
      alert('Failed to save the application. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Add New Job Application
      </Typography>
      
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
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Salary"
              name="salary"
              value={formData.salary}
              onChange={handleInputChange}
              margin="normal"
              helperText="Optional"
            />
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
    </Paper>
  );
};

export default ApplicationForm;
