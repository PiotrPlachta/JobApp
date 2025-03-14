import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Collapse, Box, Typography, IconButton, Button, CircularProgress, Alert, Chip,
  TextField, MenuItem, Select, FormControl, InputLabel, Grid, TableSortLabel,
  Tooltip, OutlinedInput
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
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

const calculateMonthlySalary = (amount, type) => {
  if (!amount) return null;
  
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount)) return null;
  
  switch (type) {
    case 'hourly':
      // Assuming 40 hours per week, 4.33 weeks per month
      return (numericAmount * 40 * 4.33).toFixed(2);
    case 'monthly':
      return numericAmount.toFixed(2);
    case 'yearly':
      return (numericAmount / 12).toFixed(2);
    default:
      return numericAmount.toFixed(2);
  }
};

const calculateYearlySalary = (amount, type) => {
  if (!amount) return null;
  
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount)) return null;
  
  switch (type) {
    case 'hourly':
      // Assuming 40 hours per week, 52 weeks per year
      return (numericAmount * 40 * 52).toFixed(2);
    case 'monthly':
      return (numericAmount * 12).toFixed(2);
    case 'yearly':
      return numericAmount.toFixed(2);
    default:
      return numericAmount.toFixed(2);
  }
};

const formatCurrency = (amount, currency) => {
  if (!amount) return 'Not specified';
  return `${amount} ${currency || 'PLN'}`;
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
        <TableCell>{application.id}</TableCell>
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
        <TableCell>
          {application.salary_amount && application.salary_currency ? 
            formatCurrency(calculateMonthlySalary(application.salary_amount, application.salary_type), application.salary_currency) : 
            'Not specified'}
        </TableCell>
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
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Details
              </Typography>
              <Table size="small" aria-label="application details">
                <TableHead>
                  <TableRow>
                    <TableCell>Original Salary</TableCell>
                    <TableCell>Monthly Equivalent</TableCell>
                    <TableCell>Yearly Equivalent</TableCell>
                    <TableCell>Date Posted</TableCell>
                    <TableCell>URL</TableCell>
                    <TableCell>CV</TableCell>
                    <TableCell>Cover Letter</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      {application.salary_amount && application.salary_currency ? 
                        `${application.salary_amount} ${application.salary_currency}/${application.salary_type || 'yearly'}` : 
                        'Not specified'}
                    </TableCell>
                    <TableCell>
                      {application.salary_amount && application.salary_currency ? 
                        formatCurrency(calculateMonthlySalary(application.salary_amount, application.salary_type), application.salary_currency) : 
                        'Not specified'}
                    </TableCell>
                    <TableCell>
                      {application.salary_amount && application.salary_currency ? 
                        formatCurrency(calculateYearlySalary(application.salary_amount, application.salary_type), application.salary_currency) : 
                        'Not specified'}
                    </TableCell>
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
  // State for sorting
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('date_applied');
  
  // State for filtering
  const [filters, setFilters] = useState({
    company: '',
    role: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);

  // Fetch statuses for filter dropdown
  useEffect(() => {
    axios.get('http://localhost:5000/api/application-statuses')
      .then(response => setStatuses(response.data))
      .catch(error => console.error('Error fetching statuses:', error));
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...applications];
    
    // Apply filters
    if (filters.company) {
      result = result.filter(app => 
        app.company.toLowerCase().includes(filters.company.toLowerCase())
      );
    }
    
    if (filters.role) {
      result = result.filter(app => 
        app.role.toLowerCase().includes(filters.role.toLowerCase())
      );
    }
    
    if (filters.status) {
      result = result.filter(app => app.status === filters.status);
    }
    
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      result = result.filter(app => {
        if (!app.date_applied) return false;
        return new Date(app.date_applied) >= fromDate;
      });
    }
    
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      result = result.filter(app => {
        if (!app.date_applied) return false;
        return new Date(app.date_applied) <= toDate;
      });
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];
      
      // Handle special cases
      if (orderBy === 'date_applied' || orderBy === 'date_posted') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      } else if (orderBy === 'monthly_salary') {
        aValue = a.salary_amount ? parseFloat(calculateMonthlySalary(a.salary_amount, a.salary_type)) : 0;
        bValue = b.salary_amount ? parseFloat(calculateMonthlySalary(b.salary_amount, b.salary_type)) : 0;
      }
      
      if (order === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
      }
    });
    
    setFilteredApplications(result);
  }, [applications, filters, order, orderBy]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      company: '',
      role: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const createSortHandler = (property) => () => {
    handleRequestSort(property);
  };

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
              Your Job Applications ({filteredApplications.length})
            </Typography>
            <Box>
              <Tooltip title="Toggle Filters">
                <IconButton onClick={() => setShowFilters(!showFilters)} sx={{ mr: 1 }}>
                  <FilterListIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={onAddClick}
              >
                Add Application
              </Button>
            </Box>
          </Box>
          
          {showFilters && (
            <Box sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    label="Company"
                    name="company"
                    value={filters.company}
                    onChange={handleFilterChange}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    label="Role"
                    name="role"
                    value={filters.role}
                    onChange={handleFilterChange}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="status-filter-label">Status</InputLabel>
                    <Select
                      labelId="status-filter-label"
                      name="status"
                      value={filters.status}
                      onChange={handleFilterChange}
                      input={<OutlinedInput label="Status" />}
                    >
                      <MenuItem value="">
                        <em>Any</em>
                      </MenuItem>
                      {statuses.map((status) => (
                        <MenuItem key={status} value={status}>
                          {status}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    label="Date From"
                    name="dateFrom"
                    type="date"
                    value={filters.dateFrom}
                    onChange={handleFilterChange}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth
                    label="Date To"
                    name="dateTo"
                    type="date"
                    value={filters.dateTo}
                    onChange={handleFilterChange}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
          
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader aria-label="collapsible table">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'id'}
                      direction={orderBy === 'id' ? order : 'asc'}
                      onClick={createSortHandler('id')}
                    >
                      ID
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'company'}
                      direction={orderBy === 'company' ? order : 'asc'}
                      onClick={createSortHandler('company')}
                    >
                      Company
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'role'}
                      direction={orderBy === 'role' ? order : 'asc'}
                      onClick={createSortHandler('role')}
                    >
                      Role
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'status'}
                      direction={orderBy === 'status' ? order : 'asc'}
                      onClick={createSortHandler('status')}
                    >
                      Status
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'date_applied'}
                      direction={orderBy === 'date_applied' ? order : 'asc'}
                      onClick={createSortHandler('date_applied')}
                    >
                      Date Applied
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'monthly_salary'}
                      direction={orderBy === 'monthly_salary' ? order : 'asc'}
                      onClick={createSortHandler('monthly_salary')}
                    >
                      Monthly Salary
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredApplications.map((application) => (
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
