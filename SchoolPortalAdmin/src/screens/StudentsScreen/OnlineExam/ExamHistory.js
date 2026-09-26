import React, { useEffect } from 'react';
import {
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    CircularProgress,
    Alert,
    Breadcrumbs,
    Link,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Card,
    CardMedia,
    Grid,
    Avatar,
    Paper,
    Divider,
    LinearProgress
} from '@mui/material';
import {
    School,
    History,
    ExpandMore,
    Quiz,
    ArrowBack,
    CheckCircle,
    Cancel,
    Grade,
    Timer,
    TrendingUp,
    EmojiEvents
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router';
import { useOnlineExam } from '../../../Redux/features/OnlineExam/useOnlineExam';
import { useSnackbar } from '../../../hooks/SnackBar';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import CustomOutletBox from '../../../components/Common/CustomOutletBox';
import { BASE_PATH } from '../../../config';
import { useTranslation } from 'react-i18next';

const ExamHistory = () => {
    const navigate = useNavigate();
    const showSnackbar = useSnackbar();
    const { examId } = useParams();
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();
    const {
        fetchAttendedExams,
        attendedExamsResult,
    } = useOnlineExam();

    // Fetch attended exams on component mount
    useEffect(() => {
        fetchAttendedExams({ publishId: examId });
    }, []);

    // Handle navigation back to dashboard
    const handleBackToDashboard = () => {
        navigate('/students/online-exam');
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

    // Render Exam History
    const renderExamHistory = () => {
        if (attendedExamsResult.isLoading) {
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
                            {t('examHistory.messages.loading')}
                        </Typography>
                    </motion.div>
                </Box>
            );
        }

        if (attendedExamsResult.error) {
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
                        {t('examHistory.messages.loadFailed', { message: attendedExamsResult.error.message })}
                    </Alert>
                </motion.div>
            );
        }

        const attendedExams = attendedExamsResult.data?.data || [];

        if (attendedExams.length === 0) {
            return (
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
                        {t('examHistory.messages.noHistoryAvailable')}
                    </Alert>
                </motion.div>
            );
        }

        return (
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {attendedExams.map((examDetail, index) => {
                    const securedMarks = examDetail.marks || 0;
                    
                    // Calculate total marks from questions array
                    const totalMarks = examDetail.questions?.reduce((sum, question) => sum + (question.marks || 0), 0) || examDetail.totalMark || 100;
                    
                    const percentage = (securedMarks / totalMarks) * 100;
                    
                    return (
                        <motion.div key={index} variants={itemVariants}>
                            <Accordion 
                                sx={{ 
                                    mb: 3,
                                    background: `linear-gradient(135deg, ${themeColors.background.primary}, ${themeColors.background.secondary})`,
                                    border: `1px solid ${themeColors.border.primary}`,
                                    boxShadow: `0 4px 20px ${themeColors.primary}10`,
                                    '&:before': { display: 'none' }
                                }}
                            >
                                <AccordionSummary 
                                    expandIcon={<ExpandMore />}
                                    sx={{
                                        '& .MuiAccordionSummary-content': {
                                            alignItems: 'center'
                                        }
                                    }}
                                >
                                    <Box display="flex" alignItems="center" width="100%">
                                        <Avatar 
                                            sx={{ 
                                                mr: 2,
                                                width: 48,
                                                height: 48,
                                                bgcolor: `${themeColors.primary}20`,
                                                color: themeColors.primary
                                            }}
                                        >
                                            <Quiz />
                                        </Avatar>
                                        <Box flex={1}>
                                            <Typography 
                                                variant="h6" 
                                                sx={{ 
                                                    fontWeight: 600,
                                                    color: themeColors.text.primary
                                                }}
                                            >
                                                {examDetail.publish?.exam?.examName || t('examHistory.fallback.exam')}
                                            </Typography>
                                            <Typography 
                                                variant="body2"
                                                sx={{ 
                                                    color: themeColors.text.secondary,
                                                    mt: 0.5
                                                }}
                                            >
                                                {new Date(examDetail.publish?.createdAt).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Paper 
                                                sx={{ 
                                                    p: 1.5, 
                                                    textAlign: 'center',
                                                    background: `linear-gradient(135deg, ${themeColors.primary}10, ${themeColors.primary}05)`,
                                                    border: `1px solid ${themeColors.primary}20`,
                                                    minWidth: 80
                                                }}
                                            >
                                                <Grade sx={{ 
                                                    color: themeColors.primary, 
                                                    fontSize: 20,
                                                    mb: 0.5
                                                }} />
                                                <Typography 
                                                    variant="body2" 
                                                    sx={{ 
                                                        fontWeight: 700,
                                                        color: themeColors.primary
                                                    }}
                                                >
                                                    {securedMarks}
                                                </Typography>
                                                <Typography 
                                                    variant="caption"
                                                    sx={{ color: themeColors.text.secondary }}
                                                >
                                                    / {totalMarks}
                                                </Typography>
                                            </Paper>
                                            <Chip
                                                label={`${percentage.toFixed(1)}%`}
                                                sx={{
                                                    bgcolor: percentage >= 70 ? `${themeColors.success}20` : 
                                                             percentage >= 50 ? `${themeColors.warning}20` : `${themeColors.error}20`,
                                                    color: percentage >= 70 ? themeColors.success : 
                                                           percentage >= 50 ? themeColors.warning : themeColors.error,
                                                    fontWeight: 600
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{ pt: 0 }}>
                                    <Box>
                                        {/* Performance Summary */}
                                        <Box sx={{ mb: 3 }}>
                                            <Typography 
                                                variant="subtitle1" 
                                                sx={{ 
                                                    mb: 2,
                                                    fontWeight: 600,
                                                    color: themeColors.text.primary
                                                }}
                                            >
                                                {t('examHistory.sections.performanceSummary')}
                                            </Typography>
                                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                                <Grid item xs={12} md={6}>
                                                    <Paper 
                                                        sx={{ 
                                                            p: 2,
                                                            background: `linear-gradient(135deg, ${themeColors.success}10, ${themeColors.success}05)`,
                                                            border: `1px solid ${themeColors.success}20`
                                                        }}
                                                    >
                                                        <Box display="flex" alignItems="center">
                                                            <CheckCircle sx={{ 
                                                                color: themeColors.success, 
                                                                mr: 1,
                                                                fontSize: 20
                                                            }} />
                                                            <Typography 
                                                                variant="body2"
                                                                sx={{ color: themeColors.text.secondary }}
                                                            >
                                                                {t('examHistory.labels.correctAnswers', { count: examDetail.questions?.filter(q => q.attendedAnswer === q.correctAnswer).length || 0 })}
                                                            </Typography>
                                                        </Box>
                                                    </Paper>
                                                </Grid>
                                                <Grid item xs={12} md={6}>
                                                    <Paper 
                                                        sx={{ 
                                                            p: 2,
                                                            background: `linear-gradient(135deg, ${themeColors.error}10, ${themeColors.error}05)`,
                                                            border: `1px solid ${themeColors.error}20`
                                                        }}
                                                    >
                                                        <Box display="flex" alignItems="center">
                                                            <Cancel sx={{ 
                                                                color: themeColors.error, 
                                                                mr: 1,
                                                                fontSize: 20
                                                            }} />
                                                            <Typography 
                                                                variant="body2"
                                                                sx={{ color: themeColors.text.secondary }}
                                                            >
                                                                {t('examHistory.labels.incorrectAnswers', { count: examDetail.questions?.filter(q => q.attendedAnswer !== q.correctAnswer).length || 0 })}
                                                            </Typography>
                                                        </Box>
                                                    </Paper>
                                                </Grid>
                                            </Grid>
                                            <Box sx={{ mb: 2 }}>
                                                <Box display="flex" justifyContent="space-between" mb={1}>
                                                    <Typography 
                                                        variant="body2"
                                                        sx={{ color: themeColors.text.secondary }}
                                                    >
                                                        {t('examHistory.labels.overallPerformance')}
                                                    </Typography>
                                                    <Typography 
                                                        variant="body2"
                                                        sx={{ 
                                                            fontWeight: 600,
                                                            color: themeColors.primary
                                                        }}
                                                    >
                                                        {percentage.toFixed(1)}%
                                                    </Typography>
                                                </Box>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={percentage}
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
                                        </Box>

                                        <Divider sx={{ mb: 3, borderColor: themeColors.border.primary }} />

                                        <Typography 
                                            variant="subtitle1" 
                                            sx={{ 
                                                mb: 2,
                                                fontWeight: 600,
                                                color: themeColors.text.primary
                                            }}
                                        >
                                            {t('examHistory.sections.questionsAndAnswers')}:
                                        </Typography>
                                        <List>
                                            {examDetail.questions?.map((question, qIndex) => {
                                                const isCorrect = question.attendedAnswer === question.correctAnswer;
                                                
                                                return (
                                                    <ListItem 
                                                        key={qIndex} 
                                                        sx={{ 
                                                            mb: 2,
                                                            p: 2,
                                                            background: `linear-gradient(135deg, ${isCorrect ? themeColors.success : themeColors.error}05, ${isCorrect ? themeColors.success : themeColors.error}02)`,
                                                            border: `1px solid ${isCorrect ? themeColors.success : themeColors.error}20`,
                                                            borderRadius: 2
                                                        }}
                                                    >
                                                        <ListItemIcon>
                                                            <Avatar 
                                                                sx={{ 
                                                                    width: 32,
                                                                    height: 32,
                                                                    bgcolor: isCorrect ? `${themeColors.success}20` : `${themeColors.error}20`,
                                                                    color: isCorrect ? themeColors.success : themeColors.error
                                                                }}
                                                            >
                                                                {isCorrect ? <CheckCircle /> : <Cancel />}
                                                            </Avatar>
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={
                                                                <Box>
                                                                    <Typography 
                                                                        variant="body1" 
                                                                        sx={{ 
                                                                            mb: 2,
                                                                            color: themeColors.text.primary,
                                                                            fontWeight: 500
                                                                        }}
                                                                    >
                                                                        {question.questionText}
                                                                    </Typography>

                                                                    {/* Question Image */}
                                                                    {question.questionImage && (
                                                                        <Box sx={{ mb: 2 }}>
                                                                            <Card 
                                                                                sx={{ 
                                                                                    maxWidth: 400, 
                                                                                    mx: 'auto',
                                                                                    border: `1px solid ${themeColors.border.primary}`,
                                                                                    boxShadow: `0 2px 8px ${themeColors.primary}10`
                                                                                }}
                                                                            >
                                                                                <CardMedia
                                                                                    component="img"
                                                                                    image={question.questionImage}
                                                                                    alt="Question"
                                                                                    sx={{
                                                                                        height: 200,
                                                                                        objectFit: 'contain',
                                                                                        backgroundColor: themeColors.background.secondary
                                                                                    }}
                                                                                    onError={(e) => {
                                                                                        console.error('Failed to load question image:', question.questionImage);
                                                                                        e.target.style.display = 'none';
                                                                                    }}
                                                                                />
                                                                            </Card>
                                                                        </Box>
                                                                    )}

                                                                    {/* Options */}
                                                                    {question.questionType === 'objective' && Array.isArray(question.options) && question.options.length > 0 && (
                                                                        <Box mt={2}>
                                                                            <Typography 
                                                                                variant="subtitle2" 
                                                                                sx={{ 
                                                                                    mb: 2,
                                                                                    fontWeight: 600,
                                                                                    color: themeColors.text.primary
                                                                                }}
                                                                            >
                                                                                {t('examHistory.labels.options')}:
                                                                            </Typography>
                                                                            <Grid container spacing={2}>
                                                                                {question.options.map((option, optIndex) => {
                                                                                    const optionLetter = String.fromCharCode(65 + optIndex);
                                                                                    const isCorrectOption = optionLetter === question.correctAnswer;
                                                                                    const isAttendedOption = optionLetter === question.attendedAnswer;

                                                                                    return (
                                                                                        <Grid item xs={12} sm={6} key={optIndex}>
                                                                                            <Paper
                                                                                                sx={{
                                                                                                    p: 2,
                                                                                                    border: `2px solid ${
                                                                                                        isCorrectOption ? themeColors.success : 
                                                                                                        isAttendedOption && !isCorrectOption ? themeColors.error : 
                                                                                                        themeColors.border.primary
                                                                                                    }`,
                                                                                                    borderRadius: 2,
                                                                                                    background: isCorrectOption ? `${themeColors.success}10` : 
                                                                                                               isAttendedOption && !isCorrectOption ? `${themeColors.error}10` : 
                                                                                                               themeColors.background.secondary,
                                                                                                    position: 'relative',
                                                                                                    transition: 'all 0.3s ease',
                                                                                                    '&:hover': {
                                                                                                        transform: 'translateY(-2px)',
                                                                                                        boxShadow: `0 4px 12px ${themeColors.primary}15`
                                                                                                    }
                                                                                                }}
                                                                                            >
                                                                                                <Typography 
                                                                                                    variant="body2" 
                                                                                                    sx={{ 
                                                                                                        fontWeight: 'bold', 
                                                                                                        mb: 1,
                                                                                                        color: themeColors.text.primary
                                                                                                    }}
                                                                                                >
                                                                                                    {t('examHistory.labels.option', { letter: optionLetter })}:
                                                                                                </Typography>

                                                                                                {option.type === 'image' ? (
                                                                                                    <Card sx={{ width: 100, height: 60 }}>
                                                                                                        <CardMedia
                                                                                                            component="img"
                                                                                                            image={option.value}
                                                                                                            alt={`Option ${optionLetter}`}
                                                                                                            sx={{
                                                                                                                height: 60,
                                                                                                                objectFit: 'contain',
                                                                                                                backgroundColor: themeColors.background.secondary
                                                                                                            }}
                                                                                                            onError={(e) => {
                                                                                                                console.error('Failed to load option image:', option.value);
                                                                                                                e.target.style.display = 'none';
                                                                                                            }}
                                                                                                        />
                                                                                                    </Card>
                                                                                                ) : (
                                                                                                    <Typography 
                                                                                                        variant="body2"
                                                                                                        sx={{ color: themeColors.text.primary }}
                                                                                                    >
                                                                                                        {option.value}
                                                                                                    </Typography>
                                                                                                )}

                                                                                                {/* Option indicators */}
                                                                                                <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                                                                                                    {isCorrectOption && (
                                                                                                        <CheckCircle 
                                                                                                            sx={{ 
                                                                                                                fontSize: 20,
                                                                                                                color: themeColors.success
                                                                                                            }} 
                                                                                                        />
                                                                                                    )}
                                                                                                    {isAttendedOption && !isCorrectOption && (
                                                                                                        <Cancel 
                                                                                                            sx={{ 
                                                                                                                fontSize: 20,
                                                                                                                color: themeColors.error
                                                                                                            }} 
                                                                                                        />
                                                                                                    )}
                                                                                                </Box>
                                                                                            </Paper>
                                                                                        </Grid>
                                                                                    );
                                                                                })}
                                                                            </Grid>
                                                                        </Box>
                                                                    )}

                                                                    {/* Fill-in-the-blanks or True/False */}
                                                                    {question.questionType !== 'objective' && (
                                                                        <Box mt={2}>
                                                                            <Typography 
                                                                                variant="subtitle2" 
                                                                                sx={{ 
                                                                                    mb: 2,
                                                                                    fontWeight: 600,
                                                                                    color: themeColors.text.primary
                                                                                }}
                                                                            >
                                                                                {t('examHistory.labels.answerDetails')}:
                                                                            </Typography>
                                                                            <Paper 
                                                                                sx={{ 
                                                                                    p: 3, 
                                                                                    border: `1px solid ${themeColors.border.primary}`,
                                                                                    borderRadius: 2,
                                                                                    background: themeColors.background.secondary
                                                                                }}
                                                                            >
                                                                                <Grid container spacing={2}>
                                                                                    <Grid item xs={12} md={6}>
                                                                                        <Typography 
                                                                                            variant="body2" 
                                                                                            sx={{ 
                                                                                                color: themeColors.text.secondary,
                                                                                                mb: 0.5
                                                                                            }}
                                                                                        >
                                                                                            {t('examHistory.labels.yourAnswer')}:
                                                                                        </Typography>
                                                                                        <Typography 
                                                                                            variant="body1"
                                                                                            sx={{ 
                                                                                                color: themeColors.text.primary,
                                                                                                fontWeight: 500
                                                                                            }}
                                                                                        >
                                                                                            {question.attendedAnswer || t('examHistory.labels.notAnswered')}
                                                                                        </Typography>
                                                                                    </Grid>
                                                                                    <Grid item xs={12} md={6}>
                                                                                        <Typography 
                                                                                            variant="body2" 
                                                                                            sx={{ 
                                                                                                color: themeColors.text.secondary,
                                                                                                mb: 0.5
                                                                                            }}
                                                                                        >
                                                                                            {t('examHistory.labels.correctAnswer')}:
                                                                                        </Typography>
                                                                                        <Typography 
                                                                                            variant="body1"
                                                                                            sx={{ 
                                                                                                color: themeColors.text.primary,
                                                                                                fontWeight: 500
                                                                                            }}
                                                                                        >
                                                                                            {question.correctAnswer}
                                                                                        </Typography>
                                                                                    </Grid>
                                                                                </Grid>
                                                                            </Paper>
                                                                        </Box>
                                                                    )}

                                                                    <Box mt={2}>
                                                                        <Chip
                                                                            icon={<Grade />}
                                                                            label={t('examHistory.labels.marks', { marks: question.marks })}
                                                                            sx={{
                                                                                bgcolor: `${themeColors.primary}20`,
                                                                                color: themeColors.primary,
                                                                                fontWeight: 600
                                                                            }}
                                                                        />
                                                                    </Box>
                                                                </Box>
                                                            }
                                                        />
                                                    </ListItem>
                                                );
                                            })}
                                        </List>
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        </motion.div>
                    );
                })}
            </motion.div>
        );
    };

    return (
        <CustomOutletBox>
            <Box sx={{ p: 3 }}>
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Breadcrumbs */}
                    <motion.div variants={itemVariants}>
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
                                {t('examHistory.breadcrumbs.dashboard')}
                            </Link>
                            <Typography 
                                color="text.primary"
                                sx={{ color: themeColors.text.primary }}
                            >
                                {t('examHistory.title')}
                            </Typography>
                        </Breadcrumbs>
                    </motion.div>

                    <motion.div variants={itemVariants}>
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
                                <History />
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
                                    {t('examHistory.title')}
                                </Typography>
                                <Typography 
                                    variant="body1"
                                    sx={{ color: themeColors.text.secondary }}
                                >
                                    {t('examHistory.subtitle')}
                                </Typography>
                            </Box>
                        </Box>
                    </motion.div>

                    {renderExamHistory()}
                </motion.div>
            </Box>
        </CustomOutletBox>
    );
};

export default ExamHistory; 