import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Box,
  Collapse,
  Chip,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Delete,
  Edit,
  Description,
  Save,
  Cancel
} from '@mui/icons-material';
import axios from 'axios';

const statusColors = {
  'Applied': 'default',
  'Phone Screen': 'info',
  'Technical Interview': 'primary',
  'Onsite Interview': 'secondary',
  'Offer': 'success',
  'Rejected': 'error',
  'Withdrawn': 'warning',
  'Not Interested': 'default'
};

const ApplicationRow = ({ application, onDelete, onRefresh, statusOptions }) => {
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ ...application });

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/applications/${application.id}`);
      setDeleteDialogOpen(false);
      onDelete(application.id);
    } catch (error) {
      console.error('Error deleting application:', error);
      alert('Failed to delete the application. Please try again.');
    }
  };

  const handleEdit = () => {
    setEditData({ ...application });
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
  };

  const handleSaveEdit = async () => {
    try {
      await axios.put(`http://localhost:5000/api/applications/${application.id}`, editData);
      setEditMode(false);
      onRefresh();
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Failed to update the application. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {application.company}
        </TableCell>
        <TableCell>{application.role}</TableCell>
        <TableCell>
          <Chip 
            label={application.status} 
            color={statusColors[application.status] || 'default'}
            size="small"
          />
        </TableCell>
        <TableCell>{application.date_applied}</TableCell>
        <TableCell>
          <IconButton size="small" color="primary" onClick={handleEdit}>
            <Edit />
          </IconButton>
          <IconButton 
            size="small" 
            color="error" 
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Delete />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Application Details
              </Typography>
              <Table size="small" aria-label="application details">
                <TableBody>
                  <TableRow>
                    <TableCell component="th" scope="row">Job URL</TableCell>
                    <TableCell>
                      <a href={application.url} target="_blank" rel="noopener noreferrer">
                        {application.url}
                      </a>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Salary</TableCell>
                    <TableCell>{application.salary || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Date Posted</TableCell>
                    <TableCell>{application.date_posted || 'N/A'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">CV File</TableCell>
                    <TableCell>
                      {application.cv_path ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Description fontSize="small" sx={{ mr: 1 }} />
                          {application.cv_path}
                        </Box>
                      ) : 'No CV uploaded'}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Notes</TableCell>
                    <TableCell>{application.notes || 'No notes'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell component="th" scope="row">Last Updated</TableCell>
                    <TableCell>{application.last_updated || 'N/A'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>

      {/* Edit Dialog */}
      <Dialog open={editMode} onClose={handleCancelEdit} maxWidth="md" fullWidth>
        <DialogTitle>Edit Application</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company"
                name="company"
                value={editData.company}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Role"
                name="role"
                value={editData.role}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Salary"
                name="salary"
                value={editData.salary || ''}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="URL"
                name="url"
                value={editData.url}
                onChange={handleInputChange}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date Posted"
                name="date_posted"
                type="date"
                value={editData.date_posted || ''}
                onChange={handleInputChange}
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date Applied"
                name="date_applied"
                type="date"
                value={editData.date_applied}
                onChange={handleInputChange}
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel id="edit-status-label">Application Status</InputLabel>
                <Select
                  labelId="edit-status-label"
                  name="status"
                  value={editData.status || 'Applied'}
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
                value={editData.notes || ''}
                onChange={handleInputChange}
                margin="normal"
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit} startIcon={<Cancel />}>Cancel</Button>
          <Button onClick={handleSaveEdit} color="primary" startIcon={<Save />}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Delete Application
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this job application for {application.role} at {application.company}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
};

const ApplicationList = ({ applications, onDelete, onRefresh }) => {
  const [statusOptions, setStatusOptions] = useState([
    'Applied',
    'Phone Screen',
    'Technical Interview',
    'Onsite Interview',
    'Offer',
    'Rejected',
    'Withdrawn',
    'Not Interested'
  ]);

  // Fetch status options when component mounts
  React.useEffect(() => {
    const fetchStatusOptions = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/application-statuses');
        setStatusOptions(response.data);
      } catch (error) {
        console.error('Error fetching status options:', error);
      }
    };
    
    fetchStatusOptions();
  }, []);

  return (
    <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden' }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ p: 2 }}>
        Your Job Applications
        <Chip 
          label={`${applications.length} Applications`} 
          color="primary" 
          size="small" 
          sx={{ ml: 2 }}
        />
      </Typography>
      
      {applications.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No job applications found. Add your first application using the form above.
          </Typography>
        </Box>
      ) : (
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="collapsible table">
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Company</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date Applied</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((application) => (
                <ApplicationRow 
                  key={application.id} 
                  application={application} 
                  onDelete={onDelete}
                  onRefresh={onRefresh}
                  statusOptions={statusOptions}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default ApplicationList;
