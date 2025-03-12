import React, { useState, useEffect } from 'react';
import { Container, CssBaseline, ThemeProvider, createTheme, Box, CircularProgress } from '@mui/material';
import axios from 'axios';
import Header from './components/Header';
import ApplicationForm from './components/ApplicationForm';
import ApplicationList from './components/ApplicationList';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch applications from the API
  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/applications');
      setApplications(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load applications. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Load applications when the component mounts
  useEffect(() => {
    fetchApplications();
  }, []);

  // Handle adding a new application
  const handleApplicationAdded = (newApplication) => {
    setApplications([...applications, newApplication]);
  };

  // Handle deleting an application
  const handleApplicationDeleted = (id) => {
    setApplications(applications.filter(app => app.id !== id));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header />
      <Container maxWidth="lg">
        <ApplicationForm onApplicationAdded={handleApplicationAdded} />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ mt: 4, color: 'error.main', textAlign: 'center' }}>
            {error}
          </Box>
        ) : (
          <ApplicationList 
            applications={applications} 
            onDelete={handleApplicationDeleted} 
            onRefresh={fetchApplications} 
          />
        )}
      </Container>
    </ThemeProvider>
  );
}

export default App;
