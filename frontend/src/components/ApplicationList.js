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
  DialogTitle
} from '@mui/material';
import {
  KeyboardArrowDown,
  KeyboardArrowUp,
  Delete,
  Edit,
  Description
} from '@mui/icons-material';
import axios from 'axios';

const ApplicationRow = ({ application, onDelete, onRefresh }) => {
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
        <TableCell>{application.salary || 'N/A'}</TableCell>
        <TableCell>{application.date_applied}</TableCell>
        <TableCell>
          <IconButton size="small" color="primary">
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
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>

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
                <TableCell>Salary</TableCell>
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
