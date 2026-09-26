import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Avatar, Popover } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import DescriptionIcon from '@mui/icons-material/Description';
import { useController } from "react-hook-form";
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const ImagePicker = ({ fieldName, control, defaultValue, fieldLabel, onChangeFile, accept, supportedFiles }) => {
    const { t } = useTranslation();
    const { themeColors } = useTheme();
    const [preview, setPreview] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [errors, setErrors] = useState(null);

    const { field: { onChange, value } } = useController({
        name: fieldName,
        control,
        defaultValue,
    });

    const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/jpg"];
    const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png"];

    const parsePreviewFromValue = (val) => {
        if (!val) return null;
        if (typeof val !== 'string') return null;
        if (val.startsWith('data:')) {
            const isImage = val.startsWith('data:image');
            return {
                isImage,
                src: isImage ? val : null,
                label: t('imagePicker.preview'),
                sourceValue: val,
            };
        }
        const segments = val.split('/');
        const fileName = segments[segments.length - 1];
        const extension = fileName?.split('.').pop()?.toLowerCase();
        const isImage = IMAGE_EXTENSIONS.includes(extension);
        return {
            isImage,
            src: isImage ? val : null,
            label: fileName,
            sourceValue: val,
        };
    };

    useEffect(() => {
        if (!value) {
            setPreview(null);
            return;
        }
        if (preview?.sourceValue === value) return;
        const nextPreview = parsePreviewFromValue(value);
        if (nextPreview) {
            setPreview(nextPreview);
        }
    }, [value, preview?.sourceValue, t]);

    const handlePopoverOpen = (event) => {
        if (preview?.isImage) {
            setAnchorEl(event.currentTarget);
        }
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl && preview?.isImage);

    const onChangeImage = (e) => {
        const file = e.target.files[0];
        if (file) {
            const allowedImageTypes = supportedFiles ? supportedFiles : ["image/jpeg", "image/png", "image/jpg"];
            if (!allowedImageTypes.includes(file.type)) {
                setErrors(t('imagePicker.errors.unsupportedFile'));
                setPreview(null);
                onChange(null);
                return;
            }
            setErrors(null);
            const reader = new FileReader();
            reader.onloadend = () => {
                const isImage = IMAGE_MIME_TYPES.includes(file.type);
                const previewPayload = {
                    isImage,
                    src: isImage ? reader.result : null,
                    label: file.name,
                    sourceValue: reader.result,
                };
                setPreview(previewPayload);
                onChange(reader.result); // Update React Hook Form field
                if (onChangeFile) onChangeFile(file); // Optional callback
            };
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
            onChange(null);
            if (onChangeFile) onChangeFile(null);
        }
    };

    return (
        <Box>
            {fieldLabel && (
                <Typography 
                    fontFamily={'Raleway, sans-serif'} 
                    fontWeight={'700'}
                    sx={{ 
                        color: themeColors.text.primary,
                        mb: 1
                    }}
                >
                    {fieldLabel}
                </Typography>
            )}
            <Box
                sx={{
                    border: `1px solid ${themeColors.border.primary}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1,
                    borderRadius: 2,
                    backgroundColor: themeColors.background.primary,
                    '&:hover': {
                        borderColor: themeColors.primary
                    }
                }}
            >
                <TextField
                    sx={{ display: 'none' }}
                    accept={accept ? accept : "image/*"}
                    id={fieldName}
                    type="file"
                    onChange={onChangeImage}
                />
                <label htmlFor={fieldName} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Button
                        variant="contained"
                        sx={{ 
                            background: themeColors.primary, 
                            '&:hover': { 
                                background: themeColors.accent,
                                transform: 'translateY(-1px)',
                                boxShadow: 2
                            }, 
                            height: 36,
                            borderRadius: 2,
                            transition: 'all 0.2s ease-in-out'
                        }}
                        component="span"
                        startIcon={<CloudUploadIcon />}
                    >
                        {t('imagePicker.upload')}
                    </Button>
                    {preview && preview.isImage && (
                        <Avatar
                            src={preview.src}
                            alt={preview.label || t('imagePicker.preview')}
                            variant='square'
                            sx={{ 
                                width: 45, 
                                height: 30, 
                                cursor: 'pointer',
                                border: `2px solid ${themeColors.border.primary}`,
                                '&:hover': {
                                    borderColor: themeColors.primary
                                }
                            }}
                            onMouseEnter={handlePopoverOpen}
                        />
                    )}
                    {preview && !preview.isImage && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                padding: '4px 8px',
                                borderRadius: 1.5,
                                border: `1px solid ${themeColors.border.primary}`,
                                backgroundColor: themeColors.background.secondary,
                            }}
                        >
                            <DescriptionIcon fontSize="small" />
                            <Typography variant="body2" sx={{ fontSize: 12 }}>
                                {preview.label || t('imagePicker.preview')}
                            </Typography>
                        </Box>
                    )}
                </label>
                {preview && (
                    <HighlightOffIcon
                        onClick={() => {
                            setPreview(null);
                            onChange(null);
                if (onChangeFile) onChangeFile(null);
                        }}
                        sx={{
                            cursor: 'pointer',
                            color: themeColors.error,
                            ml: 1,
                            '&:hover': {
                                color: themeColors.error,
                                transform: 'scale(1.1)'
                            },
                            transition: 'all 0.2s ease-in-out'
                        }}
                    />
                )}
            </Box>
            {errors && (
                <Typography
                    role="alert"
                    sx={{
                        color: themeColors.error,
                        display: "flex",
                        flexDirection: "start",
                        paddingLeft: "10px",
                        fontSize: "12px",
                        mt: 0.5
                    }}
                >
                    {errors}
                </Typography>
            )}
            {/* Popover to view the full image */}
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handlePopoverClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                PaperProps={{
                    onMouseLeave: handlePopoverClose, // Close on mouse leave
                    sx: {
                        backgroundColor: themeColors.background.primary,
                        border: `1px solid ${themeColors.border.primary}`,
                        borderRadius: 2,
                        boxShadow: 3
                    }
                }}
            >
                <Box
                    sx={{
                        p: 2,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: themeColors.background.primary
                    }}
                >
                    <img
                        src={preview?.src}
                        alt={t('imagePicker.fullPreview')}
                        style={{ 
                            maxWidth: '300px', 
                            maxHeight: '300px',
                            borderRadius: '8px'
                        }}
                    />
                </Box>
            </Popover>
        </Box>
    );
};

export default ImagePicker;
