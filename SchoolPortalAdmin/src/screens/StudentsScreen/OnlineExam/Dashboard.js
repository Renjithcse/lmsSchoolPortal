import React, { useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Chip,
    Button,
    CircularProgress,
    Alert,
    Avatar,
    LinearProgress,
    Divider,
    Paper
} from '@mui/material';
import {
    School,
    Assignment,
    CheckCircle,
    Cancel,
    Schedule,
    Subject,
    TrendingUp,
    EmojiEvents,
    Quiz,
    History,
    BarChart as BarChartIcon,
    ShowChart as ShowChartIcon,
    PieChart as PieChartIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useOnlineExam } from '../../../Redux/features/OnlineExam/useOnlineExam';
import { useSnackbar } from '../../../hooks/SnackBar';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import CustomOutletBox from '../../../components/Common/CustomOutletBox';
import { useTranslation } from 'react-i18next';
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
    LineElement,
    Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
);

const Dashboard = () => {
    const navigate = useNavigate();
    const showSnackbar = useSnackbar();
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();
    const {
        fetchExamSummary,
        examSummaryResult,
    } = useOnlineExam();

    // Fetch exam summary on component mount
    useEffect(() => {
        fetchExamSummary();
    }, []);

    // Handle subject selection
    const handleSubjectSelect = (subjectId) => {
        navigate(`/students/online-exam/subject-exams/${subjectId}`);
    };

    // Handle view history
    const handleViewHistory = () => {
        navigate('/students/online-exam/history');
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.5
            }
        }
    };

    // Render Dashboard
    const renderDashboard = () => {
        if (examSummaryResult.isLoading) {
            return (
                <Box 
                    display="flex" 
                    flexDirection="column"
                    justifyContent="center" 
                    alignItems="center" 
                    minHeight="300px"
                    sx={{
                        background: `linear-gradient(135deg, ${themeColors.primary}05, ${themeColors.accent}05)`,
                        borderRadius: 3,
                        p: 4
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <CircularProgress 
                            size={60}
                            sx={{ 
                                color: themeColors.primary,
                                mb: 2
                            }} 
                        />
                    </motion.div>
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Typography 
                            variant="h6" 
                            sx={{ 
                                color: themeColors.text.secondary,
                                textAlign: 'center'
                            }}
                        >
                            {t('studentOnlineExamDashboard.messages.loading')}
                        </Typography>
                    </motion.div>
                </Box>
            );
        }

        if (examSummaryResult.error) {
            return (
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <Alert 
                        severity="error"
                        sx={{
                            background: `linear-gradient(135deg, ${themeColors.error}10, ${themeColors.error}05)`,
                            border: `1px solid ${themeColors.error}20`,
                            borderRadius: 2
                        }}
                    >
                        {t('studentOnlineExamDashboard.messages.loadFailed', { message: examSummaryResult.error.message })}
                    </Alert>
                </motion.div>
            );
        }

        const examSummary = examSummaryResult.data?.data || [];

        // Prepare chart data for exam analytics
        const examStatusData = {
            labels: examSummary.map(subject => subject.subjectName),
            datasets: [
                {
                    label: t('studentOnlineExamDashboard.chartLabels.newExams'),
                    data: examSummary.map(subject => subject.new),
                    backgroundColor: 'rgba(33, 150, 243, 0.8)',
                    borderColor: 'rgba(33, 150, 243, 1)',
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                },
                {
                    label: t('studentOnlineExamDashboard.chartLabels.pendingExams'),
                    data: examSummary.map(subject => subject.pending),
                    backgroundColor: 'rgba(255, 193, 7, 0.8)',
                    borderColor: 'rgba(255, 193, 7, 1)',
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                },
                {
                    label: t('studentOnlineExamDashboard.chartLabels.completedExams'),
                    data: examSummary.map(subject => subject.completed),
                    backgroundColor: 'rgba(76, 175, 80, 0.8)',
                    borderColor: 'rgba(76, 175, 80, 1)',
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                },
                {
                    label: t('studentOnlineExamDashboard.chartLabels.expiredExams'),
                    data: examSummary.map(subject => subject.expired),
                    backgroundColor: 'rgba(244, 67, 54, 0.8)',
                    borderColor: 'rgba(244, 67, 54, 1)',
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }
            ]
        };

        const totalExamsData = {
            labels: examSummary.map(subject => subject.subjectName),
            datasets: [
                {
                    label: t('studentOnlineExamDashboard.chartLabels.totalExams'),
                    data: examSummary.map(subject => 
                        subject.new + subject.pending + subject.completed + subject.expired
                    ),
                    backgroundColor: 'rgba(156, 39, 176, 0.8)',
                    borderColor: 'rgba(156, 39, 176, 1)',
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }
            ]
        };

        const completionRateData = {
            labels: examSummary.map(subject => subject.subjectName),
            datasets: [
                {
                    label: t('studentOnlineExamDashboard.chartLabels.completionRate'),
                    data: examSummary.map(subject => {
                        const total = subject.new + subject.pending + subject.completed + subject.expired;
                        return total > 0 ? Math.round((subject.completed / total) * 100) : 0;
                    }),
                    borderColor: 'rgba(33, 150, 243, 1)',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: examSummary.map(subject => {
                        const total = subject.new + subject.pending + subject.completed + subject.expired;
                        const rate = total > 0 ? (subject.completed / total) * 100 : 0;
                        if (rate >= 80) return 'rgba(76, 175, 80, 1)';
                        if (rate >= 60) return 'rgba(255, 193, 7, 1)';
                        if (rate >= 40) return 'rgba(255, 152, 0, 1)';
                        return 'rgba(244, 67, 54, 1)';
                    }),
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                }
            ]
        };

        const overallStatsData = {
            labels: [
                t('studentOnlineExamDashboard.status.new'),
                t('studentOnlineExamDashboard.status.pending'),
                t('studentOnlineExamDashboard.status.completed'),
                t('studentOnlineExamDashboard.status.expired')
            ],
            datasets: [
                {
                    data: [
                        examSummary.reduce((sum, subject) => sum + subject.new, 0),
                        examSummary.reduce((sum, subject) => sum + subject.pending, 0),
                        examSummary.reduce((sum, subject) => sum + subject.completed, 0),
                        examSummary.reduce((sum, subject) => sum + subject.expired, 0),
                    ],
                    backgroundColor: [
                        'rgba(33, 150, 243, 0.8)',
                        'rgba(255, 193, 7, 0.8)',
                        'rgba(76, 175, 80, 0.8)',
                        'rgba(244, 67, 54, 0.8)',
                    ],
                    borderColor: [
                        'rgba(33, 150, 243, 1)',
                        'rgba(255, 193, 7, 1)',
                        'rgba(76, 175, 80, 1)',
                        'rgba(244, 67, 54, 1)',
                    ],
                    borderWidth: 2,
                }
            ]
        };

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: themeColors.text.primary,
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: themeColors.background.primary,
                    titleColor: themeColors.text.primary,
                    bodyColor: themeColors.text.secondary,
                    borderColor: themeColors.border.primary,
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    padding: 12,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: themeColors.text.secondary,
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: themeColors.border.primary,
                        drawBorder: false,
                    },
                    border: {
                        color: themeColors.border.primary,
                    }
                },
                x: {
                    ticks: {
                        color: themeColors.text.secondary,
                        font: {
                            size: 11
                        },
                        maxRotation: 45,
                        minRotation: 0
                    },
                    grid: {
                        color: themeColors.border.primary,
                        drawBorder: false,
                    },
                    border: {
                        color: themeColors.border.primary,
                    }
                }
            }
        };

        const doughnutOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: themeColors.text.primary,
                        font: {
                            size: 11,
                            weight: '500'
                        },
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: themeColors.background.primary,
                    titleColor: themeColors.text.primary,
                    bodyColor: themeColors.text.secondary,
                    borderColor: themeColors.border.primary,
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                }
            }
        };

        const completionRateOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: themeColors.text.primary,
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: themeColors.background.primary,
                    titleColor: themeColors.text.primary,
                    bodyColor: themeColors.text.secondary,
                    borderColor: themeColors.border.primary,
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    padding: 12,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: themeColors.text.secondary,
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: themeColors.border.primary,
                        drawBorder: false,
                    },
                    border: {
                        color: themeColors.border.primary,
                    }
                },
                x: {
                    ticks: {
                        color: themeColors.text.secondary,
                        font: {
                            size: 11
                        },
                        maxRotation: 45,
                        minRotation: 0
                    },
                    grid: {
                        color: themeColors.border.primary,
                        drawBorder: false,
                    },
                    border: {
                        color: themeColors.border.primary,
                    }
                }
            }
        };

        return (
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Exam Analytics Charts */}
                {examSummary.length > 0 && (
                    <motion.div
                        variants={itemVariants}
                        initial="visible"
                        animate="visible"
                        style={{ opacity: 1, transform: 'translateY(0)' }}
                    >
                        <Box mb={4}>
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 700,
                                    color: themeColors.text.primary,
                                    mb: 3,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}
                            >
                                <BarChartIcon sx={{ color: themeColors.primary }} />
                                {t('studentOnlineExamDashboard.sections.examAnalytics')}
                            </Typography>
                            
                            <Grid container spacing={3}>
                                {/* Bar Chart - Exam Status by Subject */}
                                <Grid item xs={12} lg={8}>
                                    <Card
                                        sx={{
                                            background: `linear-gradient(135deg, ${themeColors.background.primary}, ${themeColors.background.secondary})`,
                                            border: `1px solid ${themeColors.border.primary}`,
                                            boxShadow: `0 4px 20px ${themeColors.primary}10`,
                                            height: '100%'
                                        }}
                                    >
                                        <CardContent sx={{ p: 3 }}>
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    fontWeight: 600,
                                                    color: themeColors.text.primary,
                                                    mb: 2,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1
                                                }}
                                            >
                                                <ShowChartIcon sx={{ color: themeColors.primary, fontSize: 20 }} />
                                                {t('studentOnlineExamDashboard.charts.examStatusBySubject')}
                                            </Typography>
                                            <Box sx={{ height: 400, position: 'relative' }}>
                                                <Bar data={examStatusData} options={chartOptions} />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Doughnut Chart - Overall Exam Distribution */}
                                <Grid item xs={12} lg={4}>
                                    <Card
                                        sx={{
                                            background: `linear-gradient(135deg, ${themeColors.background.primary}, ${themeColors.background.secondary})`,
                                            border: `1px solid ${themeColors.border.primary}`,
                                            boxShadow: `0 4px 20px ${themeColors.primary}10`,
                                            height: '100%'
                                        }}
                                    >
                                        <CardContent sx={{ p: 3 }}>
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    fontWeight: 600,
                                                    color: themeColors.text.primary,
                                                    mb: 2,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1
                                                }}
                                            >
                                                <PieChartIcon sx={{ color: themeColors.primary, fontSize: 20 }} />
                                                {t('studentOnlineExamDashboard.charts.overallExamDistribution')}
                                            </Typography>
                                            <Box sx={{ height: 400, position: 'relative' }}>
                                                <Doughnut data={overallStatsData} options={doughnutOptions} />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Line Chart - Completion Rate Trend */}
                                <Grid item xs={12} lg={6}>
                                    <Card
                                        sx={{
                                            background: `linear-gradient(135deg, ${themeColors.background.primary}, ${themeColors.background.secondary})`,
                                            border: `1px solid ${themeColors.border.primary}`,
                                            boxShadow: `0 4px 20px ${themeColors.primary}10`,
                                            height: '100%'
                                        }}
                                    >
                                        <CardContent sx={{ p: 3 }}>
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    fontWeight: 600,
                                                    color: themeColors.text.primary,
                                                    mb: 2,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1
                                                }}
                                            >
                                                <ShowChartIcon sx={{ color: themeColors.primary, fontSize: 20 }} />
                                                {t('studentOnlineExamDashboard.charts.completionRateBySubject')}
                                            </Typography>
                                            <Box sx={{ height: 350, position: 'relative' }}>
                                                <Line data={completionRateData} options={completionRateOptions} />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Bar Chart - Total Exams per Subject */}
                                <Grid item xs={12} lg={6}>
                                    <Card
                                        sx={{
                                            background: `linear-gradient(135deg, ${themeColors.background.primary}, ${themeColors.background.secondary})`,
                                            border: `1px solid ${themeColors.border.primary}`,
                                            boxShadow: `0 4px 20px ${themeColors.primary}10`,
                                            height: '100%'
                                        }}
                                    >
                                        <CardContent sx={{ p: 3 }}>
                                            <Typography
                                                variant="h6"
                                                sx={{
                                                    fontWeight: 600,
                                                    color: themeColors.text.primary,
                                                    mb: 2,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1
                                                }}
                                            >
                                                <Quiz sx={{ color: themeColors.primary, fontSize: 20 }} />
                                                {t('studentOnlineExamDashboard.charts.totalExamsPerSubject')}
                                            </Typography>
                                            <Box sx={{ height: 350, position: 'relative' }}>
                                                <Bar data={totalExamsData} options={chartOptions} />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Box>
                    </motion.div>
                )}

                <Grid container spacing={3}>
                    {examSummary.map((subject, index) => (
                        <Grid item xs={12} md={6} lg={4} key={subject.subjectId}>
                            <motion.div variants={itemVariants}>
                                <Card 
                                    sx={{ 
                                        height: '100%', 
                                        display: 'flex', 
                                        flexDirection: 'column',
                                        background: `linear-gradient(135deg, ${themeColors.background.primary}, ${themeColors.background.secondary})`,
                                        border: `1px solid ${themeColors.border.primary}`,
                                        boxShadow: `0 4px 20px ${themeColors.primary}10`,
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-8px)',
                                            boxShadow: `0 8px 30px ${themeColors.primary}20`,
                                        }
                                    }}
                                >
                                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                                        {/* Header */}
                                        <Box display="flex" alignItems="center" mb={3}>
                                            <Avatar 
                                                sx={{ 
                                                    mr: 2,
                                                    bgcolor: `${themeColors.primary}20`,
                                                    color: themeColors.primary,
                                                    width: 48,
                                                    height: 48
                                                }}
                                            >
                                                <Subject />
                                            </Avatar>
                                            <Box>
                                                <Typography 
                                                    variant="h6" 
                                                    component="h3"
                                                    sx={{ 
                                                        fontWeight: 600,
                                                        color: themeColors.text.primary
                                                    }}
                                                >
                                                    {subject.subjectName}
                                                </Typography>
                                                <Typography 
                                                    variant="body2"
                                                    sx={{ 
                                                        color: themeColors.text.secondary,
                                                        mt: 0.5
                                                    }}
                                                >
                                                    {t('studentOnlineExamDashboard.labels.totalExams', { count: subject.new + subject.pending + subject.completed + subject.expired })}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Divider sx={{ mb: 3, borderColor: themeColors.border.primary }} />
                                        
                                        {/* Stats Grid */}
                                        <Grid container spacing={2} sx={{ mb: 3 }}>
                                            <Grid item xs={6}>
                                                <Paper 
                                                    sx={{ 
                                                        p: 2, 
                                                        textAlign: 'center',
                                                        background: `linear-gradient(135deg, ${themeColors.primary}10, ${themeColors.primary}05)`,
                                                        border: `1px solid ${themeColors.primary}20`
                                                    }}
                                                >
                                                    <Assignment sx={{ 
                                                        color: themeColors.primary, 
                                                        fontSize: 24,
                                                        mb: 1
                                                    }} />
                                                    <Typography 
                                                        variant="h6" 
                                                        sx={{ 
                                                            fontWeight: 700,
                                                            color: themeColors.primary
                                                        }}
                                                    >
                                                        {subject.new}
                                                    </Typography>
                                                    <Typography 
                                                        variant="caption"
                                                        sx={{ color: themeColors.text.secondary }}
                                                    >
                                                        {t('studentOnlineExamDashboard.status.new')}
                                                    </Typography>
                                                </Paper>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Paper 
                                                    sx={{ 
                                                        p: 2, 
                                                        textAlign: 'center',
                                                        background: `linear-gradient(135deg, ${themeColors.warning}10, ${themeColors.warning}05)`,
                                                        border: `1px solid ${themeColors.warning}20`
                                                    }}
                                                >
                                                    <Schedule sx={{ 
                                                        color: themeColors.warning, 
                                                        fontSize: 24,
                                                        mb: 1
                                                    }} />
                                                    <Typography 
                                                        variant="h6" 
                                                        sx={{ 
                                                            fontWeight: 700,
                                                            color: themeColors.warning
                                                        }}
                                                    >
                                                        {subject.pending}
                                                    </Typography>
                                                    <Typography 
                                                        variant="caption"
                                                        sx={{ color: themeColors.text.secondary }}
                                                    >
                                                        {t('studentOnlineExamDashboard.status.pending')}
                                                    </Typography>
                                                </Paper>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Paper 
                                                    sx={{ 
                                                        p: 2, 
                                                        textAlign: 'center',
                                                        background: `linear-gradient(135deg, ${themeColors.success}10, ${themeColors.success}05)`,
                                                        border: `1px solid ${themeColors.success}20`
                                                    }}
                                                >
                                                    <CheckCircle sx={{ 
                                                        color: themeColors.success, 
                                                        fontSize: 24,
                                                        mb: 1
                                                    }} />
                                                    <Typography 
                                                        variant="h6" 
                                                        sx={{ 
                                                            fontWeight: 700,
                                                            color: themeColors.success
                                                        }}
                                                    >
                                                        {subject.completed}
                                                    </Typography>
                                                    <Typography 
                                                        variant="caption"
                                                        sx={{ color: themeColors.text.secondary }}
                                                    >
                                                        {t('studentOnlineExamDashboard.status.completed')}
                                                    </Typography>
                                                </Paper>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Paper 
                                                    sx={{ 
                                                        p: 2, 
                                                        textAlign: 'center',
                                                        background: `linear-gradient(135deg, ${themeColors.error}10, ${themeColors.error}05)`,
                                                        border: `1px solid ${themeColors.error}20`
                                                    }}
                                                >
                                                    <Cancel sx={{ 
                                                        color: themeColors.error, 
                                                        fontSize: 24,
                                                        mb: 1
                                                    }} />
                                                    <Typography 
                                                        variant="h6" 
                                                        sx={{ 
                                                            fontWeight: 700,
                                                            color: themeColors.error
                                                        }}
                                                    >
                                                        {subject.expired}
                                                    </Typography>
                                                    <Typography 
                                                        variant="caption"
                                                        sx={{ color: themeColors.text.secondary }}
                                                    >
                                                        {t('studentOnlineExamDashboard.status.expired')}
                                                    </Typography>
                                                </Paper>
                                            </Grid>
                                        </Grid>

                                        {/* Progress Bar */}
                                        <Box sx={{ mb: 3 }}>
                                            <Box display="flex" justifyContent="space-between" mb={1}>
                                                <Typography 
                                                    variant="body2"
                                                    sx={{ color: themeColors.text.secondary }}
                                                >
                                                    {t('studentOnlineExamDashboard.labels.completionRate')}
                                                </Typography>
                                                <Typography 
                                                    variant="body2"
                                                    sx={{ 
                                                        fontWeight: 600,
                                                        color: themeColors.primary
                                                    }}
                                                >
                                                    {subject.completed > 0 ? Math.round((subject.completed / (subject.completed + subject.pending + subject.new)) * 100) : 0}%
                                                </Typography>
                                            </Box>
                                            <LinearProgress
                                                variant="determinate"
                                                value={subject.completed > 0 ? (subject.completed / (subject.completed + subject.pending + subject.new)) * 100 : 0}
                                                sx={{
                                                    height: 8,
                                                    borderRadius: 4,
                                                    backgroundColor: `${themeColors.primary}20`,
                                                    '& .MuiLinearProgress-bar': {
                                                        background: `linear-gradient(90deg, ${themeColors.primary}, ${themeColors.accent})`,
                                                        borderRadius: 4
                                                    }
                                                }}
                                            />
                                        </Box>

                                        <Button
                                            variant="contained"
                                            fullWidth
                                            onClick={() => handleSubjectSelect(subject.subjectId)}
                                            sx={{
                                                background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.accent})`,
                                                color: '#fff',
                                                fontWeight: 600,
                                                py: 1.5,
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                fontSize: '1rem',
                                                '&:hover': {
                                                    background: `linear-gradient(135deg, ${themeColors.accent}, ${themeColors.primary})`,
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: `0 4px 15px ${themeColors.primary}30`
                                                }
                                            }}
                                        >
                                            <Quiz sx={{ mr: 1 }} />
                                            {t('studentOnlineExamDashboard.actions.viewExams')}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </Grid>
                    ))}
                </Grid>
            </motion.div>
        );
    };

    return (
        <CustomOutletBox>
            <Box sx={{ p: 3 }}>
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <Box 
                        display="flex" 
                        justifyContent="space-between" 
                        alignItems="center" 
                        mb={4}
                        sx={{
                            background: `linear-gradient(135deg, ${themeColors.primary}05, ${themeColors.accent}05)`,
                            p: 3,
                            borderRadius: 3,
                            border: `1px solid ${themeColors.border.primary}`
                        }}
                    >
                        <Box display="flex" alignItems="center">
                            <Avatar 
                                sx={{ 
                                    mr: 2,
                                    bgcolor: `${themeColors.primary}20`,
                                    color: themeColors.primary,
                                    width: 56,
                                    height: 56
                                }}
                            >
                                <School />
                            </Avatar>
                            <Box>
                                <Typography 
                                    variant="h4" 
                                    sx={{ 
                                        fontWeight: 700,
                                        color: themeColors.text.primary,
                                        mb: 0.5
                                    }}
                                >
                                    {t('studentOnlineExamDashboard.title')}
                                </Typography>
                                <Typography 
                                    variant="body1"
                                    sx={{ color: themeColors.text.secondary }}
                                >
                                    {t('studentOnlineExamDashboard.subtitle')}
                                </Typography>
                            </Box>
                        </Box>
                        {/* <Button
                            variant="outlined"
                            onClick={handleViewHistory}
                            startIcon={<History />}
                            sx={{
                                borderColor: themeColors.primary,
                                color: themeColors.primary,
                                fontWeight: 600,
                                borderRadius: 2,
                                px: 3,
                                py: 1.5,
                                '&:hover': {
                                    borderColor: themeColors.accent,
                                    color: themeColors.accent,
                                    background: `${themeColors.accent}05`
                                }
                            }}
                        >
                            View History
                        </Button> */}
                    </Box>
                </motion.div>

                {renderDashboard()}
            </Box>
        </CustomOutletBox>
    );
};

export default Dashboard; 