import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * Footer component for the application
 * Displays copyright information and other footer content
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <Box 
      component="footer"
      sx={{ 
        mt: 4, 
        pt: 2, 
        borderTop: '1px solid', 
        borderColor: 'divider', 
        textAlign: 'center'
      }}
    >
      <Typography variant="body2" color="text.secondary">
        Created by: WITS Piotr Płachta &copy; {currentYear} All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
