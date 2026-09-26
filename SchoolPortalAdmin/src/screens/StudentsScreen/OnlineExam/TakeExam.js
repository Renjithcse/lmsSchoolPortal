import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert,
    RadioGroup,
    FormControlLabel,
    Radio,
    LinearProgress,
    Chip,
    Breadcrumbs,
    Link,
    Card,
    CardContent,
    CardMedia,
    IconButton,
    TextField,
    Avatar,
    Paper,
    Divider,
    Grid,
    Fab,
    Tooltip
} from '@mui/material';
import {
    School,
    Timer,
    NavigateNext,
    NavigateBefore,
    ArrowBack,
    Warning,
    ZoomIn,
    Close,
    Quiz,
    CheckCircle,
    RadioButtonChecked,
    RadioButtonUnchecked,
    PlayArrow,
    Pause,
    Stop,
    Visibility,
    VisibilityOff
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useOnlineExam } from '../../../Redux/features/OnlineExam/useOnlineExam';
import { useSnackbar } from '../../../hooks/SnackBar';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import CustomOutletBox from '../../../components/Common/CustomOutletBox';
import { BASE_PATH } from '../../../config';
import { useTranslation } from 'react-i18next';

const TakeExam = () => {
    const navigate = useNavigate();
    const { examId } = useParams();
    const showSnackbar = useSnackbar();
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();
    const {
        examState,
        fetchExamDetails,
        submitExamAnswers,
        saveAnswer,
        updateExamTimer,
        pauseExamTimer,
        resumeExamTimer,
        stopExamTimer,
        setSubmittingState,
        setStartingState,
        formatTime,
        getProgressPercentage,
        getAnsweredQuestions,
        getTotalQuestions,
        canNavigateBack,
        canNavigateForward,
        examDetailsResult,
        submitResult,
    } = useOnlineExam();

    const [timerInterval, setTimerInterval] = useState(null);
    const [examData, setExamData] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [localTimeLeft, setLocalTimeLeft] = useState(null);
    const [imageModal, setImageModal] = useState({
        open: false,
        imageUrl: '',
        imageAlt: '',
        zoomLevel: 1
    });
    const [isTimerPaused, setIsTimerPaused] = useState(false);
    const [showSubmitDialog, setShowSubmitDialog] = useState(false);

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                duration: 0.3
            }
        }
    };

    const itemVariants = {
        hidden: { y: 10, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 0.3,
                ease: "easeOut"
            }
        }
    };

    // Local formatTime function to ensure it works
    const formatTimeLocal = (seconds) => {
        if (typeof seconds !== 'number' || seconds < 0) return '00:00:00';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Load exam details on component mount
    useEffect(() => {
        const loadExamDetails = async () => {
            try {
                setStartingState(true);
                const details = await fetchExamDetails(examId);
                setExamData(details.data);

                // Initialize timer immediately when exam data is loaded
                if (details.data?.publish?.duration) {
                    const durationInSeconds = details.data.publish.duration * 60;
                    setLocalTimeLeft(durationInSeconds);
                    updateExamTimer(durationInSeconds);
                }

                showSnackbar(t('takeExam.messages.examLoaded'), 'info');
            } catch (error) {
                console.log({ error })
                showSnackbar(t('takeExam.messages.loadFailed', { message: error?.data?.message || error?.message || 'Unknown error' }), 'error');
                navigate('/students/online-exam');
            } finally {
                setStartingState(false);
            }
        };

        if (examId) {
            loadExamDetails();
        }
    }, [examId]);

    // Timer effect
    useEffect(() => {
        if (examData && examData.publish?.duration && localTimeLeft !== null && !isTimerPaused) {
            const interval = setInterval(() => {
                setLocalTimeLeft(prevTime => {
                    if (prevTime <= 1) {
                        handleAutoSubmit();
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);

            setTimerInterval(interval);
            return () => clearInterval(interval);
        }
    }, [examData, localTimeLeft, isTimerPaused]);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerInterval) {
                clearInterval(timerInterval);
            }
        };
    }, [timerInterval]);

    // Handle auto-submit when time runs out
    const handleAutoSubmit = useCallback(async () => {
        try {
            setSubmittingState(true);
            showSnackbar(t('takeExam.messages.timeExpired'), 'info');
            
            // Create answers array for ALL questions, including unanswered ones
            const answersArray = examData.questions.map(question => ({
                questionId: question._id,
                studentAnswer: answers[question._id] || null // Use null for unanswered questions
            }));

            const result = await submitExamAnswers({
                publishId: examId,
                answers: answersArray
            });

            // Check if the result indicates success
            if (result && result.status === 'success') {
                showSnackbar(t('takeExam.messages.autoSubmitted'), 'success');
                navigate(`/students/online-exam/results/${examId}`, {
                    state: { results: result.data }
                });
            } else {
                // Handle case where result has status 'fail'
                const errorMessage = result?.message || t('takeExam.messages.autoSubmitFailed');
                showSnackbar(errorMessage, 'error');
            }
        } catch (error) {
            const errorMessage = error.message || t('takeExam.messages.autoSubmitFailed');
            showSnackbar(errorMessage, 'error');
        } finally {
            setSubmittingState(false);
        }
    }, [answers, examId, submitExamAnswers, setSubmittingState, showSnackbar, navigate]);

    // Handle navigation back to subject exams
    const handleBackToSubject = () => {
        navigate('/students/online-exam');
    };

    // Handle answer selection
    const handleAnswerSelect = (questionId, answer) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    // Handle question navigation
    const handleNextQuestion = () => {
        if (currentQuestionIndex < (examData?.questions?.length - 1)) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    // Handle timer pause/resume
    const handleToggleTimer = () => {
        setIsTimerPaused(!isTimerPaused);
        if (isTimerPaused) {
            resumeExamTimer();
        } else {
            pauseExamTimer();
        }
    };

    // Handle image modal
    const handleImageClick = (imageUrl, imageAlt = 'Image') => {
        setImageModal({
            open: true,
            imageUrl,
            imageAlt,
            zoomLevel: 1
        });
    };

    const handleCloseImageModal = () => {
        setImageModal({
            open: false,
            imageUrl: '',
            imageAlt: '',
            zoomLevel: 1
        });
    };

    const handleZoomIn = () => {
        setImageModal(prev => ({
            ...prev,
            zoomLevel: Math.min(prev.zoomLevel + 0.25, 3)
        }));
    };

    const handleZoomOut = () => {
        setImageModal(prev => ({
            ...prev,
            zoomLevel: Math.max(prev.zoomLevel - 0.25, 0.5)
        }));
    };

    const handleResetZoom = () => {
        setImageModal(prev => ({
            ...prev,
            zoomLevel: 1
        }));
    };

    // Handle submit exam
    const handleSubmitExam = async () => {
        const totalQuestions = examData?.questions?.length || 0;
        const answeredQuestions = Object.keys(answers).length;
        
        if (answeredQuestions === 0) {
            setShowSubmitDialog(true);
            return;
        }
        
        if (answeredQuestions < totalQuestions) {
            setShowSubmitDialog(true);
            return;
        }
        
        await submitExam();
    };
    
    // Handle actual exam submission
    const submitExam = async () => {
        try {
            setSubmittingState(true);
            
            // Create answers array for ALL questions, including unanswered ones
            const answersArray = examData.questions.map(question => ({
                questionId: question._id,
                studentAnswer: answers[question._id] || null // Use null for unanswered questions
            }));

            const result = await submitExamAnswers({
                publishId: examId,
                answers: answersArray
            });

            // Check if the result indicates success
            if (result && result.status === 'success') {
                showSnackbar(t('takeExam.messages.submitted'), 'success');
                navigate(`/students/online-exam/results/${examId}`);
            } else {
                // Handle case where result has status 'fail'
                const errorMessage = result?.message || t('takeExam.messages.submitFailed');
                showSnackbar(errorMessage, 'error');
            }
        } catch (error) {
            const errorMessage = error.message || t('takeExam.messages.submitFailed');
            showSnackbar(errorMessage, 'error');
        } finally {
            setSubmittingState(false);
        }
    };

    // Get current question
    const currentQuestion = examData?.questions?.[currentQuestionIndex];
    const currentAnswer = answers[currentQuestion?._id] || '';

    // Safety check for timer display
    const timeLeft = localTimeLeft !== null ? localTimeLeft : (typeof examState.timeLeft === 'number' ? examState.timeLeft : 0);

    // Calculate progress based on local answers
    const totalQuestions = examData?.questions?.length || 0;
    const answeredQuestions = Object.keys(answers).length;
    const progressPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
    
    // Calculate total marks
    const totalMarks = examData?.questions?.reduce((sum, question) => sum + (question.marks || 0), 0) || 0;
    
    // Get current question marks
    const currentQuestionMarks = currentQuestion?.marks || 0;

    if (examDetailsResult.isLoading || !examData) {
        return (
            <CustomOutletBox>
                <Box 
                    display="flex" 
                    flexDirection="column"
                    justifyContent="center" 
                    alignItems="center" 
                    minHeight="400px"
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
                            {t('takeExam.messages.loading')}
                        </Typography>
                    </motion.div>
                </Box>
            </CustomOutletBox>
        );
    }

    return (
        <CustomOutletBox>
            <Box sx={{ p: 3 }}>
                <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                >
                    {/* Breadcrumbs */}
                    <motion.div 
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
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
                                onClick={handleBackToSubject}
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
                                {t('takeExam.breadcrumbs.backToExams')}
                            </Link>
                            <Typography 
                                color="text.primary"
                                sx={{ color: themeColors.text.primary }}
                            >
                                {t('takeExam.breadcrumbs.takingExam')}
                            </Typography>
                        </Breadcrumbs>
                    </motion.div>

                    {/* Header */}
                    <motion.div 
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
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
                                        {typeof examData.publish?.exam?.examName === 'string' ? examData.publish.exam.examName : t('takeExam.fallback.exam')}
                                    </Typography>
                                    <Typography 
                                        variant="body1"
                                        sx={{ color: themeColors.text.secondary }}
                                    >
                                        {t('takeExam.labels.questionOf', { current: currentQuestionIndex + 1, total: examData.questions?.length || 0 })}
                                    </Typography>
                                </Box>
                            </Box>
                            
                            <Box display="flex" alignItems="center" gap={2}>
                                {/* Timer */}
                                <Paper 
                                    sx={{ 
                                        p: 2,
                                        background: timeLeft < 300 ? 
                                            `linear-gradient(135deg, ${themeColors.error}15, ${themeColors.error}05)` :
                                            `linear-gradient(135deg, ${themeColors.primary}15, ${themeColors.primary}05)`,
                                        border: `1px solid ${timeLeft < 300 ? themeColors.error : themeColors.primary}20`,
                                        borderRadius: 2
                                    }}
                                >
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Timer sx={{ 
                                            color: timeLeft < 300 ? themeColors.error : themeColors.primary,
                                            fontSize: 24
                                        }} />
                                        <Typography 
                                            variant="h6" 
                                            sx={{ 
                                                fontWeight: 700,
                                                color: timeLeft < 300 ? themeColors.error : themeColors.primary
                                            }}
                                        >
                                            {formatTimeLocal(timeLeft)}
                                        </Typography>
                                    </Box>
                                </Paper>

                                {/* Timer Controls */}
                                <Tooltip title={isTimerPaused ? t('takeExam.timer.resume') : t('takeExam.timer.pause')}>
                                    <IconButton
                                        onClick={handleToggleTimer}
                                        sx={{
                                            bgcolor: `${themeColors.accent}20`,
                                            color: themeColors.accent,
                                            '&:hover': {
                                                bgcolor: `${themeColors.accent}30`
                                            }
                                        }}
                                    >
                                        {isTimerPaused ? <PlayArrow /> : <Pause />}
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Box>
                    </motion.div>

                    {/* Enhanced Progress Summary */}
                    <motion.div 
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                    >

                        <Card 
                            sx={{ 
                                mb: 4,
                                background: `linear-gradient(135deg, ${themeColors.background.primary || '#ffffff'}, ${themeColors.background.secondary || '#f5f5f5'})`,
                                border: `2px solid ${themeColors.border.primary || '#e0e0e0'}`,
                                boxShadow: `0 4px 20px ${themeColors.primary || '#1976d2'}20`
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Box display="flex" alignItems="center" mb={2}>
                                    <Avatar 
                                        sx={{ 
                                            mr: 2,
                                            bgcolor: `${themeColors.primary || '#1976d2'}20`,
                                            color: themeColors.primary || '#1976d2',
                                            width: 40,
                                            height: 40
                                        }}
                                    >
                                        <CheckCircle />
                                    </Avatar>
                                    <Typography 
                                        variant="h6" 
                                        sx={{ 
                                            fontWeight: 600,
                                            color: themeColors.text.primary || '#333333'
                                        }}
                                    >
                                        {t('takeExam.sections.progressSummary')}
                                    </Typography>
                                </Box>
                                
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6} md={2.4}>
                                        <Paper 
                                            sx={{ 
                                                p: 2,
                                                textAlign: 'center',
                                                background: `linear-gradient(135deg, ${themeColors.primary || '#1976d2'}10, ${themeColors.primary || '#1976d2'}05)`,
                                                border: `2px solid ${themeColors.primary || '#1976d2'}30`,
                                                borderRadius: 2
                                            }}
                                        >
                                            <Typography 
                                                variant="h4" 
                                                sx={{ 
                                                    fontWeight: 700,
                                                    color: themeColors.primary || '#1976d2',
                                                    mb: 0.5
                                                }}
                                            >
                                                {currentQuestionIndex + 1}
                                            </Typography>
                                            <Typography 
                                                variant="body2"
                                                sx={{ color: themeColors.text.secondary || '#666666' }}
                                            >
                                                {t('takeExam.labels.currentQuestion')}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={6} md={2.4}>
                                        <Paper 
                                            sx={{ 
                                                p: 2,
                                                textAlign: 'center',
                                                background: `linear-gradient(135deg, ${themeColors.success || '#4caf50'}10, ${themeColors.success || '#4caf50'}05)`,
                                                border: `2px solid ${themeColors.success || '#4caf50'}30`,
                                                borderRadius: 2
                                            }}
                                        >
                                            <Typography 
                                                variant="h4" 
                                                sx={{ 
                                                    fontWeight: 700,
                                                    color: themeColors.success || '#4caf50',
                                                    mb: 0.5
                                                }}
                                            >
                                                {answeredQuestions}
                                            </Typography>
                                            <Typography 
                                                variant="body2"
                                                sx={{ color: themeColors.text.secondary || '#666666' }}
                                            >
                                                {t('takeExam.labels.answered')}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={6} md={2.4}>
                                        <Paper 
                                            sx={{ 
                                                p: 2,
                                                textAlign: 'center',
                                                background: `linear-gradient(135deg, ${themeColors.warning || '#ff9800'}10, ${themeColors.warning || '#ff9800'}05)`,
                                                border: `2px solid ${themeColors.warning || '#ff9800'}30`,
                                                borderRadius: 2
                                            }}
                                        >
                                            <Typography 
                                                variant="h4" 
                                                sx={{ 
                                                    fontWeight: 700,
                                                    color: themeColors.warning || '#ff9800',
                                                    mb: 0.5
                                                }}
                                            >
                                                {totalQuestions - answeredQuestions}
                                            </Typography>
                                            <Typography 
                                                variant="body2"
                                                sx={{ color: themeColors.text.secondary || '#666666' }}
                                            >
                                                {t('takeExam.labels.remaining')}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={6} md={2.4}>
                                        <Paper 
                                            sx={{ 
                                                p: 2,
                                                textAlign: 'center',
                                                background: `linear-gradient(135deg, ${themeColors.accent || '#9c27b0'}10, ${themeColors.accent || '#9c27b0'}05)`,
                                                border: `2px solid ${themeColors.accent || '#9c27b0'}30`,
                                                borderRadius: 2
                                            }}
                                        >
                                            <Typography 
                                                variant="h4" 
                                                sx={{ 
                                                    fontWeight: 700,
                                                    color: themeColors.accent || '#9c27b0',
                                                    mb: 0.5
                                                }}
                                            >
                                                {totalQuestions}
                                            </Typography>
                                            <Typography 
                                                variant="body2"
                                                sx={{ color: themeColors.text.secondary || '#666666' }}
                                            >
                                                {t('takeExam.labels.totalQuestions')}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={6} md={2.4}>
                                        <Paper 
                                            sx={{ 
                                                p: 2,
                                                textAlign: 'center',
                                                background: `linear-gradient(135deg, ${themeColors.info || '#2196f3'}10, ${themeColors.info || '#2196f3'}05)`,
                                                border: `2px solid ${themeColors.info || '#2196f3'}30`,
                                                borderRadius: 2
                                            }}
                                        >
                                            <Typography 
                                                variant="h4" 
                                                sx={{ 
                                                    fontWeight: 700,
                                                    color: themeColors.info || '#2196f3',
                                                    mb: 0.5
                                                }}
                                            >
                                                {totalMarks}
                                            </Typography>
                                            <Typography 
                                                variant="body2"
                                                sx={{ color: themeColors.text.secondary || '#666666' }}
                                            >
                                                {t('takeExam.labels.totalMarks')}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>
                                
                                <Box mt={3}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                        <Typography 
                                            variant="body2"
                                            sx={{ color: themeColors.text.secondary || '#666666' }}
                                        >
                                            {t('takeExam.labels.overallProgress')}
                                        </Typography>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            {answeredQuestions === totalQuestions && (
                                                <CheckCircle 
                                                    sx={{ 
                                                        color: themeColors.success || '#4caf50',
                                                        fontSize: 20
                                                    }} 
                                                />
                                            )}
                                            <Typography 
                                                variant="body2"
                                                sx={{ 
                                                    fontWeight: 600,
                                                    color: answeredQuestions === totalQuestions 
                                                        ? (themeColors.success || '#4caf50')
                                                        : (themeColors.primary || '#1976d2')
                                                }}
                                            >
                                                {t('takeExam.labels.progressComplete', { percent: Math.round(progressPercentage) })}
                                                {answeredQuestions === totalQuestions && ` - ${t('takeExam.labels.allQuestionsAnswered')}`}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={Math.max(0, Math.min(100, progressPercentage))}
                                        sx={{
                                            height: 12,
                                            borderRadius: 6,
                                            backgroundColor: `${themeColors.primary || '#1976d2'}20`,
                                            '& .MuiLinearProgress-bar': {
                                                background: answeredQuestions === totalQuestions
                                                    ? `linear-gradient(90deg, ${themeColors.success || '#4caf50'}, ${themeColors.accent || '#9c27b0'})`
                                                    : `linear-gradient(90deg, ${themeColors.primary || '#1976d2'}, ${themeColors.accent || '#9c27b0'})`,
                                                borderRadius: 6
                                            }
                                        }}
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Question Navigation Overview */}
                    <motion.div 
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                    >

                        <Card 
                            sx={{ 
                                mb: 4,
                                background: `linear-gradient(135deg, ${themeColors.background.primary || '#ffffff'}, ${themeColors.background.secondary || '#f5f5f5'})`,
                                border: `2px solid ${themeColors.border.primary || '#e0e0e0'}`,
                                boxShadow: `0 4px 20px ${themeColors.primary || '#1976d2'}20`
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Box display="flex" alignItems="center" mb={2}>
                                    <Avatar 
                                        sx={{ 
                                            mr: 2,
                                            bgcolor: `${themeColors.accent || '#9c27b0'}20`,
                                            color: themeColors.accent || '#9c27b0',
                                            width: 40,
                                            height: 40
                                        }}
                                    >
                                        <Quiz />
                                    </Avatar>
                                    <Typography 
                                        variant="h6" 
                                        sx={{ 
                                            fontWeight: 600,
                                            color: themeColors.text.primary || '#333333'
                                        }}
                                    >
                                        {t('takeExam.sections.questionNavigation')}
                                    </Typography>
                                </Box>
                                
                                <Box sx={{ 
                                    display: 'flex', 
                                    flexWrap: 'wrap', 
                                    gap: 1,
                                    maxHeight: 200,
                                    overflowY: 'auto'
                                }}>
                                    {examData?.questions?.map((question, index) => {
                                        const isAnswered = answers[question._id];
                                        const isCurrent = index === currentQuestionIndex;
                                        
                                        return (
                                            <Chip
                                                key={question._id}
                                                label={`Q${index + 1} (${question.marks || 0}m)`}
                                                onClick={() => setCurrentQuestionIndex(index)}
                                                sx={{
                                                    cursor: 'pointer',
                                                    fontWeight: 600,
                                                    fontSize: '0.9rem',
                                                    minWidth: 50,
                                                    height: 40,
                                                    background: isCurrent 
                                                        ? `linear-gradient(135deg, ${themeColors.primary || '#1976d2'}, ${themeColors.accent || '#9c27b0'})`
                                                        : isAnswered
                                                        ? `linear-gradient(135deg, ${themeColors.success || '#4caf50'}20, ${themeColors.success || '#4caf50'}10)`
                                                        : `linear-gradient(135deg, ${themeColors.background.secondary || '#f5f5f5'}, ${themeColors.background.primary || '#ffffff'})`,
                                                    color: isCurrent 
                                                        ? '#fff'
                                                        : isAnswered
                                                        ? themeColors.success || '#4caf50'
                                                        : themeColors.text.secondary || '#666666',
                                                    border: isCurrent 
                                                        ? 'none'
                                                        : `2px solid ${isAnswered ? (themeColors.success || '#4caf50') : (themeColors.border.primary || '#e0e0e0')}`,
                                                    '&:hover': {
                                                        background: isCurrent 
                                                            ? `linear-gradient(135deg, ${themeColors.accent || '#9c27b0'}, ${themeColors.primary || '#1976d2'})`
                                                            : `linear-gradient(135deg, ${themeColors.primary || '#1976d2'}20, ${themeColors.primary || '#1976d2'}10)`,
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: `0 4px 12px ${themeColors.primary || '#1976d2'}20`
                                                    }
                                                }}
                                            />
                                        );
                                    })}
                                </Box>
                                
                                <Box mt={2} display="flex" gap={2} flexWrap="wrap">
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Box sx={{ 
                                            width: 16, 
                                            height: 16, 
                                            borderRadius: '50%',
                                            background: `linear-gradient(135deg, ${themeColors.primary || '#1976d2'}, ${themeColors.accent || '#9c27b0'})`
                                        }} />
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary || '#666666' }}>
                                            {t('takeExam.labels.current')}
                                        </Typography>
                                    </Box>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Box sx={{ 
                                            width: 16, 
                                            height: 16, 
                                            borderRadius: '50%',
                                            background: `linear-gradient(135deg, ${themeColors.success || '#4caf50'}20, ${themeColors.success || '#4caf50'}10)`,
                                            border: `2px solid ${themeColors.success || '#4caf50'}`
                                        }} />
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary || '#666666' }}>
                                            {t('takeExam.labels.answered')}
                                        </Typography>
                                    </Box>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Box sx={{ 
                                            width: 16, 
                                            height: 16, 
                                            borderRadius: '50%',
                                            background: `linear-gradient(135deg, ${themeColors.background.secondary || '#f5f5f5'}, ${themeColors.background.primary || '#ffffff'})`,
                                            border: `2px solid ${themeColors.border.primary || '#e0e0e0'}`
                                        }} />
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary || '#666666' }}>
                                            {t('takeExam.labels.unanswered')}
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </motion.div>

                                        {/* Question */}
                    {currentQuestion && (
                        <motion.div
                            key={currentQuestionIndex}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card 
                                sx={{ 
                                    mb: 4,
                                    background: `linear-gradient(135deg, ${themeColors.background.primary}, ${themeColors.background.secondary})`,
                                    border: `1px solid ${themeColors.border.primary}`,
                                    boxShadow: `0 4px 20px ${themeColors.primary}10`
                                }}
                            >
                                <CardContent sx={{ p: 4 }}>
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
                                            <Quiz />
                                        </Avatar>
                                        <Box>
                                            <Typography 
                                                variant="h5" 
                                                sx={{ 
                                                    fontWeight: 600,
                                                    color: themeColors.text.primary
                                                }}
                                            >
                                                {t('takeExam.labels.question', { number: currentQuestionIndex + 1 })}
                                            </Typography>
                                            <Typography 
                                                variant="body2"
                                                sx={{ 
                                                    color: themeColors.text.secondary || '#666666',
                                                    mt: 0.5
                                                }}
                                            >
                                                {t('takeExam.labels.marks', { marks: currentQuestionMarks })}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Divider sx={{ mb: 3, borderColor: themeColors.border.primary }} />

                                    {/* Question Text */}
                                    {currentQuestion.questionText && (
                                        <Typography 
                                            variant="body1" 
                                            sx={{ 
                                                mb: 3,
                                                color: themeColors.text.primary,
                                                fontSize: '1.1rem',
                                                lineHeight: 1.6
                                            }}
                                        >
                                            {typeof currentQuestion.questionText === 'string' ? currentQuestion.questionText : t('takeExam.fallback.questionText')}
                                        </Typography>
                                    )}

                                    {/* Question Image */}
                                    {currentQuestion.questionImage && (
                                        <Box sx={{ mb: 3 }}>
                                            <Card
                                                sx={{
                                                    maxWidth: 600,
                                                    mx: 'auto',
                                                    cursor: 'pointer',
                                                    position: 'relative',
                                                    border: `1px solid ${themeColors.border.primary}`,
                                                    boxShadow: `0 2px 8px ${themeColors.primary}10`,
                                                    transition: 'all 0.3s ease',
                                                    '&:hover': {
                                                        boxShadow: `0 8px 25px ${themeColors.primary}20`,
                                                        transform: 'translateY(-4px)'
                                                    }
                                                }}
                                                onClick={() => handleImageClick(currentQuestion.questionImage, 'Question Image')}
                                            >
                                                <CardMedia
                                                    component="img"
                                                    image={currentQuestion.questionImage}
                                                    alt="Question"
                                                    sx={{
                                                        height: 300,
                                                        objectFit: 'contain',
                                                        backgroundColor: themeColors.background.secondary
                                                    }}
                                                    onError={(e) => {
                                                        console.error('Failed to load question image:', currentQuestion.questionImage);
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                                <Box sx={{
                                                    position: 'absolute',
                                                    top: 12,
                                                    right: 12,
                                                    backgroundColor: 'rgba(0,0,0,0.7)',
                                                    borderRadius: '50%',
                                                    p: 1,
                                                    backdropFilter: 'blur(4px)'
                                                }}>
                                                    <ZoomIn sx={{ color: 'white', fontSize: 20 }} />
                                                </Box>
                                            </Card>
                                        </Box>
                                    )}

                                    {/* Answer Options */}
                                    {currentQuestion.questionType === 'fill-in-the-blanks' ? (
                                        <TextField
                                            fullWidth
                                            variant="outlined"
                                            placeholder={t('takeExam.placeholders.typeAnswer')}
                                            value={currentAnswer}
                                            onChange={(e) => handleAnswerSelect(currentQuestion._id, e.target.value)}
                                            sx={{ 
                                                mt: 2,
                                                '& .MuiOutlinedInput-root': {
                                                    '& fieldset': {
                                                        borderColor: themeColors.border.primary
                                                    },
                                                    '&:hover fieldset': {
                                                        borderColor: themeColors.primary
                                                    },
                                                    '&.Mui-focused fieldset': {
                                                        borderColor: themeColors.primary
                                                    }
                                                }
                                            }}
                                            multiline
                                            rows={4}
                                        />
                                    ) : (
                                        <RadioGroup
                                            value={currentAnswer}
                                            onChange={(e) => handleAnswerSelect(currentQuestion._id, e.target.value)}
                                        >
                                            {currentQuestion.questionType === 'true/false' ? (
                                                <Grid container spacing={2}>
                                                    <Grid item xs={12} sm={6}>
                                                        <Paper 
                                                            sx={{ 
                                                                p: 3,
                                                                border: `2px solid ${currentAnswer === 'true' ? themeColors.primary : themeColors.border.primary}`,
                                                                borderRadius: 2,
                                                                background: currentAnswer === 'true' ? `${themeColors.primary}10` : themeColors.background.secondary,
                                                                cursor: 'pointer',
                                                                transition: 'all 0.3s ease',
                                                                '&:hover': {
                                                                    borderColor: themeColors.primary,
                                                                    background: `${themeColors.primary}05`
                                                                }
                                                            }}
                                                            onClick={() => handleAnswerSelect(currentQuestion._id, 'true')}
                                                        >
                                                            <FormControlLabel
                                                                value="true"
                                                                control={
                                                                    <Radio 
                                                                        sx={{
                                                                            color: themeColors.primary,
                                                                            '&.Mui-checked': {
                                                                                color: themeColors.primary
                                                                            }
                                                                        }}
                                                                    />
                                                                }
                                                                label={
                                                                    <Typography 
                                                                        variant="h6"
                                                                        sx={{ 
                                                                            fontWeight: 600,
                                                                            color: themeColors.text.primary
                                                                        }}
                                                                    >
                                                                        {t('takeExam.options.true')}
                                                                    </Typography>
                                                                }
                                                                sx={{ m: 0, width: '100%' }}
                                                            />
                                                        </Paper>
                                                    </Grid>
                                                    <Grid item xs={12} sm={6}>
                                                        <Paper 
                                                            sx={{ 
                                                                p: 3,
                                                                border: `2px solid ${currentAnswer === 'false' ? themeColors.primary : themeColors.border.primary}`,
                                                                borderRadius: 2,
                                                                background: currentAnswer === 'false' ? `${themeColors.primary}10` : themeColors.background.secondary,
                                                                cursor: 'pointer',
                                                                transition: 'all 0.3s ease',
                                                                '&:hover': {
                                                                    borderColor: themeColors.primary,
                                                                    background: `${themeColors.primary}05`
                                                                }
                                                            }}
                                                            onClick={() => handleAnswerSelect(currentQuestion._id, 'false')}
                                                        >
                                                            <FormControlLabel
                                                                value="false"
                                                                control={
                                                                    <Radio 
                                                                        sx={{
                                                                            color: themeColors.primary,
                                                                            '&.Mui-checked': {
                                                                                color: themeColors.primary
                                                                            }
                                                                        }}
                                                                    />
                                                                }
                                                                label={
                                                                    <Typography 
                                                                        variant="h6"
                                                                        sx={{ 
                                                                            fontWeight: 600,
                                                                            color: themeColors.text.primary
                                                                        }}
                                                                    >
                                                                        {t('takeExam.options.false')}
                                                                    </Typography>
                                                                }
                                                                sx={{ m: 0, width: '100%' }}
                                                            />
                                                        </Paper>
                                                    </Grid>
                                                </Grid>
                                            ) : (
                                                <Grid container spacing={2}>
                                                    {Array.isArray(currentQuestion.options) ? currentQuestion.options.map((option, index) => {
                                                        let optionText = '';
                                                        let optionValue = '';
                                                        let optionType = 'text';
                                                        let optionImage = null;

                                                        if (typeof option === 'string') {
                                                            optionText = option;
                                                            optionValue = String.fromCharCode(65 + index);
                                                            optionType = 'text';
                                                        } else if (typeof option === 'object' && option !== null) {
                                                            optionText = option.text || option.label || option.value || JSON.stringify(option);
                                                            optionValue = String.fromCharCode(65 + index);
                                                            optionType = option.type || 'text';
                                                            optionImage = option.type === 'image' ? option.value : null;
                                                        } else {
                                                            optionText = String(option);
                                                            optionValue = String.fromCharCode(65 + index);
                                                            optionType = 'text';
                                                        }

                                                        return (
                                                            <Grid item xs={12} sm={6} key={optionValue}>
                                                                <Paper 
                                                                    sx={{ 
                                                                        p: 3,
                                                                        border: `2px solid ${currentAnswer === optionValue ? themeColors.primary : themeColors.border.primary}`,
                                                                        borderRadius: 2,
                                                                        background: currentAnswer === optionValue ? `${themeColors.primary}10` : themeColors.background.secondary,
                                                                        cursor: 'pointer',
                                                                        transition: 'all 0.3s ease',
                                                                        '&:hover': {
                                                                            borderColor: themeColors.primary,
                                                                            background: `${themeColors.primary}05`,
                                                                            transform: 'translateY(-2px)',
                                                                            boxShadow: `0 4px 12px ${themeColors.primary}15`
                                                                        }
                                                                    }}
                                                                    onClick={() => handleAnswerSelect(currentQuestion._id, optionValue)}
                                                                >
                                                                    <FormControlLabel
                                                                        value={optionValue}
                                                                        control={
                                                                            <Radio 
                                                                                sx={{
                                                                                    color: themeColors.primary,
                                                                                    '&.Mui-checked': {
                                                                                        color: themeColors.primary
                                                                                    }
                                                                                }}
                                                                            />
                                                                        }
                                                                        label={
                                                                            optionType === 'image' && optionImage ? (
                                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                                                    <Card
                                                                                        sx={{
                                                                                            width: 120,
                                                                                            height: 80,
                                                                                            cursor: 'pointer',
                                                                                            position: 'relative',
                                                                                            border: `1px solid ${themeColors.border.primary}`,
                                                                                            transition: 'all 0.3s ease',
                                                                                            '&:hover': {
                                                                                                boxShadow: `0 4px 12px ${themeColors.primary}15`,
                                                                                                transform: 'scale(1.05)'
                                                                                            }
                                                                                        }}
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleImageClick(optionImage, `Option ${index + 1}`);
                                                                                        }}
                                                                                    >
                                                                                        <CardMedia
                                                                                            component="img"
                                                                                            image={optionImage}
                                                                                            alt={`Option ${index + 1}`}
                                                                                            sx={{
                                                                                                height: 80,
                                                                                                objectFit: 'contain',
                                                                                                backgroundColor: themeColors.background.secondary
                                                                                            }}
                                                                                            onError={(e) => {
                                                                                                console.error('Failed to load option image:', optionImage);
                                                                                                e.target.style.display = 'none';
                                                                                            }}
                                                                                        />
                                                                                        <Box sx={{
                                                                                            position: 'absolute',
                                                                                            top: 4,
                                                                                            right: 4,
                                                                                            backgroundColor: 'rgba(0,0,0,0.7)',
                                                                                            borderRadius: '50%',
                                                                                            p: 0.5,
                                                                                            backdropFilter: 'blur(4px)'
                                                                                        }}>
                                                                                            <ZoomIn sx={{ color: 'white', fontSize: 16 }} />
                                                                                        </Box>
                                                                                    </Card>
                                                                                    <Typography 
                                                                                        variant="body1"
                                                                                        sx={{ 
                                                                                            color: themeColors.text.primary,
                                                                                            fontWeight: 500
                                                                                        }}
                                                                                    >
                                                                                        {t('takeExam.labels.option', { letter: optionValue })}
                                                                                    </Typography>
                                                                                </Box>
                                                                            ) : (
                                                                                <Typography 
                                                                                    variant="body1"
                                                                                    sx={{ 
                                                                                        color: themeColors.text.primary,
                                                                                        fontWeight: 500
                                                                                    }}
                                                                                >
                                                                                    {optionText}
                                                                                </Typography>
                                                                            )
                                                                        }
                                                                        sx={{ m: 0, width: '100%' }}
                                                                    />
                                                                </Paper>
                                                            </Grid>
                                                        );
                                                    }) : (
                                                        <Grid item xs={12}>
                                                            <Typography 
                                                                color="error"
                                                                sx={{ color: themeColors.error }}
                                                            >
                                                                {t('takeExam.messages.noOptionsAvailable')}
                                                            </Typography>
                                                        </Grid>
                                                    )}
                                                </Grid>
                                            )}
                                        </RadioGroup>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* Enhanced Navigation Buttons */}
                    <motion.div 
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card 
                            sx={{ 
                                mt: 4,
                                background: `linear-gradient(135deg, ${themeColors.background.primary}, ${themeColors.background.secondary})`,
                                border: `1px solid ${themeColors.border.primary}`,
                                boxShadow: `0 4px 20px ${themeColors.primary}10`
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    {/* Previous Button */}
                                    <Button
                                        onClick={handlePreviousQuestion}
                                        disabled={currentQuestionIndex === 0}
                                        startIcon={<NavigateBefore />}
                                        sx={{
                                            borderColor: themeColors.primary,
                                            color: themeColors.primary,
                                            fontWeight: 600,
                                            py: 2,
                                            px: 4,
                                            borderRadius: 2,
                                            textTransform: 'none',
                                            fontSize: '1.1rem',
                                            minWidth: 140,
                                            '&:hover': {
                                                borderColor: themeColors.accent,
                                                color: themeColors.accent,
                                                background: `${themeColors.accent}05`,
                                                transform: 'translateY(-2px)',
                                                boxShadow: `0 4px 12px ${themeColors.accent}20`
                                            },
                                            '&:disabled': {
                                                borderColor: themeColors.text.disabled,
                                                color: themeColors.text.disabled
                                            }
                                        }}
                                        variant="outlined"
                                    >
                                        {t('takeExam.actions.previous')}
                                    </Button>

                                    {/* Question Counter */}
                                    <Box textAlign="center">
                                        <Typography 
                                            variant="h6" 
                                            sx={{ 
                                                fontWeight: 700,
                                                color: themeColors.text.primary,
                                                mb: 0.5
                                            }}
                                        >
                                            {t('takeExam.labels.questionOf', { current: currentQuestionIndex + 1, total: totalQuestions })}
                                        </Typography>
                                        <Typography 
                                            variant="body2"
                                            sx={{ color: themeColors.text.secondary }}
                                        >
                                            {t('takeExam.labels.answeredRemaining', { answered: answeredQuestions, remaining: totalQuestions - answeredQuestions })}
                                        </Typography>
                                        <Typography 
                                            variant="body2"
                                            sx={{ 
                                                color: themeColors.text.secondary,
                                                fontWeight: 500,
                                                mt: 0.5
                                            }}
                                        >
                                            {t('takeExam.labels.totalMarksValue', { marks: totalMarks })}
                                        </Typography>
                                    </Box>

                                    {/* Next and Submit Buttons */}
                                    <Box display="flex" gap={2}>
                                        <Button
                                            onClick={handleNextQuestion}
                                            disabled={currentQuestionIndex === (examData.questions?.length - 1)}
                                            endIcon={<NavigateNext />}
                                            sx={{
                                                borderColor: themeColors.accent,
                                                color: themeColors.accent,
                                                fontWeight: 600,
                                                py: 2,
                                                px: 4,
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                fontSize: '1.1rem',
                                                minWidth: 140,
                                                '&:hover': {
                                                    borderColor: themeColors.primary,
                                                    color: themeColors.primary,
                                                    background: `${themeColors.primary}05`,
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: `0 4px 12px ${themeColors.primary}20`
                                                },
                                                '&:disabled': {
                                                    borderColor: themeColors.text.disabled,
                                                    color: themeColors.text.disabled
                                                }
                                            }}
                                            variant="outlined"
                                        >
                                            {t('takeExam.actions.next')}
                                        </Button>

                                        <Button
                                            onClick={handleSubmitExam}
                                            variant="contained"
                                            disabled={submitResult.isLoading}
                                            sx={{
                                                background: answeredQuestions === totalQuestions 
                                                    ? `linear-gradient(135deg, ${themeColors.success}, ${themeColors.accent})`
                                                    : `linear-gradient(135deg, ${themeColors.warning}, ${themeColors.accent})`,
                                                color: '#fff',
                                                fontWeight: 600,
                                                py: 2,
                                                px: 4,
                                                borderRadius: 2,
                                                textTransform: 'none',
                                                fontSize: '1.1rem',
                                                minWidth: 160,
                                                '&:hover': {
                                                    background: answeredQuestions === totalQuestions
                                                        ? `linear-gradient(135deg, ${themeColors.accent}, ${themeColors.success})`
                                                        : `linear-gradient(135deg, ${themeColors.accent}, ${themeColors.warning})`,
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: `0 4px 15px ${answeredQuestions === totalQuestions ? themeColors.success : themeColors.warning}30`
                                                },
                                                '&:disabled': {
                                                    background: themeColors.text.disabled
                                                }
                                            }}
                                        >
                                            {submitResult.isLoading ? (
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <CircularProgress size={20} color="inherit" />
                                                    {t('takeExam.actions.submitting')}
                                                </Box>
                                            ) : (
                                                answeredQuestions === 0 ? t('takeExam.actions.submitCount', { answered: 0, total: totalQuestions }) : 
                                                answeredQuestions === totalQuestions ? t('takeExam.actions.submitExam') : t('takeExam.actions.submitCount', { answered: answeredQuestions, total: totalQuestions })
                                            )}
                                        </Button>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Warnings */}
                    <AnimatePresence>
                        {timeLeft < 300 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Alert 
                                    severity="warning" 
                                    sx={{ 
                                        mt: 3,
                                        background: `linear-gradient(135deg, ${themeColors.warning}10, ${themeColors.warning}05)`,
                                        border: `1px solid ${themeColors.warning}20`,
                                        borderRadius: 2
                                    }}
                                >
                                    <Warning sx={{ mr: 1 }} />
                                    {t('takeExam.warnings.timeRunningOut')}
                                </Alert>
                            </motion.div>
                        )}
                        
                        {answeredQuestions < totalQuestions && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Alert 
                                    severity={answeredQuestions === 0 ? "warning" : "info"}
                                    sx={{ 
                                        mt: 3,
                                        background: answeredQuestions === 0 
                                            ? `linear-gradient(135deg, ${themeColors.warning}10, ${themeColors.warning}05)`
                                            : `linear-gradient(135deg, ${themeColors.info || '#2196f3'}10, ${themeColors.info || '#2196f3'}05)`,
                                        border: answeredQuestions === 0 
                                            ? `1px solid ${themeColors.warning}20`
                                            : `1px solid ${themeColors.info || '#2196f3'}20`,
                                        borderRadius: 2
                                    }}
                                >
                                    {answeredQuestions === 0 ? (
                                        <>
                                            <Warning sx={{ mr: 1 }} />
                                            {t('takeExam.warnings.noQuestionsAnswered', { timeRunningOut: timeLeft < 300 })}
                                        </>
                                    ) : (
                                        <>
                                            <Quiz sx={{ mr: 1 }} />
                                            {t('takeExam.warnings.unansweredQuestions', { count: totalQuestions - answeredQuestions, timeRunningOut: timeLeft < 300 })}
                                        </>
                                    )}
                                </Alert>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Submit Confirmation Dialog */}
                    <Dialog
                        open={showSubmitDialog}
                        onClose={() => setShowSubmitDialog(false)}
                        maxWidth="sm"
                        fullWidth
                        PaperProps={{
                            sx: {
                                borderRadius: 3,
                                background: `linear-gradient(135deg, ${themeColors.background.primary}, ${themeColors.background.secondary})`,
                                border: `1px solid ${themeColors.border.primary}`
                            }
                        }}
                    >
                        <DialogTitle sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            pb: 1
                        }}>
                            <Warning sx={{ color: themeColors.warning, fontSize: 28 }} />
                            <Typography variant="h6" sx={{ color: themeColors.text.primary }}>
                                {t('takeExam.dialog.confirmSubmission')}
                            </Typography>
                        </DialogTitle>
                        <DialogContent sx={{ pt: 2 }}>
                            {answeredQuestions === 0 ? (
                                <>
                                    <Typography variant="body1" sx={{ color: themeColors.text.primary, mb: 2 }}>
                                        {t('takeExam.dialog.noQuestionsAnsweredMessage', { total: totalQuestions })}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        {t('takeExam.dialog.noQuestionsAnsweredWarning')}
                                    </Typography>
                                </>
                            ) : (
                                <>
                                    <Typography variant="body1" sx={{ color: themeColors.text.primary, mb: 2 }}>
                                        {t('takeExam.dialog.unansweredQuestionsMessage', { unanswered: totalQuestions - answeredQuestions, total: totalQuestions })}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        {t('takeExam.dialog.submitWarning')}
                                    </Typography>
                                </>
                            )}
                        </DialogContent>
                        <DialogActions sx={{ p: 3, gap: 2 }}>
                            <Button
                                onClick={() => setShowSubmitDialog(false)}
                                variant="outlined"
                                sx={{
                                    borderColor: themeColors.border.primary,
                                    color: themeColors.text.primary,
                                    '&:hover': {
                                        borderColor: themeColors.primary,
                                        color: themeColors.primary
                                    }
                                }}
                            >
                                {t('takeExam.dialog.continueExam')}
                            </Button>
                            <Button
                                onClick={() => {
                                    setShowSubmitDialog(false);
                                    submitExam();
                                }}
                                variant="contained"
                                sx={{
                                    background: `linear-gradient(135deg, ${themeColors.warning}, ${themeColors.accent})`,
                                    color: '#fff',
                                    '&:hover': {
                                        background: `linear-gradient(135deg, ${themeColors.accent}, ${themeColors.warning})`
                                    }
                                }}
                            >
                                {t('takeExam.dialog.submitAnyway')}
                            </Button>
                        </DialogActions>
                    </Dialog>

                    {/* Image Modal */}
                    <Dialog
                        open={imageModal.open}
                        onClose={handleCloseImageModal}
                        maxWidth="lg"
                        fullWidth
                        PaperProps={{
                            sx: {
                                backgroundColor: 'rgba(0,0,0,0.95)',
                                color: 'white',
                                borderRadius: 3
                            }
                        }}
                    >
                        <DialogTitle sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            pb: 1
                        }}>
                            <Typography variant="h6">{imageModal.imageAlt}</Typography>
                            <IconButton 
                                onClick={handleCloseImageModal} 
                                sx={{ 
                                    color: 'white',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255,255,255,0.1)'
                                    }
                                }}
                            >
                                <Close />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            p: 3
                        }}>
                            <Box sx={{
                                position: 'relative',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                minHeight: '400px',
                                width: '100%'
                            }}>
                                <img
                                    src={imageModal.imageUrl}
                                    alt={imageModal.imageAlt}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '70vh',
                                        objectFit: 'contain',
                                        transform: `scale(${imageModal.zoomLevel})`,
                                        transition: 'transform 0.3s ease-in-out',
                                        borderRadius: 8
                                    }}
                                    onError={(e) => {
                                        console.error('Failed to load image in modal:', imageModal.imageUrl);
                                        e.target.style.display = 'none';
                                    }}
                                />
                            </Box>

                            {/* Zoom Controls */}
                            <Box sx={{
                                display: 'flex',
                                gap: 2,
                                mt: 3,
                                justifyContent: 'center'
                            }}>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={handleZoomOut}
                                    disabled={imageModal.zoomLevel <= 0.5}
                                    sx={{ 
                                        color: 'white', 
                                        borderColor: 'white',
                                        '&:hover': {
                                            borderColor: 'white',
                                            backgroundColor: 'rgba(255,255,255,0.1)'
                                        }
                                    }}
                                >
                                    {t('takeExam.imageModal.zoomOut')}
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={handleResetZoom}
                                    sx={{ 
                                        color: 'white', 
                                        borderColor: 'white',
                                        '&:hover': {
                                            borderColor: 'white',
                                            backgroundColor: 'rgba(255,255,255,0.1)'
                                        }
                                    }}
                                >
                                    {t('takeExam.imageModal.reset', { percent: Math.round(imageModal.zoomLevel * 100) })}
                                </Button>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={handleZoomIn}
                                    disabled={imageModal.zoomLevel >= 3}
                                    sx={{ 
                                        color: 'white', 
                                        borderColor: 'white',
                                        '&:hover': {
                                            borderColor: 'white',
                                            backgroundColor: 'rgba(255,255,255,0.1)'
                                        }
                                    }}
                                >
                                    {t('takeExam.imageModal.zoomIn')}
                                </Button>
                            </Box>
                        </DialogContent>
                    </Dialog>
                </motion.div>
            </Box>
        </CustomOutletBox>
    );
};

export default TakeExam; 