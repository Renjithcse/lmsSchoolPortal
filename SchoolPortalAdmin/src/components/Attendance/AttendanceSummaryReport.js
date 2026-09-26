import React, { useState, useEffect, useRef } from 'react';
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
    Alert
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
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '../../contexts/ThemeContext';
import { useGetAttendanceSummaryReportQuery } from '../../Redux/features/Attendance/attendanceSlice';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useTranslation } from 'react-i18next';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const AttendanceSummaryReport = ({ open, onClose, reportData }) => {
    const { t } = useTranslation();
    const { themeColors } = useTheme();
    const chartRef = useRef(null);

    // API call for real data
    const { data: apiData, isLoading, error } = useGetAttendanceSummaryReportQuery(
        {
            reportDate: reportData?.reportDate,
            summaryType: reportData?.summaryType,
            academicYear: reportData?.academicYear
        },
        {
            skip: !open || !reportData?.reportDate || !reportData?.summaryType
        }
    );

    const reportContent = apiData?.data;
    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        
        // Get chart images if available
        const chartImages = [];
        const chartElements = chartRef.current?.querySelectorAll('canvas');
        if (chartElements) {
            chartElements.forEach((canvas, index) => {
                const imageData = canvas.toDataURL('image/png');
                chartImages.push(imageData);
            });
        }

        printWindow.document.write(`
            <html>
                <head>
                    <title>${t('attendance.summaryReport.title')}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .stats { display: flex; justify-content: space-around; margin: 20px 0; }
                        .stat-card { border: 1px solid #ddd; padding: 15px; text-align: center; border-radius: 8px; }
                        .chart-container { margin: 20px 0; text-align: center; }
                        .chart-image { max-width: 100%; height: auto; margin: 10px 0; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f5f5f5; }
                        @media print {
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>${reportContent?.title || t('attendance.summaryReport.title')}</h1>
                        <p>${t('attendance.summaryReport.date')} ${reportContent?.date || t('attendance.summaryReport.notAvailable')}</p>
                        <p>${t('attendance.summaryReport.generatedOn')} ${new Date().toLocaleDateString()}</p>
                    </div>
                    
                    <div class="stats">
                        <div class="stat-card">
                            <h3>${t('attendance.summaryReport.totalStudents')}</h3>
                            <p>${reportContent?.totalStudents || 0}</p>
                        </div>
                        <div class="stat-card">
                            <h3>${t('attendance.summaryReport.present')}</h3>
                            <p>${reportContent?.presentStudents || 0}</p>
                        </div>
                        <div class="stat-card">
                            <h3>${t('attendance.summaryReport.absent')}</h3>
                            <p>${reportContent?.absentStudents || 0}</p>
                        </div>
                        <div class="stat-card">
                            <h3>${t('attendance.summaryReport.attendancePercentage')}</h3>
                            <p>${reportContent?.attendancePercentage || 0}%</p>
                        </div>
                    </div>

                    ${chartImages.length > 0 ? `
                        <div class="chart-container">
                            <h3>${t('attendance.summaryReport.attendanceCharts')}</h3>
                            ${chartImages.map((imageData, index) => `
                                <img src="${imageData}" alt="${t('attendance.summaryReport.chart')} ${index + 1}" class="chart-image" />
                            `).join('')}
                        </div>
                    ` : ''}

                    <div class="no-print" style="margin-top: 30px; text-align: center;">
                        <button onclick="window.print()">${t('attendance.summaryReport.printReport')}</button>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        
        // Wait for images to load before printing
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };

    const handleDownload = () => {
        if (!reportContent) return;

        // Show download options
        const downloadType = window.confirm(
            t('attendance.summaryReport.downloadFormat') + '\n\n' +
            t('attendance.summaryReport.clickOkForPdf') + '\n' +
            t('attendance.summaryReport.clickCancelForCsv')
        );

        if (downloadType) {
            handlePDFDownload();
        } else {
            handleCSVDownload();
        }
    };

    const handleCSVDownload = () => {
        if (!reportContent) return;

        // Create CSV content
        const csvContent = generateCSVContent();
        
        // Create and download CSV file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `attendance_report_${reportContent.date}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handlePDFDownload = async () => {
        if (!reportContent || !chartRef.current) return;

        try {
            // Create a temporary container for PDF content
            const pdfContainer = document.createElement('div');
            pdfContainer.style.position = 'absolute';
            pdfContainer.style.left = '-9999px';
            pdfContainer.style.top = '0';
            pdfContainer.style.width = '800px';
            pdfContainer.style.backgroundColor = 'white';
            pdfContainer.style.padding = '20px';
            pdfContainer.style.fontFamily = 'Arial, sans-serif';
            
            // Add report content to PDF container
            pdfContainer.innerHTML = `
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #333; margin-bottom: 10px;">${reportContent.title}</h1>
                    <p style="color: #666; margin: 5px 0;">${t('attendance.summaryReport.date')} ${reportContent.date}</p>
                    <p style="color: #666; margin: 5px 0;">${t('attendance.summaryReport.generatedOn')} ${new Date().toLocaleDateString()}</p>
                </div>
                
                <div style="margin-bottom: 30px;">
                    <h2 style="color: #333; border-bottom: 2px solid #333; padding-bottom: 10px;">${t('attendance.summaryReport.summaryStatistics')}</h2>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 20px;">
                        <div style="text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                            <h3 style="color: #333; margin: 0;">${t('attendance.summaryReport.totalStudents')}</h3>
                            <p style="font-size: 24px; font-weight: bold; color: #333; margin: 10px 0;">${reportContent.totalStudents}</p>
                        </div>
                        <div style="text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                            <h3 style="color: #333; margin: 0;">${t('attendance.summaryReport.present')}</h3>
                            <p style="font-size: 24px; font-weight: bold; color: #4caf50; margin: 10px 0;">${reportContent.presentStudents}</p>
                        </div>
                        <div style="text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                            <h3 style="color: #333; margin: 0;">${t('attendance.summaryReport.absent')}</h3>
                            <p style="font-size: 24px; font-weight: bold; color: #f44336; margin: 10px 0;">${reportContent.absentStudents}</p>
                        </div>
                        <div style="text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
                            <h3 style="color: #333; margin: 0;">${t('attendance.summaryReport.attendancePercentage')}</h3>
                            <p style="font-size: 24px; font-weight: bold; color: #333; margin: 10px 0;">${reportContent.attendancePercentage}%</p>
                        </div>
                    </div>
                </div>
            `;

            // Add grade-wise data if available
            if (reportContent.gradeData && reportContent.gradeData.length > 0) {
                let gradeTable = `
                    <div style="margin-bottom: 30px;">
                        <h2 style="color: #333; border-bottom: 2px solid #333; padding-bottom: 10px;">${t('attendance.summaryReport.gradeWiseBreakdown')}</h2>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                            <thead>
                                <tr style="background-color: #f5f5f5;">
                                    <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">${t('attendance.summaryReport.grade')}</th>
                                    <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">${t('attendance.summaryReport.total')}</th>
                                    <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">${t('attendance.summaryReport.present')}</th>
                                    <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">${t('attendance.summaryReport.absent')}</th>
                                    <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">${t('attendance.summaryReport.percentage')}</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                reportContent.gradeData.forEach(item => {
                    gradeTable += `
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 12px;">${item.grade}</td>
                            <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${item.total}</td>
                            <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #4caf50;">${item.present}</td>
                            <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #f44336;">${item.absent}</td>
                            <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${item.percentage}%</td>
                        </tr>
                    `;
                });
                
                gradeTable += `
                            </tbody>
                        </table>
                    </div>
                `;
                pdfContainer.innerHTML += gradeTable;
            }

            // Add gender-wise data if available
            if (reportContent.genderData && reportContent.genderData.length > 0) {
                let genderTable = `
                    <div style="margin-bottom: 30px;">
                        <h2 style="color: #333; border-bottom: 2px solid #333; padding-bottom: 10px;">${t('attendance.summaryReport.genderWiseBreakdown')}</h2>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                            <thead>
                                <tr style="background-color: #f5f5f5;">
                                    <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">${t('attendance.summaryReport.gender')}</th>
                                    <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">${t('attendance.summaryReport.total')}</th>
                                    <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">${t('attendance.summaryReport.present')}</th>
                                    <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">${t('attendance.summaryReport.absent')}</th>
                                    <th style="border: 1px solid #ddd; padding: 12px; text-align: center;">${t('attendance.summaryReport.percentage')}</th>
                                </tr>
                            </thead>
                            <tbody>
                `;
                
                reportContent.genderData.forEach(item => {
                    genderTable += `
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 12px;">${item.gender}</td>
                            <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${item.total}</td>
                            <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #4caf50;">${item.present}</td>
                            <td style="border: 1px solid #ddd; padding: 12px; text-align: center; color: #f44336;">${item.absent}</td>
                            <td style="border: 1px solid #ddd; padding: 12px; text-align: center;">${item.percentage}%</td>
                        </tr>
                    `;
                });
                
                genderTable += `
                            </tbody>
                        </table>
                    </div>
                `;
                pdfContainer.innerHTML += genderTable;
            }

            // Add to document temporarily
            document.body.appendChild(pdfContainer);

            // Convert to canvas
            const canvas = await html2canvas(pdfContainer, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff'
            });

            // Remove temporary container
            document.body.removeChild(pdfContainer);

            // Create PDF
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 210;
            const pageHeight = 295;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;

            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            // Download PDF
            pdf.save(`attendance_report_${reportContent.date}.pdf`);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert(t('attendance.summaryReport.pdfError'));
        }
    };

    const generateCSVContent = () => {
        if (!reportContent) return '';

        let csvContent = `${t('attendance.summaryReport.title')}\n`;
        csvContent += `${t('attendance.summaryReport.date')} ${reportContent.date}\n`;
        csvContent += `${t('attendance.summaryReport.generatedOn')} ${new Date().toLocaleDateString()}\n\n`;
        
        // Summary statistics
        csvContent += `${t('attendance.summaryReport.summaryStatistics')}\n`;
        csvContent += `${t('attendance.summaryReport.totalStudents')},${reportContent.totalStudents}\n`;
        csvContent += `${t('attendance.summaryReport.presentStudents')},${reportContent.presentStudents}\n`;
        csvContent += `${t('attendance.summaryReport.absentStudents')},${reportContent.absentStudents}\n`;
        csvContent += `${t('attendance.summaryReport.lateStudents')},${reportContent.lateStudents || 0}\n`;
        csvContent += `${t('attendance.summaryReport.attendancePercentage')},${reportContent.attendancePercentage}%\n\n`;

        // Grade-wise data
        if (reportContent.gradeData && reportContent.gradeData.length > 0) {
            csvContent += `${t('attendance.summaryReport.gradeWiseBreakdown')}\n`;
            csvContent += `${t('attendance.summaryReport.grade')},${t('attendance.summaryReport.total')},${t('attendance.summaryReport.present')},${t('attendance.summaryReport.absent')},${t('attendance.summaryReport.percentage')}\n`;
            reportContent.gradeData.forEach(item => {
                csvContent += `${item.grade},${item.total},${item.present},${item.absent},${item.percentage}%\n`;
            });
            csvContent += `\n`;
        }

        // Gender-wise data
        if (reportContent.genderData && reportContent.genderData.length > 0) {
            csvContent += `${t('attendance.summaryReport.genderWiseBreakdown')}\n`;
            csvContent += `${t('attendance.summaryReport.gender')},${t('attendance.summaryReport.total')},${t('attendance.summaryReport.present')},${t('attendance.summaryReport.absent')},${t('attendance.summaryReport.percentage')}\n`;
            reportContent.genderData.forEach(item => {
                csvContent += `${item.gender},${item.total},${item.present},${item.absent},${item.percentage}%\n`;
            });
            csvContent += `\n`;
        }

        return csvContent;
    };

    // Chart.js data preparation
    const prepareBarChartData = () => {
        if (!reportContent) {
            console.log('prepareBarChartData: No reportContent');
            return null;
        }
        
        // Determine which data to use based on summary type
        let data;
        let labelField;
        
        if (reportData?.summaryType === 'all-classes') {
            // For all-classes, use gradeData and show grade names
            data = reportContent.gradeData;
            labelField = 'grade';
        } else if (reportData?.summaryType === 'grade-wise') {
            // For grade-wise, use gradeData
            data = reportContent.gradeData;
            labelField = 'grade';
        } else if (reportData?.summaryType === 'gender-wise') {
            // For gender-wise, use genderData
            data = reportContent.genderData;
            labelField = 'gender';
        } else {
            // Fallback: try gradeData first, then genderData
            data = reportContent.gradeData || reportContent.genderData;
            labelField = reportContent.gradeData ? 'grade' : 'gender';
        }
        
        console.log('prepareBarChartData: data =', data);
        console.log('prepareBarChartData: summaryType =', reportData?.summaryType);
        console.log('prepareBarChartData: labelField =', labelField);
        
        if (!data || data.length === 0) {
            console.log('prepareBarChartData: No data available');
            return null;
        }

        const labels = data.map(item => {
            const label = item[labelField];
            console.log('prepareBarChartData: item =', item, 'labelField =', labelField, 'label =', label);
            return label;
        });
        const presentData = data.map(item => {
            console.log('prepareBarChartData: present value =', item.present, 'from item =', item);
            return item.present;
        });
        const absentData = data.map(item => {
            console.log('prepareBarChartData: absent value =', item.absent, 'from item =', item);
            return item.absent;
        });

        const chartData = {
            labels,
            datasets: [
                {
                    label: t('attendance.summaryReport.present'),
                    data: presentData,
                    backgroundColor: '#4caf50',
                    borderColor: '#4caf50',
                    borderWidth: 1,
                },
                {
                    label: t('attendance.summaryReport.absent'),
                    data: absentData,
                    backgroundColor: '#f44336',
                    borderColor: '#f44336',
                    borderWidth: 1,
                }
            ]
        };

        console.log('prepareBarChartData: chartData =', chartData);
        console.log('prepareBarChartData: labels length =', labels.length);
        console.log('prepareBarChartData: presentData =', presentData);
        console.log('prepareBarChartData: absentData =', absentData);
        
        // Validate that we have valid data
        if (labels.length === 0 || presentData.length === 0 || absentData.length === 0) {
            console.log('prepareBarChartData: Invalid data - returning null');
            return null;
        }
        
        return chartData;
    };

    const preparePieChartData = () => {
        if (!reportContent) return null;

        return {
            labels: [t('attendance.summaryReport.present'), t('attendance.summaryReport.absent')],
            datasets: [
                {
                    data: [reportContent.presentStudents, reportContent.absentStudents],
                    backgroundColor: ['#4caf50', '#f44336'],
                    borderColor: ['#4caf50', '#f44336'],
                    borderWidth: 1,
                }
            ]
        };
    };

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: themeColors.text.primary,
                    font: {
                        size: 12
                    }
                }
            },
            title: {
                display: true,
                text: reportData?.summaryType === 'all-classes' ? t('attendance.summaryReport.gradeWiseAttendance') : 
                      reportData?.summaryType === 'grade-wise' ? t('attendance.summaryReport.gradeWiseAttendance') :
                      reportData?.summaryType === 'gender-wise' ? t('attendance.summaryReport.genderWiseAttendance') : t('attendance.summaryReport.attendanceOverview'),
                color: themeColors.text.primary,
                font: {
                    size: 14
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
                beginAtZero: true,
                ticks: {
                    color: themeColors.text.secondary
                },
                grid: {
                    color: themeColors.border.primary
                }
            },
        },
    };

    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: themeColors.text.primary,
                    font: {
                        size: 12
                    }
                }
            },
            title: {
                display: true,
                text: t('attendance.summaryReport.attendanceDistribution'),
                color: themeColors.text.primary,
                font: {
                    size: 14
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
    };

    if (!open) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
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
                    {reportContent?.title || t('attendance.summaryReport.title')}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        startIcon={<PrintIcon />}
                        onClick={handlePrint}
                        variant="outlined"
                        size="small"
                        sx={{ color: themeColors.primary, borderColor: themeColors.primary }}
                    >
                        {t('attendance.summaryReport.print')}
                    </Button>
                    <Button
                        startIcon={<DownloadIcon />}
                        onClick={handleDownload}
                        variant="outlined"
                        size="small"
                        sx={{ color: themeColors.primary, borderColor: themeColors.primary }}
                    >
                        {t('attendance.summaryReport.download')}
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
                            {t('attendance.summaryReport.generatingReport')}
                        </Typography>
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        {error?.data?.message || t('attendance.summaryReport.generateError')}
                    </Alert>
                ) : reportContent ? (
                    <Box ref={chartRef}>
                        {/* Header Info */}
                        <Box sx={{ mb: 3, textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ color: themeColors.text.primary, mb: 1 }}>
                                {t('attendance.summaryReport.date')} {reportContent.date}
                            </Typography>
                            <Chip 
                                label={t('attendance.summaryReport.overallAttendance', { percentage: reportContent.attendancePercentage })}
                                color={reportContent.attendancePercentage >= 90 ? 'success' : 'warning'}
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
                                            {reportContent.totalStudents}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                            {t('attendance.summaryReport.totalStudents')}
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
                                            {reportContent.presentStudents}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                            {t('attendance.summaryReport.present')}
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
                                            {reportContent.absentStudents}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                            {t('attendance.summaryReport.absent')}
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
                                            {reportContent.attendancePercentage}%
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                            {t('attendance.summaryReport.attendanceRate')}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* Charts */}
                        <Grid container spacing={3}>
                            {/* Bar Chart */}
                            <Grid item xs={12} md={6}>
                                <Paper sx={{ 
                                    p: 2, 
                                    background: themeColors.background.secondary,
                                    border: `1px solid ${themeColors.border.primary}`
                                }}>
                                    <Box sx={{ height: 300 }}>
                                        {prepareBarChartData() ? (
                                            <Bar data={prepareBarChartData()} options={barChartOptions} />
                                        ) : (
                                            <Box sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                height: '100%',
                                                color: themeColors.text.secondary
                                            }}>
                                                <Typography variant="body2">
                                                    {t('attendance.summaryReport.noChartData')}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Paper>
                            </Grid>

                            {/* Pie Chart */}
                            <Grid item xs={12} md={6}>
                                <Paper sx={{ 
                                    p: 2, 
                                    background: themeColors.background.secondary,
                                    border: `1px solid ${themeColors.border.primary}`
                                }}>
                                    <Box sx={{ height: 300 }}>
                                        {preparePieChartData() ? (
                                            <Pie data={preparePieChartData()} options={pieChartOptions} />
                                        ) : (
                                            <Box sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                height: '100%',
                                                color: themeColors.text.secondary
                                            }}>
                                                <Typography variant="body2">
                                                    {t('attendance.summaryReport.noChartData')}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Box>
                ) : (
                    <Alert severity="error">
                        {t('attendance.summaryReport.generateError')}
                    </Alert>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 3, borderTop: `1px solid ${themeColors.border.primary}` }}>
                <Button onClick={onClose} variant="outlined">
                    {t('attendance.summaryReport.close')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AttendanceSummaryReport;
