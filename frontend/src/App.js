import React, { useState, useEffect } from 'react';
import { 
  Container, CssBaseline, ThemeProvider, createTheme, useMediaQuery
} from '@mui/material';
import ApplicationList from './components/ApplicationList';
import ApplicationForm from './components/ApplicationForm';
import Header from './components/Header';
import Footer from './components/Footer';
import axios from 'axios';

function App() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);
  
  // Theme state
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useState(prefersDarkMode);

  // Create theme based on dark mode state
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: darkMode ? '#90caf9' : '#1976d2',
      },
      secondary: {
        main: darkMode ? '#f48fb1' : '#dc004e',
      },
      background: {
        default: darkMode ? '#121212' : '#f5f5f5',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: darkMode ? '#f0f0e0' : '#000000', // Creamy white in dark mode
        secondary: darkMode ? '#d0d0c0' : '#666666', // Creamy secondary text in dark mode
      },
      divider: darkMode ? 'rgba(240, 240, 224, 0.12)' : 'rgba(0, 0, 0, 0.12)',
    },
    components: {
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: darkMode 
              ? '1px solid rgba(240, 240, 224, 0.12)' 
              : '1px solid rgba(0, 0, 0, 0.12)',
          },
          head: {
            backgroundColor: darkMode ? '#1e1e1e' : '#f5f5f5',
            color: darkMode ? '#f0f0e0' : '#000000',
            fontWeight: 'bold',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
          },
        },
      },
    },
  });

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

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
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
      <Footer />
    </ThemeProvider>
  );
}

export default App;
