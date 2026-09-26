import { Grid, Box, Typography } from '@mui/material'
import React from 'react'
import CustomButton from './CustomButton'
import { useTheme } from '../../contexts/ThemeContext'

const CustomAddButton = ({ ClickEvent, label, justifyContent = 'flex-end' }) => {
  const { themeColors } = useTheme();
  
  return (
    <Box 
      sx={{ 
        display: 'flex',
        justifyContent: justifyContent,
        p: 2,
        backgroundColor: themeColors.background.secondary,
        borderRadius: 1,
        border: `1px solid ${themeColors.border.primary}`,
        mb: 2
      }}
    >
      <CustomButton
        onClick={ClickEvent}
        label={label ? label : "Add"}
        isIcon={false}
        sx={{
          backgroundColor: themeColors.primary,
          color: 'white',
          '&:hover': {
            backgroundColor: themeColors.accent,
            transform: 'translateY(-1px)',
            boxShadow: 2
          },
          transition: 'all 0.2s ease-in-out',
          fontWeight: 600,
          px: 3,
          py: 1.5
        }}
      />
    </Box>
  )
}

export default CustomAddButton
