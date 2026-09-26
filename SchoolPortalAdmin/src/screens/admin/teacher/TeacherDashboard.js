import React, { useMemo } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Stack,
    Avatar,
    CircularProgress,
    Alert,
    Button,
    Divider,
    Chip,
    useTheme,
    alpha,
} from '@mui/material';
import CustomOutletBox from '../../../components/Common/CustomOutletBox';
import SchoolIcon from '@mui/icons-material/School';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import TimelineIcon from '@mui/icons-material/Timeline';
import ClassIcon from '@mui/icons-material/Class';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import { useAbility } from '../../../AbilityContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { getTeacherDashboardStats } from '../../../api/teacher';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const formatDate = (value, t) => {
    if (!value) return t('teacher.dashboard.notAvailable');
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return t('teacher.dashboard.notAvailable');
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const TeacherDashboard = () => {
    const { themeColors } = useThemeContext();
    const muiTheme = useTheme();
    const isDarkMode = muiTheme.palette.mode === 'dark';
    const ability = useAbility();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const { data, isLoading, isFetching, error, refetch } = useQuery({
        queryKey: ['teacherDashboardStats'],
        queryFn: getTeacherDashboardStats,
    });

    const dashboardData = data?.data;

    const summary = dashboardData?.summary || {
        totalTeachers: 0,
        activeTeachers: 0,
        inactiveTeachers: 0,
        newThisMonth: 0,
        averageExperience: 0,
    };

    const genderDistribution = dashboardData?.genderDistribution || { male: 0, female: 0, other: 0, unknown: 0 };
    const experienceBuckets = dashboardData?.experienceBuckets || { '0-2': 0, '3-5': 0, '6-10': 0, '10+': 0 };
    const hiringTimeline = dashboardData?.hiringTimeline || [];
    const topSubjectAssignments = dashboardData?.topSubjectAssignments || [];
    const permissionsSummary = dashboardData?.permissionsSummary || {
        totalSubjectAssignments: 0,
        teachersWithSubjectAssignments: 0,
        totalGradePermissions: 0,
        teachersWithGradePermissions: 0,
    };
    const recentHires = dashboardData?.recentHires || [];

    const designationDistribution = dashboardData?.designationDistribution || [];
    const qualificationDistribution = dashboardData?.qualificationDistribution || [];

    const summaryCards = useMemo(() => [
        {
            key: 'totalTeachers',
            title: t('teacher.dashboard.summary.totalTeachers'),
            value: summary.totalTeachers,
            icon: <PeopleAltIcon fontSize="large" />,
            bg: themeColors.primary,
        },
        {
            key: 'activeTeachers',
            title: t('teacher.dashboard.summary.activeTeachers'),
            value: summary.activeTeachers,
            icon: <SchoolIcon fontSize="large" />,
            bg: themeColors.success,
        },
        {
            key: 'newThisMonth',
            title: t('teacher.dashboard.summary.newThisMonth'),
            value: summary.newThisMonth,
            icon: <PersonAddAltIcon fontSize="large" />,
            bg: themeColors.accent,
        },
        {
            key: 'averageExperience',
            title: t('teacher.dashboard.summary.averageExperience'),
            value: summary.averageExperience?.toFixed ? summary.averageExperience.toFixed(1) : summary.averageExperience,
            icon: <TrendingUpIcon fontSize="large" />,
            bg: themeColors.warning,
        },
    ], [summary, themeColors.primary, themeColors.success, themeColors.accent, themeColors.warning, t]);

    const genderChartData = useMemo(() => {
        const labels = [
            t('teacher.dashboard.gender.male'),
            t('teacher.dashboard.gender.female'),
            t('teacher.dashboard.gender.other'),
            t('teacher.dashboard.gender.unknown')
        ];
        const dataPoints = [
            genderDistribution.male || 0,
            genderDistribution.female || 0,
            genderDistribution.other || 0,
            genderDistribution.unknown || 0,
        ];
        const total = dataPoints.reduce((acc, val) => acc + val, 0);
        if (!total) {
            return null;
        }
        const opacity = isDarkMode ? 'DD' : 'CC';
        return {
            labels,
            datasets: [
                {
                    data: dataPoints,
                    backgroundColor: [
                        `${themeColors.primary}${opacity}`,
                        `${themeColors.success}${opacity}`,
                        `${themeColors.accent}${opacity}`,
                        `${themeColors.warning}${opacity}`,
                    ],
                    borderWidth: isDarkMode ? 2 : 1,
                    borderColor: [
                        themeColors.primary,
                        themeColors.success,
                        themeColors.accent,
                        themeColors.warning,
                    ],
                },
            ],
        };
    }, [genderDistribution, themeColors, t, isDarkMode]);

    const experienceChartData = useMemo(() => {
        const labels = Object.keys(experienceBuckets);
        const values = labels.map((key) => experienceBuckets[key] || 0);
        const total = values.reduce((sum, value) => sum + value, 0);
        if (!total) {
            return null;
        }
        const opacity1 = isDarkMode ? 'CC' : 'AA';
        const opacity2 = isDarkMode ? '99' : '66';
        return {
            labels,
            datasets: [
                {
                    label: t('teacher.dashboard.charts.teachers'),
                    data: values,
                    backgroundColor: labels.map((_, index) => `${themeColors.primary}${index % 2 ? opacity1 : opacity2}`),
                    borderColor: themeColors.primary,
                    borderWidth: isDarkMode ? 2 : 1,
                },
            ],
        };
    }, [experienceBuckets, themeColors.primary, t, isDarkMode]);

    const hiringTimelineData = useMemo(() => {
        if (!hiringTimeline.length) {
            return null;
        }
        const labels = hiringTimeline.map((item) => item.month);
        const values = hiringTimeline.map((item) => item.value);
        const fillOpacity = isDarkMode ? '4D' : '33';
        return {
            labels,
            datasets: [
                {
                    label: t('teacher.dashboard.charts.newHires'),
                    data: values,
                    borderColor: themeColors.primary,
                    backgroundColor: `${themeColors.primary}${fillOpacity}`,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: themeColors.primary,
                    pointBorderColor: isDarkMode ? themeColors.background.primary : '#fff',
                    pointBorderWidth: 2,
                    borderWidth: isDarkMode ? 2 : 1.5,
                },
            ],
        };
    }, [hiringTimeline, themeColors.primary, themeColors.background.primary, t, isDarkMode]);

    const designationTopList = useMemo(() => designationDistribution.slice(0, 6), [designationDistribution]);
    const qualificationTopList = useMemo(() => qualificationDistribution.slice(0, 6), [qualificationDistribution]);

    const canManageTeachers = ability?.can('Read', 'Teacher');
    const canCreateTeacher = ability?.can('Create', 'Teacher');

    if (isLoading && !data) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress sx={{ color: themeColors.primary }} />
            </Box>
        );
    }

    if (error) {
        const message = error?.response?.data?.message || error?.message || t('teacher.dashboard.messages.loadError');
        return (
            <Box>
                <Alert 
                    severity="error" 
                    sx={{ 
                        borderRadius: 2, 
                        mb: 2,
                        backgroundColor: isDarkMode 
                            ? alpha(themeColors.error || '#f44336', 0.15)
                            : undefined,
                    }}
                >
                    {message}
                </Alert>
                <Button 
                    variant="contained" 
                    onClick={() => refetch()}
                    sx={{
                        backgroundColor: themeColors.primary,
                        color: themeColors.text.inverse,
                        '&:hover': {
                            backgroundColor: themeColors.primaryHover || themeColors.primary,
                        },
                    }}
                >
                    {t('teacher.dashboard.actions.retry')}
                </Button>
            </Box>
        );
    }

    return (
        <CustomOutletBox>
            <Box sx={{ backgroundColor: themeColors.background.primary, borderRadius: 3, p: { xs: 2, md: 3 } }}>
                {isFetching && (
                    <Box display="flex" justifyContent="flex-end" mb={2}>
                        <CircularProgress size={20} sx={{ color: themeColors.primary }} />
                    </Box>
                )}

                <Grid container spacing={3}>
                    {summaryCards.map((card) => (
                        <Grid item xs={12} sm={6} md={3} key={card.key}>
                            <Card sx={{
                                borderRadius: 3,
                                backgroundColor: themeColors.background.secondary,
                                border: `1px solid ${themeColors.border.primary}`,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    borderColor: isDarkMode 
                                        ? alpha(themeColors.primary, 0.5)
                                        : themeColors.primary,
                                    boxShadow: isDarkMode
                                        ? `0 4px 12px ${alpha(themeColors.primary, 0.2)}`
                                        : `0 4px 12px ${alpha(themeColors.primary, 0.1)}`,
                                },
                            }}>
                                <CardContent>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Avatar sx={{ backgroundColor: card.bg, color: themeColors.text.inverse }}>
                                            {card.icon}
                                        </Avatar>
                                        <Box>
                                            <Typography 
                                                variant="subtitle2" 
                                                sx={{ 
                                                    color: isDarkMode 
                                                        ? alpha('#ffffff', 0.9)
                                                        : themeColors.text.secondary,
                                                    fontWeight: isDarkMode ? 600 : 500,
                                                }}
                                            >
                                                {card.title}
                                            </Typography>
                                            <Typography 
                                                variant="h5" 
                                                fontWeight={700} 
                                                sx={{ 
                                                    color: themeColors.text.primary,
                                                    opacity: isDarkMode ? 1 : 1,
                                                }}
                                            >
                                                {card.value ?? 0}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}

                    <Grid item xs={12} md={8}>
                        <Card sx={{ 
                            borderRadius: 3, 
                            border: `1px solid ${themeColors.border.primary}`, 
                            backgroundColor: themeColors.background.secondary,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                borderColor: isDarkMode 
                                    ? alpha(themeColors.primary, 0.4)
                                    : themeColors.primary,
                            },
                        }}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="h6" sx={{ color: themeColors.text.primary }}>{t('teacher.dashboard.sections.hiringTrend')}</Typography>
                                    <Chip label={t('teacher.dashboard.chips.last12Months')} size="small" sx={{ color: themeColors.text.secondary, borderColor: themeColors.border.primary }} variant="outlined" />
                                </Stack>
                                {hiringTimelineData ? (
                                    <Box sx={{ height: 260 }}>
                                        <Line
                                            data={hiringTimelineData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: { 
                                                    legend: { display: false },
                                                    tooltip: {
                                                        backgroundColor: isDarkMode 
                                                            ? alpha(themeColors.background.secondary, 0.95)
                                                            : themeColors.background.secondary,
                                                        titleColor: themeColors.text.primary,
                                                        bodyColor: themeColors.text.secondary,
                                                        borderColor: themeColors.border.primary,
                                                        borderWidth: 1,
                                                    },
                                                },
                                                scales: {
                                                    x: {
                                                        ticks: { color: themeColors.text.secondary },
                                                        grid: { 
                                                            color: isDarkMode 
                                                                ? alpha(themeColors.border.primary, 0.3)
                                                                : themeColors.border.primary,
                                                        },
                                                    },
                                                    y: {
                                                        beginAtZero: true,
                                                        ticks: { color: themeColors.text.secondary, precision: 0 },
                                                        grid: { 
                                                            color: isDarkMode 
                                                                ? alpha(themeColors.border.primary, 0.3)
                                                                : themeColors.border.primary,
                                                        },
                                                    },
                                                },
                                            }}
                                        />
                                    </Box>
                                ) : (
                                    <Alert 
                                        severity="info" 
                                        variant="outlined" 
                                        sx={{ 
                                            borderRadius: 2, 
                                            color: themeColors.text.secondary, 
                                            borderColor: themeColors.border.primary,
                                            backgroundColor: isDarkMode 
                                                ? alpha(themeColors.background.secondary, 0.5)
                                                : 'transparent',
                                        }}
                                    >
                                        {t('teacher.dashboard.messages.noHiringTrendData')}
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card sx={{ 
                            borderRadius: 3, 
                            border: `1px solid ${themeColors.border.primary}`, 
                            backgroundColor: themeColors.background.secondary,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                borderColor: isDarkMode 
                                    ? alpha(themeColors.primary, 0.4)
                                    : themeColors.primary,
                            },
                        }}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="h6" sx={{ color: themeColors.text.primary }}>{t('teacher.dashboard.sections.genderDistribution')}</Typography>
                                    <Chip label={t('teacher.dashboard.chips.teachers')} size="small" sx={{ color: themeColors.text.secondary, borderColor: themeColors.border.primary }} variant="outlined" />
                                </Stack>
                                {genderChartData ? (
                                    <Box sx={{ height: 260 }}>
                                        <Doughnut
                                            data={genderChartData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: {
                                                        position: 'bottom',
                                                        labels: { 
                                                            color: themeColors.text.primary,
                                                            padding: 12,
                                                            usePointStyle: true,
                                                        },
                                                    },
                                                    tooltip: {
                                                        backgroundColor: isDarkMode 
                                                            ? alpha(themeColors.background.secondary, 0.95)
                                                            : themeColors.background.secondary,
                                                        titleColor: themeColors.text.primary,
                                                        bodyColor: themeColors.text.secondary,
                                                        borderColor: themeColors.border.primary,
                                                        borderWidth: 1,
                                                    },
                                                },
                                            }}
                                        />
                                    </Box>
                                ) : (
                                    <Alert 
                                        severity="info" 
                                        variant="outlined" 
                                        sx={{ 
                                            borderRadius: 2, 
                                            color: themeColors.text.secondary, 
                                            borderColor: themeColors.border.primary,
                                            backgroundColor: isDarkMode 
                                                ? alpha(themeColors.background.secondary, 0.5)
                                                : 'transparent',
                                        }}
                                    >
                                        {t('teacher.dashboard.messages.noGenderData')}
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card sx={{ 
                            borderRadius: 3, 
                            border: `1px solid ${themeColors.border.primary}`, 
                            backgroundColor: themeColors.background.secondary,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                borderColor: isDarkMode 
                                    ? alpha(themeColors.primary, 0.4)
                                    : themeColors.primary,
                            },
                        }}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="h6" sx={{ color: themeColors.text.primary }}>{t('teacher.dashboard.sections.experienceMix')}</Typography>
                                    <Chip label={t('teacher.dashboard.chips.years')} size="small" sx={{ color: themeColors.text.secondary, borderColor: themeColors.border.primary }} variant="outlined" />
                                </Stack>
                                {experienceChartData ? (
                                    <Box sx={{ height: 260 }}>
                                        <Bar
                                            data={experienceChartData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: { 
                                                    legend: { display: false },
                                                    tooltip: {
                                                        backgroundColor: isDarkMode 
                                                            ? alpha(themeColors.background.secondary, 0.95)
                                                            : themeColors.background.secondary,
                                                        titleColor: themeColors.text.primary,
                                                        bodyColor: themeColors.text.secondary,
                                                        borderColor: themeColors.border.primary,
                                                        borderWidth: 1,
                                                    },
                                                },
                                                scales: {
                                                    x: {
                                                        ticks: { color: themeColors.text.secondary },
                                                        grid: { 
                                                            color: isDarkMode 
                                                                ? alpha(themeColors.border.primary, 0.3)
                                                                : themeColors.border.primary,
                                                        },
                                                    },
                                                    y: {
                                                        beginAtZero: true,
                                                        ticks: { color: themeColors.text.secondary, precision: 0 },
                                                        grid: { 
                                                            color: isDarkMode 
                                                                ? alpha(themeColors.border.primary, 0.3)
                                                                : themeColors.border.primary,
                                                        },
                                                    },
                                                },
                                            }}
                                        />
                                    </Box>
                                ) : (
                                    <Alert 
                                        severity="info" 
                                        variant="outlined" 
                                        sx={{ 
                                            borderRadius: 2, 
                                            color: themeColors.text.secondary, 
                                            borderColor: themeColors.border.primary,
                                            backgroundColor: isDarkMode 
                                                ? alpha(themeColors.background.secondary, 0.5)
                                                : 'transparent',
                                        }}
                                    >
                                        {t('teacher.dashboard.messages.noExperienceData')}
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card sx={{ 
                            borderRadius: 3, 
                            border: `1px solid ${themeColors.border.primary}`, 
                            backgroundColor: themeColors.background.secondary,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                borderColor: isDarkMode 
                                    ? alpha(themeColors.primary, 0.4)
                                    : themeColors.primary,
                            },
                        }}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="h6" sx={{ color: themeColors.text.primary }}>{t('teacher.dashboard.sections.teachingCoverage')}</Typography>
                                    <Chip label={t('teacher.dashboard.chips.permissions')} size="small" sx={{ color: themeColors.text.secondary, borderColor: themeColors.border.primary }} variant="outlined" />
                                </Stack>
                                <Stack spacing={2}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Avatar sx={{ bgcolor: themeColors.primary }}>
                                            <ClassIcon />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ color: themeColors.text.secondary }}>
                                                {t('teacher.dashboard.coverage.totalSubjectAssignments')}
                                            </Typography>
                                            <Typography variant="h6" sx={{ color: themeColors.text.primary }}>{permissionsSummary.totalSubjectAssignments || 0}</Typography>
                                        </Box>
                                    </Stack>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Avatar sx={{ bgcolor: themeColors.success }}>
                                            <AssignmentIndIcon />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ color: themeColors.text.secondary }}>
                                                {t('teacher.dashboard.coverage.teachersWithSubjectAssignments')}
                                            </Typography>
                                            <Typography variant="h6" sx={{ color: themeColors.text.primary }}>{permissionsSummary.teachersWithSubjectAssignments || 0}</Typography>
                                        </Box>
                                    </Stack>
                                    <Divider flexItem sx={{ borderColor: themeColors.border.primary }} />
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Avatar sx={{ bgcolor: themeColors.accent }}>
                                            <TimelineIcon />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ color: themeColors.text.secondary }}>
                                                {t('teacher.dashboard.coverage.gradePermissionRecords')}
                                            </Typography>
                                            <Typography variant="h6" sx={{ color: themeColors.text.primary }}>{permissionsSummary.totalGradePermissions || 0}</Typography>
                                        </Box>
                                    </Stack>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Avatar sx={{ bgcolor: themeColors.warning }}>
                                            <PeopleAltIcon />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ color: themeColors.text.secondary }}>
                                                {t('teacher.dashboard.coverage.teachersWithGradePermissions')}
                                            </Typography>
                                            <Typography variant="h6" sx={{ color: themeColors.text.primary }}>{permissionsSummary.teachersWithGradePermissions || 0}</Typography>
                                        </Box>
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card sx={{ 
                            borderRadius: 3, 
                            border: `1px solid ${themeColors.border.primary}`, 
                            backgroundColor: themeColors.background.secondary,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                borderColor: isDarkMode 
                                    ? alpha(themeColors.primary, 0.4)
                                    : themeColors.primary,
                            },
                        }}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="h6" sx={{ color: themeColors.text.primary }}>{t('teacher.dashboard.sections.topSubjectLoads')}</Typography>
                                    {canManageTeachers && (
                                        <Button variant="text" size="small" onClick={() => navigate('/teacher/list')} sx={{ color: themeColors.primary }}>
                                            {t('teacher.dashboard.actions.manageTeachers')}
                                        </Button>
                                    )}
                                </Stack>
                                {topSubjectAssignments.length ? (
                                    <Stack spacing={2}>
                                        {topSubjectAssignments.map((item) => (
                                            <Box key={item.teacherId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography variant="subtitle1" fontWeight={600} sx={{ color: themeColors.text.primary }}>
                                                        {item.teacherName}
                                                    </Typography>
                                                    <Typography 
                                                        variant="body2" 
                                                        sx={{ 
                                                            color: isDarkMode 
                                                                ? alpha('#ffffff', 0.85)
                                                                : themeColors.text.secondary,
                                                            fontWeight: isDarkMode ? 500 : 400,
                                                        }}
                                                    >
                                                        {item.employeeId} • {item.designation}
                                                    </Typography>
                                                </Box>
                                                <Chip label={t('teacher.dashboard.subjectsCount', { count: item.totalSubjects })} sx={{ color: themeColors.primary, borderColor: themeColors.primary }} variant="outlined" />
                                            </Box>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Alert 
                                        severity="info" 
                                        variant="outlined" 
                                        sx={{ 
                                            borderRadius: 2, 
                                            color: themeColors.text.secondary, 
                                            borderColor: themeColors.border.primary,
                                            backgroundColor: isDarkMode 
                                                ? alpha(themeColors.background.secondary, 0.5)
                                                : 'transparent',
                                        }}
                                    >
                                        {t('teacher.dashboard.messages.noSubjectAssignmentData')}
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card sx={{ 
                            borderRadius: 3, 
                            border: `1px solid ${themeColors.border.primary}`, 
                            backgroundColor: themeColors.background.secondary,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                borderColor: isDarkMode 
                                    ? alpha(themeColors.primary, 0.4)
                                    : themeColors.primary,
                            },
                        }}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="h6" sx={{ color: themeColors.text.primary }}>{t('teacher.dashboard.sections.recentHires')}</Typography>
                                    {canCreateTeacher && (
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={() => navigate('/teacher/add', { state: { mode: 'add' } })}
                                            sx={{ backgroundColor: themeColors.primary, color: themeColors.text.inverse, '&:hover': { backgroundColor: themeColors.primaryHover || themeColors.primary } }}
                                        >
                                            {t('teacher.dashboard.actions.addTeacher')}
                                        </Button>
                                    )}
                                </Stack>
                                {recentHires.length ? (
                                    <Stack spacing={2}>
                                        {recentHires.map((hire) => (
                                            <Box key={hire.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography variant="subtitle1" fontWeight={600} sx={{ color: themeColors.text.primary }}>
                                                        {hire.name}
                                                    </Typography>
                                                    <Typography 
                                                        variant="body2" 
                                                        sx={{ 
                                                            color: isDarkMode 
                                                                ? alpha('#ffffff', 0.85)
                                                                : themeColors.text.secondary,
                                                            fontWeight: isDarkMode ? 500 : 400,
                                                        }}
                                                    >
                                                        {hire.designation} • {t('teacher.dashboard.joined')} {formatDate(hire.joinedOn, t)}
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    label={hire.status ? t(`teacher.dashboard.status.${hire.status}`) : t('teacher.dashboard.status.active')}
                                                    sx={{
                                                        color: hire.status === 'inactive' ? themeColors.text.secondary : themeColors.success,
                                                        borderColor: hire.status === 'inactive' ? themeColors.border.primary : themeColors.success,
                                                    }}
                                                    variant="outlined"
                                                    size="small"
                                                />
                                            </Box>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Alert 
                                        severity="info" 
                                        variant="outlined" 
                                        sx={{ 
                                            borderRadius: 2, 
                                            color: themeColors.text.secondary, 
                                            borderColor: themeColors.border.primary,
                                            backgroundColor: isDarkMode 
                                                ? alpha(themeColors.background.secondary, 0.5)
                                                : 'transparent',
                                        }}
                                    >
                                        {t('teacher.dashboard.messages.noRecentHires')}
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card sx={{ 
                            borderRadius: 3, 
                            border: `1px solid ${themeColors.border.primary}`, 
                            backgroundColor: themeColors.background.secondary,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                borderColor: isDarkMode 
                                    ? alpha(themeColors.primary, 0.4)
                                    : themeColors.primary,
                            },
                        }}>
                            <CardContent>
                                <Typography variant="h6" mb={2} sx={{ color: themeColors.text.primary }}>{t('teacher.dashboard.sections.popularDesignations')}</Typography>
                                {designationTopList.length ? (
                                    <Stack spacing={1.5}>
                                        {designationTopList.map((item) => (
                                            <Stack key={item.designation} direction="row" justifyContent="space-between" alignItems="center">
                                                <Typography variant="body1" sx={{ color: themeColors.text.primary }}>{item.designation}</Typography>
                                                <Chip label={item.count} size="small" sx={{ color: themeColors.text.secondary, borderColor: themeColors.border.primary }} variant="outlined" />
                                            </Stack>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Alert 
                                        severity="info" 
                                        variant="outlined" 
                                        sx={{ 
                                            borderRadius: 2, 
                                            color: themeColors.text.secondary, 
                                            borderColor: themeColors.border.primary,
                                            backgroundColor: isDarkMode 
                                                ? alpha(themeColors.background.secondary, 0.5)
                                                : 'transparent',
                                        }}
                                    >
                                        {t('teacher.dashboard.messages.noDesignationData')}
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card sx={{ 
                            borderRadius: 3, 
                            border: `1px solid ${themeColors.border.primary}`, 
                            backgroundColor: themeColors.background.secondary,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                borderColor: isDarkMode 
                                    ? alpha(themeColors.primary, 0.4)
                                    : themeColors.primary,
                            },
                        }}>
                            <CardContent>
                                <Typography variant="h6" mb={2} sx={{ color: themeColors.text.primary }}>{t('teacher.dashboard.sections.topQualifications')}</Typography>
                                {qualificationTopList.length ? (
                                    <Stack spacing={1.5}>
                                        {qualificationTopList.map((item) => (
                                            <Stack key={item.qualification} direction="row" justifyContent="space-between" alignItems="center">
                                                <Typography variant="body1" sx={{ color: themeColors.text.primary }}>{item.qualification}</Typography>
                                                <Chip label={item.count} size="small" sx={{ color: themeColors.text.secondary, borderColor: themeColors.border.primary }} variant="outlined" />
                                            </Stack>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Alert 
                                        severity="info" 
                                        variant="outlined" 
                                        sx={{ 
                                            borderRadius: 2, 
                                            color: themeColors.text.secondary, 
                                            borderColor: themeColors.border.primary,
                                            backgroundColor: isDarkMode 
                                                ? alpha(themeColors.background.secondary, 0.5)
                                                : 'transparent',
                                        }}
                                    >
                                        {t('teacher.dashboard.messages.noQualificationData')}
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </CustomOutletBox>
    );
};

export default TeacherDashboard;
