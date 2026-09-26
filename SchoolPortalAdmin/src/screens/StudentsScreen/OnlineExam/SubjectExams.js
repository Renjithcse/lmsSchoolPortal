import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Button,
    CircularProgress,
    Alert,
    Breadcrumbs,
    Link,
    Avatar,
    Chip,
    Paper,
    Divider,
    LinearProgress
} from '@mui/material';
import {
    School,
    Schedule,
    PlayArrow,
    CheckCircle,
    Cancel,
    Quiz,
    AccessTime,
    Info,
    Warning,
    EmojiEvents,
    Visibility,
    ArrowBack,
    Timer,
    Grade,
    TrendingUp
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useOnlineExam } from '../../../Redux/features/OnlineExam/useOnlineExam';
import { useSnackbar } from '../../../hooks/SnackBar';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import CustomOutletBox from '../../../components/Common/CustomOutletBox';
import { useTranslation } from 'react-i18next';

const SubjectExams = () => {
    const navigate = useNavigate();
    const { subjectId } = useParams();
    const showSnackbar = useSnackbar();
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();
    const {
        fetchSubjectExams,
        fetchExamDetails,
        fetchAttendedExams,
        startExamSession,
        setStartingState,
        examSummaryResult,
        subjectExamsResult,
        attendedExamsResult,
        examState,
    } = useOnlineExam();

    const [selectedSubject, setSelectedSubject] = useState(null);

    // Fetch subject exams on component mount
    useEffect(() => {
        if (subjectId) {
            setSelectedSubject(subjectId);
            fetchSubjectExams(subjectId);
        }
    }, [subjectId]);

    // Handle navigation back to dashboard
    const handleBackToDashboard = () => {
        navigate('/students/online-exam');
    };

    // Handle start exam
    const handleStartExam = async (exam) => {
        try {
            setStartingState(true);
            const examDetails = await fetchExamDetails(exam._id);
            
            const examData = {
                publishId: exam._id,
                examName: exam.exam?.examName || t('subjectExams.fallback.exam'),
                duration: exam.duration,
                totalQuestions: examDetails.data.questions.length,
                questions: examDetails.data.questions,
                questionBank: examDetails.data.questionBank,
                publish: examDetails.data.publish
            };

            startExamSession(examData);
            showSnackbar(t('subjectExams.messages.examStarted'), { variant: 'info' });
            // Navigate to exam taking screen
            navigate(`/students/online-exam/take/${exam._id}`);
        } catch (error) {
            showSnackbar(t('subjectExams.messages.startFailed', { message: error.message }), { variant: 'error' });
        } finally {
            setStartingState(false);
        }
    };

    // Handle view results
    const handleViewResults = async (examId) => {
        navigate(`/students/online-exam/results/${examId}/detailed`);
    };

    // Get subject name from exam summary
    const getSubjectName = () => {
        const examSummary = examSummaryResult.data?.data || [];
        const subject = examSummary.find(s => s.subjectId === subjectId);
        return subject?.subjectName || t('subjectExams.fallback.subject');
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

    // Render Subject Exams
    const renderSubjectExams = () => {
        if (subjectExamsResult.isLoading) {
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
                            {t('subjectExams.messages.loading')}
                        </Typography>
                    </motion.div>
                </Box>
            );
        }

        if (subjectExamsResult.error) {
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
                        {t('subjectExams.messages.loadFailed', { message: subjectExamsResult.error.message })}
                    </Alert>
                </motion.div>
            );
        }

        const subjectExams = subjectExamsResult.data?.data || { pending: [], completed: [], expired: [] };

        return (
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Pending Exams */}
                {subjectExams.pending.length > 0 && (
                    <motion.div variants={itemVariants}>
                        <Box mb={4}>
                            <Box 
                                display="flex" 
                                alignItems="center" 
                                mb={3}
                                sx={{
                                    background: `linear-gradient(135deg, ${themeColors.warning}10, ${themeColors.warning}05)`,
                                    p: 2,
                                    borderRadius: 2,
                                    border: `1px solid ${themeColors.warning}20`
                                }}
                            >
                                <Avatar 
                                    sx={{ 
                                        mr: 2,
                                        bgcolor: `${themeColors.warning}20`,
                                        color: themeColors.warning,
                                        width: 40,
                                        height: 40
                                    }}
                                >
                                    <Schedule />
                                </Avatar>
                                <Typography 
                                    variant="h6" 
                                    sx={{ 
                                        color: themeColors.warning,
                                        fontWeight: 600
                                    }}
                                >
                                    {t('subjectExams.sections.pendingExams', { count: subjectExams.pending.length })}
                                </Typography>
                            </Box>
                            <Grid container spacing={3}>
                                {subjectExams.pending.map((exam) => (
                                    <Grid item xs={12} md={6} key={exam._id}>
                                        <Card 
                                            sx={{ 
                                                height: '100%',
                                                background: `linear-gradient(135deg, ${themeColors.background.primary}, ${themeColors.background.secondary})`,
                                                border: `1px solid ${themeColors.border.primary}`,
                                                boxShadow: `0 4px 20px ${themeColors.warning}10`,
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-4px)',
                                                    boxShadow: `0 8px 30px ${themeColors.warning}20`,
                                                }
                                            }}
                                        >
                                            <CardContent sx={{ p: 3 }}>
                                                <Box display="flex" alignItems="center" mb={2}>
                                                    <Avatar 
                                                        sx={{ 
                                                            mr: 2,
                                                            bgcolor: `${themeColors.warning}20`,
                                                            color: themeColors.warning,
                                                            width: 48,
                                                            height: 48
                                                        }}
                                                    >
                                                        <Quiz />
                                                    </Avatar>
                                                    <Box>
                                                        <Typography 
                                                            variant="h6" 
                                                            sx={{ 
                                                                fontWeight: 600,
                                                                color: themeColors.text.primary
                                                            }}
                                                        >
                                                            {exam.exam?.examName || t('subjectExams.fallback.exam')}
                                                        </Typography>
                                                        <Typography 
                                                            variant="body2"
                                                            sx={{ color: themeColors.text.secondary }}
                                                        >
                                                            {t('subjectExams.status.availableForTaking')}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                <Divider sx={{ mb: 2, borderColor: themeColors.border.primary }} />

                                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                                    <Grid item xs={6}>
                                                        <Paper 
                                                            sx={{ 
                                                                p: 1.5, 
                                                                textAlign: 'center',
                                                                background: `linear-gradient(135deg, ${themeColors.primary}10, ${themeColors.primary}05)`,
                                                                border: `1px solid ${themeColors.primary}20`
                                                            }}
                                                        >
                                                            <AccessTime sx={{ 
                                                                color: themeColors.primary, 
                                                                fontSize: 20,
                                                                mb: 0.5
                                                            }} />
                                                            <Typography 
                                                                variant="body2" 
                                                                sx={{ 
                                                                    fontWeight: 600,
                                                                    color: themeColors.primary
                                                                }}
                                                            >
                                                                {t('subjectExams.labels.duration', { duration: exam.duration })}
                                                            </Typography>
                                                        </Paper>
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Paper 
                                                            sx={{ 
                                                                p: 1.5, 
                                                                textAlign: 'center',
                                                                background: `linear-gradient(135deg, ${themeColors.accent}10, ${themeColors.accent}05)`,
                                                                border: `1px solid ${themeColors.accent}20`
                                                            }}
                                                        >
                                                            <Quiz sx={{ 
                                                                color: themeColors.accent, 
                                                                fontSize: 20,
                                                                mb: 0.5
                                                            }} />
                                                            <Typography 
                                                                variant="body2" 
                                                                sx={{ 
                                                                    fontWeight: 600,
                                                                    color: themeColors.accent
                                                                }}
                                                            >
                                                                {t('subjectExams.labels.questions', { count: exam.numberOfQuestions })}
                                                            </Typography>
                                                        </Paper>
                                                    </Grid>
                                                </Grid>

                                                <Box sx={{ mb: 3 }}>
                                                    <Typography 
                                                        variant="body2" 
                                                        sx={{ 
                                                            color: themeColors.text.secondary,
                                                            mb: 1,
                                                            display: 'flex',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <Info sx={{ mr: 1, fontSize: 16 }} />
                                                        {t('subjectExams.labels.availableUntil', { date: new Date(exam.endDate).toLocaleString() })}
                                                    </Typography>
                                                </Box>

                                                <Button
                                                    variant="contained"
                                                    startIcon={<PlayArrow />}
                                                    onClick={() => handleStartExam(exam)}
                                                    disabled={examState.isStartingExam}
                                                    fullWidth
                                                    sx={{
                                                        background: `linear-gradient(135deg, ${themeColors.warning}, ${themeColors.primary})`,
                                                        color: '#fff',
                                                        fontWeight: 600,
                                                        py: 1.5,
                                                        borderRadius: 2,
                                                        textTransform: 'none',
                                                        fontSize: '1rem',
                                                        '&:hover': {
                                                            background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.warning})`,
                                                            transform: 'translateY(-2px)',
                                                            boxShadow: `0 4px 15px ${themeColors.warning}30`
                                                        },
                                                        '&:disabled': {
                                                            background: themeColors.text.disabled
                                                        }
                                                    }}
                                                >
                                                    {examState.isStartingExam ? t('subjectExams.actions.starting') : t('subjectExams.actions.startExam')}
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </motion.div>
                )}

                {/* Completed Exams */}
                {subjectExams.completed.length > 0 && (
                    <motion.div variants={itemVariants}>
                        <Box mb={4}>
                            <Box 
                                display="flex" 
                                alignItems="center" 
                                mb={3}
                                sx={{
                                    background: `linear-gradient(135deg, ${themeColors.success}10, ${themeColors.success}05)`,
                                    p: 2,
                                    borderRadius: 2,
                                    border: `1px solid ${themeColors.success}20`
                                }}
                            >
                                <Avatar 
                                    sx={{ 
                                        mr: 2,
                                        bgcolor: `${themeColors.success}20`,
                                        color: themeColors.success,
                                        width: 40,
                                        height: 40
                                    }}
                                >
                                    <CheckCircle />
                                </Avatar>
                                <Typography 
                                    variant="h6" 
                                    sx={{ 
                                        color: themeColors.success,
                                        fontWeight: 600
                                    }}
                                >
                                    {t('subjectExams.sections.completedExams', { count: subjectExams.completed.length })}
                                </Typography>
                            </Box>
                            <Grid container spacing={3}>
                                {subjectExams.completed.map((exam) => (
                                    <Grid item xs={12} md={6} key={exam._id}>
                                        <Card 
                                            sx={{ 
                                                height: '100%',
                                                background: `linear-gradient(135deg, ${themeColors.background.primary}, ${themeColors.background.secondary})`,
                                                border: `1px solid ${themeColors.border.primary}`,
                                                boxShadow: `0 4px 20px ${themeColors.success}10`,
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-4px)',
                                                    boxShadow: `0 8px 30px ${themeColors.success}20`,
                                                }
                                            }}
                                        >
                                            <CardContent sx={{ p: 3 }}>
                                                <Box display="flex" alignItems="center" mb={2}>
                                                    <Avatar 
                                                        sx={{ 
                                                            mr: 2,
                                                            bgcolor: `${themeColors.success}20`,
                                                            color: themeColors.success,
                                                            width: 48,
                                                            height: 48
                                                        }}
                                                    >
                                                        <EmojiEvents />
                                                    </Avatar>
                                                    <Box>
                                                        <Typography 
                                                            variant="h6" 
                                                            sx={{ 
                                                                fontWeight: 600,
                                                                color: themeColors.text.primary
                                                            }}
                                                        >
                                                            {exam.exam?.examName || t('subjectExams.fallback.exam')}
                                                        </Typography>
                                                        <Typography 
                                                            variant="body2"
                                                            sx={{ color: themeColors.text.secondary }}
                                                        >
                                                            {t('subjectExams.status.successfullyCompleted')}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                <Divider sx={{ mb: 2, borderColor: themeColors.border.primary }} />

                                                <Box sx={{ mb: 3 }}>
                                                    <Chip
                                                        icon={<CheckCircle />}
                                                        label={t('subjectExams.status.completed')}
                                                        sx={{
                                                            bgcolor: `${themeColors.success}20`,
                                                            color: themeColors.success,
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                </Box>

                                                <Button
                                                    variant="outlined"
                                                    startIcon={<Visibility />}
                                                    onClick={() => handleViewResults(exam._id)}
                                                    fullWidth
                                                    sx={{
                                                        borderColor: themeColors.success,
                                                        color: themeColors.success,
                                                        fontWeight: 600,
                                                        py: 1.5,
                                                        borderRadius: 2,
                                                        textTransform: 'none',
                                                        fontSize: '1rem',
                                                        '&:hover': {
                                                            borderColor: themeColors.success,
                                                            color: '#fff',
                                                            background: themeColors.success,
                                                            transform: 'translateY(-2px)',
                                                            boxShadow: `0 4px 15px ${themeColors.success}30`
                                                        }
                                                    }}
                                                >
                                                    {t('subjectExams.actions.viewResults')}
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </motion.div>
                )}

                {/* Expired Exams */}
                {subjectExams.expired.length > 0 && (
                    <motion.div variants={itemVariants}>
                        <Box>
                            <Box 
                                display="flex" 
                                alignItems="center" 
                                mb={3}
                                sx={{
                                    background: `linear-gradient(135deg, ${themeColors.error}10, ${themeColors.error}05)`,
                                    p: 2,
                                    borderRadius: 2,
                                    border: `1px solid ${themeColors.error}20`
                                }}
                            >
                                <Avatar 
                                    sx={{ 
                                        mr: 2,
                                        bgcolor: `${themeColors.error}20`,
                                        color: themeColors.error,
                                        width: 40,
                                        height: 40
                                    }}
                                >
                                    <Cancel />
                                </Avatar>
                                <Typography 
                                    variant="h6" 
                                    sx={{ 
                                        color: themeColors.error,
                                        fontWeight: 600
                                    }}
                                >
                                    {t('subjectExams.sections.expiredExams', { count: subjectExams.expired.length })}
                                </Typography>
                            </Box>
                            <Grid container spacing={3}>
                                {subjectExams.expired.map((exam) => (
                                    <Grid item xs={12} md={6} key={exam._id}>
                                        <Card 
                                            sx={{ 
                                                height: '100%',
                                                background: `linear-gradient(135deg, ${themeColors.background.primary}, ${themeColors.background.secondary})`,
                                                border: `1px solid ${themeColors.border.primary}`,
                                                boxShadow: `0 4px 20px ${themeColors.error}10`,
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-4px)',
                                                    boxShadow: `0 8px 30px ${themeColors.error}20`,
                                                }
                                            }}
                                        >
                                            <CardContent sx={{ p: 3 }}>
                                                <Box display="flex" alignItems="center" mb={2}>
                                                    <Avatar 
                                                        sx={{ 
                                                            mr: 2,
                                                            bgcolor: `${themeColors.error}20`,
                                                            color: themeColors.error,
                                                            width: 48,
                                                            height: 48
                                                        }}
                                                    >
                                                        <Warning />
                                                    </Avatar>
                                                    <Box>
                                                        <Typography 
                                                            variant="h6" 
                                                            sx={{ 
                                                                fontWeight: 600,
                                                                color: themeColors.text.primary
                                                            }}
                                                        >
                                                            {exam.exam?.examName || t('subjectExams.fallback.exam')}
                                                        </Typography>
                                                        <Typography 
                                                            variant="body2"
                                                            sx={{ color: themeColors.text.secondary }}
                                                        >
                                                            {t('subjectExams.status.timeLimitExceeded')}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                <Divider sx={{ mb: 2, borderColor: themeColors.border.primary }} />

                                                <Box sx={{ mb: 3 }}>
                                                    <Typography 
                                                        variant="body2" 
                                                        sx={{ 
                                                            color: themeColors.error,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            fontWeight: 500
                                                        }}
                                                    >
                                                        <Warning sx={{ mr: 1, fontSize: 16 }} />
                                                        {t('subjectExams.labels.expiredOn', { date: new Date(exam.endDate).toLocaleString() })}
                                                    </Typography>
                                                </Box>

                                                <Chip
                                                    icon={<Cancel />}
                                                    label={t('subjectExams.status.expired')}
                                                    sx={{
                                                        bgcolor: `${themeColors.error}20`,
                                                        color: themeColors.error,
                                                        fontWeight: 600
                                                    }}
                                                />
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </motion.div>
                )}

                {subjectExams.pending.length === 0 && 
                 subjectExams.completed.length === 0 && 
                 subjectExams.expired.length === 0 && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Alert 
                            severity="info"
                            sx={{
                                background: `linear-gradient(135deg, ${themeColors.primary}10, ${themeColors.primary}05)`,
                                border: `1px solid ${themeColors.primary}20`,
                                borderRadius: 2
                            }}
                        >
                            {t('subjectExams.messages.noExamsAvailable')}
                        </Alert>
                    </motion.div>
                )}
            </motion.div>
        );
    };

    return (
        <CustomOutletBox>
            <Box sx={{ p: 3 }}>
                {/* Breadcrumbs */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <Breadcrumbs 
                        sx={{ 
                            mb: 3,
                            p: 2,
                            background: `linear-gradient(135deg, ${themeColors.background.secondary}, ${themeColors.background.primary})`,
                            borderRadius: 2,
                            border: `1px solid ${themeColors.border.primary}`
                        }}
                    >
                        <Link
                            component="button"
                            variant="body1"
                            onClick={handleBackToDashboard}
                            sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                color: themeColors.primary,
                                textDecoration: 'none',
                                '&:hover': {
                                    color: themeColors.accent,
                                    textDecoration: 'underline'
                                }
                            }}
                            >
                                <ArrowBack sx={{ mr: 1 }} />
                                {t('subjectExams.breadcrumbs.dashboard')}
                            </Link>
                        <Typography 
                            color="text.primary"
                            sx={{ color: themeColors.text.primary }}
                        >
                            {getSubjectName()}
                        </Typography>
                    </Breadcrumbs>
                </motion.div>

                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <Box 
                        display="flex" 
                        alignItems="center" 
                        mb={4}
                        sx={{
                            background: `linear-gradient(135deg, ${themeColors.primary}05, ${themeColors.accent}05)`,
                            p: 3,
                            borderRadius: 3,
                            border: `1px solid ${themeColors.border.primary}`
                        }}
                    >
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
                                {t('subjectExams.title', { subjectName: getSubjectName() })}
                            </Typography>
                            <Typography 
                                variant="body1"
                                sx={{ color: themeColors.text.secondary }}
                            >
                                {t('subjectExams.subtitle')}
                            </Typography>
                        </Box>
                    </Box>
                </motion.div>

                {renderSubjectExams()}
            </Box>
        </CustomOutletBox>
    );
};

export default SubjectExams; 