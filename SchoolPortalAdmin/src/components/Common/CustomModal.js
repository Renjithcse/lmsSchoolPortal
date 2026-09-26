import { Box, Typography } from '@mui/material'
import React from 'react'
import Dialog from '@mui/material/Dialog';
import CancelIcon from '@mui/icons-material/Cancel';
import DialogContent from '@mui/material/DialogContent';
import { useTheme } from '../../contexts/ThemeContext';

const CustomModal = ({ children, open, close, label, width, block, FS }) => {

  const { themeColors } = useTheme()

  // const Transition = React.forwardRef(function Transition(props, ref) {
  //   return <Slide direction="up" ref={ref} {...props} />;

  const handleClose = (event, reason) => {
    if (reason && reason === "backdropClick")
      return;

    close();

  }
  // });
  return (
    <Dialog
      disableEnforceFocus
      // TransitionComponent={Transition}
      fullWidth
      maxWidth={width ? width : 'md'}
      fullScreen={FS ? FS : false}
      open={open}
      onClose={block ? handleClose : close}
      aria-describedby="alert-dialog-description"
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: themeColors.background.primary,
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          border: `1px solid ${themeColors.border.primary}`
        }
      }}
    >

      <Box display={'flex'} justifyContent={'space-between'} height={40} px={3.5} borderBottom={`1px solid ${themeColors.border.primary}`} py={2} alignItems={'center'}>
        <Typography fontFamily={'Raleway, sans-serif'} sx={{
          fontSize: {
            lg: 26,
            md: 24,
            sm: 20,
            xs: 16,
          },
          color: themeColors.text.primary
        }} letterSpacing={1} fontWeight={'bold'}>{label}</Typography>
        <CancelIcon sx={{
          fontSize: 35,
          "&:hover": { 
            color: themeColors.text.primary 
          }, 
          color: themeColors.text.secondary,
          cursor: 'pointer',
          transition: 'color 0.2s ease-in-out'
        }} onClick={close} />
      </Box>
      <DialogContent dividers sx={{ 
        scrollbarWidth: 'thin',
        backgroundColor: themeColors.background.primary,
        color: themeColors.text.primary
      }}>
        {children}
      </DialogContent>
    </Dialog>
  )
}

export default CustomModal