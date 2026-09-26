import React from 'react';
import { CircularProgress, Typography, Box } from '@mui/material';

const CustomLoader = ({ text }) => {
  return (
    <Box textAlign="center" mt={ 8 }>
      <CircularProgress color="primary" size={ 60 } thickness={ 4 } />
      { text && <Typography variant="body1" mt={ 2 }>{ text }</Typography> }
    </Box>
  );
};

export default CustomLoader;