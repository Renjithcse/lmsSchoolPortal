import React, { useMemo } from 'react'
import { Outlet, useLocation, Link as RouterLink, matchPath, useNavigate } from 'react-router-dom'
import { Box, Breadcrumbs, Typography, Link as MuiLink, Stack, Button } from '@mui/material'
import CustomOutletBox from '../../components/Common/CustomOutletBox'
import ClassSelector from '../../components/Common/ClassSelector'
import { useTheme as useThemeContext } from '../../contexts/ThemeContext'
import { useAbility } from '../../AbilityContext'
import { useTranslation } from 'react-i18next'

const StudentsModule = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { themeColors } = useThemeContext()
    const ability = useAbility()
    const { t } = useTranslation()

    const breadcrumbConfig = useMemo(() => ({
        '/student': t('students.breadcrumbs.dashboard'),
        '/student/list': t('students.breadcrumbs.manageStudents'),
        '/student/add': t('students.breadcrumbs.addStudent'),
        '/student/edit/:id': t('students.breadcrumbs.editStudent'),
        '/student/view/:id': t('students.breadcrumbs.studentDetails'),
    }), [t])

    const pathnames = location.pathname.split('/').filter(Boolean)

    const breadcrumbs = useMemo(() => {
        const paths = []
        pathnames.forEach((_, index) => {
            const url = `/${pathnames.slice(0, index + 1).join('/')}`
            const matchEntry = Object.entries(breadcrumbConfig).find(([pattern]) =>
                matchPath({ path: pattern, end: true }, url)
            )

            if (matchEntry && url !== '/student') {
                paths.push({ label: matchEntry[1], href: url })
            }
        })
        return paths
    }, [breadcrumbConfig, pathnames])

    const currentPageTitle = useMemo(() => breadcrumbs[breadcrumbs.length - 1]?.label || t('students.breadcrumbs.dashboard'), [breadcrumbs, t])

    const canCreateStudent = ability?.can('Create', 'Student')
    const canReadStudentDashboard = ability?.can('Read', 'StudentDashboard') || ability?.can('Read', 'Student')
    const canReadStudentList = ability?.can('Read', 'Student')
    const showManageButton = canReadStudentList && location.pathname !== '/student/list'
    const showClassSelector = location.pathname.startsWith('/student') && location.pathname !== '/student'

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
                            sx={{ '& .MuiBreadcrumbs-separator': { color: themeColors.text.secondary } }}
                        >
                            <MuiLink
                                component={RouterLink}
                                underline="hover"
                                sx={{ color: themeColors.text.secondary, '&:hover': { color: themeColors.primary } }}
                                to="/student"
                            >
                                {t('students.breadcrumbs.studentModule')}
                            </MuiLink>
                            {breadcrumbs.map((crumb, index) => {
                                const isLast = index === breadcrumbs.length - 1
                                return isLast ? (
                                    <Typography key={crumb.href} sx={{ color: themeColors.text.primary }}>
                                        {crumb.label}
                                    </Typography>
                                ) : (
                                    <MuiLink
                                        key={crumb.href}
                                        component={RouterLink}
                                        underline="hover"
                                        sx={{ color: themeColors.text.secondary, '&:hover': { color: themeColors.primary } }}
                                        to={crumb.href}
                                    >
                                        {crumb.label}
                                    </MuiLink>
                                )
                            })}
                        </Breadcrumbs>
                    </Box>
                    <Stack direction="row" spacing={1.5}>
                        {showManageButton && canReadStudentList && (
                            <Button variant="outlined" onClick={() => navigate('/student/list')}>
                                {t('students.actions.manageStudents')}
                            </Button>
                        )}
                        {canCreateStudent && (
                            <Button variant="contained" onClick={() => navigate('/student/add', { state: { mode: 'add' } })}>
                                {t('students.actions.addStudent')}
                            </Button>
                        )}
                    </Stack>
                </Stack>
            </Box>

            {showClassSelector && canReadStudentList && (
                <Box sx={{ mb: 3 }}>
                    <ClassSelector hide={'term'} redirectTo="/student/list" />
                </Box>
            )}

            <Box>
                <Outlet />
            </Box>
        </CustomOutletBox>
    )
}

export default StudentsModule