import React, { useState, useRef, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    LinearProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Avatar
} from '@mui/material';
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
import { Bar, Pie, Line } from 'react-chartjs-2';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import { useTheme } from '../../contexts/ThemeContext';
import { useGetClasswiseAttendanceReportQuery } from '../../Redux/features/Attendance/attendanceSlice';
import { useTranslation } from 'react-i18next';

// Register Chart.js components
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

const ClasswiseAttendanceReport = ({ open, onClose, reportData }) => {
    const { t } = useTranslation();
    const { themeColors } = useTheme();
    const chartRef = useRef(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // API call for real data
    const { data: apiData, isLoading, error } = useGetClasswiseAttendanceReportQuery(
        {
            fromDate: reportData?.fromDate,
            toDate: reportData?.toDate,
            academicYear: reportData?.academicYear,
            grade: reportData?.grade_id,
            gender: reportData?.gender,
            section: reportData?.section
        },
        {
            skip: !open || !reportData?.fromDate || !reportData?.toDate || !reportData?.academicYear || !reportData?.grade_id
        }
    );

    const reportContent = apiData?.data;

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // Print functionality
    const handlePrint = useCallback(async () => {
        if (!reportContent) return;
        
        try {
            // Capture chart images
            const chartImages = [];
            const chartContainers = chartRef.current?.querySelectorAll('canvas');
            
            if (chartContainers && chartContainers.length > 0) {
                for (let i = 0; i < chartContainers.length; i++) {
                    const canvas = chartContainers[i];
                    const imageData = canvas.toDataURL('image/png');
                    chartImages.push(imageData);
                }
            }
            
            const printWindow = window.open('', '_blank');
            if (!printWindow) return;
            
            const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${t('attendance.classwiseReport.title')}</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 20px; 
                            color: #333;
                            line-height: 1.6;
                        }
                        .header { 
                            text-align: center; 
                            margin-bottom: 30px; 
                            border-bottom: 2px solid #333; 
                            padding-bottom: 20px;
                        }
                        .header h1 {
                            margin: 0 0 10px 0;
                            color: #333;
                        }
                        .header p {
                            margin: 5px 0;
                            font-size: 14px;
                        }
                        .summary-stats { 
                            display: grid; 
                            grid-template-columns: repeat(4, 1fr); 
                            gap: 20px; 
                            margin-bottom: 30px;
                        }
                        .stat-card { 
                            border: 1px solid #ddd; 
                            padding: 15px; 
                            text-align: center; 
                            border-radius: 8px;
                            background-color: #f9f9f9;
                        }
                        .stat-number { 
                            font-size: 24px; 
                            font-weight: bold; 
                            margin-bottom: 5px;
                        }
                        .stat-label { 
                            font-size: 14px; 
                            color: #666;
                        }
                        .performance-stats { 
                            display: grid; 
                            grid-template-columns: repeat(4, 1fr); 
                            gap: 20px; 
                            margin-bottom: 30px;
                        }
                        .performance-card { 
                            border: 1px solid #ddd; 
                            padding: 15px; 
                            text-align: center; 
                            border-radius: 8px;
                            background-color: #f9f9f9;
                        }
                        .excellent { color: #10B981; }
                        .good { color: #F59E0B; }
                        .needs-improvement { color: #EF4444; }
                        .no-attendance { color: #6B7280; }
                        .charts-section {
                            margin: 30px 0;
                            page-break-inside: avoid;
                        }
                        .chart-container {
                            margin: 20px 0;
                            text-align: center;
                            page-break-inside: avoid;
                        }
                        .chart-title {
                            font-size: 18px;
                            font-weight: bold;
                            margin-bottom: 15px;
                            color: #333;
                        }
                        .chart-image {
                            max-width: 100%;
                            height: auto;
                            border: 1px solid #ddd;
                            border-radius: 8px;
                        }
                        table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin-top: 20px;
                            font-size: 12px;
                            page-break-inside: avoid;
                        }
                        th, td { 
                            border: 1px solid #ddd; 
                            padding: 8px; 
                            text-align: left;
                        }
                        th { 
                            background-color: #f5f5f5; 
                            font-weight: bold;
                            text-align: center;
                        }
                        @media print {
                            body { margin: 0; }
                            .no-print { display: none; }
                            .chart-container { page-break-inside: avoid; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>${reportContent.title || t('attendance.classwiseReport.title')}</h1>
                        <p><strong>${t('attendance.classwiseReport.dateRange')}</strong> ${reportContent.dateRange?.from} ${t('attendance.classwiseReport.to')} ${reportContent.dateRange?.to}</p>
                        <p><strong>${t('attendance.classwiseReport.grade')}</strong> ${reportContent.grade} | <strong>${t('attendance.classwiseReport.section')}</strong> ${reportContent.section} | <strong>${t('attendance.classwiseReport.gender')}</strong> ${reportContent.gender}</p>
                        <p><strong>${t('attendance.classwiseReport.overallAttendanceLabel')}</strong> ${reportContent.summary?.overallAttendancePercentage}%</p>
                    </div>

                    <div class="summary-stats">
                        <div class="stat-card">
                            <div class="stat-number">${reportContent.summary?.totalStudents || 0}</div>
                            <div class="stat-label">${t('attendance.classwiseReport.totalStudents')}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" style="color: #4caf50;">${reportContent.summary?.totalPresentDays || 0}</div>
                            <div class="stat-label">${t('attendance.classwiseReport.presentDays')}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" style="color: #f44336;">${reportContent.summary?.totalAbsentDays || 0}</div>
                            <div class="stat-label">${t('attendance.classwiseReport.absentDays')}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${reportContent.summary?.overallAttendancePercentage || 0}%</div>
                            <div class="stat-label">${t('attendance.classwiseReport.attendanceRate')}</div>
                        </div>
                    </div>

                    ${reportContent.visualData?.performanceIndicators ? `
                    <div class="performance-stats">
                        <div class="performance-card">
                            <div class="stat-number excellent">${reportContent.visualData.performanceIndicators.excellent || 0}</div>
                            <div class="stat-label">${t('attendance.classwiseReport.excellent')}</div>
                        </div>
                        <div class="performance-card">
                            <div class="stat-number good">${reportContent.visualData.performanceIndicators.good || 0}</div>
                            <div class="stat-label">${t('attendance.classwiseReport.good')}</div>
                        </div>
                        <div class="performance-card">
                            <div class="stat-number needs-improvement">${reportContent.visualData.performanceIndicators.needsImprovement || 0}</div>
                            <div class="stat-label">${t('attendance.classwiseReport.needsImprovement')}</div>
                        </div>
                        <div class="performance-card">
                            <div class="stat-number no-attendance">${reportContent.visualData.performanceIndicators.noAttendance || 0}</div>
                            <div class="stat-label">${t('attendance.classwiseReport.noAttendance')}</div>
                        </div>
                    </div>
                    ` : ''}

                    ${chartImages.length > 0 ? `
                    <div class="charts-section">
                        <h2 style="text-align: center; margin: 30px 0 20px 0; color: #333;">${t('attendance.classwiseReport.visualDataCharts')}</h2>
                        ${chartImages.map((imageData, index) => {
                            const chartTitles = [
                                t('attendance.classwiseReport.attendanceDistributionPie'),
                                t('attendance.classwiseReport.studentAttendancePercentageBar'),
                                t('attendance.classwiseReport.dailyAttendanceTrendBar')
                            ];
                            return `
                                <div class="chart-container">
                                    <div class="chart-title">${chartTitles[index] || t('attendance.classwiseReport.chart', { number: index + 1 })}</div>
                                    <img src="${imageData}" alt="${t('attendance.classwiseReport.chart', { number: index + 1 })}" class="chart-image" />
                                </div>
                            `;
                        }).join('')}
                    </div>
                    ` : ''}

                    <table>
                        <thead>
                            <tr>
                                <th>${t('attendance.classwiseReport.studentName')}</th>
                                <th>${t('attendance.classwiseReport.studentId')}</th>
                                <th>${t('attendance.classwiseReport.rollNumber')}</th>
                                <th>${t('attendance.classwiseReport.totalDays')}</th>
                                <th>${t('attendance.classwiseReport.present')}</th>
                                <th>${t('attendance.classwiseReport.absent')}</th>
                                <th>${t('attendance.classwiseReport.late')}</th>
                                <th>${t('attendance.classwiseReport.percentage')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(reportContent.students || []).map(student => `
                                <tr>
                                    <td>${student.studentName || t('attendance.classwiseReport.notAvailable')}</td>
                                    <td>${student.studentID || t('attendance.classwiseReport.notAvailable')}</td>
                                    <td>${student.rollNumber || t('attendance.classwiseReport.notAvailable')}</td>
                                    <td style="text-align: center;">${student.totalDays || 0}</td>
                                    <td style="color: #4caf50; font-weight: bold; text-align: center;">${student.presentDays || 0}</td>
                                    <td style="color: #f44336; font-weight: bold; text-align: center;">${student.absentDays || 0}</td>
                                    <td style="color: #ff9800; font-weight: bold; text-align: center;">${student.lateDays || 0}</td>
                                    <td style="text-align: center;">${student.attendancePercentage || 0}%</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
                </html>
            `;
            
            printWindow.document.write(printContent);
            printWindow.document.close();
            
            // Wait for images to load before printing
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 2000);
            
        } catch (error) {
            console.error('Error generating print content:', error);
            // Fallback to simple print without charts
            const printWindow = window.open('', '_blank');
            if (!printWindow) return;
            
            const simplePrintContent = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>${t('attendance.classwiseReport.title')}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f5f5f5; font-weight: bold; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>${reportContent.title || t('attendance.classwiseReport.title')}</h1>
                        <p><strong>${t('attendance.classwiseReport.dateRange')}</strong> ${reportContent.dateRange?.from} ${t('attendance.classwiseReport.to')} ${reportContent.dateRange?.to}</p>
                        <p><strong>${t('attendance.classwiseReport.grade')}</strong> ${reportContent.grade} | <strong>${t('attendance.classwiseReport.section')}</strong> ${reportContent.section} | <strong>${t('attendance.classwiseReport.gender')}</strong> ${reportContent.gender}</p>
                        <p><strong>${t('attendance.classwiseReport.overallAttendanceLabel')}</strong> ${reportContent.summary?.overallAttendancePercentage}%</p>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>${t('attendance.classwiseReport.studentName')}</th>
                                <th>${t('attendance.classwiseReport.studentId')}</th>
                                <th>${t('attendance.classwiseReport.rollNumber')}</th>
                                <th>${t('attendance.classwiseReport.totalDays')}</th>
                                <th>${t('attendance.classwiseReport.present')}</th>
                                <th>${t('attendance.classwiseReport.absent')}</th>
                                <th>${t('attendance.classwiseReport.late')}</th>
                                <th>${t('attendance.classwiseReport.percentage')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(reportContent.students || []).map(student => `
                                <tr>
                                    <td>${student.studentName || t('attendance.classwiseReport.notAvailable')}</td>
                                    <td>${student.studentID || t('attendance.classwiseReport.notAvailable')}</td>
                                    <td>${student.rollNumber || t('attendance.classwiseReport.notAvailable')}</td>
                                    <td style="text-align: center;">${student.totalDays || 0}</td>
                                    <td style="color: #4caf50; font-weight: bold; text-align: center;">${student.presentDays || 0}</td>
                                    <td style="color: #f44336; font-weight: bold; text-align: center;">${student.absentDays || 0}</td>
                                    <td style="color: #ff9800; font-weight: bold; text-align: center;">${student.lateDays || 0}</td>
                                    <td style="text-align: center;">${student.attendancePercentage || 0}%</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
                </html>
            `;
            
            printWindow.document.write(simplePrintContent);
            printWindow.document.close();
            
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 1000);
        }
    }, [reportContent]);

    // Download functionality
    const handleDownload = useCallback(() => {
        if (reportContent) {
            const csvContent = [
                [t('attendance.classwiseReport.title')],
                [''],
                [`${t('attendance.classwiseReport.dateRange')} ${reportContent.dateRange?.from} ${t('attendance.classwiseReport.to')} ${reportContent.dateRange?.to}`],
                [`${t('attendance.classwiseReport.grade')} ${reportContent.grade} | ${t('attendance.classwiseReport.section')} ${reportContent.section} | ${t('attendance.classwiseReport.gender')} ${reportContent.gender}`],
                [`${t('attendance.classwiseReport.overallAttendanceLabel')} ${reportContent.summary?.overallAttendancePercentage}%`],
                [''],
                [t('attendance.classwiseReport.summaryStatistics')],
                [t('attendance.classwiseReport.totalStudents'), t('attendance.classwiseReport.presentDays'), t('attendance.classwiseReport.absentDays'), t('attendance.classwiseReport.lateDays'), t('attendance.classwiseReport.totalDays'), t('attendance.classwiseReport.overallPercentage')],
                [
                    reportContent.summary?.totalStudents,
                    reportContent.summary?.totalPresentDays,
                    reportContent.summary?.totalAbsentDays,
                    reportContent.summary?.totalLateDays,
                    reportContent.summary?.totalDays,
                    `${reportContent.summary?.overallAttendancePercentage}%`
                ],
                [''],
                [t('attendance.classwiseReport.performanceIndicators')],
                [t('attendance.classwiseReport.excellent'), t('attendance.classwiseReport.good'), t('attendance.classwiseReport.needsImprovement'), t('attendance.classwiseReport.noAttendance')],
                [
                    reportContent.visualData?.performanceIndicators?.excellent || 0,
                    reportContent.visualData?.performanceIndicators?.good || 0,
                    reportContent.visualData?.performanceIndicators?.needsImprovement || 0,
                    reportContent.visualData?.performanceIndicators?.noAttendance || 0
                ],
                [''],
                [t('attendance.classwiseReport.studentDetails')],
                [t('attendance.classwiseReport.studentName'), t('attendance.classwiseReport.studentId'), t('attendance.classwiseReport.rollNumber'), t('attendance.classwiseReport.totalDays'), t('attendance.classwiseReport.presentDays'), t('attendance.classwiseReport.absentDays'), t('attendance.classwiseReport.lateDays'), t('attendance.classwiseReport.attendancePercentage')],
                ...(reportContent.students?.map(student => [
                    student.studentName,
                    student.studentID,
                    student.rollNumber,
                    student.totalDays,
                    student.presentDays,
                    student.absentDays,
                    student.lateDays,
                    `${student.attendancePercentage}%`
                ]) || [])
            ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `attendance_report_${reportContent.dateRange?.from}_to_${reportContent.dateRange?.to}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }, [reportContent, t]);

    if (!open) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xl"
            fullWidth
            PaperProps={{
                sx: {
                    background: themeColors.background.primary,
                    color: themeColors.text.primary,
                    borderRadius: 2
                }
            }}
        >
            <DialogTitle sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: `1px solid ${themeColors.border.primary}`,
                pb: 2
            }}>
                <Typography variant="h5" sx={{ color: themeColors.text.primary, fontWeight: 600 }}>
                    {reportContent?.title || t('attendance.classwiseReport.title')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        startIcon={<PrintIcon />}
                        onClick={handlePrint}
                        variant="outlined"
                        size="small"
                        disabled={!reportContent}
                        sx={{ color: themeColors.primary, borderColor: themeColors.primary }}
                    >
                        {t('attendance.classwiseReport.print')}
                    </Button>
                    <Button
                        startIcon={<DownloadIcon />}
                        onClick={handleDownload}
                        variant="outlined"
                        size="small"
                        disabled={!reportContent}
                        sx={{ color: themeColors.primary, borderColor: themeColors.primary }}
                    >
                        {t('attendance.classwiseReport.downloadCsv')}
                    </Button>
                    <Button
                        onClick={onClose}
                        size="small"
                        sx={{ color: themeColors.text.secondary }}
                    >
                        <CloseIcon />
                    </Button>
                </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
                {isLoading ? (
                    <Box sx={{ width: '100%', mt: 2 }}>
                        <LinearProgress />
                        <Typography sx={{ mt: 2, textAlign: 'center' }}>
                            {t('attendance.classwiseReport.generatingReport')}
                        </Typography>
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error?.data?.message || t('attendance.classwiseReport.generateError')}
                    </Alert>
                ) : reportContent ? (
                    <Box ref={chartRef}>
                        {/* Header Info */}
                        <Box sx={{ mb: 3, textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ color: themeColors.text.primary, mb: 1 }}>
                                {t('attendance.classwiseReport.dateRange')} {reportContent.dateRange?.from} {t('attendance.classwiseReport.to')} {reportContent.dateRange?.to}
                            </Typography>
                            <Typography variant="body1" sx={{ color: themeColors.text.secondary, mb: 1 }}>
                                {t('attendance.classwiseReport.grade')} {reportContent.grade} | {t('attendance.classwiseReport.section')} {reportContent.section} | {t('attendance.classwiseReport.gender')} {reportContent.gender}
                            </Typography>
                            <Chip 
                                label={t('attendance.classwiseReport.overallAttendance', { percentage: reportContent.summary?.overallAttendancePercentage })}
                                color={reportContent.summary?.overallAttendancePercentage >= 90 ? 'success' : 'warning'}
                                sx={{ fontSize: '1rem', p: 1 }}
                            />
                        </Box>

                        {/* Summary Stats */}
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ 
                                    background: themeColors.background.secondary,
                                    border: `1px solid ${themeColors.border.primary}`
                                }}>
                                    <CardContent sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" sx={{ color: themeColors.primary, fontWeight: 'bold' }}>
                                            {reportContent.summary?.totalStudents || 0}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                            {t('attendance.classwiseReport.totalStudents')}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ 
                                    background: themeColors.background.secondary,
                                    border: `1px solid ${themeColors.border.primary}`
                                }}>
                                    <CardContent sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                                            {reportContent.summary?.totalPresentDays || 0}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                            {t('attendance.classwiseReport.presentDays')}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ 
                                    background: themeColors.background.secondary,
                                    border: `1px solid ${themeColors.border.primary}`
                                }}>
                                    <CardContent sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" sx={{ color: '#f44336', fontWeight: 'bold' }}>
                                            {reportContent.summary?.totalAbsentDays || 0}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                            {t('attendance.classwiseReport.absentDays')}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card sx={{ 
                                    background: themeColors.background.secondary,
                                    border: `1px solid ${themeColors.border.primary}`
                                }}>
                                    <CardContent sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" sx={{ color: themeColors.primary, fontWeight: 'bold' }}>
                                            {reportContent.summary?.overallAttendancePercentage || 0}%
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                            {t('attendance.classwiseReport.attendanceRate')}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* Performance Indicators */}
                        {reportContent.visualData?.performanceIndicators && (
                            <Grid container spacing={3} sx={{ mb: 4 }}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card sx={{ 
                                        background: themeColors.background.secondary,
                                        border: `1px solid ${themeColors.border.primary}`
                                    }}>
                                        <CardContent sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" sx={{ color: '#10B981', fontWeight: 'bold' }}>
                                                {reportContent.visualData.performanceIndicators.excellent || 0}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                {t('attendance.classwiseReport.excellent')}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card sx={{ 
                                        background: themeColors.background.secondary,
                                        border: `1px solid ${themeColors.border.primary}`
                                    }}>
                                        <CardContent sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" sx={{ color: '#F59E0B', fontWeight: 'bold' }}>
                                                {reportContent.visualData.performanceIndicators.good || 0}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                {t('attendance.classwiseReport.good')}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card sx={{ 
                                        background: themeColors.background.secondary,
                                        border: `1px solid ${themeColors.border.primary}`
                                    }}>
                                        <CardContent sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" sx={{ color: '#EF4444', fontWeight: 'bold' }}>
                                                {reportContent.visualData.performanceIndicators.needsImprovement || 0}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                {t('attendance.classwiseReport.needsImprovement')}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card sx={{ 
                                        background: themeColors.background.secondary,
                                        border: `1px solid ${themeColors.border.primary}`
                                    }}>
                                        <CardContent sx={{ textAlign: 'center' }}>
                                            <Typography variant="h4" sx={{ color: '#6B7280', fontWeight: 'bold' }}>
                                                {reportContent.visualData.performanceIndicators.noAttendance || 0}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                {t('attendance.classwiseReport.noAttendance')}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        )}

                        {/* Charts Section */}
                        {reportContent.visualData && (
                            <Grid container spacing={3} sx={{ mb: 4 }}>
                                {/* Pie Chart - Attendance Distribution */}
                                {reportContent.visualData.attendanceDistribution && (
                                    <Grid item xs={12} md={6}>
                                        <Card sx={{ 
                                            background: themeColors.background.secondary,
                                            border: `1px solid ${themeColors.border.primary}`,
                                            height: '400px'
                                        }}>
                                            <CardContent>
                                                <Typography variant="h6" sx={{ color: themeColors.text.primary, mb: 2, textAlign: 'center' }}>
                                                    {t('attendance.classwiseReport.attendanceDistribution')}
                                                </Typography>
                                                <Box sx={{ height: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                    <Pie
                                                        data={{
                                                            labels: reportContent.visualData.attendanceDistribution.map(item => item.label),
                                                            datasets: [{
                                                                data: reportContent.visualData.attendanceDistribution.map(item => item.value),
                                                                backgroundColor: reportContent.visualData.attendanceDistribution.map(item => item.color),
                                                                borderColor: themeColors.background.secondary,
                                                                borderWidth: 2
                                                            }]
                                                        }}
                                                        options={{
                                                            responsive: true,
                                                            maintainAspectRatio: false,
                                                            plugins: {
                                                                legend: {
                                                                    position: 'bottom',
                                                                    labels: {
                                                                        color: themeColors.text.primary,
                                                                        padding: 20,
                                                                        usePointStyle: true
                                                                    }
                                                                },
                                                                tooltip: {
                                                                    callbacks: {
                                                                        label: function(context) {
                                                                            const item = reportContent.visualData.attendanceDistribution[context.dataIndex];
                                                                            return `${item.label}: ${item.value} (${item.percentage}%)`;
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                )}

                                {/* Bar Chart - Student Attendance */}
                                {reportContent.visualData.studentAttendanceChart && (
                                    <Grid item xs={12} md={6}>
                                        <Card sx={{ 
                                            background: themeColors.background.secondary,
                                            border: `1px solid ${themeColors.border.primary}`,
                                            height: '400px'
                                        }}>
                                            <CardContent>
                                                <Typography variant="h6" sx={{ color: themeColors.text.primary, mb: 2, textAlign: 'center' }}>
                                                    {t('attendance.classwiseReport.studentAttendancePercentage')}
                                                </Typography>
                                                <Box sx={{ height: '300px' }}>
                                                    <Bar
                                                        data={{
                                                            labels: reportContent.visualData.studentAttendanceChart.map(item => item.name),
                                                            datasets: [{
                                                                label: t('attendance.classwiseReport.attendancePercentage'),
                                                                data: reportContent.visualData.studentAttendanceChart.map(item => item.percentage),
                                                                backgroundColor: reportContent.visualData.studentAttendanceChart.map(item => item.color),
                                                                borderColor: themeColors.background.secondary,
                                                                borderWidth: 1,
                                                                borderRadius: 4
                                                            }]
                                                        }}
                                                        options={{
                                                            responsive: true,
                                                            maintainAspectRatio: false,
                                                            scales: {
                                                                y: {
                                                                    beginAtZero: true,
                                                                    max: 100,
                                                                    ticks: {
                                                                        color: themeColors.text.secondary,
                                                                        callback: function(value) {
                                                                            return value + '%';
                                                                        }
                                                                    },
                                                                    grid: {
                                                                        color: themeColors.border.primary
                                                                    }
                                                                },
                                                                x: {
                                                                    ticks: {
                                                                        color: themeColors.text.secondary,
                                                                        maxRotation: 45,
                                                                        minRotation: 45
                                                                    },
                                                                    grid: {
                                                                        display: false
                                                                    }
                                                                }
                                                            },
                                                            plugins: {
                                                                legend: {
                                                                    display: false
                                                                },
                                                                tooltip: {
                                                                    callbacks: {
                                                                        label: function(context) {
                                                                            const item = reportContent.visualData.studentAttendanceChart[context.dataIndex];
                                                                            return `Attendance: ${item.percentage}% (${item.presentDays}/${item.totalDays} days)`;
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                )}

                                {/* Line Chart - Attendance Trend */}
                                {reportContent.visualData.attendanceTrend && reportContent.visualData.attendanceTrend.length > 1 && (
                                    <Grid item xs={12}>
                                        <Card sx={{ 
                                            background: themeColors.background.secondary,
                                            border: `1px solid ${themeColors.border.primary}`,
                                            height: '400px'
                                        }}>
                                            <CardContent>
                                                <Typography variant="h6" sx={{ color: themeColors.text.primary, mb: 2, textAlign: 'center' }}>
                                                    {t('attendance.classwiseReport.dailyAttendanceTrend')}
                                                </Typography>
                                                <Box sx={{ height: '300px' }}>
                                                    <Bar
                                                        data={{
                                                            labels: reportContent.visualData.attendanceTrend.map(item => new Date(item.date).toLocaleDateString()),
                                                            datasets: [
                                                                {
                                                                    label: t('attendance.classwiseReport.present'),
                                                                    data: reportContent.visualData.attendanceTrend.map(item => item.present),
                                                                    backgroundColor: '#10B981',
                                                                    borderColor: '#10B981',
                                                                    borderWidth: 1
                                                                },
                                                                {
                                                                    label: t('attendance.classwiseReport.absent'),
                                                                    data: reportContent.visualData.attendanceTrend.map(item => item.absent),
                                                                    backgroundColor: '#EF4444',
                                                                    borderColor: '#EF4444',
                                                                    borderWidth: 1
                                                                },
                                                                {
                                                                    label: t('attendance.classwiseReport.late'),
                                                                    data: reportContent.visualData.attendanceTrend.map(item => item.late),
                                                                    backgroundColor: '#F59E0B',
                                                                    borderColor: '#F59E0B',
                                                                    borderWidth: 1
                                                                }
                                                            ]
                                                        }}
                                                        options={{
                                                            responsive: true,
                                                            maintainAspectRatio: false,
                                                            scales: {
                                                                y: {
                                                                    beginAtZero: true,
                                                                    ticks: {
                                                                        color: themeColors.text.secondary
                                                                    },
                                                                    grid: {
                                                                        color: themeColors.border.primary
                                                                    }
                                                                },
                                                                x: {
                                                                    ticks: {
                                                                        color: themeColors.text.secondary,
                                                                        maxRotation: 45,
                                                                        minRotation: 45
                                                                    },
                                                                    grid: {
                                                                        display: false
                                                                    }
                                                                }
                                                            },
                                                            plugins: {
                                                                legend: {
                                                                    position: 'top',
                                                                    labels: {
                                                                        color: themeColors.text.primary,
                                                                        usePointStyle: true
                                                                    }
                                                                },
                                                                tooltip: {
                                                                    callbacks: {
                                                                        afterBody: function(context) {
                                                                            const item = reportContent.visualData.attendanceTrend[context[0].dataIndex];
                                                                            return `Total: ${item.total} | Percentage: ${item.percentage}%`;
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                )}
                            </Grid>
                        )}

                        {/* Student Table */}
                        {reportContent.students && reportContent.students.length > 0 && (
                            <Paper sx={{ 
                                background: themeColors.background.secondary,
                                border: `1px solid ${themeColors.border.primary}`
                            }}>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ color: themeColors.text.primary, fontWeight: 600 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <PersonIcon sx={{ fontSize: 20 }} />
                                                        {t('attendance.classwiseReport.student')}
                                                    </Box>
                                                </TableCell>
                                                <TableCell align="center" sx={{ color: themeColors.text.primary, fontWeight: 600 }}>{t('attendance.classwiseReport.id')}</TableCell>
                                                <TableCell align="center" sx={{ color: themeColors.text.primary, fontWeight: 600 }}>{t('attendance.classwiseReport.totalDays')}</TableCell>
                                                <TableCell align="center" sx={{ color: themeColors.text.primary, fontWeight: 600 }}>{t('attendance.classwiseReport.present')}</TableCell>
                                                <TableCell align="center" sx={{ color: themeColors.text.primary, fontWeight: 600 }}>{t('attendance.classwiseReport.absent')}</TableCell>
                                                <TableCell align="center" sx={{ color: themeColors.text.primary, fontWeight: 600 }}>{t('attendance.classwiseReport.late')}</TableCell>
                                                <TableCell align="center" sx={{ color: themeColors.text.primary, fontWeight: 600 }}>{t('attendance.classwiseReport.percentage')}</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {reportContent.students
                                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                                .map((student, index) => (
                                                    <TableRow key={index} hover>
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                                <Avatar sx={{ bgcolor: themeColors.primary, width: 32, height: 32 }}>
                                                                    {student.studentName?.charAt(0) || 'S'}
                                                                </Avatar>
                                                                <Box>
                                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: themeColors.text.primary }}>
                                                                        {student.studentName || t('attendance.classwiseReport.notAvailable')}
                                                                    </Typography>
                                                                    <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                                                                        {t('attendance.classwiseReport.roll')} {student.rollNumber || t('attendance.classwiseReport.notAvailable')}
                                                                    </Typography>
                                                                </Box>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell align="center">{student.studentID || t('attendance.classwiseReport.notAvailable')}</TableCell>
                                                        <TableCell align="center">{student.totalDays || 0}</TableCell>
                                                        <TableCell align="center">
                                                            <Typography sx={{ color: '#4caf50', fontWeight: 600 }}>
                                                                {student.presentDays || 0}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <Typography sx={{ color: '#f44336', fontWeight: 600 }}>
                                                                {student.absentDays || 0}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <Typography sx={{ color: '#ff9800', fontWeight: 600 }}>
                                                                {student.lateDays || 0}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <Chip 
                                                                label={`${student.attendancePercentage || 0}%`}
                                                                color={student.attendancePercentage >= 90 ? 'success' : student.attendancePercentage >= 75 ? 'warning' : 'error'}
                                                                size="small"
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 25]}
                                    component="div"
                                    count={reportContent.students.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={handleChangePage}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                    sx={{ color: themeColors.text.primary }}
                                />
                            </Paper>
                        )}
                    </Box>
                ) : (
                    <Alert severity="info">
                        {t('attendance.classwiseReport.noData')}
                    </Alert>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 3, borderTop: `1px solid ${themeColors.border.primary}` }}>
                <Button onClick={onClose} variant="outlined">
                    {t('attendance.classwiseReport.close')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ClasswiseAttendanceReport;
