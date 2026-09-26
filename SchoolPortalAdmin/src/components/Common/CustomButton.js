import { Box, Button, CircularProgress } from '@mui/material'
import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'

const CustomButton = ({ label, active, onClick, loading, disable, isIcon, ICON, width, variant, type }) => {
    const { themeColors } = useTheme()
    
    const getButtonStyles = () => {
        const baseStyles = {
            fontFamily: 'Outfit-Regular',
            borderRadius: 2,
            padding: "9px 18px",
            fontSize: "14px",
            fontWeight: 'bold',
            letterSpacing: 1,
            width: width ? width : 'unset',
            height: 40,
            transition: 'all 0.2s ease-in-out'
        };

        if (variant === 'outlined') {
            return {
                ...baseStyles,
                borderColor: themeColors.border.primary,
                color: themeColors.text.primary,
                backgroundColor: 'transparent',
                ':hover': {
                    borderColor: themeColors.primary,
                    backgroundColor: `${themeColors.primary}22`,
                    color: themeColors.primary
                }
            };
        }

        return {
            ...baseStyles,
            backgroundColor: active ? themeColors.accent : themeColors.primary,
            color: themeColors.text.inverse,
            ':hover': {
                bgcolor: themeColors.accent,
                boxShadow: 4,
                color: themeColors.text.inverse
            }
        };
    };
    
    return (
        <Button 
            onClick={onClick}
            disabled={disable}
            variant={variant}
            type={type}
            endIcon={isIcon ? <ICON sx={{ color: variant === 'outlined' ? themeColors.text.primary : themeColors.text.inverse }} /> : null}
            sx={getButtonStyles()}
        >
            {loading ? <CircularProgress sx={{ color: variant === 'outlined' ? themeColors.text.primary : themeColors.text.inverse }} /> : label}
        </Button>
    )
}

export default CustomButton