import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Work } from '@mui/icons-material';

const Header = () => {
  return (
    <AppBar position="static" sx={{ mb: 4 }}>
      <Toolbar>
        <Work sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Job Application Tracker
        </Typography>
        <Box>
          <Button color="inherit">Dashboard</Button>
          <Button color="inherit">Statistics</Button>
          <Button color="inherit">Settings</Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
