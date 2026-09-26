import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const StudentOnlineExam = () => {
    const navigate = useNavigate();
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();

    // Redirect to dashboard on mount
    useEffect(() => {
        navigate('/students/online-exam/dashboard', { replace: true });
    }, [navigate]);

    return (
        <Box 
            display="flex" 
            flexDirection="column"
            justifyContent="center" 
            alignItems="center" 
            minHeight="400px"
            sx={{
                background: `linear-gradient(135deg, ${themeColors.primary}05, ${themeColors.accent}05)`,
                borderRadius: 2,
                p: 4
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
                    {t('studentOnlineExam.messages.loading')}
                </Typography>
            </motion.div>
        </Box>
    );
};

export default StudentOnlineExam;
