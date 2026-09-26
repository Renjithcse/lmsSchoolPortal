import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import SchoolIcon from '@mui/icons-material/School';
import AssessmentIcon from '@mui/icons-material/Assessment';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import ListAltIcon from '@mui/icons-material/ListAlt';
import dayjs from 'dayjs';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
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

import { useAbility } from '../../AbilityContext';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { useLazyListExamsQuery } from '../../Redux/features/MarkEntry';
import Header from '../../components/ExamMark/Header';
import { useTranslation } from 'react-i18next';

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

const ExamMarkDashboard = () => {
    const { themeColors } = useThemeContext();
    const ability = useAbility();
    const { t } = useTranslation();
    const filterRef = useRef(null);
    const [filterTarget, setFilterTarget] = useState('/exammark/category');

    const [fetchExams, { data: examsResponse, isFetching, isLoading, error }] = useLazyListExamsQuery();

    useEffect(() => {
        fetchExams({})
            .unwrap()
            .catch(() => {
                /* silence errors, handled via message */
            });
    }, [fetchExams]);

    const exams = useMemo(
        () => Array.isArray(examsResponse?.data) ? examsResponse.data : [],
        [examsResponse]
    );

    const statistics = useMemo(() => {
        if (!exams.length) {
            return {
                totalExams: 0,
                upcomingExams: 0,
                publishedExams: 0,
                uniqueGrades: 0,
            };
        }

        const totalExams = exams.length;
        const upcomingExams = exams.filter(exam => exam?.examDate && dayjs(exam.examDate).isAfter(dayjs(), 'day')).length;
        const publishedExams = exams.filter(exam => exam?.publishDate).length;
        const uniqueGrades = new Set(
            exams.map(exam => exam?.grade?.gradeName || exam?.gradeName || t('examMarkDashboard.unassignedGrade'))
        ).size;

        return {
            totalExams,
            upcomingExams,
            publishedExams,
            uniqueGrades,
        };
    }, [exams]);

    const examsByGrade = useMemo(() => {
        return exams.reduce((acc, exam) => {
            const gradeLabel = exam?.grade?.gradeName || exam?.gradeName || t('examMarkDashboard.unassignedGrade');
            acc[gradeLabel] = (acc[gradeLabel] || 0) + 1;
            return acc;
        }, {});
    }, [exams, t]);

    const examsBySubject = useMemo(() => {
        return exams.reduce((acc, exam) => {
            const subjectLabel = exam?.subject?.subjectName || exam?.subjectName || t('examMarkDashboard.unassignedSubject');
            acc[subjectLabel] = (acc[subjectLabel] || 0) + 1;
            return acc;
        }, {});
    }, [exams, t]);

    const examsTimeline = useMemo(() => {
        const counts = exams.reduce((acc, exam) => {
            if (!exam?.createdAt) return acc;
            const monthLabel = dayjs(exam.createdAt).format('MMM YYYY');
            acc[monthLabel] = (acc[monthLabel] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(counts)
            .map(([label, value]) => ({
                label,
                value,
                order: dayjs(label, 'MMM YYYY').valueOf(),
            }))
            .sort((a, b) => a.order - b.order);
    }, [exams]);

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

    const gradeChartData = useMemo(() => {
        const labels = Object.keys(examsByGrade);
        const values = labels.map(label => examsByGrade[label]);

        return {
            labels,
            datasets: [
                {
                    label: t('examMarkDashboard.charts.examsPerGrade'),
                    data: values,
                    backgroundColor: labels.map((_, idx) =>
                        `${themeColors.primary}${idx % 2 ? '66' : '99'}`
                    ),
                    borderColor: themeColors.primary,
                    borderWidth: 1,
                },
            ],
        };
    }, [examsByGrade, themeColors.primary, t]);

    const subjectChartData = useMemo(() => {
        const labels = Object.keys(examsBySubject);
        const values = labels.map(label => examsBySubject[label]);

        const palette = [
            themeColors.primary,
            themeColors.accent,
            themeColors.success,
            themeColors.warning,
            themeColors.error,
        ];

        return {
            labels,
            datasets: [
                {
                    data: values,
                    backgroundColor: labels.map((_, idx) => `${palette[idx % palette.length]}AA`),
                    borderColor: labels.map((_, idx) => palette[idx % palette.length]),
                    borderWidth: 1,
                },
            ],
        };
    }, [examsBySubject, themeColors]);

    const timelineChartData = useMemo(() => {
        const labels = examsTimeline.map(item => item.label);
        const values = examsTimeline.map(item => item.value);

        return {
            labels,
            datasets: [
                {
                    label: t('examMarkDashboard.charts.examsCreated'),
                    data: values,
                    borderColor: themeColors.primary,
                    backgroundColor: `${themeColors.primary}33`,
                    fill: true,
                    tension: 0.35,
                },
            ],
        };
    }, [examsTimeline, themeColors.primary, t]);

    const handleNavigateWithFilters = useCallback((route) => {
        setFilterTarget(route);
        if (filterRef.current) {
            filterRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);

    const quickActions = useMemo(() => {
        const actions = [
            {
                title: t('examMarkDashboard.quickActions.manageCategories.title'),
                description: t('examMarkDashboard.quickActions.manageCategories.description'),
                icon: PlaylistAddIcon,
                color: themeColors.primary,
                permission: { action: 'Read', subject: 'ExamMark' },
                onClick: () => handleNavigateWithFilters('/exammark/category'),
            },
            {
                title: t('examMarkDashboard.quickActions.enterMarks.title'),
                description: t('examMarkDashboard.quickActions.enterMarks.description'),
                icon: ListAltIcon,
                color: themeColors.accent,
                permission: { action: 'Read', subject: 'ExamMark' },
                onClick: () => handleNavigateWithFilters('/exammark/mark-entry'),
            },
        ];

        return actions.filter(action =>
            ability.can(action.permission.action, action.permission.subject)
        );
    }, [ability, handleNavigateWithFilters, themeColors, t]);

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
                    <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                        {t('examMarkDashboard.title')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                        {t('examMarkDashboard.subtitle')}
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                    {ability.can('Read', 'ExamMark') && (
                        <Button
                            variant="outlined"
                            onClick={() => handleNavigateWithFilters('/exammark/category')}
                            sx={{
                                borderColor: themeColors.primary,
                                color: themeColors.primary,
                                '&:hover': {
                                    borderColor: themeColors.primary,
                                    backgroundColor: `${themeColors.primary}14`,
                                },
                            }}
                        >
                            {t('examMarkDashboard.actions.manageCategories')}
                        </Button>
                    )}
                    {ability.can('Read', 'ExamMark') && (
                        <Button
                            variant="contained"
                            onClick={() => handleNavigateWithFilters('/exammark/mark-entry')}
                            sx={{
                                backgroundColor: themeColors.primary,
                                color: '#fff',
                                '&:hover': {
                                    backgroundColor: themeColors.accent,
                                },
                            }}
                        >
                            {t('examMarkDashboard.actions.enterMarks')}
                        </Button>
                    )}
                </Stack>
            </Box>

            {(isLoading || isFetching) && (
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
                            {t('examMarkDashboard.loading')}
                        </Typography>
                    </CardContent>
                </Card>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {t('examMarkDashboard.messages.error')}
                </Alert>
            )}

            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                        <CardContent>
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Avatar sx={{ bgcolor: `${themeColors.primary}22`, color: themeColors.primary }}>
                                    <AssessmentIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="h5" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                        {statistics.totalExams}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        {t('examMarkDashboard.stats.totalExams')}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                        <CardContent>
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Avatar sx={{ bgcolor: `${themeColors.accent}22`, color: themeColors.accent }}>
                                    <EventAvailableIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="h5" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                        {statistics.upcomingExams}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        {t('examMarkDashboard.stats.upcomingExams')}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                        <CardContent>
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Avatar sx={{ bgcolor: `${themeColors.success}22`, color: themeColors.success }}>
                                    <PlaylistAddIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="h5" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                        {statistics.publishedExams}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        {t('examMarkDashboard.stats.publishedExams')}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                        <CardContent>
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Avatar sx={{ bgcolor: `${themeColors.warning}22`, color: themeColors.warning }}>
                                    <SchoolIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="h5" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                        {statistics.uniqueGrades}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        {t('examMarkDashboard.stats.gradesCovered')}
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {!!quickActions.length && (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    {quickActions.map(action => (
                        <Grid item xs={12} sm={6} md={4} key={action.title}>
                            <Card
                                sx={{
                                    backgroundColor: themeColors.background.primary,
                                    border: `1px solid ${themeColors.border.primary}`,
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Stack spacing={2} alignItems="center" textAlign="center">
                                        <Avatar sx={{ bgcolor: `${action.color}22`, color: action.color, width: 56, height: 56 }}>
                                            <action.icon />
                                        </Avatar>
                                        <Box>
                                            <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 1 }}>
                                                {action.title}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
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
                                            {t('examMarkDashboard.actions.explore')}
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {!isLoading && !isFetching && exams.length === 0 && !error && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    {t('examMarkDashboard.messages.noData')}
                </Alert>
            )}

            {exams.length > 0 && (
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={6}>
                        <Card sx={{ height: 360, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                            <CardContent sx={{ height: '100%' }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                                    {t('examMarkDashboard.charts.examsByGrade')}
                                </Typography>
                                <Box sx={{ height: 280 }}>
                                    <Bar data={gradeChartData} options={chartOptions} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card sx={{ height: 360, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                            <CardContent sx={{ height: '100%' }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                                    {t('examMarkDashboard.charts.examsBySubject')}
                                </Typography>
                                <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Doughnut data={subjectChartData} options={{ ...chartOptions, scales: {} }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card sx={{ height: 360, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                            <CardContent sx={{ height: '100%' }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                                    {t('examMarkDashboard.charts.examCreationTrend')}
                                </Typography>
                                <Box sx={{ height: 280 }}>
                                    <Line data={timelineChartData} options={timelineOptions} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            <Card
                ref={filterRef}
                sx={{
                    backgroundColor: themeColors.background.primary,
                    border: `1px solid ${themeColors.border.primary}`,
                }}
            >
                <CardContent>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                        {t('examMarkDashboard.launch.title')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 3 }}>
                        {t('examMarkDashboard.launch.description')}
                    </Typography>
                    <Header
                        hide={false}
                        resetRoute="/exammark"
                        successRoute={filterTarget}
                        onHide={() => {}}
                        onSelectionChange={() => {}}
                        title={t('examMarkDashboard.launch.filtersTitle')}
                    />
                </CardContent>
            </Card>
        </Box>
    );
};

export default ExamMarkDashboard;

