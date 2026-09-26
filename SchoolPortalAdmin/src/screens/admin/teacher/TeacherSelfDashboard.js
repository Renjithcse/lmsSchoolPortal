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
    Chip,
    List,
    ListItem,
    ListItemText,
    useTheme,
    alpha,
} from '@mui/material';
import ClassIcon from '@mui/icons-material/Class';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import GroupsIcon from '@mui/icons-material/Groups';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import QuizIcon from '@mui/icons-material/Quiz';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AvTimerIcon from '@mui/icons-material/AvTimer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import { useAbility } from '../../../AbilityContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import CustomOutletBox from '../../../components/Common/CustomOutletBox';
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
import { getMyTeacherDashboardStats } from '../../../api/teacher';

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
    if (!value) return t('teacher.selfDashboard.notAvailable');
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return t('teacher.selfDashboard.notAvailable');
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const formatDateTime = (value, t) => {
    if (!value) return t('teacher.selfDashboard.notAvailable');
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return t('teacher.selfDashboard.notAvailable');
    return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const TeacherSelfDashboard = () => {
    const { themeColors } = useThemeContext();
    const muiTheme = useTheme();
    const isDarkMode = muiTheme.palette.mode === 'dark';
    const ability = useAbility();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const { data, isLoading, isFetching, error, refetch } = useQuery({
        queryKey: ['myTeacherDashboard'],
        queryFn: getMyTeacherDashboardStats,
    });

    const dashboardData = data?.data || {};
    const teacher = dashboardData.teacher || {};
    const summary = dashboardData.summary || {
        totalClasses: 0,
        totalSubjects: 0,
        studentsCovered: 0,
        assignmentsCompleted: 0,
        examsConducted: 0,
        upcomingEvents: 0,
    };

    const classCoverage = dashboardData.classCoverage || [];
    const subjectCoverage = dashboardData.subjectCoverage || [];
    const assignmentStats = dashboardData.assignmentStats || { total: 0, completed: 0, pending: 0 };
    const examStats = dashboardData.examStats || { total: 0, completed: 0, pending: 0 };
    const performanceTrend = dashboardData.performanceTrend || [];
    const recentAssignments = dashboardData.recentAssignments || [];
    const upcomingSchedule = dashboardData.upcomingSchedule || [];
    const recentActivity = dashboardData.recentActivity || [];

    const summaryCards = useMemo(() => [
        {
            key: 'totalClasses',
            title: t('teacher.selfDashboard.summary.classesAssigned'),
            value: summary.totalClasses,
            icon: <ClassIcon fontSize="large" />,
            bg: themeColors.primary,
        },
        {
            key: 'totalSubjects',
            title: t('teacher.selfDashboard.summary.subjectsHandling'),
            value: summary.totalSubjects,
            icon: <MenuBookIcon fontSize="large" />,
            bg: themeColors.accent,
        },
        {
            key: 'studentsCovered',
            title: t('teacher.selfDashboard.summary.studentsCovered'),
            value: summary.studentsCovered,
            icon: <GroupsIcon fontSize="large" />,
            bg: themeColors.success,
        },
        {
            key: 'assignmentsCompleted',
            title: t('teacher.selfDashboard.summary.assignmentsCompleted'),
            value: summary.assignmentsCompleted,
            icon: <AssignmentTurnedInIcon fontSize="large" />,
            bg: themeColors.warning,
        },
        {
            key: 'examsConducted',
            title: t('teacher.selfDashboard.summary.examsConducted'),
            value: summary.examsConducted,
            icon: <QuizIcon fontSize="large" />,
            bg: themeColors.error,
        },
        {
            key: 'upcomingEvents',
            title: t('teacher.selfDashboard.summary.upcomingEvents'),
            value: summary.upcomingEvents,
            icon: <EventAvailableIcon fontSize="large" />,
            bg: themeColors.primaryDark || themeColors.primary,
        },
    ], [summary, themeColors, t]);

    const classBarData = useMemo(() => {
        if (!classCoverage.length) return null;
        const labels = classCoverage.map((item) => `${item.gradeName}-${item.sectionName}`);
        const values = classCoverage.map((item) => item.studentCount || 0);
        const opacity1 = isDarkMode ? 'CC' : 'AA';
        const opacity2 = isDarkMode ? '99' : '55';
        return {
            labels,
            datasets: [
                {
                    label: t('teacher.selfDashboard.charts.students'),
                    data: values,
                    backgroundColor: labels.map((_, idx) => `${themeColors.primary}${idx % 2 ? opacity1 : opacity2}`),
                    borderColor: themeColors.primary,
                    borderWidth: isDarkMode ? 2 : 1,
                },
            ],
        };
    }, [classCoverage, themeColors.primary, t, isDarkMode]);

    const performanceLineData = useMemo(() => {
        if (!performanceTrend.length) return null;
        const fillOpacity = isDarkMode ? '4D' : '33';
        return {
            labels: performanceTrend.map((item) => item.month),
            datasets: [
                {
                    label: t('teacher.selfDashboard.charts.averageScore'),
                    data: performanceTrend.map((item) => item.averageScore || 0),
                    borderColor: themeColors.success,
                    backgroundColor: `${themeColors.success}${fillOpacity}`,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: themeColors.success,
                    pointBorderColor: isDarkMode ? themeColors.background.primary : '#fff',
                    pointBorderWidth: 2,
                    borderWidth: isDarkMode ? 2 : 1.5,
                },
            ],
        };
    }, [performanceTrend, themeColors.success, themeColors.background.primary, t, isDarkMode]);

    const assignmentDoughnutData = useMemo(() => {
        if (!assignmentStats.total) return null;
        const opacity = isDarkMode ? 'DD' : 'CC';
        return {
            labels: [t('teacher.selfDashboard.status.completed'), t('teacher.selfDashboard.status.pending')],
            datasets: [
                {
                    data: [assignmentStats.completed || 0, assignmentStats.pending || 0],
                    backgroundColor: [`${themeColors.success}${opacity}`, `${themeColors.warning}${opacity}`],
                    borderColor: [themeColors.success, themeColors.warning],
                    borderWidth: isDarkMode ? 2 : 1,
                },
            ],
        };
    }, [assignmentStats, themeColors.success, themeColors.warning, t, isDarkMode]);

    const examDoughnutData = useMemo(() => {
        if (!examStats.total) return null;
        const opacity = isDarkMode ? 'DD' : 'CC';
        return {
            labels: [t('teacher.selfDashboard.status.completed'), t('teacher.selfDashboard.status.pending')],
            datasets: [
                {
                    data: [examStats.completed || 0, examStats.pending || 0],
                    backgroundColor: [`${themeColors.primary}${opacity}`, `${themeColors.accent}${opacity}`],
                    borderColor: [themeColors.primary, themeColors.accent],
                    borderWidth: isDarkMode ? 2 : 1,
                },
            ],
        };
    }, [examStats, themeColors.primary, themeColors.accent, t, isDarkMode]);

    const uniqueSubjects = useMemo(() => {
        const set = new Set();
        subjectCoverage.forEach((item) => set.add(item.subjectName || t('teacher.selfDashboard.unknownSubject')));
        return Array.from(set);
    }, [subjectCoverage, t]);

    const canViewAssignments = ability?.can('Read', 'Assignments');
    const canViewExams = ability?.can('Read', 'Exams');

    if (isLoading && !data) {
        return (
            <CustomOutletBox>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                    <CircularProgress sx={{ color: themeColors.primary }} />
                </Box>
            </CustomOutletBox>
        );
    }

    if (error) {
        const message = error?.response?.data?.message || error?.message || t('teacher.selfDashboard.messages.loadError');
        return (
            <CustomOutletBox>
                <Alert 
                    severity="error" 
                    sx={{ 
                        borderRadius: 3, 
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
                    {t('teacher.selfDashboard.actions.retry')}
                </Button>
            </CustomOutletBox>
        );
    }

    const teacherInitials = teacher?.name ? teacher.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() : 'T';

    return (
        <CustomOutletBox>
            <Box sx={{ backgroundColor: themeColors.background.primary, borderRadius: 3, p: { xs: 2, md: 3 } }}>
                {isFetching && (
                    <Box display="flex" justifyContent="flex-end" mb={2}>
                        <CircularProgress size={20} sx={{ color: themeColors.primary }} />
                    </Box>
                )}

                <Card sx={{ 
                    borderRadius: 3, 
                    border: `1px solid ${themeColors.border.primary}`, 
                    backgroundColor: themeColors.background.secondary, 
                    mb: 3,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        borderColor: isDarkMode 
                            ? alpha(themeColors.primary, 0.4)
                            : themeColors.primary,
                    },
                }}>
                    <CardContent>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ xs: 'flex-start', md: 'center' }}>
                            <Avatar sx={{ width: 72, height: 72, bgcolor: themeColors.primary, color: themeColors.text.inverse, fontSize: 28 }}>
                                {teacherInitials}
                            </Avatar>
                            <Box flex={1}>
                                <Typography variant="h5" fontWeight={700} sx={{ color: themeColors.text.primary }}>
                                    {teacher.name || t('teacher.selfDashboard.teacher')}
                                </Typography>
                                <Typography 
                                    variant="subtitle1" 
                                    sx={{ 
                                        color: isDarkMode 
                                            ? alpha('#ffffff', 0.85)
                                            : themeColors.text.secondary,
                                    }}
                                >
                                    {teacher.designation || t('teacher.selfDashboard.classTeacher')}
                                </Typography>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} mt={1.5}>
                                    <Chip 
                                        label={`${t('teacher.selfDashboard.employeeId')}: ${teacher.employeeId || t('teacher.selfDashboard.notAvailable')}`} 
                                        size="small"
                                        sx={{
                                            color: isDarkMode ? alpha('#ffffff', 0.9) : themeColors.text.secondary,
                                            borderColor: themeColors.border.primary,
                                            backgroundColor: isDarkMode ? alpha(themeColors.background.secondary, 0.5) : 'transparent',
                                        }}
                                        variant="outlined"
                                    />
                                    <Chip 
                                        label={`${t('teacher.selfDashboard.experience')}: ${teacher.experienceInYears ?? 0} ${t('teacher.selfDashboard.years')}`} 
                                        size="small"
                                        sx={{
                                            color: isDarkMode ? alpha('#ffffff', 0.9) : themeColors.text.secondary,
                                            borderColor: themeColors.border.primary,
                                            backgroundColor: isDarkMode ? alpha(themeColors.background.secondary, 0.5) : 'transparent',
                                        }}
                                        variant="outlined"
                                    />
                                    <Chip 
                                        label={`${t('teacher.selfDashboard.joined')}: ${formatDate(teacher.dateOfJoining, t)}`} 
                                        size="small"
                                        sx={{
                                            color: isDarkMode ? alpha('#ffffff', 0.9) : themeColors.text.secondary,
                                            borderColor: themeColors.border.primary,
                                            backgroundColor: isDarkMode ? alpha(themeColors.background.secondary, 0.5) : 'transparent',
                                        }}
                                        variant="outlined"
                                    />
                                </Stack>
                            </Box>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                                {canViewAssignments && (
                                    <Button variant="outlined" onClick={() => navigate('/assignments')}>
                                        {t('teacher.selfDashboard.actions.viewAssignments')}
                                    </Button>
                                )}
                                {canViewExams && (
                                    <Button variant="contained" onClick={() => navigate('/online-exam/list')}>
                                        {t('teacher.selfDashboard.actions.manageExams')}
                                    </Button>
                                )}
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>

                <Grid container spacing={3}>
                    {summaryCards.map((card) => (
                        <Grid item xs={12} sm={6} md={4} lg={2} key={card.key}>
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
                                                }}
                                            >
                                                {card.title}
                                            </Typography>
                                            <Typography variant="h6" fontWeight={700} sx={{ color: themeColors.text.primary }}>
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
                                    <Typography variant="h6" sx={{ color: themeColors.text.primary }}>{t('teacher.selfDashboard.sections.classCoverage')}</Typography>
                                    <ClassIcon sx={{ color: themeColors.text.secondary }} />
                                </Stack>
                                {classBarData ? (
                                    <Box sx={{ height: 260 }}>
                                        <Bar
                                            data={classBarData}
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
                                        {t('teacher.selfDashboard.messages.noClassAssignments')}
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
                                <Typography variant="h6" sx={{ color: themeColors.text.primary }} gutterBottom>{t('teacher.selfDashboard.sections.subjectsOverview')}</Typography>
                                {uniqueSubjects.length ? (
                                    <Stack direction="row" flexWrap="wrap" gap={1}>
                                        {uniqueSubjects.map((subject) => (
                                            <Chip key={subject} label={subject} size="small" />
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
                                        {t('teacher.selfDashboard.messages.noSubjectPermissions')}
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
                                    <Typography variant="h6" sx={{ color: themeColors.text.primary }}>{t('teacher.selfDashboard.sections.assignmentProgress')}</Typography>
                                    <AssignmentTurnedInIcon sx={{ color: themeColors.text.secondary }} />
                                </Stack>
                                {assignmentDoughnutData ? (
                                    <Box sx={{ height: 240 }}>
                                        <Doughnut
                                            data={assignmentDoughnutData}
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
                                        {t('teacher.selfDashboard.messages.noAssignmentSubmissions')}
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
                                    <Typography variant="h6" sx={{ color: themeColors.text.primary }}>{t('teacher.selfDashboard.sections.examParticipation')}</Typography>
                                    <QuizIcon sx={{ color: themeColors.text.secondary }} />
                                </Stack>
                                {examDoughnutData ? (
                                    <Box sx={{ height: 240 }}>
                                        <Doughnut
                                            data={examDoughnutData}
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
                                        {t('teacher.selfDashboard.messages.noExamAttempts')}
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

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
                                    <Typography variant="h6" sx={{ color: themeColors.text.primary }}>{t('teacher.selfDashboard.sections.performanceTrend')}</Typography>
                                    <TrendingUpIcon sx={{ color: themeColors.text.secondary }} />
                                </Stack>
                                {performanceLineData ? (
                                    <Box sx={{ height: 260 }}>
                                        <Line
                                            data={performanceLineData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: {
                                                        display: false,
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
                                                        ticks: { color: themeColors.text.secondary },
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
                                        {t('teacher.selfDashboard.messages.noPerformanceData')}
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
                                    <Typography variant="h6" sx={{ color: themeColors.text.primary }}>{t('teacher.selfDashboard.sections.upcomingSchedule')}</Typography>
                                    <AvTimerIcon sx={{ color: themeColors.text.secondary }} />
                                </Stack>
                                {upcomingSchedule.length ? (
                                    <List dense>
                                        {upcomingSchedule.map((item, index) => (
                                            <ListItem key={`${item.type}-${index}`} sx={{ borderBottom: index !== upcomingSchedule.length - 1 ? `1px solid ${themeColors.border.primary}` : 'none' }}>
                                                <ListItemText
                                                    primary={
                                                        <Typography variant="subtitle1" sx={{ color: themeColors.text.primary }}>
                                                            {item.title}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                <Typography 
                                                    variant="body2" 
                                                    sx={{ 
                                                        color: isDarkMode 
                                                            ? alpha('#ffffff', 0.85)
                                                            : themeColors.text.secondary,
                                                    }}
                                                >
                                                    {item.subject} • {formatDate(item.startDate, t)}
                                                </Typography>
                                                    }
                                                />
                                                <Chip label={item.type === 'assignment' ? t('teacher.selfDashboard.type.assignment') : t('teacher.selfDashboard.type.exam')} size="small" color={item.type === 'assignment' ? 'primary' : 'secondary'} />
                                            </ListItem>
                                        ))}
                                    </List>
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
                                        {t('teacher.selfDashboard.messages.noUpcomingEvents')}
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
                                <Typography variant="h6" sx={{ color: themeColors.text.primary }} gutterBottom>{t('teacher.selfDashboard.sections.recentAssignments')}</Typography>
                                {recentAssignments.length ? (
                                    <Stack spacing={2}>
                                        {recentAssignments.map((assignment, idx) => (
                                            <Box key={`recent-assignment-${idx}`}>
                                                <Typography variant="subtitle1" fontWeight={600} sx={{ color: themeColors.text.primary }}>
                                                    {assignment.title}
                                                </Typography>
                                                <Typography 
                                                    variant="body2" 
                                                    sx={{ 
                                                        color: isDarkMode 
                                                            ? alpha('#ffffff', 0.85)
                                                            : themeColors.text.secondary,
                                                    }}
                                                >
                                                    {assignment.subject} • {assignment.status === 'closed' ? t('teacher.selfDashboard.status.closed') : t('teacher.selfDashboard.status.ongoing')} • {formatDate(assignment.endDate || assignment.startDate, t)}
                                                </Typography>
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
                                        {t('teacher.selfDashboard.messages.noRecentAssignments')}
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
                                <Typography variant="h6" sx={{ color: themeColors.text.primary }} gutterBottom>{t('teacher.selfDashboard.sections.recentActivity')}</Typography>
                                {recentActivity.length ? (
                                    <Stack spacing={2}>
                                        {recentActivity.map((activity, idx) => (
                                            <Box key={`recent-activity-${idx}`}>
                                                <Typography variant="subtitle1" fontWeight={600} sx={{ color: themeColors.text.primary }}>
                                                    {activity.title}
                                                </Typography>
                                                <Typography 
                                                    variant="body2" 
                                                    sx={{ 
                                                        color: isDarkMode 
                                                            ? alpha('#ffffff', 0.85)
                                                            : themeColors.text.secondary,
                                                    }}
                                                >
                                                    {activity.type === 'assignment' ? t('teacher.selfDashboard.type.assignment') : t('teacher.selfDashboard.type.exam')} • {activity.subject} • {formatDateTime(activity.timestamp, t)}
                                                </Typography>
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
                                        {t('teacher.selfDashboard.messages.noRecentActivity')}
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

export default TeacherSelfDashboard;
