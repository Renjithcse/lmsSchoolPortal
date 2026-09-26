import React, { useMemo, useState } from 'react';
import { Controller } from 'react-hook-form';
import { FormGroup, IconButton, InputAdornment } from '@mui/material';
import TextField from '@mui/material/TextField';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { alpha, useTheme } from '@mui/material/styles';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';

const CustomLoginInput = ({
    control,
    fieldName,
    placeholder,
    error,
    type = 'text',
    readOnly,
    startAdornmentIcon,
    endAdornmentIcon,
    inputProps,
    autoComplete = 'off',
}) => {
    const muiTheme = useTheme();
    const { themeColors } = useThemeContext();
    const isDarkMode = muiTheme.palette.mode === 'dark';

    const [showPassword, setShowPassword] = useState(false);
    const isPasswordField = type === 'password';
    const inputType = isPasswordField ? (showPassword ? 'text' : 'password') : type;

    const { backgroundColor, borderColor, placeholderColor, focusShadow } = useMemo(() => {
        const baseBackground = isDarkMode
            ? alpha(themeColors.background.primary, 0.32)
            : themeColors.background.primary;
        const derivedBorder = isDarkMode
            ? alpha('#ffffff', 0.18)
            : alpha(themeColors.border.primary, 0.85);
        const derivedPlaceholder = alpha(themeColors.text.secondary, isDarkMode ? 0.75 : 0.6);
        const derivedFocusShadow = isDarkMode
            ? `0 0 0 4px ${alpha(themeColors.primary, 0.22)}`
            : `0 0 0 4px ${alpha(themeColors.primary, 0.18)}`;

        return {
            backgroundColor: baseBackground,
            borderColor: derivedBorder,
            placeholderColor: derivedPlaceholder,
            focusShadow: derivedFocusShadow,
        };
    }, [isDarkMode, themeColors]);

    const renderAdornment = (content, position = 'start') => {
        if (!content) return undefined;
        const spacing = position === 'start' ? { pl: 1.25, pr: 0.75 } : { pl: 0.75, pr: 1.25 };
        const colorizedContent = React.isValidElement(content)
            ? React.cloneElement(content, {
                sx: {
                    color: themeColors.text.secondary,
                    ...(content.props?.sx || {}),
                },
            })
            : content;

        return (
            <InputAdornment position={position} sx={{ color: themeColors.text.secondary, ...spacing }}>
                {colorizedContent}
            </InputAdornment>
        );
    };

    return (
        <FormGroup>
            <Controller
                name={fieldName}
                control={control}
                render={({ field }) => (
                    <TextField
                        name={field.name}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        value={field.value || ''}
                        autoComplete={autoComplete}
                        aria-invalid={error ? 'true' : 'false'}
                        placeholder={placeholder}
                        variant="standard"
                        type={inputType}
                        fullWidth
                        {...(readOnly && { readOnly: true })}
                        inputProps={inputProps || {}}
                        InputProps={{
                            disableUnderline: true,
                            startAdornment: renderAdornment(startAdornmentIcon, 'start'),
                            endAdornment: isPasswordField ? (
                                <InputAdornment position="end" sx={{ pr: 1.25 }}>
                                    <IconButton
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        edge="end"
                                        sx={{
                                            color: themeColors.text.secondary,
                                        }}
                                    >
                                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                    </IconButton>
                                </InputAdornment>
                            ) : renderAdornment(endAdornmentIcon, 'end'),
                        }}
                        sx={{
                            '& .MuiInputBase-root': {
                                display: 'flex',
                                alignItems: 'center',
                                borderRadius: '12px',
                                paddingLeft: startAdornmentIcon ? 0 : 1.5,
                                paddingRight: isPasswordField || endAdornmentIcon ? 0 : 1.5,
                                backgroundColor,
                                border: `1px solid ${borderColor}`,
                                boxShadow: isDarkMode
                                    ? `0 18px 48px -32px ${alpha('#000000', 0.95)}`
                                    : `0 18px 40px -28px ${alpha(themeColors.primary, 0.28)}`,
                                transition: 'all 0.2s ease',
                                height: 54,
                                '&:hover': {
                                    borderColor: alpha(themeColors.primary, 0.55),
                                },
                                '&.Mui-focused': {
                                    borderColor: themeColors.primary,
                                    boxShadow: focusShadow,
                                },
                            },
                            '& .MuiInputBase-input': {
                                fontFamily: 'Outfit, sans-serif',
                                fontSize: '0.95rem',
                                fontWeight: 500,
                                letterSpacing: '0.2px',
                                color: themeColors.text.primary,
                                padding: '0 0 0 0',
                            },
                            '& .MuiInputBase-input::placeholder': {
                                color: placeholderColor,
                                opacity: 1,
                            },
                        }}
                    />
                )}
            />
            {error && (
                <TypographyError message={error?.message} themeColors={themeColors} />
            )}
        </FormGroup>
    );
};

const TypographyError = ({ message, themeColors }) => (
    <p
        role="alert"
        style={{
            letterSpacing: 0.5,
            color: themeColors.error || '#ff4d4f',
            paddingLeft: '12px',
            fontSize: '12px',
            fontFamily: 'Raleway, sans-serif',
            marginTop: 6,
        }}
    >
        {message}
    </p>
);

export default CustomLoginInput;