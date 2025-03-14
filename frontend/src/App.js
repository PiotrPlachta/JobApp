import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import ApplicationList from './components/ApplicationList';
import ApplicationForm from './components/ApplicationForm';
import axios from 'axios';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('http://localhost:5000/api/applications');
      setApplications(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError('Failed to load applications. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleApplicationAdded = (newApplication) => {
    setApplications([...applications, newApplication]);
    setFormDialogOpen(false);
  };

  const handleApplicationDeleted = (id) => {
    setApplications(applications.filter(app => app.id !== id));
  };

  const handleEditApplication = (application) => {
    setEditingApplication(application);
    setFormDialogOpen(true);
  };

  const handleApplicationUpdated = (updatedApplication) => {
    setApplications(applications.map(app => 
      app.id === updatedApplication.id ? updatedApplication : app
    ));
    setFormDialogOpen(false);
    setEditingApplication(null);
  };

  const handleSubmitApplication = async (formData) => {
    try {
      if (editingApplication) {
        // Update existing application
        const response = await axios.put(`http://localhost:5000/api/applications/${editingApplication.id}`, formData);
        handleApplicationUpdated(response.data);
      } else {
        // Add new application
        const response = await axios.post('http://localhost:5000/api/applications', formData);
        handleApplicationAdded(response.data);
      }
      return true;
    } catch (error) {
      console.error('Error submitting application:', error);
      return false;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Job Application Tracker
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" paragraph>
            Keep track of your job applications, interviews, and offers in one place.
          </Typography>
        </Box>

        <ApplicationList 
          applications={applications} 
          loading={loading} 
          error={error} 
          onDelete={handleApplicationDeleted} 
          onEdit={handleEditApplication}
          onAddClick={() => setFormDialogOpen(true)}
        />

        <ApplicationForm 
          open={formDialogOpen} 
          onClose={() => {
            setFormDialogOpen(false);
            setEditingApplication(null);
          }} 
          onSubmit={handleSubmitApplication}
          initialData={editingApplication}
        />
      </Container>
    </ThemeProvider>
  );
}

export default App;
