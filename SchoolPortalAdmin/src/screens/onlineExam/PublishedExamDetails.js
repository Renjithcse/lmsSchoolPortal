import React, { memo, useCallback, useState } from 'react';
import {
    Box,
    Card,
    CardContent,
    CardMedia,
    Divider,
    Typography,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Chip,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Tooltip,
    Grid,
    Paper,
    Collapse,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import {
    School as SchoolIcon,
    People as PeopleIcon,
    DateRange as DateRangeIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Person as PersonIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Refresh as RefreshIcon,
    Visibility as VisibilityIcon,
    ArrowBack as ArrowBackIcon,
    Quiz as QuizIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import CustomButton from '../../components/Common/CustomButton';
import { BASE_PATH } from '../../config';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

// Tab Panel Component
const TabPanel = ({ children, value, index, ...other }) => (
    <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
    >
        {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
);

// User Card Component
const UserCard = ({ user, index, color = "primary", totalMarks, questions, onViewDetails, calculateTotalMarks, themeColors, t }) => (
    <Card variant="outlined" sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: themeColors.background.primary,
        border: `1px solid ${themeColors.border.primary}`,
        '&:hover': {
            borderColor: themeColors.primary,
            boxShadow: `0 4px 12px ${themeColors.primary}15`
        }
    }}>
        <CardContent sx={{ flexGrow: 1 }}>
            <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ 
                    bgcolor: color === 'success' ? themeColors.success : 
                            color === 'error' ? themeColors.error : themeColors.primary, 
                    mr: 2 
                }}>
                    <PersonIcon sx={{ color: 'white' }} />
                </Avatar>
                <Box flexGrow={1}>
                    <Typography variant="h6" component="div" sx={{ color: themeColors.text.primary }}>
                        {user.studentId?.studentName || t('publishedExamDetails.userCard.student', { number: index + 1 })}
                    </Typography>
                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                        {t('publishedExamDetails.userCard.id')}: {user.studentId?.studentID || t('publishedExamDetails.userCard.na')}
                    </Typography>
                </Box>
                {user.attendedStatus && (
                    <CheckCircleIcon sx={{ color: themeColors.success }} />
                )}
            </Box>
            
            <Box mb={2}>
                {user.attendedDate && (
                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }} gutterBottom>
                        <strong>{t('publishedExamDetails.userCard.attended')}:</strong> {dayjs(user.attendedDate).format('DD-MM-YYYY HH:mm')}
                    </Typography>
                )}
                {user.securedMark !== undefined && (
                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }} gutterBottom>
                        <strong>{t('publishedExamDetails.userCard.marks')}:</strong> {user.securedMark} / {calculateTotalMarks ? calculateTotalMarks(user) : totalMarks}
                    </Typography>
                )}
                {user.teacherRemarks && (
                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }} gutterBottom>
                        <strong>{t('publishedExamDetails.userCard.remarks')}:</strong> {user.teacherRemarks}
                    </Typography>
                )}
            </Box>
            
            {user.attendedStatus && questions && (
                <Button
                    variant="outlined"
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => onViewDetails(user, questions)}
                    fullWidth
                    sx={{
                        borderColor: themeColors.border.primary,
                        color: themeColors.primary,
                        '&:hover': {
                            borderColor: themeColors.primary,
                            backgroundColor: `${themeColors.primary}10`
                        }
                    }}
                >
                    {t('publishedExamDetails.userCard.viewDetails')}
                </Button>
            )}
        </CardContent>
    </Card>
);

// User List Component
const UserList = ({ users, title, emptyMessage, icon, color = "primary", calculateTotalMarks, questions, onViewDetails, themeColors, t }) => (
    <Card variant="outlined" sx={{
        backgroundColor: themeColors.background.primary,
        border: `1px solid ${themeColors.border.primary}`
    }}>
        <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
                {icon}
                <Typography variant="h6" ml={1} sx={{ color: themeColors.text.primary }}>
                    {title}
                </Typography>
                <Chip 
                    label={users?.length || 0} 
                    size="small" 
                    sx={{ 
                        ml: 'auto',
                        backgroundColor: color === 'success' ? themeColors.success : 
                                        color === 'error' ? themeColors.error : themeColors.primary,
                        color: 'white'
                    }}
                />
            </Box>
            
            {users && users.length > 0 ? (
                <Grid container spacing={2}>
                            {users.map((user, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                            <UserCard
                                user={user}
                                index={index}
                                color={color}
                                totalMarks={calculateTotalMarks ? calculateTotalMarks(user) : 0}
                                questions={questions}
                                onViewDetails={onViewDetails}
                                calculateTotalMarks={calculateTotalMarks}
                                themeColors={themeColors}
                                t={t}
                            />
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Box textAlign="center" py={3}>
                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                        {emptyMessage}
                    </Typography>
                </Box>
            )}
        </CardContent>
    </Card>
);

// Student Details Dialog Component
const StudentDetailsDialog = ({ open, onClose, student, questions, totalMarks, themeColors, t }) => {
    if (!student || !questions) return null;

    const renderQuestionDetails = () => {
        return questions.map((question, qIndex) => {
            const studentAnswer = student.studentAnswers?.find(
                answer => answer.questionId === question._id
            );
            const isCorrect = studentAnswer?.studentAnswer === question.correctAnswer;
            
            return (
                <Card key={qIndex} sx={{ 
                    mb: 2,
                    backgroundColor: themeColors.background.primary,
                    border: `1px solid ${themeColors.border.primary}`
                }}>
                    <CardContent>
                        <Box display="flex" alignItems="center" mb={2}>
                            <Typography variant="h6" component="div" flexGrow={1} sx={{ color: themeColors.text.primary }}>
                                {t('publishedExamDetails.studentDialog.question', { number: qIndex + 1 })}
                            </Typography>
                            {isCorrect ? (
                                <CheckCircleIcon sx={{ color: themeColors.success }} />
                            ) : (
                                <CancelIcon sx={{ color: themeColors.error }} />
                            )}
                        </Box>
                        
                        <Typography variant="body1" gutterBottom sx={{ color: themeColors.text.primary }}>
                            {question.questionText}
                        </Typography>
                        
                        {question.questionImage && (
                            <Box sx={{ mb: 2 }}>
                                <Card sx={{ 
                                    maxWidth: 300,
                                    backgroundColor: themeColors.background.secondary,
                                    border: `1px solid ${themeColors.border.primary}`
                                }}>
                                    <CardMedia
                                        component="img"
                                        image={question.questionImage}
                                        alt="Question"
                                        sx={{ height: 150, objectFit: 'contain' }}
                                    />
                                </Card>
                            </Box>
                        )}
                        
                        {question.questionType === 'objective' && question.options && (
                            <Box mt={2}>
                                <Typography variant="subtitle2" gutterBottom sx={{ color: themeColors.text.primary }}>
                                    {t('publishedExamDetails.studentDialog.options')}:
                                </Typography>
                                <Grid container spacing={1}>
                                    {question.options.map((option, optIndex) => {
                                        const optionLetter = String.fromCharCode(65 + optIndex);
                                        const isCorrectOption = optionLetter === question.correctAnswer;
                                        const isStudentAnswer = optionLetter === studentAnswer?.studentAnswer;
                                        
                                        return (
                                            <Grid item xs={12} sm={6} key={optIndex}>
                                                <Box 
                                                    sx={{ 
                                                        p: 1, 
                                                        border: `1px solid ${themeColors.border.primary}`,
                                                        borderRadius: 1,
                                                        backgroundColor: isCorrectOption ? `${themeColors.success}20` : 
                                                                       isStudentAnswer && !isCorrectOption ? `${themeColors.error}20` : themeColors.background.secondary,
                                                        position: 'relative'
                                                    }}
                                                >
                                                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, color: themeColors.text.primary }}>
                                                        {t('publishedExamDetails.studentDialog.option', { letter: optionLetter })}:
                                                    </Typography>
                                                    
                                                    {option.type === 'image' ? (
                                                        <Card sx={{ 
                                                            width: 80, 
                                                            height: 50,
                                                            backgroundColor: themeColors.background.primary,
                                                            border: `1px solid ${themeColors.border.primary}`
                                                        }}>
                                                            <CardMedia
                                                                component="img"
                                                                image={option.value}
                                                                alt={`Option ${optionLetter}`}
                                                                sx={{ height: 50, objectFit: 'contain' }}
                                                            />
                                                        </Card>
                                                    ) : (
                                                        <Typography variant="body2" sx={{ color: themeColors.text.primary }}>
                                                            {option.value}
                                                        </Typography>
                                                    )}
                                                    
                                                    <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
                                                        {isCorrectOption && (
                                                            <CheckCircleIcon sx={{ fontSize: 16, color: themeColors.success }} />
                                                        )}
                                                        {isStudentAnswer && !isCorrectOption && (
                                                            <CancelIcon sx={{ fontSize: 16, color: themeColors.error }} />
                                                        )}
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            </Box>
                        )}
                        
                        {question.questionType !== 'objective' && (
                            <Box mt={2}>
                                <Typography variant="subtitle2" gutterBottom sx={{ color: themeColors.text.primary }}> 
                                    {t('publishedExamDetails.studentDialog.answerDetails')}:
                                </Typography>
                                <Box sx={{ 
                                    p: 2, 
                                    border: '1px solid #e0e0e0',
                                    borderRadius: 1,
                                    backgroundColor: themeColors.background.secondary,
                                    color: themeColors.text.primary
                                }}>
                                    <Typography variant="body2" color={themeColors.text.primary}>
                                        <strong>{t('publishedExamDetails.studentDialog.studentAnswer')}:</strong> {studentAnswer?.studentAnswer || t('publishedExamDetails.studentDialog.notAnswered')}
                                    </Typography>
                                    <Typography variant="body2" color={themeColors.text.primary}>
                                        <strong>{t('publishedExamDetails.studentDialog.correctAnswer')}:</strong> {question.correctAnswer}
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                        
                        <Box mt={2}>
                            <Typography variant="body2" color={themeColors.text.primary}>
                                <strong>{t('publishedExamDetails.studentDialog.marks')}:</strong> {isCorrect ? question.marks : 0} / {question.marks}
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            );
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{
            sx: {
                backgroundColor: themeColors.background.primary,
                border: `1px solid ${themeColors.border.primary}`,
                borderRadius: 2,
                boxShadow: 3,
                color: themeColors.text.primary
            }
        }}>
            <DialogTitle>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center">
                        <PersonIcon sx={{ mr: 1 }} />
                        <Typography variant="h6">
                            {student.studentId?.studentName} - {t('publishedExamDetails.studentDialog.examDetails')}
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        {t('publishedExamDetails.studentDialog.marks')}: {student.securedMark} / {totalMarks}
                    </Typography>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
                    {renderQuestionDetails()}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t('publishedExamDetails.studentDialog.close')}</Button>
            </DialogActions>
        </Dialog>
    );
};

// Retest Dialog Component
const RetestDialog = ({ open, onClose, onConfirm, data, themeColors, t }) => {
    const publishData = data?.publishedExam ?? data;
    return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
        PaperProps={{
            sx: {
                backgroundColor: themeColors.background.primary,
                border: `1px solid ${themeColors.border.primary}`
            }
        }}
    >
        <DialogTitle sx={{ color: themeColors.text.primary }}>
            <Box display="flex" alignItems="center">
                <RefreshIcon sx={{ mr: 1, color: themeColors.primary }} />
                {t('publishedExamDetails.retestDialog.title')}
            </Box>
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: themeColors.background.primary }}>
            <Typography variant="body1" gutterBottom sx={{ color: themeColors.text.primary }}>
                {t('publishedExamDetails.retestDialog.confirmMessage')}
            </Typography>
            <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: themeColors.text.primary }}>
                    {t('publishedExamDetails.retestDialog.examDetails')}:
                </Typography>
                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                    • {publishData?.questionBank?.questionBankName}
                </Typography>
                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                    • {t('publishedExamDetails.retestDialog.section')}: {publishData?.section?.sectionName}
                </Typography>
                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                    • {t('publishedExamDetails.retestDialog.gender')}: {publishData?.gender === "male" ? t('publishedExamDetails.gender.boys') : t('publishedExamDetails.gender.girls')}
                </Typography>
            </Box>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: themeColors.background.primary }}>
            <Button 
                onClick={onClose}
                sx={{
                    color: themeColors.text.primary,
                    borderColor: themeColors.border.primary,
                    '&:hover': {
                        borderColor: themeColors.primary,
                        backgroundColor: `${themeColors.primary}10`
                    }
                }}
            >
                {t('publishedExamDetails.retestDialog.cancel')}
            </Button>
            <Button 
                onClick={onConfirm} 
                variant="contained"
                sx={{
                    backgroundColor: themeColors.primary,
                    color: 'white',
                    '&:hover': {
                        backgroundColor: themeColors.accent
                    }
                }}
            >
                {t('publishedExamDetails.retestDialog.create')}
            </Button>
        </DialogActions>
    </Dialog>
    );
};

const PublishedExamDetails = ({ data, enableRetest }) => {
    const navigate = useNavigate();
    const { themeColors } = useTheme();
    const { t } = useTranslation();
    const [tabValue, setTabValue] = useState(0);
    const [retestDialogOpen, setRetestDialogOpen] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [studentDetailsOpen, setStudentDetailsOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [questionBankExpanded, setQuestionBankExpanded] = useState(false);

    const publishedExam = data?.data?.publishedExam ?? data?.publishedExam;
    const questions = data?.data?.questions ?? data?.questions ?? [];
    const students = data?.data?.students ?? data?.students ?? [];
    const gradeLabel =
        publishedExam?.grade?.gradeName ||
        publishedExam?.grade?.grade ||
        publishedExam?.grade?.name ||
        publishedExam?.grade;
    const subjectLabel =
        publishedExam?.questionBank?.subject?.subjectName ||
        publishedExam?.exam?.subject?.subjectName ||
        publishedExam?.exam?.subjectId?.subjectName ||
        publishedExam?.exam?.subjectName ||
        null;
    const questionBankLabel = publishedExam?.questionBank?.questionBankName;

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const createRetest = useCallback(() => {
        setRetestDialogOpen(false);
        navigate(`retest`, { state: data });
    }, [data, navigate]);

    const handleRetestClick = () => {
        setRetestDialogOpen(true);
    };

    const toggleExpanded = () => {
        setExpanded(!expanded);
    };

    const handleViewStudentDetails = (student, questions) => {
        setSelectedStudent(student);
        setStudentDetailsOpen(true);
    };

    const toggleQuestionBankExpanded = () => {
        setQuestionBankExpanded(!questionBankExpanded);
    };

    // Process student data from API response
    // Process student data from API response
    
    // Calculate total marks from student answers (questionId.marks)
    const calculateTotalMarksFromStudent = (student) => {
        if (!student.studentAnswers || !Array.isArray(student.studentAnswers)) {
            return 0;
        }
        return student.studentAnswers.reduce((sum, answer) => {
            const questionMarks = answer.questionId?.marks || 0;
            return sum + questionMarks;
        }, 0);
    };
    
    // Calculate total marks from questions array (fallback)
    const totalMarksFromQuestions = questions.reduce((sum, question) => sum + (question.marks || 0), 0);
    
    // Separate attended and non-attended students
    const attendedUsers = students.filter(student => student.attendedStatus === true);
    const nonAttendedUsers = students.filter(student => student.attendedStatus === false);

    return (
        <Box sx={{ backgroundColor: themeColors.background.primary, minHeight: '100vh', paddingTop: 2 }}>
            {/* Back Button */}
            {/* <Box display="flex" alignItems="center" mb={3} sx={{ p: 3 }}>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(-1)}
                    sx={{ 
                        mr: 2,
                        borderColor: themeColors.border.primary,
                        color: themeColors.text.primary,
                        '&:hover': {
                            borderColor: themeColors.primary,
                            backgroundColor: `${themeColors.primary}10`
                        }
                    }}
                >
                    Back
                </Button>
            </Box> */}

            {/* Main Exam Details Card */}
            <Card sx={{ 
                marginTop: 4, 
                borderRadius: 2, 
                boxShadow: 3, 
                margin: 1, 
                width: '100%',
                backgroundColor: themeColors.background.primary,
                border: `1px solid ${themeColors.border.primary}`
            }}>
                <CardContent>
                    {/* Header Section */}
                    <Box display="flex" mb={2} flexDirection="column">
                        <Box display="flex" alignItems="center" flexDirection="row" justifyContent="space-between">
                            <Box display="flex" alignItems="center">
                                <SchoolIcon sx={{ color: themeColors.primary }} fontSize="large" />
                                <Box ml={1}>
                                    <Typography variant="h6" component="div" sx={{ color: themeColors.text.primary }}>
                                        {`${publishedExam?.gender === "male" ? t('publishedExamDetails.gender.boys') : t('publishedExamDetails.gender.girls')} - ${publishedExam?.section?.sectionName}`}
                                    </Typography>
                                    <Typography variant="body2" component="div" sx={{ color: themeColors.text.secondary }}>
                                        {t('publishedExamDetails.examInfo.grade')}: {gradeLabel || t('publishedExamDetails.na')}
                                    </Typography>
                                    <Typography variant="body2" component="div" sx={{ color: themeColors.text.secondary }}>
                                        {t('publishedExamDetails.examInfo.subject')}: {subjectLabel || t('publishedExamDetails.na')}
                                    </Typography>
                                    <Typography variant="body2" component="div" sx={{ color: themeColors.text.secondary }}>
                                        {t('publishedExamDetails.examInfo.questionBank')}: {questionBankLabel || t('publishedExamDetails.na')}
                                    </Typography>
                                </Box>
                            </Box>
                            
                            {enableRetest && (
                                <Tooltip title={t('publishedExamDetails.retestDialog.create')}>
                                    <IconButton 
                                        onClick={handleRetestClick}
                                        sx={{ 
                                            border: '1px solid',
                                            borderColor: themeColors.primary,
                                            color: themeColors.primary,
                                            '&:hover': {
                                                backgroundColor: `${themeColors.primary}10`
                                            }
                                        }}
                                    >
                                        <RefreshIcon />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                    </Box>

                    <Divider sx={{ mb: 2, borderColor: themeColors.border.primary }} />

                    {/* Question Bank Details Section */}
                    <Box mb={3}>
                        <Typography variant="h6" sx={{ color: themeColors.text.primary, mb: 2, fontWeight: 600 }}>
                            {t('publishedExamDetails.questionBankDetails.title')}
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ 
                                    p: 2, 
                                    backgroundColor: themeColors.background.secondary, 
                                    borderRadius: 1,
                                    border: `1px solid ${themeColors.border.primary}`
                                }}>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                                        {t('publishedExamDetails.questionBankDetails.questionBankName')}
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: themeColors.text.primary, fontWeight: 500 }}>
                                        {questionBankLabel || t('publishedExamDetails.na')}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ 
                                    p: 2, 
                                    backgroundColor: themeColors.background.secondary, 
                                    borderRadius: 1,
                                    border: `1px solid ${themeColors.border.primary}`
                                }}>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                                        {t('publishedExamDetails.questionBankDetails.grade')}
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: themeColors.text.primary, fontWeight: 500 }}>
                                        {gradeLabel || t('publishedExamDetails.na')}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ 
                                    p: 2, 
                                    backgroundColor: themeColors.background.secondary, 
                                    borderRadius: 1,
                                    border: `1px solid ${themeColors.border.primary}`
                                }}>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                                        {t('publishedExamDetails.questionBankDetails.subject')}
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: themeColors.text.primary, fontWeight: 500 }}>
                                        {subjectLabel || t('publishedExamDetails.na')}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ 
                                    p: 2, 
                                    backgroundColor: themeColors.background.secondary, 
                                    borderRadius: 1,
                                    border: `1px solid ${themeColors.border.primary}`
                                }}>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                                        {t('publishedExamDetails.questionBankDetails.totalQuestions')}
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: themeColors.text.primary, fontWeight: 500 }}>
                                        {publishedExam?.totalQuestionsInBank || 0}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ 
                                    p: 2, 
                                    backgroundColor: themeColors.background.secondary, 
                                    borderRadius: 1,
                                    border: `1px solid ${themeColors.border.primary}`
                                }}>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
                                        {t('publishedExamDetails.questionBankDetails.questionsSelected')}
                                    </Typography>
                                    <Typography variant="body1" sx={{ color: themeColors.text.primary, fontWeight: 500 }}>
                                        {publishedExam?.numberOfQuestions || 0}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>

                    <Divider sx={{ mb: 2, borderColor: themeColors.border.primary }} />

                    {/* Statistics Section */}
                    <Grid container spacing={2} mb={2}>
                        <Grid item xs={12} sm={6} md={2.4}>
                            <Box display="flex" alignItems="center">
                                <PeopleIcon sx={{ color: themeColors.text.secondary }} />
                                <Box ml={1}>
                                    <Typography variant="body1" sx={{ color: themeColors.text.primary }}>
                                        {t('publishedExamDetails.statistics.totalParticipants')}
                                    </Typography>
                                    <Typography variant="h6" sx={{ color: themeColors.primary }}>
                                        {`${attendedUsers.length} / ${students.length}`}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={2.4}>
                            <Box display="flex" alignItems="center">
                                <PeopleIcon sx={{ color: themeColors.text.secondary }} />
                                <Box ml={1}>
                                    <Typography variant="body1" sx={{ color: themeColors.text.primary }}>
                                        {t('publishedExamDetails.statistics.questions')}
                                    </Typography>
                                    <Typography variant="h6" sx={{ color: themeColors.primary }}>
                                        {`${publishedExam?.numberOfQuestions || 0} / ${publishedExam?.totalQuestionsInBank || 0}`}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={2.4}>
                            <Box display="flex" alignItems="center">
                                <CheckCircleIcon sx={{ color: themeColors.success }} />
                                <Box ml={1}>
                                    <Typography variant="body1" sx={{ color: themeColors.text.primary }}>
                                        {t('publishedExamDetails.statistics.attended')}
                                    </Typography>
                                    <Typography variant="h6" sx={{ color: themeColors.success }}>
                                        {attendedUsers.length}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                        
                        <Grid item xs={12} sm={6} md={2.4}>
                            <Box display="flex" alignItems="center">
                                <CancelIcon sx={{ color: themeColors.error }} />
                                <Box ml={1}>
                                    <Typography variant="body1" sx={{ color: themeColors.text.primary }}>
                                        {t('publishedExamDetails.statistics.notAttended')}
                                    </Typography>
                                    <Typography variant="h6" sx={{ color: themeColors.error }}>
                                        {nonAttendedUsers.length}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>

                    <Divider sx={{ mb: 2, borderColor: themeColors.border.primary }} />

                    {/* Date Range */}
                    <Box display="flex" alignItems="center">
                        <DateRangeIcon sx={{ color: themeColors.text.secondary }} />
                        <Typography variant="body1" fontSize={12} ml={1} sx={{ color: themeColors.text.primary }}>
                            {`${dayjs(publishedExam?.startDate).format("DD-MM-YYYY")} to ${dayjs(publishedExam?.endDate).format("DD-MM-YYYY")}`}
                        </Typography>
                    </Box>
                </CardContent>
            </Card>

            {/* Question Bank with Questions Section */}
            <Card sx={{ 
                marginTop: 2, 
                borderRadius: 2, 
                boxShadow: 3, 
                margin: 1, 
                width: '100%',
                backgroundColor: themeColors.background.primary,
                border: `1px solid ${themeColors.border.primary}`
            }}>
                <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Box display="flex" alignItems="center">
                            <QuizIcon sx={{ color: themeColors.primary, mr: 1 }} />
                            <Typography variant="h6" sx={{ color: themeColors.text.primary }}>
                                {t('publishedExamDetails.questionBankWithQuestions.title')}
                            </Typography>
                        </Box>
                        <IconButton 
                            onClick={toggleQuestionBankExpanded} 
                            size="small"
                            sx={{ color: themeColors.text.primary }}
                        >
                            {questionBankExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    </Box>
                    
                    <Collapse in={questionBankExpanded}>
                        <Box>
                            {questions && questions.length > 0 ? (
                                questions.map((question, index) => (
                                    <Accordion 
                                        key={index}
                                        sx={{
                                            backgroundColor: themeColors.background.secondary,
                                            border: `1px solid ${themeColors.border.primary}`,
                                            mb: 1,
                                            '&:before': {
                                                display: 'none',
                                            },
                                            '& .MuiAccordionSummary-root': {
                                                backgroundColor: themeColors.background.primary,
                                                borderBottom: `1px solid ${themeColors.border.primary}`,
                                            },
                                            '& .MuiAccordionSummary-content': {
                                                margin: '12px 0',
                                            },
                                            '& .MuiAccordionDetails-root': {
                                                backgroundColor: themeColors.background.secondary,
                                                padding: 2,
                                            }
                                        }}
                                    >
                                        <AccordionSummary
                                            expandIcon={<ExpandMoreIcon sx={{ color: themeColors.primary }} />}
                                            sx={{
                                                '& .MuiAccordionSummary-content': {
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                }
                                            }}
                                        >
                                            <Box display="flex" alignItems="center" flexGrow={1}>
                                                <Typography variant="h6" sx={{ color: themeColors.text.primary, fontWeight: 600 }}>
                                                    {t('publishedExamDetails.questionBankWithQuestions.question', { number: index + 1 })}
                                                </Typography>
                                                <Chip 
                                                    label={question.questionType === 'objective' ? t('publishedExamDetails.questionTypes.objective') : 
                                                           question.questionType === 'fill-in-the-blanks' ? t('publishedExamDetails.questionTypes.fillInBlanks') : t('publishedExamDetails.questionTypes.trueFalse')} 
                                                    size="small" 
                                                    sx={{ 
                                                        ml: 2,
                                                        backgroundColor: themeColors.primary,
                                                        color: 'white',
                                                        fontSize: '0.75rem'
                                                    }}
                                                />
                                                <Chip 
                                                    label={t('publishedExamDetails.questionBankWithQuestions.marks', { marks: question.marks })} 
                                                    size="small" 
                                                    sx={{ 
                                                        ml: 1,
                                                        backgroundColor: themeColors.accent,
                                                        color: 'white',
                                                        fontSize: '0.75rem'
                                                    }}
                                                />
                                            </Box>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <Box>
                                                {/* Question Text */}
                                                <Typography variant="body1" sx={{ color: themeColors.text.primary, mb: 2, fontWeight: 500 }}>
                                                    {question.questionText}
                                                </Typography>
                                                
                                                {/* Question Image */}
                                                {question.questionImage && (
                                                    <Box sx={{ mb: 2 }}>
                                                        <Card sx={{ 
                                                            maxWidth: 300,
                                                            backgroundColor: themeColors.background.primary,
                                                            border: `1px solid ${themeColors.border.primary}`
                                                        }}>
                                                            <CardMedia
                                                                component="img"
                                                                image={question.questionImage}
                                                                alt="Question"
                                                                sx={{ height: 150, objectFit: 'contain' }}
                                                            />
                                                        </Card>
                                                    </Box>
                                                )}
                                                
                                                {/* Options for Objective Questions */}
                                                {question.questionType === 'objective' && question.options && (
                                                    <Box mt={2}>
                                                        <Typography variant="subtitle2" gutterBottom sx={{ color: themeColors.text.primary, fontWeight: 600 }}>
                                                            {t('publishedExamDetails.questionBankWithQuestions.options')}:
                                                        </Typography>
                                                        <Grid container spacing={1}>
                                                            {question.options.map((option, optIndex) => {
                                                                const optionLetter = String.fromCharCode(65 + optIndex);
                                                                const isCorrectOption = optionLetter === question.correctAnswer;
                                                                
                                                                return (
                                                                    <Grid item xs={12} sm={6} key={optIndex}>
                                                                        <Box 
                                                                            sx={{ 
                                                                                p: 1.5, 
                                                                                border: `1px solid ${themeColors.border.primary}`,
                                                                                borderRadius: 1,
                                                                                backgroundColor: isCorrectOption ? `${themeColors.success}20` : themeColors.background.primary,
                                                                                position: 'relative'
                                                                            }}
                                                                        >
                                                                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5, color: themeColors.text.primary }}>
                                                                                {t('publishedExamDetails.questionBankWithQuestions.option', { letter: optionLetter })}:
                                                                            </Typography>
                                                                            
                                                                            {option.type === 'image' ? (
                                                                                <Card sx={{ 
                                                                                    width: 80, 
                                                                                    height: 50,
                                                                                    backgroundColor: themeColors.background.secondary,
                                                                                    border: `1px solid ${themeColors.border.primary}`
                                                                                }}>
                                                                                    <CardMedia
                                                                                        component="img"
                                                                                        image={option.value}
                                                                                        alt={`Option ${optionLetter}`}
                                                                                        sx={{ height: 50, objectFit: 'contain' }}
                                                                                    />
                                                                                </Card>
                                                                            ) : (
                                                                                <Typography variant="body2" sx={{ color: themeColors.text.primary }}>
                                                                                    {option.value}
                                                                                </Typography>
                                                                            )}
                                                                            
                                                                            {isCorrectOption && (
                                                                                <CheckCircleIcon sx={{ 
                                                                                    position: 'absolute', 
                                                                                    top: 4, 
                                                                                    right: 4, 
                                                                                    fontSize: 16, 
                                                                                    color: themeColors.success 
                                                                                }} />
                                                                            )}
                                                                        </Box>
                                                                    </Grid>
                                                                );
                                                            })}
                                                        </Grid>
                                                    </Box>
                                                )}
                                                
                                                {/* Answer for Non-Objective Questions */}
                                                {question.questionType !== 'objective' && (
                                                    <Box mt={2}>
                                                        <Typography variant="subtitle2" gutterBottom sx={{ color: themeColors.text.primary, fontWeight: 600 }}>
                                                            {t('publishedExamDetails.questionBankWithQuestions.correctAnswer')}:
                                                        </Typography>
                                                        <Box sx={{ 
                                                            p: 2, 
                                                            border: `1px solid ${themeColors.success}`,
                                                            borderRadius: 1,
                                                            backgroundColor: `${themeColors.success}10`,
                                                            color: themeColors.text.primary
                                                        }}>
                                                            <Typography variant="body2" sx={{ color: themeColors.text.primary, fontWeight: 500 }}>
                                                                {question.correctAnswer}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                )}
                                            </Box>
                                        </AccordionDetails>
                                    </Accordion>
                                ))
                            ) : (
                                <Box textAlign="center" py={3}>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        {t('publishedExamDetails.questionBankWithQuestions.noQuestions')}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Collapse>
                </CardContent>
            </Card>

            {/* User Details Section */}
            <Card sx={{ 
                marginTop: 2, 
                borderRadius: 2, 
                boxShadow: 3, 
                margin: 1, 
                width: '100%',
                backgroundColor: themeColors.background.primary,
                border: `1px solid ${themeColors.border.primary}`
            }}>
                <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Typography variant="h6" sx={{ color: themeColors.text.primary }}>
                            {t('publishedExamDetails.userDetails.title')}
                        </Typography>
                        <IconButton 
                            onClick={toggleExpanded} 
                            size="small"
                            sx={{ color: themeColors.text.primary }}
                        >
                            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    </Box>
                    
                    <Collapse in={expanded}>
                        <Box>
                            <Tabs 
                                value={tabValue} 
                                onChange={handleTabChange} 
                                sx={{ 
                                    mb: 2,
                                    '& .MuiTabs-indicator': {
                                        backgroundColor: themeColors.primary
                                    },
                                    '& .MuiTab-root': {
                                        color: themeColors.text.secondary,
                                        '&.Mui-selected': {
                                            color: themeColors.primary
                                        }
                                    }
                                }}
                            >
                                <Tab 
                                    label={t('publishedExamDetails.userDetails.attendedUsers', { count: attendedUsers.length })} 
                                    icon={<CheckCircleIcon sx={{ color: themeColors.success }} />} 
                                    iconPosition="start"
                                />
                                <Tab 
                                    label={t('publishedExamDetails.userDetails.notAttended', { count: nonAttendedUsers.length })} 
                                    icon={<CancelIcon sx={{ color: themeColors.error }} />} 
                                    iconPosition="start"
                                />
                            </Tabs>

                            <TabPanel value={tabValue} index={0}>
                                <UserList
                                    users={attendedUsers}
                                    title={t('publishedExamDetails.userDetails.attendedUsersTitle')}
                                    emptyMessage={t('publishedExamDetails.userDetails.noAttended')}
                                    icon={<CheckCircleIcon sx={{ color: themeColors.success }} />}
                                    color="success"
                                    calculateTotalMarks={calculateTotalMarksFromStudent}
                                    questions={questions}
                                    onViewDetails={handleViewStudentDetails}
                                    themeColors={themeColors}
                                    t={t}
                                />
                            </TabPanel>

                            <TabPanel value={tabValue} index={1}>
                                <UserList
                                    users={nonAttendedUsers}
                                    title={t('publishedExamDetails.userDetails.notAttendedTitle')}
                                    emptyMessage={t('publishedExamDetails.userDetails.allAttended')}
                                    icon={<CancelIcon sx={{ color: themeColors.error }} />}
                                    color="error"
                                    calculateTotalMarks={calculateTotalMarksFromStudent}
                                    questions={questions}
                                    onViewDetails={handleViewStudentDetails}
                                    themeColors={themeColors}
                                    t={t}
                                />
                            </TabPanel>
                        </Box>
                    </Collapse>
                </CardContent>
            </Card>

            {/* Student Details Dialog */}
            <StudentDetailsDialog
                open={studentDetailsOpen}
                onClose={() => setStudentDetailsOpen(false)}
                student={selectedStudent}
                questions={questions}
                totalMarks={selectedStudent ? calculateTotalMarksFromStudent(selectedStudent) : 0}
                themeColors={themeColors}
                t={t}
            />

            {/* Retest Dialog */}
            <RetestDialog
                open={retestDialogOpen}
                onClose={() => setRetestDialogOpen(false)}
                onConfirm={createRetest}
                data={data}
                themeColors={themeColors}
                t={t}
            />
        </Box>
    );
};

export default memo(PublishedExamDetails); 