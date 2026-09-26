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
} from '@mui/material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SchoolIcon from '@mui/icons-material/School';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import QuizIcon from '@mui/icons-material/Quiz';
import CommuteIcon from '@mui/icons-material/Commute';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { useAbility } from '../../AbilityContext';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    DoughnutController,
    ArcElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import CustomOutletBox from '../../components/Common/CustomOutletBox';
import { getStudentDashboardStats } from '../../api/student';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    DoughnutController,
    ArcElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
);

const StudentsDashboard = () => {
    const { themeColors } = useThemeContext();
    const ability = useAbility();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const { data, isLoading, isFetching, error, refetch } = useQuery({
        queryKey: ['studentsDashboardStats'],
        queryFn: getStudentDashboardStats,
    });

    const dashboardData = data?.data;

    const summary = dashboardData?.summary || {
        totalStudents: 0,
        activeEnrollments: 0,
        inactiveEnrollments: 0,
        newAdmissions: 0,
        assignmentsCompleted: 0,
        examsCompleted: 0,
    };

    const genderDistribution = dashboardData?.genderDistribution || { male: 0, female: 0, other: 0, unknown: 0 };
    const gradeDistribution = dashboardData?.gradeDistribution || [];
    const sectionDistribution = dashboardData?.sectionDistribution || [];
    const transportUsage = dashboardData?.transportUsage || [];
    const admissionTimeline = dashboardData?.admissionTimeline || [];
    const assignmentStats = dashboardData?.assignmentStats || { total: 0, completed: 0, pending: 0 };
    const examStats = dashboardData?.examStats || { total: 0, completed: 0, pending: 0 };
    const performanceByGrade = dashboardData?.performanceByGrade || [];
    const topPerformers = dashboardData?.topPerformers || [];
    const recentAdmissions = dashboardData?.recentAdmissions || [];

    const summaryCards = useMemo(() => [
        {
            key: 'totalStudents',
            title: t('studentsDashboard.summaryCards.totalStudents'),
            value: summary.totalStudents,
            icon: <PeopleAltIcon fontSize="large" />,
            bg: themeColors.primary,
        },
        {
            key: 'activeEnrollments',
            title: t('studentsDashboard.summaryCards.activeEnrollments'),
            value: summary.activeEnrollments,
            icon: <SchoolIcon fontSize="large" />,
            bg: themeColors.success,
        },
        {
            key: 'newAdmissions',
            title: t('studentsDashboard.summaryCards.newAdmissions'),
            value: summary.newAdmissions,
            icon: <PersonAddAltIcon fontSize="large" />,
            bg: themeColors.accent,
        },
        {
            key: 'examsCompleted',
            title: t('studentsDashboard.summaryCards.examsCompleted'),
            value: summary.examsCompleted,
            icon: <QuizIcon fontSize="large" />,
            bg: themeColors.warning,
        },
    ], [summary, themeColors.primary, themeColors.success, themeColors.accent, themeColors.warning, t]);

    const genderChartData = useMemo(() => {
        const labels = [
            t('studentsDashboard.gender.male'),
            t('studentsDashboard.gender.female'),
            t('studentsDashboard.gender.other'),
            t('studentsDashboard.gender.unknown')
        ];
        const dataPoints = [
            genderDistribution.male || 0,
            genderDistribution.female || 0,
            genderDistribution.other || 0,
            genderDistribution.unknown || 0,
        ];
        const total = dataPoints.reduce((acc, val) => acc + val, 0);
        if (!total) return null;
        return {
            labels,
            datasets: [
                {
                    data: dataPoints,
                    backgroundColor: [
                        `${themeColors.primary}CC`,
                        `${themeColors.success}CC`,
                        `${themeColors.accent}CC`,
                        `${themeColors.warning}CC`,
                    ],
                    borderColor: [themeColors.primary, themeColors.success, themeColors.accent, themeColors.warning],
                    borderWidth: 1,
                },
            ],
        };
    }, [genderDistribution, themeColors, t]);

    const gradeChartData = useMemo(() => {
        if (!gradeDistribution.length) return null;
        const labels = gradeDistribution.map((item) => item.gradeName || t('studentsDashboard.fallback.unassigned'));
        const values = gradeDistribution.map((item) => item.count);
        return {
            labels,
            datasets: [
                {
                    label: t('studentsDashboard.chartLabels.students'),
                    data: values,
                    backgroundColor: labels.map((_, idx) => `${themeColors.primary}${idx % 2 ? 'AA' : '66'}`),
                    borderColor: themeColors.primary,
                    borderWidth: 1,
                },
            ],
        };
    }, [gradeDistribution, themeColors.primary, t]);

    const transportChartData = useMemo(() => {
        if (!transportUsage.length) return null;
        const labels = transportUsage.map((item) => item.label || t('studentsDashboard.fallback.notSpecified'));
        const values = transportUsage.map((item) => item.count);
        return {
            labels,
            datasets: [
                {
                    data: values,
                    backgroundColor: labels.map((_, idx) => {
                        const palette = [themeColors.primary, themeColors.success, themeColors.accent, themeColors.warning, themeColors.error];
                        return `${palette[idx % palette.length]}CC`;
                    }),
                    borderWidth: 1,
                    borderColor: labels.map((_, idx) => {
                        const palette = [themeColors.primary, themeColors.success, themeColors.accent, themeColors.warning, themeColors.error];
                        return palette[idx % palette.length];
                    }),
                },
            ],
        };
    }, [transportUsage, themeColors, t]);

    const admissionTimelineData = useMemo(() => {
        if (!admissionTimeline.length) return null;
        const labels = admissionTimeline.map((item) => item.month);
        const values = admissionTimeline.map((item) => item.value);
        return {
            labels,
            datasets: [
                {
                    label: t('studentsDashboard.chartLabels.newStudents'),
                    data: values,
                    borderColor: themeColors.primary,
                    backgroundColor: `${themeColors.primary}33`,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: themeColors.primary,
                },
            ],
        };
    }, [admissionTimeline, themeColors.primary, t]);

    const performanceChartData = useMemo(() => {
        if (!performanceByGrade.length) return null;
        const labels = performanceByGrade.map((item) => item.gradeName || t('studentsDashboard.fallback.unassigned'));
        const values = performanceByGrade.map((item) => Number(item.averagePercentage || 0));
        return {
            labels,
            datasets: [
                {
                    label: t('studentsDashboard.chartLabels.averagePercent'),
                    data: values,
                    backgroundColor: labels.map((_, idx) => `${themeColors.success}${idx % 2 ? 'AA' : '66'}`),
                    borderColor: themeColors.success,
                    borderWidth: 1,
                },
            ],
        };
    }, [performanceByGrade, themeColors.success, t]);

    const canCreateStudent = ability?.can('Create', 'Student');
    const canManageStudents = ability?.can('Read', 'Student');

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
        const message = error?.response?.data?.message || error?.message || t('studentsDashboard.messages.loadFailed');
        return (
            <CustomOutletBox>
                <Alert severity="error" sx={{ borderRadius: 3, mb: 2 }}>
                    {message}
                </Alert>
                <Button variant="contained" onClick={() => refetch()}>
                    {t('studentsDashboard.actions.retry')}
                </Button>
            </CustomOutletBox>
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
                            }}>
                                <CardContent>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Avatar sx={{ backgroundColor: card.bg, color: themeColors.text.inverse }}>
                                            {card.icon}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ color: themeColors.text.secondary }}>
                                                {card.title}
                                            </Typography>
                                            <Typography variant="h5" fontWeight={700} sx={{ color: themeColors.text.primary }}>
                                                {card.value ?? 0}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}

                    <Grid item xs={12} md={8}>
                        <Card sx={{ borderRadius: 3, border: `1px solid ${themeColors.border.primary}`, backgroundColor: themeColors.background.secondary }}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="h6" sx={{ color: themeColors.text.primary }}>{t('studentsDashboard.charts.admissionsTimeline')}</Typography>
                                    <Chip label={t('studentsDashboard.chips.last12Months')} size="small" variant="outlined" sx={{ color: themeColors.text.secondary, borderColor: themeColors.border.primary }} />
                                </Stack>
                                {admissionTimelineData ? (
                                    <Box sx={{ height: 260 }}>
                                        <Line
                                            data={admissionTimelineData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: { legend: { display: false } },
                                                scales: {
                                                    x: {
                                                        ticks: { color: themeColors.text.secondary },
                                                        grid: { color: themeColors.border.primary },
                                                    },
                                                    y: {
                                                        beginAtZero: true,
                                                        ticks: { color: themeColors.text.secondary, precision: 0 },
                                                        grid: { color: themeColors.border.primary },
                                                    },
                                                },
                                            }}
                                        />
                                    </Box>
                                ) : (
                                    <Alert severity="info" variant="outlined" sx={{ borderRadius: 2, color: themeColors.text.secondary, borderColor: themeColors.border.primary }}>
                                        {t('studentsDashboard.messages.noAdmissionsData')}
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card sx={{ borderRadius: 3, border: `1px solid ${themeColors.border.primary}`, backgroundColor: themeColors.background.secondary }}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="h6" sx={{ color: themeColors.text.primary }}>{t('studentsDashboard.charts.genderSplit')}</Typography>
                                    <Chip label={t('studentsDashboard.chartLabels.students')} size="small" variant="outlined" sx={{ color: themeColors.text.secondary, borderColor: themeColors.border.primary }} />
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
                                                        labels: { color: themeColors.text.primary },
                                                    },
                                                },
                                            }}
                                        />
                                    </Box>
                                ) : (
                                    <Alert severity="info" variant="outlined" sx={{ borderRadius: 2, color: themeColors.text.secondary, borderColor: themeColors.border.primary }}>
                                        {t('studentsDashboard.messages.noGenderData')}
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card sx={{ borderRadius: 3, border: `1px solid ${themeColors.border.primary}`, backgroundColor: themeColors.background.secondary }}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="h6" sx={{ color: themeColors.text.primary }}>{t('studentsDashboard.charts.gradeDistribution')}</Typography>
                                    <Chip label={t('studentsDashboard.chips.grades')} size="small" variant="outlined" sx={{ color: themeColors.text.secondary, borderColor: themeColors.border.primary }} />
                                </Stack>
                                {gradeChartData ? (
                                    <Box sx={{ height: 260 }}>
                                        <Bar
                                            data={gradeChartData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: { legend: { display: false } },
                                                scales: {
                                                    x: {
                                                        ticks: { color: themeColors.text.secondary },
                                                        grid: { color: themeColors.border.primary },
                                                    },
                                                    y: {
                                                        beginAtZero: true,
                                                        ticks: { color: themeColors.text.secondary, precision: 0 },
                                                        grid: { color: themeColors.border.primary },
                                                    },
                                                },
                                            }}
                                        />
                                    </Box>
                                ) : (
                                    <Alert severity="info" variant="outlined" sx={{ borderRadius: 2, color: themeColors.text.secondary, borderColor: themeColors.border.primary }}>
                                        {t('studentsDashboard.messages.noGradeDistributionData')}
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card sx={{ borderRadius: 3, border: `1px solid ${themeColors.border.primary}`, backgroundColor: themeColors.background.secondary }}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="h6" sx={{ color: themeColors.text.primary }}>{t('studentsDashboard.charts.performanceByGrade')}</Typography>
                                    <Chip label={t('studentsDashboard.chartLabels.averagePercent')} size="small" variant="outlined" sx={{ color: themeColors.text.secondary, borderColor: themeColors.border.primary }} />
                                </Stack>
                                {performanceChartData ? (
                                    <Box sx={{ height: 260 }}>
                                        <Bar
                                            data={performanceChartData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: { legend: { display: false } },
                                                scales: {
                                                    x: {
                                                        ticks: { color: themeColors.text.secondary },
                                                        grid: { color: themeColors.border.primary },
                                                    },
                                                    y: {
                                                        beginAtZero: true,
                                                        ticks: { color: themeColors.text.secondary },
                                                        grid: { color: themeColors.border.primary },
                                                    },
                                                },
                                            }}
                                        />
                                    </Box>
                                ) : (
                                    <Alert severity="info" variant="outlined" sx={{ borderRadius: 2, color: themeColors.text.secondary, borderColor: themeColors.border.primary }}>
                                        {t('studentsDashboard.messages.noPerformanceData')}
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card sx={{ borderRadius: 3, border: `1px solid ${themeColors.border.primary}`, backgroundColor: themeColors.background.secondary }}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="h6" sx={{ color: themeColors.text.primary }}>{t('studentsDashboard.charts.transportUsage')}</Typography>
                                    <CommuteIcon sx={{ color: themeColors.text.secondary }} />
                                </Stack>
                                {transportChartData ? (
                                    <Box sx={{ height: 260 }}>
                                        <Doughnut
                                            data={transportChartData}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                                plugins: {
                                                    legend: {
                                                        position: 'bottom',
                                                        labels: { color: themeColors.text.primary },
                                                    },
                                                },
                                            }}
                                        />
                                    </Box>
                                ) : (
                                    <Alert severity="info" variant="outlined" sx={{ borderRadius: 2, color: themeColors.text.secondary, borderColor: themeColors.border.primary }}>
                                        {t('studentsDashboard.messages.noTransportData')}
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card sx={{ borderRadius: 3, border: `1px solid ${themeColors.border.primary}`, backgroundColor: themeColors.background.secondary }}>
                            <CardContent>
                                <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                                    <AssignmentTurnedInIcon sx={{ color: themeColors.primary }} />
                                    <Typography variant="h6" sx={{ color: themeColors.text.primary }}>{t('studentsDashboard.sections.assignmentProgress')}</Typography>
                                </Stack>
                                <Stack spacing={1.5}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography sx={{ color: themeColors.text.secondary }}>{t('studentsDashboard.labels.totalAssignments')}</Typography>
                                        <Chip label={assignmentStats.total || 0} size="small" />
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography sx={{ color: themeColors.text.secondary }}>{t('studentsDashboard.labels.completed')}</Typography>
                                        <Chip label={assignmentStats.completed || 0} size="small" color="success" />
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography sx={{ color: themeColors.text.secondary }}>{t('studentsDashboard.labels.pending')}</Typography>
                                        <Chip label={assignmentStats.pending || 0} size="small" color="warning" />
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card sx={{ borderRadius: 3, border: `1px solid ${themeColors.border.primary}`, backgroundColor: themeColors.background.secondary }}>
                            <CardContent>
                                <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                                    <QuizIcon sx={{ color: themeColors.primary }} />
                                    <Typography variant="h6" sx={{ color: themeColors.text.primary }}>{t('studentsDashboard.sections.onlineExamProgress')}</Typography>
                                </Stack>
                                <Stack spacing={1.5}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography sx={{ color: themeColors.text.secondary }}>{t('studentsDashboard.labels.totalExams')}</Typography>
                                        <Chip label={examStats.total || 0} size="small" />
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography sx={{ color: themeColors.text.secondary }}>{t('studentsDashboard.labels.completed')}</Typography>
                                        <Chip label={examStats.completed || 0} size="small" color="success" />
                                    </Stack>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography sx={{ color: themeColors.text.secondary }}>{t('studentsDashboard.labels.pending')}</Typography>
                                        <Chip label={examStats.pending || 0} size="small" color="warning" />
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card sx={{ borderRadius: 3, border: `1px solid ${themeColors.border.primary}`, backgroundColor: themeColors.background.secondary }}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="h6" sx={{ color: themeColors.text.primary }}>{t('studentsDashboard.sections.topPerformers')}</Typography>
                                    {canManageStudents && (
                                        <Button variant="text" size="small" sx={{ color: themeColors.primary }} onClick={() => navigate('/student/list')}>
                                            {t('studentsDashboard.actions.manageStudents')}
                                        </Button>
                                    )}
                                </Stack>
                                {topPerformers.length ? (
                                    <Stack spacing={2}>
                                        {topPerformers.map((student) => (
                                            <Box key={student.studentId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography variant="subtitle1" fontWeight={600} sx={{ color: themeColors.text.primary }}>
                                                        {student.studentName}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                        {student.studentCode} • {student.gradeName} {student.sectionName ? `(${student.sectionName})` : ''}
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    label={`${student.averagePercentage}%`}
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            </Box>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Alert severity="info" variant="outlined" sx={{ borderRadius: 2, color: themeColors.text.secondary, borderColor: themeColors.border.primary }}>
                                        {t('studentsDashboard.messages.noPerformanceDataAvailable')}
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card sx={{ borderRadius: 3, border: `1px solid ${themeColors.border.primary}`, backgroundColor: themeColors.background.secondary }}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="h6" sx={{ color: themeColors.text.primary }}>{t('studentsDashboard.sections.recentAdmissions')}</Typography>
                                    {canCreateStudent && (
                                        <Button
                                            variant="contained"
                                            size="small"
                                            onClick={() => navigate('/student/add', { state: { mode: 'add' } })}
                                            sx={{ backgroundColor: themeColors.primary, color: themeColors.text.inverse, '&:hover': { backgroundColor: themeColors.primaryHover || themeColors.primary } }}
                                        >
                                            {t('studentsDashboard.actions.addStudent')}
                                        </Button>
                                    )}
                                </Stack>
                                {recentAdmissions.length ? (
                                    <Stack spacing={2}>
                                        {recentAdmissions.map((student) => (
                                            <Box key={student.studentId} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography variant="subtitle1" fontWeight={600} sx={{ color: themeColors.text.primary }}>
                                                        {student.studentName}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                        {student.studentCode} • {student.gradeName} {student.sectionName ? `(${student.sectionName})` : ''}
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    label={student.admissionDate ? new Date(student.admissionDate).toLocaleDateString('en-GB') : t('studentProfile.fallback.na')}
                                                    size="small"
                                                />
                                            </Box>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Alert severity="info" variant="outlined" sx={{ borderRadius: 2, color: themeColors.text.secondary, borderColor: themeColors.border.primary }}>
                                        {t('studentsDashboard.messages.noAdmissionsRecorded')}
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Card sx={{ borderRadius: 3, border: `1px solid ${themeColors.border.primary}`, backgroundColor: themeColors.background.secondary }}>
                            <CardContent>
                                <Typography variant="h6" sx={{ color: themeColors.text.primary }} mb={2}>{t('studentsDashboard.sections.sectionDistribution')}</Typography>
                                {sectionDistribution.length ? (
                                    <Stack spacing={1.5}>
                                        {sectionDistribution.slice(0, 8).map((item) => (
                                            <Stack key={item.sectionId || item.sectionName} direction="row" justifyContent="space-between" alignItems="center">
                                                <Typography variant="body1" sx={{ color: themeColors.text.primary }}>
                                                    {item.sectionName}
                                                </Typography>
                                                <Chip label={item.count} size="small" />
                                            </Stack>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Alert severity="info" variant="outlined" sx={{ borderRadius: 2, color: themeColors.text.secondary, borderColor: themeColors.border.primary }}>
                                        {t('studentsDashboard.messages.noSectionDistributionData')}
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

export default StudentsDashboard;
