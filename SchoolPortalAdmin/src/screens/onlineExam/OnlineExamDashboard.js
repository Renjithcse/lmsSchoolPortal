import React, { useMemo } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Avatar,
    LinearProgress,
    Alert,
    Button,
    Stack
} from '@mui/material';
import moment from 'moment';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { useAbility } from '../../AbilityContext';
import { useNavigate } from 'react-router-dom';
import AssessmentIcon from '@mui/icons-material/Assessment';
import QuizIcon from '@mui/icons-material/Quiz';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PublishIcon from '@mui/icons-material/Publish';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ListAltIcon from '@mui/icons-material/ListAlt';
import TimelineIcon from '@mui/icons-material/Timeline';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
} from 'chart.js';
import { useQuery } from '@tanstack/react-query';
import { getAllExams } from '../../api/onlineExam';
import { useTranslation } from 'react-i18next';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement
);

const OnlineExamDashboard = () => {
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();
    const ability = useAbility();
    const navigate = useNavigate();

    const { data: examsResponse, isLoading, isFetching, error } = useQuery({
        queryKey: ['onlineExamDashboard', null],
        queryFn: getAllExams,
    });

    const exams = useMemo(() => examsResponse?.exams || [], [examsResponse]);

    const statistics = useMemo(() => {
        if (!exams.length) {
            return {
                totalExams: 0,
                publishedExams: 0,
                drafts: 0,
                activeExams: 0,
                uniqueSubjects: 0
            };
        }

        const publishedExams = exams.filter(exam => (exam?.publishCount || 0) > 0).length;
        const activeExams = exams.filter(exam => exam?.status === 'active').length;
        const drafts = exams.length - publishedExams;
        const uniqueSubjects = new Set(
            exams.map(exam => exam?.subjectId?.subjectName || t('onlineExamDashboard.fallbacks.unknownSubject'))
        ).size;

        return {
            totalExams: exams.length,
            publishedExams,
            drafts,
            activeExams,
            uniqueSubjects
        };
    }, [exams, t]);

    const examsByGrade = useMemo(() => {
        const counts = exams.reduce((acc, exam) => {
            const gradeName = exam?.grade?.gradeName || t('onlineExamDashboard.fallbacks.unassignedGrade');
            acc[gradeName] = (acc[gradeName] || 0) + 1;
            return acc;
        }, {});
        return counts;
    }, [exams, t]);

    const examsByTerm = useMemo(() => {
        const counts = exams.reduce((acc, exam) => {
            const term = exam?.term || t('onlineExamDashboard.fallbacks.unknownTerm');
            acc[term] = (acc[term] || 0) + 1;
            return acc;
        }, {});
        return counts;
    }, [exams, t]);

    const examsTimeline = useMemo(() => {
        const counts = exams.reduce((acc, exam) => {
            if (!exam?.createdAt) return acc;
            const monthLabel = moment(exam.createdAt).format('MMM YYYY');
            acc[monthLabel] = (acc[monthLabel] || 0) + 1;
            return acc;
        }, {});

        const entries = Object.entries(counts)
            .map(([label, value]) => ({
                label,
                value,
                order: moment(label, 'MMM YYYY').valueOf()
            }))
            .sort((a, b) => a.order - b.order);

        return entries;
    }, [exams]);

    const gradeChartData = useMemo(() => {
        const labels = Object.keys(examsByGrade);
        const data = labels.map(label => examsByGrade[label]);

        return {
            labels,
            datasets: [
                {
                    label: t('onlineExamDashboard.charts.examsPerGrade'),
                    data,
                    backgroundColor: labels.map((_, idx) => `${themeColors.primary}${idx % 2 ? '80' : 'CC'}`),
                    borderColor: themeColors.primary,
                    borderWidth: 1,
                }
            ],
        };
    }, [examsByGrade, themeColors.primary, t]);

    const termChartData = useMemo(() => {
        const labels = Object.keys(examsByTerm);
        const data = labels.map(label => examsByTerm[label]);

        return {
            labels,
            datasets: [
                {
                    label: t('onlineExamDashboard.charts.examsPerTerm'),
                    data,
                    backgroundColor: labels.map((_, idx) => `${themeColors.accent}${idx % 2 ? '55' : '99'}`),
                    borderColor: themeColors.accent,
                    borderWidth: 1,
                }
            ],
        };
    }, [examsByTerm, themeColors.accent, t]);

    const publicationChartData = useMemo(() => {
        return {
            labels: [t('onlineExamDashboard.charts.published'), t('onlineExamDashboard.charts.draft')],
            datasets: [
                {
                    data: [statistics.publishedExams, statistics.drafts],
                    backgroundColor: [themeColors.success, themeColors.warning],
                    borderColor: [themeColors.success, themeColors.warning],
                    borderWidth: 1,
                }
            ],
        };
    }, [statistics.publishedExams, statistics.drafts, themeColors.success, themeColors.warning, t]);

    const timelineChartData = useMemo(() => {
        const labels = examsTimeline.map(item => item.label);
        const data = examsTimeline.map(item => item.value);

        return {
            labels,
            datasets: [
                {
                    label: t('onlineExamDashboard.charts.examsCreated'),
                    data,
                    borderColor: themeColors.primary,
                    backgroundColor: `${themeColors.primary}33`,
                    fill: true,
                    tension: 0.4,
                }
            ],
        };
    }, [examsTimeline, themeColors.primary, t]);

    const chartOptions = useMemo(() => ({
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
    }), [themeColors]);

    const timelineOptions = useMemo(() => ({
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
    }), [chartOptions, themeColors]);

    const quickActions = useMemo(() => {
        const actions = [
            {
                title: t('onlineExamDashboard.quickActions.createExam.title'),
                description: t('onlineExamDashboard.quickActions.createExam.description'),
                icon: AddCircleOutlineIcon,
                color: themeColors.primary,
                path: '/online-exam/list',
                permission: { action: 'Create', subject: 'Exams' },
                onClick: () => navigate('/online-exam/list', { state: { openCreate: true } })
            },
            {
                title: t('onlineExamDashboard.quickActions.manageExams.title'),
                description: t('onlineExamDashboard.quickActions.manageExams.description'),
                icon: ListAltIcon,
                color: themeColors.accent,
                path: '/online-exam/list',
                permission: { action: 'Read', subject: 'Exams' },
                onClick: () => navigate('/online-exam/list')
            },
            {
                title: t('onlineExamDashboard.quickActions.questionBank.title'),
                description: t('onlineExamDashboard.quickActions.questionBank.description'),
                icon: QuizIcon,
                color: themeColors.warning,
                path: '/online-exam/question-bank',
                permission: { action: 'Read', subject: 'QuestionBank' },
                onClick: () => navigate('/online-exam/question-bank')
            },
            {
                title: t('onlineExamDashboard.quickActions.examReports.title'),
                description: t('onlineExamDashboard.quickActions.examReports.description'),
                icon: AssessmentIcon,
                color: themeColors.success,
                path: '/online-exam/list',
                permission: { action: 'Read', subject: 'Exams' },
                onClick: () => navigate('/online-exam/list')
            },
        ];

        return actions.filter(action => ability.can(action.permission.action, action.permission.subject));
    }, [ability, navigate, themeColors, t]);

    return (
        <Box sx={{ py: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                        {t('onlineExamDashboard.title')}
                    </Typography>
                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                        {t('onlineExamDashboard.subtitle')}
                    </Typography>
                </Box>
            </Box>

            {(isLoading || isFetching) && (
                <Card sx={{ mb: 3, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                    <CardContent>
                        <LinearProgress sx={{ mb: 2 }} />
                        <Typography sx={{ color: themeColors.text.secondary }}>
                            {t('onlineExamDashboard.messages.loading')}
                        </Typography>
                    </CardContent>
                </Card>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {t('onlineExamDashboard.messages.loadFailed')}
                </Alert>
            )}

            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                        <CardContent>
                            <Stack direction="row" alignItems="center" spacing={2}>
                                <Avatar sx={{ bgcolor: `${themeColors.primary}22`, color: themeColors.primary }}>
                                    <QuizIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="h5" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                        {statistics.totalExams}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        {t('onlineExamDashboard.statistics.totalExams')}
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
                                    <PublishIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="h5" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                        {statistics.publishedExams}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        {t('onlineExamDashboard.statistics.publishedExams')}
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
                                    <AssignmentTurnedInIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="h5" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                        {statistics.drafts}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        {t('onlineExamDashboard.statistics.draftExams')}
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
                                    <TimelineIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="h5" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                        {statistics.uniqueSubjects}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        {t('onlineExamDashboard.statistics.subjectsCovered')}
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
                        <Grid item xs={12} sm={6} md={3} key={action.title}>
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
                                                }
                                            }}
                                        >
                                            {t('onlineExamDashboard.quickActions.explore')}
                                        </Button>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {!isLoading && !isFetching && exams.length === 0 && (
                <Alert severity="info">
                    {t('onlineExamDashboard.messages.noExams')}
                </Alert>
            )}

            {exams.length > 0 && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card sx={{ height: 360, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                            <CardContent sx={{ height: '100%' }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                                    {t('onlineExamDashboard.charts.examsByGrade')}
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
                                    {t('onlineExamDashboard.charts.publicationStatus')}
                                </Typography>
                                <Box sx={{ height: 280, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <Doughnut data={publicationChartData} options={{ ...chartOptions, scales: {} }} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card sx={{ height: 360, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                            <CardContent sx={{ height: '100%' }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                                    {t('onlineExamDashboard.charts.examsByTerm')}
                                </Typography>
                                <Box sx={{ height: 280 }}>
                                    <Bar data={termChartData} options={chartOptions} />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card sx={{ height: 360, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                            <CardContent sx={{ height: '100%' }}>
                                <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                                    {t('onlineExamDashboard.charts.examCreationTrend')}
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

export default OnlineExamDashboard;
