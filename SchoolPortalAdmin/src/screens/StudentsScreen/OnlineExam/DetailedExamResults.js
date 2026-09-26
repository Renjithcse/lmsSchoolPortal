import React, { useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Breadcrumbs,
    Link,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Divider,
    Alert,
    CardMedia,
    Grid,
    CircularProgress,
    Avatar,
    Paper,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import {
    School,
    ArrowBack,
    Quiz,
    CheckCircle,
    Cancel,
    ExpandMore,
    Visibility,
    Grade,
    TrendingUp,
    TrendingDown
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useOnlineExam } from '../../../Redux/features/OnlineExam/useOnlineExam';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import CustomOutletBox from '../../../components/Common/CustomOutletBox';
import { BASE_PATH } from '../../../config';
import { useTranslation } from 'react-i18next';

const DetailedExamResults = () => {
    const navigate = useNavigate();
    const { examId } = useParams();
    const location = useLocation();
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();
    const {
        fetchAttendedExams,
        attendedExamsResult,
    } = useOnlineExam();

    // Get results from location state or fetch from API
    const results = location.state?.results;

    // Fetch results if not available in location state
    useEffect(() => {
        if (examId && !results) {
            fetchAttendedExams({ publishId: examId });
        }
    }, [examId, results]);

    // Use results from API if not available in location state
    const examResults = results || (attendedExamsResult.data?.data?.[0]);

    // Handle navigation back to exam results
    const handleBackToResults = () => {
        navigate(`/students/online-exam/results/${examId}`);
    };

    // Handle navigation back to exams
    const handleBackToExams = () => {
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

    // Render Detailed Results
    const renderDetailedResults = () => {
        if (!examResults || !examResults.questions) {
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
                        {t('detailedExamResults.messages.noResultsAvailable')}
                    </Alert>
                </motion.div>
            );
        }

        const correctAnswers = examResults.questions.filter(q => q.attendedAnswer === q.correctAnswer).length;
        const totalQuestions = examResults.questions.length;
        
        // Calculate total marks from questions array
        const totalMarks = examResults.questions.reduce((sum, question) => sum + (question.marks || 0), 0);
        const securedMarks = examResults.securedMark || examResults.marks || 0;
        
        const accuracy = (correctAnswers / totalQuestions) * 100;
        const percentage = (securedMarks / totalMarks) * 100;

        return (
            <motion.div variants={itemVariants}>
                {/* Summary Card */}
                <Card 
                    sx={{ 
                        mb: 4,
                        background: `linear-gradient(135deg, ${themeColors.background.primary}, ${themeColors.background.secondary})`,
                        border: `1px solid ${themeColors.border.primary}`,
                        boxShadow: `0 4px 20px ${themeColors.primary}10`
                    }}
                >
                    <CardContent sx={{ p: 3 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                            <Typography 
                                variant="h6" 
                                sx={{ 
                                    fontWeight: 600,
                                    color: themeColors.text.primary
                                }}
                            >
                                {t('detailedExamResults.sections.performanceSummary')}
                            </Typography>
                            <Box textAlign="center">
                                <Typography 
                                    variant="h4" 
                                    sx={{ 
                                        fontWeight: 700,
                                        background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.accent})`,
                                        backgroundClip: 'text',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        mb: 0.5
                                    }}
                                >
                                    {securedMarks} / {totalMarks}
                                </Typography>
                                <Typography 
                                    variant="body2"
                                    sx={{ color: themeColors.text.secondary }}
                                >
                                    {t('detailedExamResults.labels.marksSecured')}
                                </Typography>
                            </Box>
                        </Box>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={3}>
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
                                        fontSize: 32,
                                        mb: 1
                                    }} />
                                    <Typography 
                                        variant="h4" 
                                        sx={{ 
                                            fontWeight: 700,
                                            color: themeColors.success
                                        }}
                                    >
                                        {correctAnswers}
                                    </Typography>
                                    <Typography 
                                        variant="body2"
                                        sx={{ color: themeColors.text.secondary }}
                                    >
                                        {t('detailedExamResults.labels.correctAnswers')}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={3}>
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
                                        fontSize: 32,
                                        mb: 1
                                    }} />
                                    <Typography 
                                        variant="h4" 
                                        sx={{ 
                                            fontWeight: 700,
                                            color: themeColors.error
                                        }}
                                    >
                                        {totalQuestions - correctAnswers}
                                    </Typography>
                                    <Typography 
                                        variant="body2"
                                        sx={{ color: themeColors.text.secondary }}
                                    >
                                        {t('detailedExamResults.labels.incorrectAnswers')}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Paper 
                                    sx={{ 
                                        p: 2, 
                                        textAlign: 'center',
                                        background: `linear-gradient(135deg, ${themeColors.primary}10, ${themeColors.primary}05)`,
                                        border: `1px solid ${themeColors.primary}20`
                                    }}
                                >
                                    <TrendingUp sx={{ 
                                        color: themeColors.primary, 
                                        fontSize: 32,
                                        mb: 1
                                    }} />
                                    <Typography 
                                        variant="h4" 
                                        sx={{ 
                                            fontWeight: 700,
                                            color: themeColors.primary
                                        }}
                                    >
                                        {percentage.toFixed(1)}%
                                    </Typography>
                                    <Typography 
                                        variant="body2"
                                        sx={{ color: themeColors.text.secondary }}
                                    >
                                        {t('detailedExamResults.labels.performancePercent')}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Paper 
                                    sx={{ 
                                        p: 2, 
                                        textAlign: 'center',
                                        background: `linear-gradient(135deg, ${themeColors.info || '#2196f3'}10, ${themeColors.info || '#2196f3'}05)`,
                                        border: `1px solid ${themeColors.info || '#2196f3'}20`
                                    }}
                                >
                                    <Grade sx={{ 
                                        color: themeColors.info || '#2196f3', 
                                        fontSize: 32,
                                        mb: 1
                                    }} />
                                    <Typography 
                                        variant="h4" 
                                        sx={{ 
                                            fontWeight: 700,
                                            color: themeColors.info || '#2196f3'
                                        }}
                                    >
                                        {totalMarks}
                                    </Typography>
                                    <Typography 
                                        variant="body2"
                                        sx={{ color: themeColors.text.secondary }}
                                    >
                                        {t('detailedExamResults.labels.totalMarks')}
                                    </Typography>
                                </Paper>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Questions List */}
                <Card 
                    sx={{ 
                        background: `linear-gradient(135deg, ${themeColors.background.primary}, ${themeColors.background.secondary})`,
                        border: `1px solid ${themeColors.border.primary}`,
                        boxShadow: `0 4px 20px ${themeColors.primary}10`
                    }}
                >
                    <CardContent sx={{ p: 3 }}>
                        <Typography 
                            variant="h6" 
                            sx={{ 
                                mb: 3,
                                fontWeight: 600,
                                color: themeColors.text.primary
                            }}
                        >
                            {t('detailedExamResults.sections.questionAnalysis')}
                        </Typography>
                        {examResults.questions.map((question, qIndex) => {
                            const isCorrect = question.attendedAnswer === question.correctAnswer;
                            
                            return (
                                <motion.div
                                    key={qIndex}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: qIndex * 0.1 }}
                                >
                                    <Accordion 
                                        sx={{ 
                                            mb: 2,
                                            background: `linear-gradient(135deg, ${isCorrect ? themeColors.success : themeColors.error}05, ${isCorrect ? themeColors.success : themeColors.error}02)`,
                                            border: `1px solid ${isCorrect ? themeColors.success : themeColors.error}20`,
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
                                                        width: 40,
                                                        height: 40,
                                                        bgcolor: isCorrect ? `${themeColors.success}20` : `${themeColors.error}20`,
                                                        color: isCorrect ? themeColors.success : themeColors.error
                                                    }}
                                                >
                                                    {qIndex + 1}
                                                </Avatar>
                                                <Box flex={1}>
                                                    <Typography 
                                                        variant="subtitle1" 
                                                        sx={{ 
                                                            fontWeight: 600,
                                                            color: themeColors.text.primary
                                                        }}
                                                    >
                                                        {t('detailedExamResults.labels.questionNumber', { number: qIndex + 1 })}
                                                    </Typography>
                                                    <Typography 
                                                        variant="body2"
                                                        sx={{ 
                                                            color: themeColors.text.secondary,
                                                            display: '-webkit-box',
                                                            WebkitLineClamp: 2,
                                                            WebkitBoxOrient: 'vertical',
                                                            overflow: 'hidden'
                                                        }}
                                                    >
                                                        {question.questionText}
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    icon={isCorrect ? <CheckCircle /> : <Cancel />}
                                                    label={isCorrect ? t('detailedExamResults.status.correct') : t('detailedExamResults.status.incorrect')}
                                                    sx={{
                                                        bgcolor: isCorrect ? `${themeColors.success}20` : `${themeColors.error}20`,
                                                        color: isCorrect ? themeColors.success : themeColors.error,
                                                        fontWeight: 600
                                                    }}
                                                />
                                            </Box>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ pt: 0 }}>
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
                                                    <Box sx={{ mb: 3 }}>
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
                                                            />
                                                        </Card>
                                                    </Box>
                                                )}
                                                
                                                {/* Options */}
                                                {question.questionType === 'objective' && question.options && (
                                                    <Box mt={3}>
                                                        <Typography 
                                                            variant="subtitle2" 
                                                            sx={{ 
                                                                mb: 2,
                                                                fontWeight: 600,
                                                                color: themeColors.text.primary
                                                            }}
                                                        >
                                                            {t('detailedExamResults.labels.options')}:
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
                                                                                {t('detailedExamResults.labels.option', { letter: optionLetter })}:
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
                                                    <Box mt={3}>
                                                        <Typography 
                                                            variant="subtitle2" 
                                                            sx={{ 
                                                                mb: 2,
                                                                fontWeight: 600,
                                                                color: themeColors.text.primary
                                                            }}
                                                        >
                                                            {t('detailedExamResults.labels.answerDetails')}:
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
                                                                        {t('detailedExamResults.labels.yourAnswer')}:
                                                                    </Typography>
                                                                    <Typography 
                                                                        variant="body1"
                                                                        sx={{ 
                                                                            color: themeColors.text.primary,
                                                                            fontWeight: 500
                                                                        }}
                                                                    >
                                                                        {question.attendedAnswer || t('detailedExamResults.labels.notAnswered')}
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
                                                                        {t('detailedExamResults.labels.correctAnswer')}:
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
                                                
                                                <Box mt={3}>
                                                    <Chip
                                                        icon={<Grade />}
                                                        label={t('detailedExamResults.labels.marks', { marks: question.marks })}
                                                        sx={{
                                                            bgcolor: `${themeColors.primary}20`,
                                                            color: themeColors.primary,
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                </Box>
                                            </Box>
                                        </AccordionDetails>
                                    </Accordion>
                                </motion.div>
                            );
                        })}
                    </CardContent>
                </Card>
            </motion.div>
        );
    };

    if (attendedExamsResult.isLoading) {
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
                            {t('detailedExamResults.messages.loading')}
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
                                onClick={handleBackToExams}
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
                                {t('detailedExamResults.actions.backToExams')}
                            </Link>
                            <Link
                                component="button"
                                variant="body1"
                                onClick={handleBackToResults}
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
                                {t('detailedExamResults.breadcrumbs.examResults')}
                            </Link>
                            <Typography 
                                color="text.primary"
                                sx={{ color: themeColors.text.primary }}
                            >
                                {t('detailedExamResults.breadcrumbs.detailedResults')}
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
                                    {t('detailedExamResults.title')}
                                </Typography>
                                <Typography 
                                    variant="body1"
                                    sx={{ color: themeColors.text.secondary }}
                                >
                                    {t('detailedExamResults.subtitle')}
                                </Typography>
                            </Box>
                        </Box>
                    </motion.div>

                    {renderDetailedResults()}

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.7 }}
                    >
                        <Box display="flex" justifyContent="center" gap={3} mt={4}>
                            <Button
                                variant="outlined"
                                onClick={handleBackToResults}
                                startIcon={<ArrowBack />}
                                sx={{
                                    borderColor: themeColors.primary,
                                    color: themeColors.primary,
                                    fontWeight: 600,
                                    py: 1.5,
                                    px: 3,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontSize: '1rem',
                                    '&:hover': {
                                        borderColor: themeColors.accent,
                                        color: themeColors.accent,
                                        background: `${themeColors.accent}05`
                                    }
                                }}
                            >
                                {t('detailedExamResults.actions.backToResults')}
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleBackToExams}
                                startIcon={<ArrowBack />}
                                sx={{
                                    background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.accent})`,
                                    color: '#fff',
                                    fontWeight: 600,
                                    py: 1.5,
                                    px: 3,
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
                                {t('detailedExamResults.actions.backToExams')}
                            </Button>
                        </Box>
                    </motion.div>
                </motion.div>
            </Box>
        </CustomOutletBox>
    );
};

export default DetailedExamResults; 