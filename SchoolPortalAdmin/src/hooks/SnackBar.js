import React, { createContext, useContext, useState, useCallback } from 'react';
import Snackbar from '@mui/material/Snackbar';
import SnackbarContent from '@mui/material/SnackbarContent';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
// Create a context to manage the Snackbar state
const SnackbarContext = createContext();

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};

export const SnackbarProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('info');

  const handleOpen = useCallback((message, severity = 'info') => {
    setMessage(message);
    setSeverity(severity);
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const snackbarContentProps = {
    style: { backgroundColor: severity === 'error' ? '#d32f2f' : severity === 'info' ? 'rgb(30, 149, 214)' : '#43a047' },
    message: (
      <span style={{ display: 'flex', alignItems: 'center' }}>
        {severity === 'error' ? (
          <ErrorOutlineIcon style={{ marginRight: '8px' }} />
        ) : (
          <CheckCircleOutlineIcon style={{ marginRight: '8px' }} />
        )}
        {message}
      </span>
    ),
    action: [
      <IconButton key="close" color="inherit" onClick={handleClose}>
        <CloseIcon />
      </IconButton>,
    ],
  };

  return (
    <SnackbarContext.Provider value={handleOpen}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <SnackbarContent {...snackbarContentProps} />
      </Snackbar>
    </SnackbarContext.Provider>
  );
};