
import { Box, Typography, Breadcrumbs, Link } from '@mui/material'
import React from 'react'
import { COLORS } from '../../assets/colors'
import { useLocation } from 'react-router-dom'
import HomeIcon from '@mui/icons-material/Home'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'
import { useTheme } from '../../contexts/ThemeContext'
import { useTranslation } from 'react-i18next'

const CustomSubHeader = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { themeColors } = useTheme();
  
  // Generate breadcrumbs from current path
  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    const breadcrumbs = pathnames.map((value, index) => {
      const to = `/${pathnames.slice(0, index + 1).join('/')}`;
      const label = value.charAt(0).toUpperCase() + value.slice(1).replace(/([A-Z])/g, ' $1');
      return { label, to };
    });
    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <Box sx={{
      padding: '16px 0',
      backgroundColor: 'transparent'
    }}>
      {/* Page Title */}
      {/* <Typography 
        variant="h4" 
        sx={{
          fontWeight: 600,
          color: themeColors.text.primary,
          marginBottom: '8px',
          fontSize: {
            xs: '1.5rem',
            sm: '1.75rem',
            md: '2rem'
          }
        }}
      >
        {breadcrumbs.length > 0 
          ? breadcrumbs[breadcrumbs.length - 1].label 
          : 'Dashboard'
        }
      </Typography> */}

      {/* Breadcrumbs */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{
          '& .MuiBreadcrumbs-separator': {
            color: themeColors.text.secondary
          }
        }}
      >
        <Link
          underline="hover"
          color="inherit"
          href="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: themeColors.text.secondary,
            textDecoration: 'none',
            '&:hover': {
              color: themeColors.primary
            }
          }}
        >
          <HomeIcon sx={{ fontSize: '1rem', marginRight: '4px' }} />
          {t('customSubHeader.home')}
        </Link>
        
        {breadcrumbs.map((breadcrumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <Typography
              key={breadcrumb.to}
              color={isLast ? 'text.primary' : 'inherit'}
              sx={{
                color: isLast ? themeColors.text.primary : themeColors.text.secondary,
                fontWeight: isLast ? 500 : 400,
                fontSize: '0.875rem'
              }}
            >
              {breadcrumb.label}
            </Typography>
          );
        })}
      </Breadcrumbs>
    </Box>
  )
}

export default CustomSubHeader
