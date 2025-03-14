import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Collapse, Box, Typography, IconButton, Button, CircularProgress, Alert, Chip
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';

const statusColors = {
  'Applied': 'info',
  'Interview': 'warning',
  'Offer': 'success',
  'Rejected': 'error',
  'Withdrawn': 'default',
  'Not Interested': 'default'
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

const getStatusColor = (status) => {
  return statusColors[status] || 'default';
};

const ApplicationRow = ({ application, onDelete, onEdit }) => {
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete the application for ${application.company}?`)) {
      try {
        await axios.delete(`http://localhost:5000/api/applications/${application.id}`);
        onDelete(application.id);
      } catch (error) {
        console.error('Error deleting application:', error);
        alert('Failed to delete application. Please try again.');
      }
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
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">{application.company}</TableCell>
        <TableCell>{application.role}</TableCell>
        <TableCell>
          <Chip 
            label={application.status} 
            color={getStatusColor(application.status)} 
            size="small" 
          />
        </TableCell>
        <TableCell>{formatDate(application.date_applied)}</TableCell>
        <TableCell align="right">
          <IconButton aria-label="edit" onClick={() => onEdit(application)}>
            <EditIcon />
          </IconButton>
          <IconButton aria-label="delete" onClick={handleDelete}>
            <DeleteIcon />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Details
              </Typography>
              <Table size="small" aria-label="application details">
                <TableHead>
                  <TableRow>
                    <TableCell>Salary</TableCell>
                    <TableCell>Date Posted</TableCell>
                    <TableCell>URL</TableCell>
                    <TableCell>CV</TableCell>
                    <TableCell>Cover Letter</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>{application.salary || 'Not specified'}</TableCell>
                    <TableCell>{application.date_posted ? formatDate(application.date_posted) : 'Not specified'}</TableCell>
                    <TableCell>
                      {application.url ? (
                        <a href={application.url} target="_blank" rel="noopener noreferrer">
                          View Job Posting
                        </a>
                      ) : 'Not available'}
                    </TableCell>
                    <TableCell>
                      {application.cv_path ? (
                        <a href={`http://localhost:5000${application.cv_path}`} target="_blank" rel="noopener noreferrer">
                          View CV
                        </a>
                      ) : 'Not uploaded'}
                    </TableCell>
                    <TableCell>
                      {application.cover_letter_path ? (
                        <a href={`http://localhost:5000${application.cover_letter_path}`} target="_blank" rel="noopener noreferrer">
                          View Cover Letter
                        </a>
                      ) : 'Not uploaded'}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              {application.notes && (
                <Box sx={{ mt: 2, mb: 1 }}>
                  <Typography variant="subtitle2" gutterBottom component="div">
                    Notes
                  </Typography>
                  <Typography variant="body2">
                    {application.notes}
                  </Typography>
                </Box>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

const ApplicationList = ({ applications, loading, error, onDelete, onEdit, onAddClick }) => {
  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', mb: 4 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
      ) : applications.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body1" gutterBottom>
            No applications found.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={onAddClick}
            sx={{ mt: 2 }}
          >
            Add Application
          </Button>
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
            <Typography variant="h6" component="div">
              Your Job Applications
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={onAddClick}
            >
              Add Application
            </Button>
          </Box>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader aria-label="collapsible table">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Company</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date Applied</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {applications.map((application) => (
                  <ApplicationRow 
                    key={application.id} 
                    application={application} 
                    onDelete={onDelete}
                    onEdit={onEdit}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Paper>
  );
};

export default ApplicationList;
