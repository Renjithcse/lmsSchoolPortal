import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Popover,
  Typography,
  Grid,
  Paper,
  Tooltip,
  useTheme as useMuiTheme
} from '@mui/material';
import { Palette, Check } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const ThemeSwitcher = () => {
  const { t } = useTranslation();
  const { currentTheme, themeColors, changeTheme, getAvailableThemes } = useTheme();
  const muiTheme = useMuiTheme();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleThemeChange = (themeName) => {
    changeTheme(themeName);
    handleClose();
  };

  const open = Boolean(anchorEl);
  const id = open ? 'theme-popover' : undefined;

  const availableThemes = getAvailableThemes();

  return (
    <>
      <Tooltip title={t('themeSwitcher.changeTheme')}>
        <IconButton
          onClick={handleClick}
          sx={{
            color: themeColors.text.secondary,
            '&:hover': {
              backgroundColor: themeColors.background.tertiary
            }
          }}
        >
          <Palette />
        </IconButton>
      </Tooltip>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{
          '& .MuiPaper-root': {
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${themeColors.border.primary}`,
            marginTop: '8px'
          }
        }}
      >
        <Box sx={{ p: 2, minWidth: 280 }}>
          <Typography
            variant="h6"
            sx={{
              mb: 2,
              color: themeColors.text.primary,
              fontWeight: 600
            }}
          >
            {t('themeSwitcher.chooseTheme')}
          </Typography>

          <Grid container spacing={1}>
            {availableThemes.map((theme) => (
              <Grid item xs={6} key={theme.name}>
                <Paper
                  onClick={() => handleThemeChange(theme.name)}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    border: `2px solid ${
                      currentTheme === theme.name
                        ? themeColors.primary
                        : themeColors.border.primary
                    }`,
                    borderRadius: '8px',
                    transition: 'all 0.2s ease-in-out',
                    position: 'relative',
                    '&:hover': {
                      borderColor: themeColors.primary,
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  {/* Theme Preview */}
                  <Box sx={{ mb: 1 }}>
                    <Box
                      sx={{
                        height: 40,
                        borderRadius: '6px',
                        background: `linear-gradient(45deg, ${theme.colors.primary}, ${theme.colors.accent})`,
                        mb: 1
                      }}
                    />
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: theme.colors.primary
                        }}
                      />
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: theme.colors.secondary
                        }}
                      />
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: theme.colors.success
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Theme Name */}
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color: themeColors.text.primary,
                      textAlign: 'center'
                    }}
                  >
                    {theme.label}
                  </Typography>

                  {/* Check Mark for Current Theme */}
                  {currentTheme === theme.name && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: themeColors.primary,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Check sx={{ fontSize: 12, color: 'white' }} />
                    </Box>
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Popover>
    </>
  );
};

export default ThemeSwitcher;
