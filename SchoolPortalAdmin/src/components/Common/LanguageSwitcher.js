import React, { useMemo, useState } from 'react';
import {
    Button,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import LanguageIcon from '@mui/icons-material/Language';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CheckIcon from '@mui/icons-material/Check';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';

const LanguageSwitcher = ({ size = 'small', sx = {} }) => {
    const { i18n, t } = useTranslation();
    const current = i18n.resolvedLanguage || i18n.language || 'en';
    const { themeColors } = useThemeContext();
    const [anchorEl, setAnchorEl] = useState(null);

    const languages = useMemo(() => {
        const supported = i18n.options?.supportedLngs || Object.keys(i18n.store?.data || {});
        return supported
            .filter((lng) => lng && lng !== 'cimode' && lng !== 'dev')
            .map((lng) => ({
                code: lng,
                label: t(`common.language.${lng}`, lng.toUpperCase()),
            }));
    }, [i18n, t]);

    const normalizedCurrent = useMemo(() => {
        const exactMatch = languages.find(({ code }) => current === code);
        if (exactMatch) return exactMatch.code;

        // attempt to match language with region, e.g. "en-US"
        const prefixMatch = languages.find(({ code }) => current.startsWith(`${code}-`));
        return prefixMatch ? prefixMatch.code : languages[0]?.code || 'en';
    }, [current, languages]);

    const handleChange = (_event, value) => {
        if (!value || value === normalizedCurrent) {
            setAnchorEl(null);
            return;
        }
        i18n.changeLanguage(value);
        setAnchorEl(null);
    };

    if (!languages.length) {
        return null;
    }

    const currentLanguage = languages.find(({ code }) => code === normalizedCurrent);
    const buttonPadding = size === 'small' ? '6px 12px' : size === 'large' ? '10px 18px' : '8px 16px';

    return (
        <>
            <Button
                size={size}
                variant="outlined"
                onClick={(event) => setAnchorEl(event.currentTarget)}
                endIcon={<KeyboardArrowDownIcon />}
                startIcon={<LanguageIcon />}
                sx={{
                    fontWeight: 600,
                    borderRadius: 2,
                    padding: buttonPadding,
                    textTransform: 'none',
                    backgroundColor: themeColors.background.secondary,
                    border: `1px solid ${themeColors.border.primary}`,
                    color: themeColors.text.primary,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    '&:hover': {
                        backgroundColor: themeColors.background.tertiary,
                        borderColor: themeColors.border.secondary,
                    },
                    ...sx,
                }}
            >
                {currentLanguage?.label || current.toUpperCase()}
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                MenuListProps={{ dense: size === 'small' }}
                PaperProps={{
                    sx: {
                        mt: 1,
                        borderRadius: 1.5,
                        border: `1px solid ${themeColors.border.primary}`,
                        backgroundColor: themeColors.background.secondary,
                        boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
                        minWidth: 180,
                    },
                }}
            >
                {languages.map(({ code, label }) => {
                    const isSelected = code === normalizedCurrent;
                    return (
                        <MenuItem
                            key={code}
                            selected={isSelected}
                            onClick={(event) => handleChange(event, code)}
                            sx={{
                                gap: 1,
                                borderRadius: 1,
                                color: themeColors.text.primary,
                                '&.Mui-selected': {
                                    backgroundColor: `${themeColors.primary}1A`,
                                    color: themeColors.text.primary,
                                },
                                '&:hover': {
                                    backgroundColor: themeColors.background.tertiary,
                                },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 32, color: themeColors.primary }}>
                                {isSelected ? <CheckIcon fontSize="small" /> : null}
                            </ListItemIcon>
                            <ListItemText primaryTypographyProps={{ fontWeight: isSelected ? 600 : 500 }}>
                                {label}
                            </ListItemText>
                        </MenuItem>
                    );
                })}
            </Menu>
        </>
    );
};

export default LanguageSwitcher;
