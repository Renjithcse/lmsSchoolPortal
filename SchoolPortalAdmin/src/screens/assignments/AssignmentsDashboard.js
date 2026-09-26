import React, { useMemo } from 'react';
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Grid,
    LinearProgress,
    Stack,
    Typography,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import TimelineIcon from '@mui/icons-material/Timeline';
import SchoolIcon from '@mui/icons-material/School';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PublishIcon from '@mui/icons-material/Publish';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    Title as ChartTitle,
    Tooltip as ChartTooltip,
} from 'chart.js';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useAbility } from '../../AbilityContext';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useListAssignmentsQuery } from '../../Redux/features/assignmentSlice';
import { useGetAcademicYearQuery } from '../../Redux/features/commonSlice';
import { useGetMyGradePermissionsQuery } from '../../Redux/features/Admin/TeachersSlice';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ChartTitle,
    ChartTooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

const AssignmentsDashboard = () => {
    const { themeColors } = useThemeContext();
    const ability = useAbility();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const {
        data: assignmentsResponse,
        isLoading,
        isFetching,
        error,
    } = useListAssignmentsQuery({});

    const { data: academicYears, isFetching: academicYearLoading } = useGetAcademicYearQuery();
    const { data: gradePermissions, isLoading: gradeLoading } = useGetMyGradePermissionsQuery();

    const assignments = useMemo(
        () => assignmentsResponse?.data || [],
        [assignmentsResponse]
    );

    const academicYearMap = useMemo(() => {
        const map = new Map();
        (academicYears || []).forEach((year) => {
            if (year?._id) {
                map.set(year._id, year.academicYear);
            }
        });
        return map;
    }, [academicYears]);

    const gradeMap = useMemo(() => {
        const map = new Map();
        (gradePermissions?.data || []).forEach((grade) => {
            if (grade?._id) {
                map.set(grade._id, grade.gradeName);
            }
        });
        return map;
    }, [gradePermissions]);

    const statistics = useMemo(() => {
        const totalAssignments = assignments.length;
        const activeAssignments = assignments.filter(
            (item) => (item?.status || 'active').toLowerCase() === 'active'
        ).length;
        const assignmentsThisMonth = assignments.filter((item) =>
            item?.createdAt ? dayjs(item.createdAt).isSame(dayjs(), 'month') : false
        ).length;

        const uniqueTerms = new Set(
            assignments.map((item) => (item?.term || t('assignments.dashboard.unassigned')).trim())
        ).size;

        const uniqueSubjects = new Set(
            assignments.map((item) => {
                if (!item?.subjectId) return t('assignments.dashboard.unassigned');
                if (typeof item.subjectId === 'object' && item.subjectId !== null) {
                    return item.subjectId._id || JSON.stringify(item.subjectId);
                }
                return item.subjectId;
            })
        ).size;

        return {
            totalAssignments,
            activeAssignments,
            assignmentsThisMonth,
            uniqueTerms,
            uniqueSubjects,
        };
    }, [assignments]);

    const assignmentsByTerm = useMemo(() => {
        return assignments.reduce((acc, item) => {
            const termLabel = (item?.term || t('assignments.dashboard.unassigned')).trim();
            acc[termLabel] = (acc[termLabel] || 0) + 1;
            return acc;
        }, {});
    }, [assignments, t]);

    const assignmentsByGrade = useMemo(() => {
        return assignments.reduce((acc, item) => {
            const gradeId = item?.grade;
            let label = t('assignments.dashboard.unassigned');
            if (gradeId) {
                label = gradeMap.get(gradeId) || t('assignments.dashboard.gradeFallback', { id: String(gradeId).slice(-4) });
            }
            acc[label] = (acc[label] || 0) + 1;
            return acc;
        }, {});
    }, [assignments, gradeMap, t]);

    const assignmentsByAcademicYear = useMemo(() => {
        return assignments.reduce((acc, item) => {
            const yearId = item?.academicYear;
            let label = t('assignments.dashboard.unassigned');
            if (yearId) {
                label = academicYearMap.get(yearId) || t('assignments.dashboard.yearFallback', { id: String(yearId).slice(-4) });
            }
            acc[label] = (acc[label] || 0) + 1;
            return acc;
        }, {});
    }, [assignments, academicYearMap, t]);

    const assignmentsTimeline = useMemo(() => {
        const counts = assignments.reduce((acc, item) => {
            if (!item?.createdAt) return acc;
            const label = dayjs(item.createdAt).format('MMM YYYY');
            acc[label] = (acc[label] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(counts)
            .map(([label, value]) => ({
                label,
                value,
                order: dayjs(label, 'MMM YYYY').valueOf(),
            }))
            .sort((a, b) => a.order - b.order);
    }, [assignments]);

    const chartOptions = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: themeColors.text.primary,
                    },
                },
            },
            scales: {
                x: {
                    ticks: { color: themeColors.text.primary },
                    grid: { color: `${themeColors.border.primary}55` },
                },
                y: {
                    ticks: { color: themeColors.text.primary },
                    grid: { color: `${themeColors.border.primary}55` },
                    beginAtZero: true,
                    precision: 0,
                },
            },
        }),
        [themeColors]
    );

    const timelineOptions = useMemo(
        () => ({
            ...chartOptions,
            scales: {
                x: {
                    ticks: { color: themeColors.text.primary },
                    grid: { color: `${themeColors.border.primary}33` },
                },
                y: {
                    ticks: { color: themeColors.text.primary },
                    grid: { color: `${themeColors.border.primary}33` },
                    beginAtZero: true,
                    precision: 0,
                },
            },
        }),
        [chartOptions, themeColors]
    );

    const termChartData = useMemo(() => {
        const labels = Object.keys(assignmentsByTerm);
        const data = labels.map((label) => assignmentsByTerm[label]);

        return {
            labels,
            datasets: [
                {
                    label: t('assignments.dashboard.charts.assignmentsPerTerm'),
                    data,
                    backgroundColor: labels.map((_, idx) =>
                        `${themeColors.primary}${idx % 2 ? '66' : '99'}`
                    ),
                    borderColor: themeColors.primary,
                    borderWidth: 1,
                },
            ],
        };
    }, [assignmentsByTerm, themeColors.primary, t]);

    const gradeChartData = useMemo(() => {
        const labels = Object.keys(assignmentsByGrade);
        const data = labels.map((label) => assignmentsByGrade[label]);

        return {
            labels,
            datasets: [
                {
                    label: t('assignments.dashboard.charts.assignmentsPerGrade'),
                    data,
                    backgroundColor: labels.map((_, idx) =>
                        `${themeColors.accent}${idx % 2 ? '66' : 'AA'}`
                    ),
                    borderColor: themeColors.accent,
                    borderWidth: 1,
                },
            ],
        };
    }, [assignmentsByGrade, themeColors.accent, t]);

    const academicYearChartData = useMemo(() => {
        const labels = Object.keys(assignmentsByAcademicYear);
        const data = labels.map((label) => assignmentsByAcademicYear[label]);

        return {
            labels,
            datasets: [
                {
                    data,
                    backgroundColor: labels.map((_, idx) => {
                        const colors = [
                            themeColors.primary,
                            themeColors.accent,
                            themeColors.success,
                            themeColors.warning,
                            themeColors.error,
                        ];
                        return `${colors[idx % colors.length]}AA`;
                    }),
                    borderColor: labels.map((_, idx) => {
                        const colors = [
                            themeColors.primary,
                            themeColors.accent,
                            themeColors.success,
                            themeColors.warning,
                            themeColors.error,
                        ];
                        return colors[idx % colors.length];
                    }),
                    borderWidth: 1,
                },
            ],
        };
    }, [assignmentsByAcademicYear, themeColors]);

    const timelineChartData = useMemo(() => {
        const labels = assignmentsTimeline.map((item) => item.label);
        const data = assignmentsTimeline.map((item) => item.value);

        return {
            labels,
            datasets: [
                {
                    label: t('assignments.dashboard.charts.assignmentsCreated'),
                    data,
                    borderColor: themeColors.primary,
                    backgroundColor: `${themeColors.primary}33`,
                    fill: true,
                    tension: 0.35,
                },
            ],
        };
    }, [assignmentsTimeline, themeColors.primary, t]);

    const quickActions = useMemo(() => {
        const actions = [
            {
                title: t('assignments.dashboard.quickActions.create.title'),
                description: t('assignments.dashboard.quickActions.create.description'),
                icon: AddCircleOutlineIcon,
                color: themeColors.primary,
                permission: { action: 'Create', subject: 'Assignments' },
                onClick: () => navigate('/assignments/list', { state: { openCreate: true } }),
            },
            {
                title: t('assignments.dashboard.quickActions.manage.title'),
                description: t('assignments.dashboard.quickActions.manage.description'),
                icon: ListAltIcon,
                color: themeColors.accent,
                permission: { action: 'Read', subject: 'Assignments' },
                onClick: () => navigate('/assignments/list'),
            },
            {
                title: t('assignments.dashboard.quickActions.published.title'),
                description: t('assignments.dashboard.quickActions.published.description'),
                icon: PublishIcon,
                color: themeColors.success,
                permission: { action: 'Read', subject: 'PublishedAssignments' },
                onClick: () => navigate('/assignments/list', { state: { tab: 'published' } }),
            },
        ];

        return actions.filter((action) =>
            ability.can(action.permission.action, action.permission.subject)
        );
    }, [ability, navigate, themeColors, t]);

    const isBusy = isLoading || isFetching || academicYearLoading || gradeLoading;

    const handleNavigateToList = () => {
        navigate('/assignments/list');
    };

    return (
        <Box sx={{ py: 2 }}>
            <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
                flexWrap="wrap"
                gap={2}
            >
                <Box>
                    <Typography
                        variant="h4"
                        fontWeight="bold"
                        sx={{ color: themeColors.text.primary }}
                    >
                        {t('assignments.dashboard.title')}
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{ color: themeColors.text.secondary }}
                    >
                        {t('assignments.dashboard.subtitle')}
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                    {ability.can('Read', 'Assignments') && <Button
                        variant="outlined"
                        onClick={handleNavigateToList}
                        sx={{
                            borderColor: themeColors.primary,
                            color: themeColors.primary,
                            '&:hover': {
                                borderColor: themeColors.primary,
                                backgroundColor: `${themeColors.primary}14`,
                            },
                        }}
                    >
                        {t('assignments.dashboard.actions.manage')}
                    </Button>}
                    {ability.can('Create', 'Assignments') && (
                        <Button
                            variant="contained"
                            onClick={() => navigate('/assignments/list', { state: { openCreate: true } })}
                            sx={{
                                backgroundColor: themeColors.primary,
                                color: '#fff',
                                '&:hover': {
                                    backgroundColor: themeColors.accent,
                                },
                            }}
                        >
                            {t('assignments.dashboard.actions.create')}
                        </Button>
                    )}
                </Stack>
            </Box>

            {isBusy && (
                <Card
                    sx={{
                        mb: 3,
                        backgroundColor: themeColors.background.primary,
                        border: `1px solid ${themeColors.border.primary}`,
                    }}
                >
                    <CardContent>
                        <LinearProgress sx={{ mb: 2 }} />
                        <Typography sx={{ color: themeColors.text.secondary }}>
                            {t('assignments.dashboard.messages.loading')}
                        </Typography>
                    </CardContent>
                </Card>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {t('assignments.dashboard.messages.fetchError')}
                </Alert>
            )}

            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card
                        sx={{
                            backgroundColor: themeColors.background.primary,
                            border: `1px solid ${themeColors.border.primary}`,
                        }}
                    >
                        <CardContent>
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Avatar sx={{ bgcolor: `${themeColors.primary}22`, color: themeColors.primary }}>
                                    <AssignmentIcon />
                                </Avatar>
                                <Box>
                                    <Typography
                                        variant="h5"
                                        fontWeight="bold"
                                        sx={{ color: themeColors.text.primary }}
                                    >
                                        {statistics.totalAssignments}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{ color: themeColors.text.secondary }}
                                    >
                                        {t('assignments.dashboard.stats.total')}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card
                        sx={{
                            backgroundColor: themeColors.background.primary,
                            border: `1px solid ${themeColors.border.primary}`,
                        }}
                    >
                        <CardContent>
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Avatar sx={{ bgcolor: `${themeColors.success}22`, color: themeColors.success }}>
                                    <PlaylistAddCheckIcon />
                                </Avatar>
                                <Box>
                                    <Typography
                                        variant="h5"
                                        fontWeight="bold"
                                        sx={{ color: themeColors.text.primary }}
                                    >
                                        {statistics.activeAssignments}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{ color: themeColors.text.secondary }}
                                    >
                                        {t('assignments.dashboard.stats.active')}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card
                        sx={{
                            backgroundColor: themeColors.background.primary,
                            border: `1px solid ${themeColors.border.primary}`,
                        }}
                    >
                        <CardContent>
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Avatar sx={{ bgcolor: `${themeColors.accent}22`, color: themeColors.accent }}>
                                    <TimelineIcon />
                                </Avatar>
                                <Box>
                                    <Typography
                                        variant="h5"
                                        fontWeight="bold"
                                        sx={{ color: themeColors.text.primary }}
                                    >
                                        {statistics.assignmentsThisMonth}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{ color: themeColors.text.secondary }}
                                    >
                                        {t('assignments.dashboard.stats.thisMonth')}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card
                        sx={{
                            backgroundColor: themeColors.background.primary,
                            border: `1px solid ${themeColors.border.primary}`,
                        }}
                    >
                        <CardContent>
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Avatar sx={{ bgcolor: `${themeColors.warning}22`, color: themeColors.warning }}>
                                    <SchoolIcon />
                                </Avatar>
                                <Box>
                                    <Typography
                                        variant="h5"
                                        fontWeight="bold"
                                        sx={{ color: themeColors.text.primary }}
                                    >
                                        {statistics.uniqueTerms}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{ color: themeColors.text.secondary }}
                                    >
                                        {t('assignments.dashboard.stats.termsCovered')}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {!!quickActions.length && (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    {quickActions.map((action) => (
                        <Grid item xs={12} sm={6} md={4} key={action.title}>
                            <Card
                                sx={{
                                    backgroundColor: themeColors.background.primary,
                                    border: `1px solid ${themeColors.border.primary}`,
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <CardContent>
                                    <Stack direction="column" spacing={2} alignItems="center" textAlign="center">
                                        <Avatar
                                            sx={{
                                                bgcolor: `${action.color}22`,
                                                color: action.color,
                                                width: 56,
                                                height: 56,
                                            }}
                                        >
                                            <action.icon />
                                        </Avatar>
                                        <Box>
                                            <Typography
                                                variant="h6"
                                                fontWeight="bold"
                                                sx={{ color: themeColors.text.primary, mb: 1 }}
                                            >
                                                {action.title}
                                            </Typography>
                                            <Typography
                                                variant="body2"
                                                sx={{ color: themeColors.text.secondary }}
                                            >
                                                {action.description}
                                            </Typography>
                                        </Box>
                                        <Button
                                            variant="outlined"
                                            onClick={action.onClick}
                                            sx={{
                                                borderColor: action.color,
                                                color: action.color,
                                                '&:hover': {
                                                    borderColor: action.color,
                                                    backgroundColor: `${action.color}14`,
                                                },
                                            }}
                                        >
                                            {t('assignments.dashboard.quickActions.explore')}
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {!isBusy && assignments.length === 0 && (
                <Alert severity="info">
                    {t('assignments.dashboard.messages.noAssignments')}
                </Alert>
            )}

            {assignments.length > 0 && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card
                            sx={{
                                height: 360,
                                backgroundColor: themeColors.background.primary,
                                border: `1px solid ${themeColors.border.primary}`,
                            }}
                        >
                            <CardContent sx={{ height: '100%' }}>
                                <Typography
                                    variant="h6"
                                    fontWeight="bold"
                                    sx={{ color: themeColors.text.primary, mb: 2 }}
                                >
                                    {t('assignments.dashboard.charts.byTerm')}
                                </Typography>
                                <Box sx={{ height: 280 }}>
                                    <Bar data={termChartData} options={chartOptions} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card
                            sx={{
                                height: 360,
                                backgroundColor: themeColors.background.primary,
                                border: `1px solid ${themeColors.border.primary}`,
                            }}
                        >
                            <CardContent sx={{ height: '100%' }}>
                                <Typography
                                    variant="h6"
                                    fontWeight="bold"
                                    sx={{ color: themeColors.text.primary, mb: 2 }}
                                >
                                    {t('assignments.dashboard.charts.byGrade')}
                                </Typography>
                                <Box sx={{ height: 280 }}>
                                    <Bar data={gradeChartData} options={chartOptions} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card
                            sx={{
                                height: 360,
                                backgroundColor: themeColors.background.primary,
                                border: `1px solid ${themeColors.border.primary}`,
                            }}
                        >
                            <CardContent sx={{ height: '100%' }}>
                                <Typography
                                    variant="h6"
                                    fontWeight="bold"
                                    sx={{ color: themeColors.text.primary, mb: 2 }}
                                >
                                    {t('assignments.dashboard.charts.academicYearCoverage')}
                                </Typography>
                                <Box
                                    sx={{
                                        height: 280,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Doughnut data={academicYearChartData} options={{ ...chartOptions, scales: {} }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card
                            sx={{
                                height: 360,
                                backgroundColor: themeColors.background.primary,
                                border: `1px solid ${themeColors.border.primary}`,
                            }}
                        >
                            <CardContent sx={{ height: '100%' }}>
                                <Typography
                                    variant="h6"
                                    fontWeight="bold"
                                    sx={{ color: themeColors.text.primary, mb: 2 }}
                                >
                                    {t('assignments.dashboard.charts.creationTrend')}
                                </Typography>
                                <Box sx={{ height: 280 }}>
                                    <Line data={timelineChartData} options={timelineOptions} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default AssignmentsDashboard;

