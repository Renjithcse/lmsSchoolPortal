import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Typography, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import CustomOutletBox from '../../../components/Common/CustomOutletBox';
import { useTranslation } from 'react-i18next';

const StudentOnlineAssignment = () => {
  const { themeColors } = useThemeContext();
  const { t } = useTranslation();

  return (
    <CustomOutletBox>
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
        sx={{
          background: `linear-gradient(135deg, ${themeColors.primary}05, ${themeColors.accent}05)`,
          borderRadius: 3,
          // p: 0
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <CircularProgress 
            size={60}
            sx={{ 
              color: themeColors.primary,
              mb: 2
            }} 
          />
        </motion.div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              color: themeColors.text.secondary,
              textAlign: 'center'
            }}
          >
            {t('onlineAssignmentDashboard.messages.loading')}
          </Typography>
        </motion.div>
      </Box>
      <Navigate to="/students/online-assignment/dashboard" replace />
    </CustomOutletBox>
  );
};

export default StudentOnlineAssignment;