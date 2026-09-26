import React, { useMemo } from 'react';
import CustomOutletBox from '../../components/Common/CustomOutletBox';
import { Outlet, useLocation, Link, matchPath } from 'react-router-dom';
import { Box, Breadcrumbs, Typography, Link as MuiLink } from '@mui/material';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const AssignmentScreen = () => {
    const location = useLocation();
    const { themeColors } = useTheme();
    const { t } = useTranslation();

    const breadcrumbConfig = useMemo(() => ({
        '/assignments': t('assignments.breadcrumbs.assignments'),
        '/assignments/list': t('assignments.breadcrumbs.manage'),
        '/assignments/add': t('assignments.breadcrumbs.create'),
        '/assignments/view/:id': t('assignments.breadcrumbs.details'),
        '/assignments/view/:assignmentId/:publishId': t('assignments.breadcrumbs.publishedDetails'),
    }), [t]);

    const pathnames = location.pathname.split('/').filter(Boolean);

    const breadcrumbs = useMemo(() => {
        const paths = [];
        pathnames.forEach((_, index) => {
            const url = `/${pathnames.slice(0, index + 1).join('/')}`;
            const matchEntry = Object.entries(breadcrumbConfig).find(([pattern]) =>
                matchPath({ path: pattern, end: true }, url)
            );

            if (matchEntry && url !== '/assignments') {
                paths.push({ label: matchEntry[1], href: url });
            }
        });

        return paths;
    }, [breadcrumbConfig, pathnames]);

    const currentPageTitle = breadcrumbs[breadcrumbs.length - 1]?.label || t('assignments.breadcrumbs.assignments');

    return (
        <CustomOutletBox>
            <Box sx={{ mb: 1 }}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 1 }}>
                    {currentPageTitle}
                </Typography>
                {/* <Breadcrumbs
                    aria-label="breadcrumb"
                    sx={{
                        '& .MuiBreadcrumbs-separator': {
                            color: themeColors.text.secondary,
                        },
                    }}
                >
                    <MuiLink
                        component={Link}
                        underline="hover"
                        sx={{
                            color: themeColors.text.secondary,
                            '&:hover': { color: themeColors.primary },
                        }}
                        to="/assignments"
                    >
                        {t('assignments.breadcrumbs.assignments')}
                    </MuiLink>
                    {breadcrumbs.map((crumb, index) => {
                        const isLast = index === breadcrumbs.length - 1;
                        return isLast ? (
                            <Typography key={crumb.href} sx={{ color: themeColors.text.primary }}>
                                {crumb.label}
                            </Typography>
                        ) : (
                            <MuiLink
                                key={crumb.href}
                                component={Link}
                                underline="hover"
                                sx={{
                                    color: themeColors.text.secondary,
                                    '&:hover': { color: themeColors.primary },
                                }}
                                to={crumb.href}
                            >
                                {crumb.label}
                            </MuiLink>
                        );
                    })}
                </Breadcrumbs> */}
            </Box>

            <Box>
                <Outlet />
            </Box>
        </CustomOutletBox>
    );
};

export default AssignmentScreen;

