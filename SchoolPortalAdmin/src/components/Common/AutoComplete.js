import React, { useState, useEffect, useRef } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { Box, Typography, List, ListItem, FormGroup } from '@mui/material';
import KeyboardArrowDownSharpIcon from '@mui/icons-material/KeyboardArrowDownSharp';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const AutocompleteInput = ({
    fieldLabel,
    fieldName,
    control,
    defaultValue = null,
    options = [],
    labelField = 'label',
    placeholder,
    error,
}) => {
    const { t } = useTranslation();
    const [inputValue, setInputValue] = useState(defaultValue?.[labelField] || '');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);
    const { themeColors } = useTheme();
    
    const defaultPlaceholder = placeholder || t('autoComplete.defaultPlaceholder');

    // Watch the form value for this field
    const watchedValue = useWatch({
        control,
        name: fieldName,
    });

    // Sync input field when the form value changes
    useEffect(() => {
        if (
            (watchedValue && typeof watchedValue === 'object' && watchedValue[labelField] !== inputValue) ||
            (typeof watchedValue === 'string' && watchedValue !== inputValue) ||
            (!watchedValue && inputValue !== '')
        ) {
            setInputValue(watchedValue?.[labelField] || '');
        }
    }, [watchedValue, labelField]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter((option) =>
        option[labelField].toLowerCase().includes(inputValue.toLowerCase())
    );


    return (
        <FormGroup>
            {fieldLabel && (
                <Typography fontFamily={'Raleway, sans-serif'} fontWeight={'700'} px={'3px'} mb={'2px'}
                    sx={{
                        fontSize: {
                            lg: 14,
                            md: 14,
                            sm: 13,
                            xs: 12,
                        },
                        color: themeColors.text.primary
                    }}
                >{fieldLabel}
                </Typography>
            )}

            <Controller
                name={fieldName}
                control={control}
                defaultValue={defaultValue}
                render={({ field: { onChange, onBlur } }) => (
                    <Box sx={{ position: 'relative' }} ref={wrapperRef}>
                        <Box sx={{
                            position: 'relative',
                            width: '100%',
                            cursor: 'pointer',
                            borderRadius: isOpen ? '5px 5px 0 0' : '5px',
                            height: '40px',
                            mt: '4px',
                            opacity: '1',
                            background: themeColors.background.primary,
                            fontFamily: 'Raleway, sans-serif',
                            letterSpacing: '1px',
                            fontWeight: '700px',
                            margin: '3px',
                            borderRadius: '5px',
                            opacity: "1",
                            border: `0.4px solid ${themeColors.primary}`,
                            paddingRight: '48px',
                            color: themeColors.text.primary,
                            '&:hover': {
                                borderColor: themeColors.primary
                            },
                            '&:focus-within': {
                                borderColor: themeColors.primary,
                                boxShadow: `0 0 0 2px ${themeColors.primary}20`
                            }
                        }}>
                            <input
                                type="text"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    padding: '8px 0 8px 12px',
                                    border: 'none',
                                    outline: 'none',
                                    backgroundColor: 'transparent',
                                    color: themeColors.text.primary,
                                    fontFamily: 'Raleway, sans-serif',
                                    fontWeight: '700',
                                    fontSize: '14px',
                                    letterSpacing: '1px',
                                    border: `0.5px solid ${themeColors.border.primary}`,
                                    '&::placeholder': {
                                        color: themeColors.text.disabled
                                    }
                                }}
                                placeholder={defaultPlaceholder}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onFocus={() => setIsOpen(true)}
                                onBlur={onBlur}
                                autoComplete="off"
                            />
                            <Box sx={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: isOpen ? 'translateY(-50%) rotate(180deg)' : 'translateY(-50%) rotate(0deg)',
                                cursor: 'default',
                                pointerEvents: 'none',
                                width: 24,
                                height: 24,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                bgcolor: themeColors.primary,
                                color: themeColors.text.inverse,
                                borderRadius: '12px',
                                transition: 'transform 0.2s ease-in-out'
                            }}>
                                <KeyboardArrowDownSharpIcon style={{ fontSize: 20, fontWeight: 'bold' }} />
                            </Box>
                        </Box>

                        {isOpen && (
                            <List sx={{
                                position: 'absolute',
                                zIndex: 1400,
                                width: '100%',
                                maxHeight: '192px',
                                overflow: 'auto',
                                backgroundColor: themeColors.background.primary,
                                border: `1px solid ${themeColors.border.primary}`,
                                borderTop: 'none',
                                borderRadius: '0 0 5px 5px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                                mt: -1,
                                '& .MuiListItem-root': {
                                    color: themeColors.text.primary,
                                    fontFamily: 'Raleway, sans-serif',
                                    fontWeight: '700',
                                    fontSize: '14px',
                                    '&:hover': {
                                        backgroundColor: themeColors.background.secondary,
                                    }
                                }
                            }}>
                                {filteredOptions.length > 0 ? (
                                    filteredOptions.map((option, index) => (
                                        <ListItem
                                            key={index}
                                            sx={{
                                                px: 1.5,
                                                py: 1,
                                                cursor: 'pointer',
                                                color: themeColors.text.primary,
                                                fontFamily: 'Raleway, sans-serif',
                                                fontWeight: '700',
                                                fontSize: '14px',
                                                '&:hover': {
                                                    backgroundColor: themeColors.background.secondary
                                                }
                                            }}
                                            onMouseDown={() => {
                                                onChange(option);
                                                setInputValue(option[labelField]);
                                                setIsOpen(false);
                                            }}
                                        >
                                            {option[labelField]}
                                        </ListItem>
                                    ))
                                ) : (
                                    <ListItem sx={{
                                        px: 1.5,
                                        py: 1,
                                        color: themeColors.text.disabled,
                                        fontStyle: 'italic',
                                        fontFamily: 'Raleway, sans-serif',
                                        fontWeight: '700',
                                        fontSize: '14px'
                                    }}>
                                        {t('autoComplete.noResults')}
                                    </ListItem>
                                )}
                            </List>
                        )}
                    </Box>
                )}
            />

            {error && (
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
                    {error?.message}
                </Typography>
            )}
        </FormGroup>
    );
};

export default AutocompleteInput;
