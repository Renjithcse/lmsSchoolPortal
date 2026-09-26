import React, { useMemo } from 'react';
import { Outlet, useLocation, Link as RouterLink, matchPath, useNavigate } from 'react-router-dom';
import { Box, Breadcrumbs, Typography, Link as MuiLink, Stack, Button } from '@mui/material';
import CustomOutletBox from '../../../components/Common/CustomOutletBox';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import { useAbility } from '../../../AbilityContext';
import { useTranslation } from 'react-i18next';

const TeacherModule = () => {
    const location = useLocation();
    const { themeColors } = useThemeContext();
    const ability = useAbility();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const breadcrumbConfig = useMemo(() => ({
        '/teacher': t('teacher.breadcrumbs.dashboard'),
        '/teacher/list': t('teacher.breadcrumbs.manageTeachers'),
        '/teacher/add': t('teacher.breadcrumbs.addTeacher'),
        '/teacher/edit/:id': t('teacher.breadcrumbs.editTeacher'),
        '/teacher/view/:id': t('teacher.breadcrumbs.viewTeacher'),
        '/teacher/view-teacher': t('teacher.breadcrumbs.teacherDetails'),
    }), [t]);

    const pathnames = location.pathname.split('/').filter(Boolean);

    const breadcrumbs = useMemo(() => {
        const paths = [];
        pathnames.forEach((_, index) => {
            const url = `/${pathnames.slice(0, index + 1).join('/')}`;
            const matchEntry = Object.entries(breadcrumbConfig).find(([pattern]) =>
                matchPath({ path: pattern, end: true }, url)
            );

            if (matchEntry && url !== '/teacher') {
                paths.push({ label: matchEntry[1], href: url });
            }
        });
        return paths;
    }, [breadcrumbConfig, pathnames]);

    const currentPageTitle = breadcrumbs[breadcrumbs.length - 1]?.label || t('teacher.breadcrumbs.dashboard');

    const canCreateTeacher = ability?.can('Create', 'Teacher');
    const canReadTeacherDashboard = ability?.can('Read', 'TeacherDashboard') || ability?.can('Read', 'Teacher');
    const canReadTeacherList = ability?.can('Read', 'Teacher');
    const canReadTeacherSelf = ability?.can('Read', 'TeacherSelfDashboard') || ability?.can('Read', 'Teacher');
    const showManageButton = canReadTeacherList && location.pathname !== '/teacher/list';
    const showMyDashboardButton = canReadTeacherSelf && location.pathname !== '/teacher/my-dashboard';

    return (
        <CustomOutletBox>
            <Box sx={{ mb: 3 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" spacing={2}>
                    <Box>
                        <Typography variant="h4" fontWeight={700} sx={{ color: themeColors.text.primary, mb: 1 }}>
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
                                component={RouterLink}
                                underline="hover"
                                sx={{
                                    color: themeColors.text.secondary,
                                    '&:hover': { color: themeColors.primary },
                                }}
                                to="/teacher"
                            >
                                {t('teacher.breadcrumbs.teacherModule')}
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
                                        component={RouterLink}
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
                        </Breadcrumbs>
                    </Box>
                    <Stack direction="row" spacing={1.5}>
                        {showMyDashboardButton && (
                            <Button variant="outlined" onClick={() => navigate('/teacher/my-dashboard')}>
                                {t('teacher.actions.myDashboard')}
                            </Button>
                        )}
                        {showManageButton && (
                            <Button variant="outlined" onClick={() => navigate('/teacher/list')}>
                                {t('teacher.actions.manageTeachers')}
                            </Button>
                        )}
                        {canCreateTeacher && (
                            <Button variant="contained" onClick={() => navigate('/teacher/add', { state: { mode: 'add' } })}>
                                {t('teacher.actions.addTeacher')}
                            </Button>
                        )}
                    </Stack>
                </Stack>
            </Box>

            <Box>
                <Outlet />
            </Box>
        </CustomOutletBox>
    );
};

export default TeacherModule;
