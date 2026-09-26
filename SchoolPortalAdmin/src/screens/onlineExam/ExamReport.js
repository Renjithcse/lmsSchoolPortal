import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Divider,
    Skeleton,
    Alert,
    Button,
    Stack,
    Avatar
} from '@mui/material';
import {
    Assessment as AssessmentIcon,
    People as PeopleIcon,
    School as SchoolIcon,
    TrendingUp as TrendingUpIcon,
    Schedule as ScheduleIcon,
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Download as DownloadIcon,
    PictureAsPdf as PdfIcon,
    TableChart as ExcelIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { getExamReport } from '../../api/onlineExam';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const ExamReport = () => {
    const { themeColors } = useTheme();
    const { t } = useTranslation();
    const { examId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const exam = location.state;
    


    const { data, isLoading, error } = useQuery({
        queryKey: ['examReport', examId],
        queryFn: () => getExamReport(examId),
        enabled: !!examId
    });

    // Charts removed from web interface

    // Export to Excel
    const exportToExcel = () => {
        if (!data) return;

        const { exam: examData, statistics, performances, publishes } = data;

        // Create workbook
        const wb = XLSX.utils.book_new();

        // Exam Information Sheet
        const examInfo = [
            [t('examReport.excel.examReport'), ''],
            [t('examReport.excel.examName'), examData?.examName || ''],
            [t('examReport.excel.term'), examData?.term || ''],
            [t('examReport.excel.status'), examData?.status || ''],
            [t('examReport.excel.createdDate'), dayjs(examData?.createdAt).format('DD-MM-YYYY')],
            ['', ''],
            [t('examReport.excel.statistics'), ''],
            [t('examReport.excel.totalStudents'), totalStudentsCount],
            [t('examReport.excel.studentsWithAttempts'), statistics?.studentsWithAttempts || 0],
            [t('examReport.excel.studentsWithoutAttempts'), statistics?.studentsWithoutAttempts || 0],
            [t('examReport.excel.averageMarks'), statistics?.averageMarks || 0],
            [t('examReport.excel.totalMarks'), statistics?.totalMarks || 0],
            [t('examReport.excel.totalPublishes'), statistics?.totalPublishes || 0],
            [t('examReport.excel.totalAttendedUsers'), statistics?.totalAttendedUsers || 0],
            [t('examReport.excel.totalUsersSelected'), statistics?.totalUsersSelected || 0],
            [t('examReport.excel.attendanceRate'), `${statistics?.attendanceRate || 0}%`]
        ];

        const examSheet = XLSX.utils.aoa_to_sheet(examInfo);
        XLSX.utils.book_append_sheet(wb, examSheet, t('examReport.excel.examInformation'));

        // Student Performance Sheet
        const performanceData = [
            [t('examReport.excel.studentId'), t('examReport.excel.studentName'), t('examReport.excel.attempts'), t('examReport.excel.bestMarks'), t('examReport.excel.lastUpdated')]
        ];

        performances?.forEach(perf => {
            performanceData.push([
                perf.studentId?.studentID || '',
                perf.studentId?.studentName || '',
                perf.attempts || 0,
                perf.bestMarkSecured || 0,
                dayjs(perf.updatedAt).format('DD-MM-YYYY HH:mm')
            ]);
        });

        const performanceSheet = XLSX.utils.aoa_to_sheet(performanceData);
        XLSX.utils.book_append_sheet(wb, performanceSheet, t('examReport.excel.studentPerformance'));

        // Published Exams Sheet
        const publishData = [
            [t('examReport.excel.section'), t('examReport.excel.gender'), t('examReport.excel.questions'), t('examReport.excel.duration'), t('examReport.excel.attendedUsers'), t('examReport.excel.totalUsers'), t('examReport.excel.startDate'), t('examReport.excel.endDate')]
        ];

        publishes?.forEach(pub => {
            publishData.push([
                pub.section?.sectionName || '',
                pub.gender || '',
                pub.numberOfQuestions || 0,
                `${pub.duration || 0} ${t('examReport.excel.min')}`,
                pub.attendedUsers || 0,
                pub.totalUsersSelected || 0,
                dayjs(pub.startDate).format('DD-MM-YYYY'),
                dayjs(pub.endDate).format('DD-MM-YYYY')
            ]);
        });

        const publishSheet = XLSX.utils.aoa_to_sheet(publishData);
        XLSX.utils.book_append_sheet(wb, publishSheet, t('examReport.excel.publishedExams'));

        // Download file
        const fileName = `${t('examReport.excel.examReport')}_${examData?.examName?.replace(/\s+/g, '_')}_${dayjs().format('YYYY-MM-DD')}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    // Create chart image function
    

    // Export to PDF
    const exportToPDF = async () => {
        if (!data) return;

        const { exam: examData, statistics, performances, publishes } = data;
        const doc = new jsPDF();

        // Title
        doc.setFontSize(20);
        doc.text(t('examReport.pdf.examReport'), 20, 20);
        
        doc.setFontSize(12);
        doc.text(`${t('examReport.pdf.exam')}: ${examData?.examName || ''}`, 20, 35);
        doc.text(`${t('examReport.pdf.generatedOn')}: ${dayjs().format('DD-MM-YYYY HH:mm')}`, 20, 45);

        // Exam Information and Statistics in Two Columns
        doc.setFontSize(16);
        doc.text(t('examReport.pdf.examInformation'), 20, 65);
        doc.text(t('examReport.pdf.statistics'), 110, 65);
        
        doc.setFontSize(10);
        // Left Column - Exam Information
        doc.text(`${t('examReport.pdf.term')}: ${examData?.term || ''}`, 20, 80);
        doc.text(`${t('examReport.pdf.status')}: ${examData?.status || ''}`, 20, 90);
        doc.text(`${t('examReport.pdf.created')}: ${dayjs(examData?.createdAt).format('DD-MM-YYYY')}`, 20, 100);
        doc.text(`${t('examReport.pdf.subject')}: ${examData?.subjectId?.subjectName || ''}`, 20, 110);
        doc.text(`${t('examReport.pdf.grade')}: ${examData?.grade?.gradeName || ''}`, 20, 120);
        
        // Right Column - Statistics
        doc.text(`${t('examReport.pdf.totalStudents')}: ${statistics?.totalStudents || 0}`, 110, 80);
        doc.text(`${t('examReport.pdf.studentsWithAttempts')}: ${statistics?.studentsWithAttempts || 0}`, 110, 90);
        doc.text(`${t('examReport.pdf.averageMarks')}: ${statistics?.averageMarks || 0}`, 110, 100);
        doc.text(`${t('examReport.pdf.attendanceRate')}: ${statistics?.attendanceRate || 0}%`, 110, 110);
        doc.text(`${t('examReport.pdf.totalMarks')}: ${statistics?.totalMarks || 0}`, 110, 120);
        doc.text(`${t('examReport.pdf.totalPublishes')}: ${statistics?.totalPublishes || 0}`, 110, 130);

        // Charts removed from PDF - keeping only text content

        // Student Performance Table
        doc.setFontSize(16);
        doc.text(t('examReport.pdf.studentPerformance'), 20, 150);

        const performanceTableData = performances?.map(perf => [
            perf.studentId?.studentID || '',
            perf.studentId?.studentName || '',
            perf.attempts || 0,
            perf.bestMarkSecured || 0,
            dayjs(perf.updatedAt).format('DD-MM-YYYY')
        ]) || [];

        autoTable(doc, {
            startY: 155,
            head: [[t('examReport.pdf.studentId'), t('examReport.pdf.studentName'), t('examReport.pdf.attempts'), t('examReport.pdf.bestMarks'), t('examReport.pdf.lastUpdated')]],
            body: performanceTableData,
            theme: 'grid',
            headStyles: { fillColor: [66, 139, 202] }
        });

        // Published Exams Table
        const tableY = 250; // Adjusted position for second table
        doc.setFontSize(16);
        doc.text(t('examReport.pdf.publishedExams'), 20, tableY);

        const publishTableData = publishes?.map(pub => [
            pub.section?.sectionName || '',
            pub.gender || '',
            pub.numberOfQuestions || 0,
            `${pub.duration || 0} ${t('examReport.pdf.min')}`,
            `${pub.attendedUsers || 0}/${pub.totalUsersSelected || 0}`
        ]) || [];

        autoTable(doc, {
            startY: tableY + 10,
            head: [[t('examReport.pdf.section'), t('examReport.pdf.gender'), t('examReport.pdf.questions'), t('examReport.pdf.duration'), t('examReport.pdf.attendance')]],
            body: publishTableData,
            theme: 'grid',
            headStyles: { fillColor: [66, 139, 202] }
        });

        // Download file
        const fileName = `${t('examReport.pdf.examReport')}_${examData?.examName?.replace(/\s+/g, '_')}_${dayjs().format('YYYY-MM-DD')}.pdf`;
        doc.save(fileName);
    };

    if (isLoading) {
        return (
            <Box sx={{ p: 3, backgroundColor: themeColors.background.primary, minHeight: '100vh' }}>
                <Skeleton variant="rectangular" height={200} sx={{ mb: 2, backgroundColor: themeColors.background.secondary }} />
                <Grid container spacing={2}>
                    {[...Array(6)].map((_, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                            <Skeleton variant="rectangular" height={100} sx={{ backgroundColor: themeColors.background.secondary }} />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3, backgroundColor: themeColors.background.primary, minHeight: '100vh' }}>
                <Alert 
                    severity="error"
                    sx={{
                        backgroundColor: themeColors.background.primary,
                        color: themeColors.error,
                        border: `1px solid ${themeColors.error}`
                    }}
                >
                    {t('examReport.messages.loadFailed')}: {error.message}
                </Alert>
            </Box>
        );
    }

    if (!data) {
        return (
            <Box sx={{ p: 3, backgroundColor: themeColors.background.primary, minHeight: '100vh' }}>
                <Alert 
                    severity="info"
                    sx={{
                        backgroundColor: themeColors.background.primary,
                        color: themeColors.info,
                        border: `1px solid ${themeColors.info}`
                    }}
                >
                    {t('examReport.messages.noData')}
                </Alert>
            </Box>
        );
    }

    const { exam: examData, statistics, performances, publishes } = data;
    const totalStudentsCount = (statistics?.studentsWithAttempts || 0) + (statistics?.studentsWithoutAttempts || 0);

    return (
        <Box sx={{ p: 3, backgroundColor: themeColors.background.primary, minHeight: '100vh' }}>
            {/* Header with Back Button and Export Buttons */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}
                 sx={{
                    backgroundColor: themeColors.background.secondary,
                    border: `1px solid ${themeColors.border.primary}`,
                    borderRadius: 2,
                    p: 2
                 }}
            >
                <Box display="flex" alignItems="center">
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
                        {t('examReport.actions.back')}
                    </Button>
                    <Avatar sx={{ width: 40, height: 40, mr: 2, background: `${themeColors.primary}22`, color: themeColors.primary }}>
                        <AssessmentIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="h4" component="h1" gutterBottom sx={{ color: themeColors.text.primary }}>
                            {t('examReport.title')}
                        </Typography>
                        <Typography variant="body1" sx={{ color: themeColors.text.secondary }}>
                            {examData?.examName || t('examReport.subtitle')}
                        </Typography>
                    </Box>
                </Box>
                
                <Stack direction="row" spacing={2}>
                    <Button
                        variant="outlined"
                        startIcon={<ExcelIcon />}
                        onClick={exportToExcel}
                        sx={{
                            borderColor: themeColors.success,
                            color: themeColors.success,
                            '&:hover': {
                                borderColor: themeColors.success,
                                backgroundColor: `${themeColors.success}10`
                            }
                        }}
                    >
                        {t('examReport.actions.exportExcel')}
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<PdfIcon />}
                        onClick={exportToPDF}
                        sx={{
                            borderColor: themeColors.error,
                            color: themeColors.error,
                            '&:hover': {
                                borderColor: themeColors.error,
                                backgroundColor: `${themeColors.error}10`
                            }
                        }}
                    >
                        {t('examReport.actions.exportPDF')}
                    </Button>
                </Stack>
            </Box>

            {/* Exam Details Card */}
            <Card sx={{ 
                mb: 3, 
                borderRadius: 2, 
                boxShadow: 'none',
                backgroundColor: themeColors.background.primary,
                border: `1px solid ${themeColors.border.primary}`
            }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: themeColors.text.primary }}>
                        <Avatar sx={{ width: 28, height: 28, mr: 1, background: `${themeColors.primary}22`, color: themeColors.primary }}>
                            <SchoolIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                        {t('examReport.examInformation.title')}
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                {t('examReport.examInformation.examName')}
                            </Typography>
                            <Typography variant="h6" sx={{ color: themeColors.primary }}>
                                {examData?.examName}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                {t('examReport.examInformation.term')}
                            </Typography>
                            <Typography variant="h6" sx={{ color: themeColors.primary }}>
                                {examData?.term}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                {t('examReport.examInformation.status')}
                            </Typography>
                            <Chip 
                                label={examData?.status} 
                                size="small"
                                sx={{
                                    backgroundColor: examData?.status === 'active' ? themeColors.success : themeColors.warning,
                                    color: '#fff'
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                {t('examReport.examInformation.createdDate')}
                            </Typography>
                            <Typography variant="h6" sx={{ color: themeColors.primary }}>
                                {dayjs(examData?.createdAt).format('DD-MM-YYYY')}
                            </Typography>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Statistics Cards */}
            <Grid container spacing={3} mb={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderRadius: 2, boxShadow: 'none', backgroundColor: themeColors.background.secondary, border: `1px solid ${themeColors.border.primary}` }}>
                        <CardContent>
                            <Box display="flex" alignItems="center">
                                <Avatar sx={{ width: 36, height: 36, mr: 1.5, background: `${themeColors.primary}22`, color: themeColors.primary }}>
                                    <PeopleIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        {t('examReport.statistics.totalStudents')}
                                    </Typography>
                                    <Typography variant="h4" sx={{ color: themeColors.text.primary }}>
                                        {totalStudentsCount}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderRadius: 2, boxShadow: 'none', backgroundColor: themeColors.background.secondary, border: `1px solid ${themeColors.border.primary}` }}>
                        <CardContent>
                            <Box display="flex" alignItems="center">
                                <Avatar sx={{ width: 36, height: 36, mr: 1.5, background: `${themeColors.success}22`, color: themeColors.success }}>
                                    <CheckCircleIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        {t('examReport.statistics.studentsWithAttempts')}
                                    </Typography>
                                    <Typography variant="h4" sx={{ color: themeColors.text.primary }}>
                                        {statistics?.studentsWithAttempts || 0}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderRadius: 2, boxShadow: 'none', backgroundColor: themeColors.background.secondary, border: `1px solid ${themeColors.border.primary}` }}>
                        <CardContent>
                            <Box display="flex" alignItems="center">
                                <Avatar sx={{ width: 36, height: 36, mr: 1.5, background: `${themeColors.info}22`, color: themeColors.info }}>
                                    <TrendingUpIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        {t('examReport.statistics.averageMarks')}
                                    </Typography>
                                    <Typography variant="h4" sx={{ color: themeColors.text.primary }}>
                                        {statistics?.averageMarks || 0}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderRadius: 2, boxShadow: 'none', backgroundColor: themeColors.background.secondary, border: `1px solid ${themeColors.border.primary}` }}>
                        <CardContent>
                            <Box display="flex" alignItems="center">
                                <Avatar sx={{ width: 36, height: 36, mr: 1.5, background: `${themeColors.warning}22`, color: themeColors.warning }}>
                                    <ScheduleIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        {t('examReport.statistics.attendanceRate')}
                                    </Typography>
                                    <Typography variant="h4" sx={{ color: themeColors.text.primary }}>
                                        {statistics?.attendanceRate || 0}%
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Total Publishes */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderRadius: 2, boxShadow: 'none', backgroundColor: themeColors.background.secondary, border: `1px solid ${themeColors.border.primary}` }}>
                        <CardContent>
                            <Box display="flex" alignItems="center">
                                <Avatar sx={{ width: 36, height: 36, mr: 1.5, background: `${themeColors.primary}22`, color: themeColors.primary }}>
                                    <AssessmentIcon />
                                </Avatar>
                                <Box>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        {t('examReport.statistics.totalPublishes')}
                                    </Typography>
                                    <Typography variant="h4" sx={{ color: themeColors.text.primary }}>
                                        {statistics?.totalPublishes || 0}
                                    </Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>



            {/* Student Performance Table */}
            <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 'none', backgroundColor: themeColors.background.secondary, border: `1px solid ${themeColors.border.primary}` }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: themeColors.text.primary }}>
                        {t('examReport.studentPerformance.title')}
                    </Typography>
                    <TableContainer component={Paper} variant="outlined" sx={{ backgroundColor: themeColors.background.primary, borderColor: themeColors.border.primary }}>
                        <Table sx={{
                            '& thead th': {
                                backgroundColor: themeColors.background.secondary,
                                color: themeColors.text.primary,
                                borderBottom: `1px solid ${themeColors.border.primary}`
                            },
                            '& tbody td': {
                                color: themeColors.text.secondary,
                                borderColor: themeColors.border.primary
                            },
                            '& tbody tr:hover': {
                                backgroundColor: `${themeColors.primary}10`
                            }
                        }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell><strong>{t('examReport.studentPerformance.studentId')}</strong></TableCell>
                                    <TableCell><strong>{t('examReport.studentPerformance.studentName')}</strong></TableCell>
                                    <TableCell><strong>{t('examReport.studentPerformance.attempts')}</strong></TableCell>
                                    <TableCell><strong>{t('examReport.studentPerformance.bestMarks')}</strong></TableCell>
                                    <TableCell><strong>{t('examReport.studentPerformance.lastUpdated')}</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {performances?.map((perf, index) => (
                                    <TableRow key={index} hover>
                                        <TableCell>{perf.studentId?.studentID}</TableCell>
                                        <TableCell>{perf.studentId?.studentName}</TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={perf.attempts}
                                                size="small"
                                                sx={{
                                                    backgroundColor: perf.attempts > 0 ? themeColors.success : themeColors.background.tertiary,
                                                    color: perf.attempts > 0 ? '#fff' : themeColors.text.secondary
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>{perf.bestMarkSecured || 0}</TableCell>
                                        <TableCell>
                                            {dayjs(perf.updatedAt).format('DD-MM-YYYY HH:mm')}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Publish Details */}
            <Card sx={{ borderRadius: 2, boxShadow: 'none', backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: themeColors.text.primary }}>
                        {t('examReport.publishedExams.title')}
                    </Typography>
                    <Grid container spacing={2}>
                        {publishes?.map((pub, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <Card variant="outlined" sx={{ backgroundColor: themeColors.background.secondary, border: `1px solid ${themeColors.border.primary}` }}>
                                    <CardContent>
                                        <Typography variant="subtitle1" gutterBottom sx={{ color: themeColors.text.primary }}>
                                            {pub.section?.sectionName} - {pub.gender}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                            {t('examReport.publishedExams.questions')}: {pub.numberOfQuestions}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                            {t('examReport.publishedExams.duration')}: {pub.duration} {t('examReport.publishedExams.min')}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                            {t('examReport.publishedExams.attended')}: {pub.attendedUsers} / {pub.totalUsersSelected}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                            {dayjs(pub.startDate).format('DD-MM-YYYY')} {t('examReport.publishedExams.to')} {dayjs(pub.endDate).format('DD-MM-YYYY')}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </CardContent>
            </Card>
        </Box>
    );
};

export default ExamReport; 