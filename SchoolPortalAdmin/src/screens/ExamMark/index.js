import React, { useMemo } from 'react';
import CustomOutletBox from '../../components/Common/CustomOutletBox';
import { Outlet, useLocation, Link, matchPath } from 'react-router-dom';
import { Box, Breadcrumbs, Typography, Link as MuiLink } from '@mui/material';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const ExamMark = () => {
    const location = useLocation();
    const { themeColors } = useTheme();
    const { t } = useTranslation();

    const breadcrumbConfig = useMemo(() => ({
        '/exammark': t('examMark.breadcrumbs.examMark'),
        '/exammark/category': t('examMark.breadcrumbs.categories'),
        '/exammark/category/new': t('examMark.breadcrumbs.newCategory'),
        '/exammark/mark-entry': t('examMark.breadcrumbs.markEntry'),
        '/exammark/edit-mark': t('examMark.breadcrumbs.editMarks'),
    }), [t]);

    const pathnames = location.pathname.split('/').filter(Boolean);

    const breadcrumbs = useMemo(() => {
        const paths = [];
        pathnames.forEach((_, index) => {
            const url = `/${pathnames.slice(0, index + 1).join('/')}`;
            const matchEntry = Object.entries(breadcrumbConfig).find(([pattern]) =>
                matchPath({ path: pattern, end: true }, url)
            );

            if (matchEntry && url !== '/exammark') {
                paths.push({ label: matchEntry[1], href: url });
            }
        });

        return paths;
    }, [breadcrumbConfig, pathnames]);

    const currentPageTitle = useMemo(() => 
        breadcrumbs[breadcrumbs.length - 1]?.label || t('examMark.breadcrumbs.examMark'),
        [breadcrumbs, t]
    );

    return (
        <CustomOutletBox>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 1 }}>
                    {currentPageTitle}
                </Typography>
                <Breadcrumbs
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
                            '&:hover': {
                                color: themeColors.primary,
                            },
                        }}
                        to="/exammark"
                    >
                        {t('examMark.breadcrumbs.examMark')}
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
                                    '&:hover': {
                                        color: themeColors.primary,
                                    },
                                }}
                                to={crumb.href}
                            >
                                {crumb.label}
                            </MuiLink>
                        );
                    })}
                </Breadcrumbs>
            </Box>

            <Box>
                <Outlet />
            </Box>
        </CustomOutletBox>
    );
};

export default ExamMark;