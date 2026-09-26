import React, { useState, useRef, useCallback } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Alert,
    LinearProgress
} from '@mui/material';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { useGetTodayOverallReportQuery } from '../../Redux/features/Attendance/attendanceSlice';
import { useTheme } from '../../contexts/ThemeContext';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from 'react-i18next';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const TodayOverallReport = ({ open, onClose }) => {
    const { t } = useTranslation();
    const { themeColors } = useTheme();
    const chartRef = useRef(null);

    const { data: apiData, isLoading, error } = useGetTodayOverallReportQuery(undefined, {
        skip: !open
    });

    const reportContent = apiData?.data;

    // Debug logging
    console.log('TodayOverallReport - open:', open);
    console.log('TodayOverallReport - isLoading:', isLoading);
    console.log('TodayOverallReport - error:', error);
    console.log('TodayOverallReport - apiData:', apiData);
    console.log('TodayOverallReport - reportContent:', reportContent);
    console.log('TodayOverallReport - visualData:', reportContent?.visualData);
    console.log('TodayOverallReport - gradeAttendance:', reportContent?.visualData?.gradeAttendance);

    // Print functionality
    const handlePrint = useCallback(async () => {
        if (!reportContent) return;
        
        try {
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
                    <title>${t('attendance.todayOverallReport.title')}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                        .summary-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
                        .stat-card { border: 1px solid #ddd; padding: 15px; text-align: center; border-radius: 8px; background-color: #f9f9f9; }
                        .stat-number { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
                        .stat-label { font-size: 14px; color: #666; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f5f5f5; font-weight: bold; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>${reportContent.title || t('attendance.todayOverallReport.title')}</h1>
                        <p><strong>${t('attendance.todayOverallReport.date')}</strong> ${reportContent.reportDate}</p>
                        <p><strong>${t('attendance.todayOverallReport.academicYear')}</strong> ${reportContent.academicYear}</p>
                        <p><strong>${t('attendance.todayOverallReport.overallAttendanceLabel')}</strong> ${reportContent.summary?.overallAttendancePercentage}%</p>
                    </div>

                    <div class="summary-stats">
                        <div class="stat-card">
                            <div class="stat-number">${reportContent.summary?.totalStudents || 0}</div>
                            <div class="stat-label">${t('attendance.todayOverallReport.totalStudents')}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" style="color: #4caf50;">${reportContent.summary?.presentStudents || 0}</div>
                            <div class="stat-label">${t('attendance.todayOverallReport.present')}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number" style="color: #f44336;">${reportContent.summary?.absentStudents || 0}</div>
                            <div class="stat-label">${t('attendance.todayOverallReport.absent')}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${reportContent.summary?.overallAttendancePercentage || 0}%</div>
                            <div class="stat-label">${t('attendance.todayOverallReport.attendanceRate')}</div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>${t('attendance.todayOverallReport.grade')}</th>
                                <th>${t('attendance.todayOverallReport.totalStudents')}</th>
                                <th>${t('attendance.todayOverallReport.present')}</th>
                                <th>${t('attendance.todayOverallReport.absent')}</th>
                                <th>${t('attendance.todayOverallReport.late')}</th>
                                <th>${t('attendance.todayOverallReport.notMarked')}</th>
                                <th>${t('attendance.todayOverallReport.attendancePercentage')}</th>
                                <th>${t('attendance.todayOverallReport.markedPercentage')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(reportContent.gradeData || []).map(grade => `
                                <tr>
                                    <td>${grade.gradeName || t('attendance.todayOverallReport.notAvailable')}</td>
                                    <td style="text-align: center;">${grade.totalRegistered || 0}</td>
                                    <td style="color: #4caf50; font-weight: bold; text-align: center;">${grade.presentStudents || 0}</td>
                                    <td style="color: #f44336; font-weight: bold; text-align: center;">${grade.absentStudents || 0}</td>
                                    <td style="color: #ff9800; font-weight: bold; text-align: center;">${grade.lateStudents || 0}</td>
                                    <td style="color: #6b7280; font-weight: bold; text-align: center;">${grade.notMarked || 0}</td>
                                    <td style="text-align: center;">${grade.attendancePercentage || 0}%</td>
                                    <td style="text-align: center;">${grade.markedPercentage || 0}%</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </body>
                </html>
            `;
            
            printWindow.document.write(printContent);
            printWindow.document.close();
            
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 2000);
            
        } catch (error) {
            console.error('Error generating print content:', error);
        }
    }, [reportContent, t]);

    // Download functionality
    const handleDownload = useCallback(() => {
        if (!reportContent) return;
        
        const csvData = [
            [t('attendance.todayOverallReport.grade'), t('attendance.todayOverallReport.totalStudents'), t('attendance.todayOverallReport.present'), t('attendance.todayOverallReport.absent'), t('attendance.todayOverallReport.late'), t('attendance.todayOverallReport.notMarked'), t('attendance.todayOverallReport.attendancePercentage'), t('attendance.todayOverallReport.markedPercentage')],
            ...(reportContent.gradeData || []).map(grade => [
                grade.gradeName || t('attendance.todayOverallReport.notAvailable'),
                grade.totalRegistered || 0,
                grade.presentStudents || 0,
                grade.absentStudents || 0,
                grade.lateStudents || 0,
                grade.notMarked || 0,
                `${grade.attendancePercentage || 0}%`,
                `${grade.markedPercentage || 0}%`
            ])
        ];
        
        const csvContent = csvData.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `today_overall_attendance_${reportContent.reportDate}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [reportContent, t]);

    if (isLoading) {
        return (
            <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
                <DialogContent>
                    <LinearProgress />
                    <Typography sx={{ mt: 2, textAlign: 'center' }}>
                        {t('attendance.todayOverallReport.loading')}
                    </Typography>
                </DialogContent>
            </Dialog>
        );
    }

    if (error) {
        return (
            <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
                <DialogContent>
                    <Alert severity="error">
                        {t('attendance.todayOverallReport.loadError', { message: error.message })}
                    </Alert>
                </DialogContent>
            </Dialog>
        );
    }

    if (!reportContent) {
        return (
            <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
                <DialogContent>
                    <Alert severity="info">
                        {t('attendance.todayOverallReport.noData')}
                    </Alert>
                </DialogContent>
            </Dialog>
        );
    }

    // Chart data
    const pieChartData = {
        labels: reportContent.visualData?.overallDistribution?.map(item => item.label) || [],
        datasets: [{
            data: reportContent.visualData?.overallDistribution?.map(item => item.value) || [],
            backgroundColor: reportContent.visualData?.overallDistribution?.map(item => item.color) || [],
            borderWidth: 2,
            borderColor: '#fff'
        }]
    };

    const barChartData = {
        labels: reportContent.visualData?.gradeAttendance?.map(item => item.gradeName) || [],
        datasets: [
            {
                label: t('attendance.todayOverallReport.present'),
                data: reportContent.visualData?.gradeAttendance?.map(item => item.presentStudents) || [],
                backgroundColor: '#10B981',
                borderColor: '#10B981',
                borderWidth: 1
            },
            {
                label: t('attendance.todayOverallReport.absent'),
                data: reportContent.visualData?.gradeAttendance?.map(item => item.absentStudents) || [],
                backgroundColor: '#EF4444',
                borderColor: '#EF4444',
                borderWidth: 1
            },
            {
                label: t('attendance.todayOverallReport.late'),
                data: reportContent.visualData?.gradeAttendance?.map(item => item.lateStudents) || [],
                backgroundColor: '#F59E0B',
                borderColor: '#F59E0B',
                borderWidth: 1
            },
            {
                label: t('attendance.todayOverallReport.notMarked'),
                data: reportContent.visualData?.gradeAttendance?.map(item => item.notMarked) || [],
                backgroundColor: '#6B7280',
                borderColor: '#6B7280',
                borderWidth: 1
            }
        ]
    };

    // Debug chart data
    console.log('TodayOverallReport - pieChartData:', pieChartData);
    console.log('TodayOverallReport - barChartData:', barChartData);
    console.log('TodayOverallReport - gradeData:', reportContent?.gradeData);
    console.log('TodayOverallReport - first grade item:', reportContent?.gradeData?.[0]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: themeColors.text.primary,
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                backgroundColor: themeColors.background.primary,
                titleColor: themeColors.text.primary,
                bodyColor: themeColors.text.secondary,
                borderColor: themeColors.border.primary,
                borderWidth: 1
            }
        },
        scales: {
            x: {
                ticks: {
                    color: themeColors.text.secondary
                },
                grid: {
                    color: themeColors.border.primary
                }
            },
            y: {
                ticks: {
                    color: themeColors.text.secondary
                },
                grid: {
                    color: themeColors.border.primary
                }
            }
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                backgroundColor: themeColors.background.primary,
                color: themeColors.text.primary
            }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {reportContent.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        startIcon={<PrintIcon />}
                        onClick={handlePrint}
                        variant="outlined"
                        size="small"
                        sx={{ color: themeColors.primary, borderColor: themeColors.primary }}
                    >
                        {t('attendance.todayOverallReport.print')}
                    </Button>
                    <Button
                        startIcon={<DownloadIcon />}
                        onClick={handleDownload}
                        variant="outlined"
                        size="small"
                        sx={{ color: themeColors.primary, borderColor: themeColors.primary }}
                    >
                        {t('attendance.todayOverallReport.download')}
                    </Button>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            
            <DialogContent sx={{ backgroundColor: themeColors.background.primary }}>
                <Box ref={chartRef}>
                    {/* Header Information */}
                    <Card sx={{ mb: 3, backgroundColor: themeColors.background.secondary }}>
                        <CardContent>
                            <Typography variant="h5" sx={{ 
                                textAlign: 'center', 
                                mb: 2, 
                                color: themeColors.text.primary,
                                fontWeight: 600
                            }}>
                                {reportContent.title}
                            </Typography>
                            <Grid container spacing={2} justifyContent="center">
                                <Grid item>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        <strong>{t('attendance.todayOverallReport.date')}</strong> {reportContent.reportDate}
                                    </Typography>
                                </Grid>
                                <Grid item>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        <strong>{t('attendance.todayOverallReport.academicYear')}</strong> {reportContent.academicYear}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Summary Statistics */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ backgroundColor: themeColors.background.secondary }}>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" sx={{ 
                                        color: themeColors.text.primary,
                                        fontWeight: 700
                                    }}>
                                        {reportContent.summary?.totalStudents || 0}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        {t('attendance.todayOverallReport.totalStudents')}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ backgroundColor: themeColors.background.secondary }}>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" sx={{ 
                                        color: '#4caf50',
                                        fontWeight: 700
                                    }}>
                                        {reportContent.summary?.presentStudents || 0}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        {t('attendance.todayOverallReport.present')}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ backgroundColor: themeColors.background.secondary }}>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" sx={{ 
                                        color: '#f44336',
                                        fontWeight: 700
                                    }}>
                                        {reportContent.summary?.absentStudents || 0}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        {t('attendance.todayOverallReport.absent')}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card sx={{ backgroundColor: themeColors.background.secondary }}>
                                <CardContent sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" sx={{ 
                                        color: themeColors.primary,
                                        fontWeight: 700
                                    }}>
                                        {reportContent.summary?.overallAttendancePercentage || 0}%
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        {t('attendance.todayOverallReport.attendanceRate')}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Charts */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12} md={6}>
                            <Card sx={{ backgroundColor: themeColors.background.secondary }}>
                                <CardContent>
                                    <Typography variant="h6" sx={{ 
                                        mb: 2, 
                                        textAlign: 'center',
                                        color: themeColors.text.primary
                                    }}>
                                        {t('attendance.todayOverallReport.overallAttendanceDistribution')}
                                    </Typography>
                                    <Box sx={{ height: 300 }}>
                                        {pieChartData.labels.length > 0 ? (
                                            <Pie data={pieChartData} options={chartOptions} />
                                        ) : (
                                            <Box sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                height: '100%',
                                                color: themeColors.text.secondary
                                            }}>
                                                <Typography variant="body2">
                                                    {t('attendance.todayOverallReport.noChartData')}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card sx={{ backgroundColor: themeColors.background.secondary }}>
                                <CardContent>
                                    <Typography variant="h6" sx={{ 
                                        mb: 2, 
                                        textAlign: 'center',
                                        color: themeColors.text.primary
                                    }}>
                                        {t('attendance.todayOverallReport.gradeWiseAttendance')}
                                    </Typography>
                                    <Box sx={{ height: 300 }}>
                                        {barChartData.labels.length > 0 ? (
                                            <Bar data={barChartData} options={chartOptions} />
                                        ) : (
                                            <Box sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                height: '100%',
                                                color: themeColors.text.secondary
                                            }}>
                                                <Typography variant="body2">
                                                    {t('attendance.todayOverallReport.noGradeChartData')}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Grade Data Table */}
                    <Card sx={{ backgroundColor: themeColors.background.secondary }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ 
                                mb: 2,
                                color: themeColors.text.primary
                            }}>
                                {t('attendance.todayOverallReport.gradeWiseDetails')}
                            </Typography>
                            <TableContainer component={Paper} sx={{ backgroundColor: themeColors.background.primary }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 600, color: themeColors.text.primary }}>{t('attendance.todayOverallReport.grade')}</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 600, color: themeColors.text.primary }}>{t('attendance.todayOverallReport.totalStudents')}</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 600, color: themeColors.text.primary }}>{t('attendance.todayOverallReport.present')}</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 600, color: themeColors.text.primary }}>{t('attendance.todayOverallReport.absent')}</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 600, color: themeColors.text.primary }}>{t('attendance.todayOverallReport.late')}</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 600, color: themeColors.text.primary }}>{t('attendance.todayOverallReport.notMarked')}</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 600, color: themeColors.text.primary }}>{t('attendance.todayOverallReport.attendancePercentage')}</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 600, color: themeColors.text.primary }}>{t('attendance.todayOverallReport.markedPercentage')}</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {(reportContent.gradeData || []).map((grade, index) => (
                                            <TableRow key={index}>
                                                <TableCell sx={{ color: themeColors.text.primary }}>
                                                    {grade.gradeName || grade.gradeId || t('attendance.todayOverallReport.gradeNumber', { number: index + 1 }) || t('attendance.todayOverallReport.notAvailable')}
                                                </TableCell>
                                                <TableCell align="center" sx={{ color: themeColors.text.primary }}>
                                                    {grade.totalRegistered || 0}
                                                </TableCell>
                                                <TableCell align="center" sx={{ color: '#4caf50', fontWeight: 600 }}>
                                                    {grade.presentStudents || 0}
                                                </TableCell>
                                                <TableCell align="center" sx={{ color: '#f44336', fontWeight: 600 }}>
                                                    {grade.absentStudents || 0}
                                                </TableCell>
                                                <TableCell align="center" sx={{ color: '#ff9800', fontWeight: 600 }}>
                                                    {grade.lateStudents || 0}
                                                </TableCell>
                                                <TableCell align="center" sx={{ color: '#6b7280', fontWeight: 600 }}>
                                                    {grade.notMarked || 0}
                                                </TableCell>
                                                <TableCell align="center" sx={{ color: themeColors.text.primary }}>
                                                    {grade.attendancePercentage || 0}%
                                                </TableCell>
                                                <TableCell align="center" sx={{ color: themeColors.text.primary }}>
                                                    {grade.markedPercentage || 0}%
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default TodayOverallReport;
