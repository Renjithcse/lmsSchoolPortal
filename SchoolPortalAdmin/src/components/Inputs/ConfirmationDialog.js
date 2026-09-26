import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";
import { useTheme as useThemeContext } from "../../contexts/ThemeContext";
import { useTranslation } from 'react-i18next';

const ConfirmationDialog = ({ isOpen, onClose, onConfirm, message, title }) => {
    const { t } = useTranslation();
    const { themeColors } = useThemeContext();

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            PaperProps={{
                sx: {
                    backgroundColor: themeColors.background.primary,
                    border: `1px solid ${themeColors.border.primary}`,
                    borderRadius: 2,
                },
            }}
        >
            <DialogTitle sx={{ color: themeColors.text.primary, fontWeight: 800 }}>
                {title || t('confirmationDialog.defaultTitle')}
            </DialogTitle>
            <DialogContent>
                <Typography sx={{ color: themeColors.text.secondary }}>
                    {message || t('confirmationDialog.defaultMessage')}
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    sx={{ borderColor: themeColors.border.primary, color: themeColors.text.primary }}
                >
                    {t('confirmationDialog.cancel')}
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    sx={{ backgroundColor: themeColors.error, color: themeColors.text.inverse, '&:hover': { backgroundColor: themeColors.error } }}
                >
                    {t('confirmationDialog.confirm')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmationDialog;
