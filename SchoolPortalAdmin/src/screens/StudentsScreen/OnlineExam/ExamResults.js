import React, { useEffect } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Button,
    Breadcrumbs,
    Link,
    Chip,
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
    LinearProgress
} from '@mui/material';
import {
    School,
    EmojiEvents,
    ArrowBack,
    Quiz,
    CheckCircle,
    Cancel,
    Grade,
    Timer,
    TrendingUp,
    Visibility
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useOnlineExam } from '../../../Redux/features/OnlineExam/useOnlineExam';
import { useSnackbar } from '../../../hooks/SnackBar';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import CustomOutletBox from '../../../components/Common/CustomOutletBox';
import { BASE_PATH } from '../../../config';
import { useTranslation } from 'react-i18next';

const ExamResults = () => {
    const navigate = useNavigate();
    const { examId } = useParams();
    const location = useLocation();
    const showSnackbar = useSnackbar();
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
        if (examId) {
            fetchAttendedExams({ publishId: examId });
        }
    }, [examId]);

    // Use results from API if not available in location state
    const examResults = results || (attendedExamsResult.data?.data?.[0]);

    console.log({results, examResults, attendedExamsResult: attendedExamsResult.data})

    // Handle navigation back to subject exams
    const handleBackToExams = () => {
        navigate('/students/online-exam');
    };

    // Handle view detailed results
    const handleViewDetailedResults = () => {
        // Navigate to detailed results view with results data
        navigate(`/students/online-exam/results/${examId}/detailed`, {
            state: { results: examResults }
        });
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

    // Render Detailed Results Button
    const renderDetailedResultsButton = () => {
        if (!examResults) {
            return null;
        }

        return (
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.5 }}
            >
                <Box display="flex" justifyContent="center" mt={4}>
                    <Button
                        variant="outlined"
                        onClick={handleViewDetailedResults}
                        startIcon={<Visibility />}
                        size="large"
                        sx={{
                            borderColor: themeColors.primary,
                            color: themeColors.primary,
                            fontWeight: 600,
                            py: 2,
                            px: 4,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontSize: '1.1rem',
                            '&:hover': {
                                borderColor: themeColors.accent,
                                color: themeColors.accent,
                                background: `${themeColors.accent}05`,
                                transform: 'translateY(-2px)',
                                boxShadow: `0 4px 15px ${themeColors.accent}20`
                            }
                        }}
                    >
                        {t('examResults.actions.viewDetailedResults')}
                    </Button>
                </Box>
            </motion.div>
        );
    };

    // Render Results Summary
    const renderResultsSummary = () => {
        if (examResults) {
            // Get secured marks from response (API provides this directly)
            const securedMarks = examResults.marks || examResults.score || examResults.securedMark || 0;
            
            // Calculate total marks from questions array
            let totalMarks = 0;
            if (examResults.questions && Array.isArray(examResults.questions) && examResults.questions.length > 0) {
                totalMarks = examResults.questions.reduce((sum, question) => sum + (question.marks || 0), 0);
            }
            
            // Fallback to totalMarks from response if calculation failed
            if (!totalMarks || totalMarks === 0) {
                totalMarks = examResults.totalMarks || examResults.totalMark || 100;
            }
            
            // Convert secured marks to 100-point scale (normalized)
            const securedMarksOutOf100 = totalMarks > 0 ? (securedMarks / totalMarks) * 100 : 0;
            
            // Percentage should match securedMarksOutOf100 since we're normalizing to 100
            const percentage = securedMarksOutOf100;
            
            return (
                <motion.div variants={itemVariants}>
                    <Card 
                        sx={{ 
                            mb: 4,
                            background: `linear-gradient(135deg, ${themeColors.background.primary}, ${themeColors.background.secondary})`,
                            border: `1px solid ${themeColors.border.primary}`,
                            boxShadow: `0 8px 32px ${themeColors.primary}15`,
                            overflow: 'hidden',
                            position: 'relative'
                        }}
                    >
                        {/* Background Pattern */}
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '100%',
                                background: `linear-gradient(135deg, ${themeColors.primary}05, ${themeColors.accent}05)`,
                                opacity: 0.3,
                                zIndex: 0
                            }}
                        />
                        
                        <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
                            <Box textAlign="center" py={3}>
                                {/* Success Icon */}
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ duration: 0.6, type: "spring" }}
                                >
                                    <Avatar 
                                        sx={{ 
                                            width: 80, 
                                            height: 80, 
                                            mx: 'auto',
                                            mb: 3,
                                            background: `linear-gradient(135deg, ${themeColors.success}, ${themeColors.accent})`,
                                            boxShadow: `0 8px 25px ${themeColors.success}30`
                                        }}
                                    >
                                        <EmojiEvents sx={{ fontSize: 40 }} />
                                    </Avatar>
                                </motion.div>

                                {/* Score Display */}
                                <motion.div
                                    initial={{ y: 30, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                >
                                    <Typography 
                                        variant="h2" 
                                        sx={{ 
                                            fontWeight: 800,
                                            background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.accent})`,
                                            backgroundClip: 'text',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            mb: 1
                                        }}
                                    >
                                        {securedMarksOutOf100.toFixed(1)}
                                    </Typography>
                                    <Typography 
                                        variant="h6" 
                                        sx={{ 
                                            color: themeColors.text.secondary,
                                            mb: 3,
                                            fontWeight: 500
                                        }}
                                    >
                                        {t('examResults.labels.outOfMarks', { totalMarks: 100 })}
                                    </Typography>
                                </motion.div>

                                {/* Progress Bar */}
                                <motion.div
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ duration: 0.8, delay: 0.4 }}
                                >
                                    <Box sx={{ mb: 3 }}>
                                        <Box display="flex" justifyContent="space-between" mb={1}>
                                            <Typography 
                                                variant="body2"
                                                sx={{ color: themeColors.text.secondary }}
                                            >
                                                {t('examResults.labels.performance')}
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
                                                height: 12,
                                                borderRadius: 6,
                                                backgroundColor: `${themeColors.primary}20`,
                                                '& .MuiLinearProgress-bar': {
                                                    background: `linear-gradient(90deg, ${themeColors.primary}, ${themeColors.accent})`,
                                                    borderRadius: 6
                                                }
                                            }}
                                        />
                                    </Box>
                                </motion.div>

                                {/* Status Chip */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.3, delay: 0.6 }}
                                >
                                    <Chip
                                        icon={<CheckCircle />}
                                        label={percentage >= 70 ? t('examResults.performance.excellent') : percentage >= 50 ? t('examResults.performance.good') : t('examResults.performance.needsImprovement')}
                                        sx={{
                                            bgcolor: percentage >= 70 ? `${themeColors.success}20` : 
                                                     percentage >= 50 ? `${themeColors.warning}20` : `${themeColors.error}20`,
                                            color: percentage >= 70 ? themeColors.success : 
                                                   percentage >= 50 ? themeColors.warning : themeColors.error,
                                            fontWeight: 600,
                                            fontSize: '1rem',
                                            py: 1
                                        }}
                                    />
                                </motion.div>

                                <Divider sx={{ my: 3, borderColor: themeColors.border.primary }} />

                                {/* Exam Details */}
                                <Grid container spacing={3} sx={{ mt: 2 }}>
                                    <Grid item xs={12} md={6}>
                                        <Paper 
                                            sx={{ 
                                                p: 2, 
                                                textAlign: 'center',
                                                background: `linear-gradient(135deg, ${themeColors.primary}10, ${themeColors.primary}05)`,
                                                border: `1px solid ${themeColors.primary}20`
                                            }}
                                        >
                                            <Grade sx={{ 
                                                color: themeColors.primary, 
                                                fontSize: 24,
                                                mb: 1
                                            }} />
                                            <Typography 
                                                variant="body2"
                                                sx={{ color: themeColors.text.secondary }}
                                            >
                                                {t('examResults.labels.attemptId')}
                                            </Typography>
                                            <Typography 
                                                variant="body1"
                                                sx={{ 
                                                    fontWeight: 600,
                                                    color: themeColors.text.primary
                                                }}
                                            >
                                                {examResults._id?.slice(-8) || 'N/A'}
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Paper 
                                            sx={{ 
                                                p: 2, 
                                                textAlign: 'center',
                                                background: `linear-gradient(135deg, ${themeColors.accent}10, ${themeColors.accent}05)`,
                                                border: `1px solid ${themeColors.accent}20`
                                            }}
                                        >
                                            <Timer sx={{ 
                                                color: themeColors.accent, 
                                                fontSize: 24,
                                                mb: 1
                                            }} />
                                            <Typography 
                                                variant="body2"
                                                sx={{ color: themeColors.text.secondary }}
                                            >
                                                {t('examResults.labels.submittedOn')}
                                            </Typography>
                                            <Typography 
                                                variant="body1"
                                                sx={{ 
                                                    fontWeight: 600,
                                                    color: themeColors.text.primary
                                                }}
                                            >
                                                {examResults.attendedDate ? 
                                                    new Date(examResults.attendedDate).toLocaleDateString() : 
                                                    new Date().toLocaleDateString()
                                                }
                                            </Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </Box>
                        </CardContent>
                    </Card>
                </motion.div>
            );
        }

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
                            {t('examResults.messages.loading')}
                        </Typography>
                    </motion.div>
                </Box>
            );
        }

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
                    {t('examResults.messages.noResultsAvailable')}
                </Alert>
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
                                {t('examResults.breadcrumbs.backToExams')}
                            </Link>
                            <Typography 
                                color="text.primary"
                                sx={{ color: themeColors.text.primary }}
                            >
                                {t('examResults.title')}
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
                                    {t('examResults.title')}
                                </Typography>
                                <Typography 
                                    variant="body1"
                                    sx={{ color: themeColors.text.secondary }}
                                >
                                    {t('examResults.subtitle')}
                                </Typography>
                            </Box>
                        </Box>
                    </motion.div>

                    {renderResultsSummary()}

                    {renderDetailedResultsButton()}

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.7 }}
                    >
                        <Box display="flex" justifyContent="center" mt={4}>
                            <Button
                                variant="contained"
                                onClick={handleBackToExams}
                                startIcon={<ArrowBack />}
                                sx={{
                                    background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.accent})`,
                                    color: '#fff',
                                    fontWeight: 600,
                                    py: 1.5,
                                    px: 4,
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
                                {t('examResults.actions.backToExams')}
                            </Button>
                        </Box>
                    </motion.div>
                </motion.div>
            </Box>
        </CustomOutletBox>
    );
};

export default ExamResults; 