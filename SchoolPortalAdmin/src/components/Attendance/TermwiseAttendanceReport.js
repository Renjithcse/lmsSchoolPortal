import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    IconButton,
    Tooltip,
    Collapse
} from '@mui/material';
import { useTheme } from '../../contexts/ThemeContext';
import { useGetTermwiseAttendanceReportQuery } from '../../Redux/features/Attendance/attendanceSlice';
import moment from 'moment/moment';
import { useTranslation } from 'react-i18next';

// Icons
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import TimelineIcon from '@mui/icons-material/Timeline';
import SchoolIcon from '@mui/icons-material/School';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ExpandLess from '@mui/icons-material/ExpandLess';

// Chart.js imports
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip as ChartTooltip,
    Legend,
    Filler
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    ChartTooltip,
    Legend,
    Filler
);

const TermwiseAttendanceReport = ({ open, onClose, reportData }) => {
    const { t } = useTranslation();
    const { themeColors } = useTheme();
    const [report, setReport] = useState(null);
    const [termInfo, setTermInfo] = useState(null);
    
    // Interactive features state
    const [viewType, setViewType] = useState('overview');
    const [sortBy, setSortBy] = useState('attendance');
    const [searchTerm, setSearchTerm] = useState('');
    const [advancedView, setAdvancedView] = useState(false);
    const [showTopPerformers, setShowTopPerformers] = useState(true);
    const [showConcerns, setShowConcerns] = useState(true);
    const [showAllRecommendations, setShowAllRecommendations] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedConcern, setSelectedConcern] = useState(null);
    const [selectedRecommendation, setSelectedRecommendation] = useState(null);
    
    // Fallback colors if theme is not ready
    const colors = themeColors || {
        primary: '#1976d2',
        secondary: '#dc004e',
        success: '#4caf50',
        error: '#f44336',
        warning: '#ff9800',
        info: '#2196f3',
        accent: '#9c27b0',
        text: {
            primary: '#000000',
            secondary: '#666666'
        },
        background: {
            primary: '#ffffff',
            secondary: '#f5f5f5'
        },
        border: {
            primary: '#e0e0e0'
        }
    };
    
    console.log('Theme context:', { themeColors, hasTheme: !!themeColors });
    console.log('Fallback colors:', colors);

    // Safe chart wrapper to handle rendering errors
    const SafeChart = ({ children, fallback = null }) => {
        try {
            return children;
        } catch (error) {
            console.error('Chart rendering error:', error);
            return fallback || (
                <Box sx={{ p: 2, textAlign: 'center', color: colors.text.secondary }}>
                    <Typography variant="body2">{t('attendance.termwiseReport.chartError')}</Typography>
                </Box>
            );
        }
    };

    // Redux hooks for API calls
    const { data: reportResponse, isLoading, error } = useGetTermwiseAttendanceReportQuery(
        {
            academicYear: reportData?.academicYear,
            term: reportData?.term,
            grade: reportData?.grade_id,
            gender: reportData?.gender,
            section: reportData?.section
        },
        {
            skip: !open || !reportData?.academicYear || !reportData?.term || !reportData?.grade_id
        }
    );

    useEffect(() => {
        if (open && reportData && reportResponse) {
            processReportData();
        }
    }, [open, reportData, reportResponse]);

    const processReportData = () => {
        if (!reportResponse) return;

        try {
            console.log('Processing report response:', reportResponse);
            
            // The backend now provides all the data in one response
            const reportData = reportResponse?.data?.data || reportResponse?.data;
            
            console.log('Extracted report data:', reportData);
            
            if (!reportData) {
                throw new Error('No report data received');
            }

            // Set the report directly since backend provides processed data
            const processedReport = {
                ...reportData,
                filters: reportData,
                generatedAt: new Date().toISOString()
            };
            
            console.log('Setting report state:', processedReport);
            setReport(processedReport);

            // Set term info for display purposes
            if (reportData.termInfo) {
                const termInfoData = {
                    term: reportData.termInfo.term,
                    startDate: reportData.termInfo.startDate,
                    endDate: reportData.termInfo.endDate,
                    academicYear: reportData.termInfo.academicYear
                };
                
                console.log('Setting term info:', termInfoData);
                setTermInfo(termInfoData);
            } else {
                console.warn('No termInfo in report data');
            }

        } catch (err) {
            console.error('Error processing report data:', err);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        // Implement CSV/PDF download functionality
        console.log('Download functionality to be implemented');
    };

    const getAttendanceColor = (percentage) => {
        if (percentage >= 90) return colors.success;
        if (percentage >= 75) return colors.warning;
        return colors.error;
    };

    const getAttendanceIcon = (percentage) => {
        if (percentage >= 90) return <CheckCircleIcon />;
        if (percentage >= 75) return <ScheduleIcon />;
        return <CancelIcon />;
    };

    // Interactive feature handlers
    const handleMetricClick = (metricType) => {
        console.log(`Metric clicked: ${metricType}`);
        // Add specific logic for each metric type
        switch (metricType) {
            case 'consistency':
                alert(t('attendance.termwiseReport.consistencyAlert', { score: report?.analytics?.insights?.consistencyScore || 0 }));
                break;
            case 'performance':
                alert(t('attendance.termwiseReport.performanceAlert', { gap: report?.analytics?.insights?.attendanceGap || 0 }));
                break;
            case 'days':
                alert(t('attendance.termwiseReport.daysAlert', { days: report?.analytics?.trends?.totalDates || 0 }));
                break;
            case 'trend':
                alert(t('attendance.termwiseReport.trendAlert', { trend: report?.analytics?.trends?.overall || t('attendance.termwiseReport.stable') }));
                break;
            default:
                break;
        }
    };

    const handleStudentClick = (student) => {
        setSelectedStudent(student);
        alert(t('attendance.termwiseReport.studentDetailsAlert', { 
            name: student.name || t('attendance.termwiseReport.notAvailable'),
            section: student.section || t('attendance.termwiseReport.notAvailable'),
            gender: student.gender || t('attendance.termwiseReport.notAvailable'),
            attendance: student.attendancePercentage || 0
        }));
    };

    const handleConcernClick = (concern) => {
        setSelectedConcern(concern);
        alert(t('attendance.termwiseReport.concernDetailsAlert', {
            issue: concern.issue || t('attendance.termwiseReport.notAvailable'),
            recommendation: concern.recommendation || t('attendance.termwiseReport.notAvailable'),
            priority: concern.priority || t('attendance.termwiseReport.medium')
        }));
    };

    const handleRecommendationClick = (rec) => {
        setSelectedRecommendation(rec);
        alert(t('attendance.termwiseReport.recommendationDetailsAlert', {
            category: rec.category || t('attendance.termwiseReport.notAvailable'),
            suggestion: rec.suggestion || t('attendance.termwiseReport.notAvailable'),
            priority: rec.priority || t('attendance.termwiseReport.medium')
        }));
    };

    const toggleAdvancedView = () => {
        setAdvancedView(!advancedView);
    };

    const filteredStudents = report?.students?.filter(student => {
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            return (
                (student.name && student.name.toLowerCase().includes(searchLower)) ||
                (student.section && student.section.toLowerCase().includes(searchLower)) ||
                (student.gender && student.gender.toLowerCase().includes(searchLower))
            );
        }
        return true;
    }) || [];

    const sortedStudents = [...filteredStudents].sort((a, b) => {
        switch (sortBy) {
            case 'attendance':
                return (b.attendancePercentage || 0) - (a.attendancePercentage || 0);
            case 'name':
                return (a.name || '').localeCompare(b.name || '');
            case 'section':
                return (a.section || '').localeCompare(b.section || '');
            case 'gender':
                return (a.gender || '').localeCompare(b.gender || '');
            default:
                return 0;
        }
    });

    if (!open) return null;

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2
            }}
        >
            <Paper
                sx={{
                    width: '100%',
                    maxWidth: '1200px',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    backgroundColor: colors.background.primary,
                    border: `1px solid ${colors.border.primary}`,
                    borderRadius: 2
                }}
            >
                {/* Header */}
                <Box sx={{ 
                    p: 3, 
                    borderBottom: `1px solid ${colors.border.primary}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <Box>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: colors.text.primary }}>
                            {t('attendance.termwiseReport.title')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: colors.text.secondary, mt: 1 }}>
                            {reportData?.term} • {termInfo?.startDate ? moment(termInfo.startDate).format('MMM DD, YYYY') : t('attendance.termwiseReport.loading')} - {termInfo?.endDate ? moment(termInfo.endDate).format('MMM DD, YYYY') : t('attendance.termwiseReport.loading')}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title={t('attendance.termwiseReport.printReport')}>
                            <IconButton onClick={handlePrint} sx={{ color: colors.primary }}>
                                <PrintIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={t('attendance.termwiseReport.downloadReport')}>
                            <IconButton onClick={handleDownload} sx={{ color: colors.primary }}>
                                <DownloadIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={t('attendance.termwiseReport.close')}>
                            <IconButton onClick={onClose} sx={{ color: colors.text.secondary }}>
                                <CloseIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Content */}
                <Box sx={{ p: 3 }}>
                    {isLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : error ? (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error?.data?.message || t('attendance.termwiseReport.loadError')}
                        </Alert>
                                         ) : report ? (
                         <>
                             {console.log('Rendering report with data:', report)}
                             {console.log('Report summary:', report?.summary)}
                             {console.log('Report termInfo:', report?.termInfo)}
                             {console.log('Report students:', report?.students)}
                             {console.log('Term info state:', termInfo)}
                             {/* Summary Cards */}
                            <Grid container spacing={3} sx={{ mb: 4 }}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card sx={{ 
                                        backgroundColor: colors.background.secondary,
                                        border: `1px solid ${colors.border.primary}`
                                    }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                <SchoolIcon sx={{ color: colors.primary, mr: 1 }} />
                                                <Typography variant="h6" sx={{ color: colors.text.primary }}>
                                                    {t('attendance.termwiseReport.totalStudents')}
                                                </Typography>
                                            </Box>
                                                                                         <Typography variant="h4" fontWeight="bold" sx={{ color: colors.primary }}>
                                                 {report.summary?.totalStudents || 0}
                                             </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <Card sx={{ 
                                        backgroundColor: colors.background.secondary,
                                        border: `1px solid ${colors.border.primary}`
                                    }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                <CalendarTodayIcon sx={{ color: colors.success, mr: 1 }} />
                                                <Typography variant="h6" sx={{ color: colors.text.primary }}>
                                                    {t('attendance.termwiseReport.totalDays')}
                                                </Typography>
                                            </Box>
                                                                                         <Typography variant="h4" fontWeight="bold" sx={{ color: colors.success }}>
                                                 {report.termInfo?.totalDays || 0}
                                             </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <Card sx={{ 
                                        backgroundColor: colors.background.secondary,
                                        border: `1px solid ${colors.border.primary}`
                                    }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                <TrendingUpIcon sx={{ color: colors.warning, mr: 1 }} />
                                                <Typography variant="h6" sx={{ color: colors.text.primary }}>
                                                    {t('attendance.termwiseReport.overallAttendance')}
                                                </Typography>
                                            </Box>
                                                                                         <Typography variant="h4" fontWeight="bold" sx={{ color: colors.warning }}>
                                                 {report.summary?.overallAttendancePercentage || 0}%
                                             </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                <Grid item xs={12} sm={6} md={3}>
                                    <Card sx={{ 
                                        backgroundColor: colors.background.secondary,
                                        border: `1px solid ${colors.border.primary}`
                                    }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                <TimelineIcon sx={{ color: colors.accent, mr: 1 }} />
                                                <Typography variant="h6" sx={{ color: colors.text.primary }}>
                                                    {t('attendance.termwiseReport.termPeriod')}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                                                                                 {report.termInfo?.startDate ? moment(report.termInfo.startDate).format('MMM DD') : t('attendance.termwiseReport.loading')} - {report.termInfo?.endDate ? moment(report.termInfo.endDate).format('MMM DD, YYYY') : t('attendance.termwiseReport.loading')}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Detailed Statistics */}
                            <Card sx={{ mb: 4, backgroundColor: colors.background.secondary }}>
                                <CardContent>
                                    <Typography variant="h6" fontWeight="bold" sx={{ color: colors.text.primary, mb: 2 }}>
                                        {t('attendance.termwiseReport.termStatistics')}
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={4}>
                                            <Box sx={{ textAlign: 'center', p: 2 }}>
                                                                                                 <Typography variant="h4" fontWeight="bold" sx={{ color: colors.success }}>
                                                     {report.summary?.totalPresentDays || 0}
                                                 </Typography>
                                                <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                                    {t('attendance.termwiseReport.presentDays')}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <Box sx={{ textAlign: 'center', p: 2 }}>
                                                                                                 <Typography variant="h4" fontWeight="bold" sx={{ color: colors.error }}>
                                                     {report.summary?.totalAbsentDays || 0}
                                                 </Typography>
                                                <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                                    {t('attendance.termwiseReport.absentDays')}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <Box sx={{ textAlign: 'center', p: 2 }}>
                                                                                                 <Typography variant="h4" fontWeight="bold" sx={{ color: colors.warning }}>
                                                     {report.summary?.totalLateDays || 0}
                                                 </Typography>
                                                <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                                    {t('attendance.termwiseReport.lateDays')}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                                             </CardContent>
                             </Card>

                             {/* Analytics Dashboard */}
                             {report?.analytics && Object.keys(report.analytics).length > 0 ? (
                                 <>
                                     {/* Performance Categories */}
                                     <Card sx={{ mb: 4, backgroundColor: colors.background.secondary }}>
                                         <CardContent>
                                             <Typography variant="h6" fontWeight="bold" sx={{ color: colors.text.primary, mb: 2 }}>
                                                 {t('attendance.termwiseReport.performanceBreakdown')}
                                             </Typography>
                                             <Grid container spacing={2}>
                                                 <Grid item xs={12} sm={3}>
                                                     <Box sx={{ textAlign: 'center', p: 2, border: `2px solid ${colors.success}`, borderRadius: 2 }}>
                                                         <Typography variant="h4" fontWeight="bold" sx={{ color: colors.success }}>
                                                             {report.analytics.performanceBreakdown?.excellent?.count || 0}
                                                         </Typography>
                                                         <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                                             {t('attendance.termwiseReport.excellent')}
                                                         </Typography>
                                                     </Box>
                                                 </Grid>
                                                 <Grid item xs={12} sm={3}>
                                                     <Box sx={{ textAlign: 'center', p: 2, border: `2px solid ${colors.info || '#2196f3'}`, borderRadius: 2 }}>
                                                         <Typography variant="h4" fontWeight="bold" sx={{ color: colors.info || '#2196f3' }}>
                                                             {report.analytics.performanceBreakdown?.good?.count || 0}
                                                         </Typography>
                                                         <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                                             {t('attendance.termwiseReport.good')}
                                                         </Typography>
                                                     </Box>
                                                 </Grid>
                                                 <Grid item xs={12} sm={3}>
                                                     <Box sx={{ textAlign: 'center', p: 2, border: `2px solid ${colors.warning}`, borderRadius: 2 }}>
                                                         <Typography variant="h4" fontWeight="bold" sx={{ color: colors.warning }}>
                                                             {report.analytics.performanceBreakdown?.average?.count || 0}
                                                         </Typography>
                                                         <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                                             {t('attendance.termwiseReport.average')}
                                                         </Typography>
                                                     </Box>
                                                 </Grid>
                                                 <Grid item xs={12} sm={3}>
                                                     <Box sx={{ textAlign: 'center', p: 2, border: `2px solid ${colors.error}`, borderRadius: 2 }}>
                                                         <Typography variant="h4" fontWeight="bold" sx={{ color: colors.error }}>
                                                             {report.analytics.performanceBreakdown?.needsImprovement?.count || 0}
                                                         </Typography>
                                                         <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                                             {t('attendance.termwiseReport.needsImprovement')}
                                                         </Typography>
                                                     </Box>
                                                 </Grid>
                                             </Grid>
                                         </CardContent>
                                     </Card>

                                     {/* Gender and Section Analysis */}
                                     <Grid container spacing={3} sx={{ mb: 4 }}>
                                         {/* Gender Analysis */}
                                         <Grid item xs={12} md={6}>
                                             <Card sx={{ backgroundColor: colors.background.secondary }}>
                                                 <CardContent>
                                                     <Typography variant="h6" fontWeight="bold" sx={{ color: colors.text.primary, mb: 2 }}>
                                                         {t('attendance.termwiseReport.genderPerformanceComparison')}
                                                     </Typography>
                                                     {Object.entries(report.analytics.genderAnalysis || {}).map(([gender, stats]) => (
                                                         <Box key={gender} sx={{ mb: 2, p: 2, border: `1px solid ${colors.border.primary}`, borderRadius: 1 }}>
                                                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                                 <Typography variant="subtitle1" sx={{ color: colors.text.primary, textTransform: 'capitalize' }}>
                                                                     {gender}
                                                                 </Typography>
                                                                 <Typography variant="h6" fontWeight="bold" sx={{ color: colors.primary }}>
                                                                     {stats.averageAttendance}%
                                                                 </Typography>
                                                             </Box>
                                                             <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                                                 {t('attendance.termwiseReport.statsSummary', { count: stats.count, present: stats.totalPresentDays, absent: stats.totalAbsentDays, late: stats.totalLateDays })}
                                                             </Typography>
                                                         </Box>
                                                     ))}
                                                 </CardContent>
                                             </Card>
                                         </Grid>

                                         {/* Section Analysis */}
                                         <Grid item xs={12} md={6}>
                                             <Card sx={{ backgroundColor: colors.background.secondary }}>
                                                 <CardContent>
                                                     <Typography variant="h6" fontWeight="bold" sx={{ color: colors.text.primary, mb: 2 }}>
                                                         {t('attendance.termwiseReport.sectionPerformanceComparison')}
                                                     </Typography>
                                                     {Object.entries(report.analytics.sectionAnalysis || {}).map(([section, stats]) => (
                                                         <Box key={section} sx={{ mb: 2, p: 2, border: `1px solid ${colors.border.primary}`, borderRadius: 1 }}>
                                                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                                 <Typography variant="subtitle1" sx={{ color: colors.text.primary }}>
                                                                     {section}
                                                                 </Typography>
                                                                 <Typography variant="h6" fontWeight="bold" sx={{ color: colors.primary }}>
                                                                     {stats.averageAttendance}%
                                                                 </Typography>
                                                             </Box>
                                                             <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                                                 {t('attendance.termwiseReport.statsSummary', { count: stats.count, present: stats.totalPresentDays, absent: stats.totalAbsentDays, late: stats.totalLateDays })}
                                                             </Typography>
                                                         </Box>
                                                     ))}
                                                 </CardContent>
                                             </Card>
                                         </Grid>
                                     </Grid>

                                     {/* Highlights and Insights */}
                                     <Grid container spacing={3} sx={{ mb: 4 }}>
                                         {/* Top Performers */}
                                         <Grid item xs={12} md={6}>
                                             <Card sx={{ backgroundColor: colors.background.secondary }}>
                                                 <CardContent>
                                                     <Typography variant="h6" fontWeight="bold" sx={{ color: colors.text.primary, mb: 2 }}>
                                                         {t('attendance.termwiseReport.topPerformers')}
                                                     </Typography>
                                                     {report.analytics.highlights?.topPerformers?.map((student, index) => (
                                                         <Box key={index} sx={{ mb: 2, p: 2, border: `1px solid ${colors.success}`, borderRadius: 1, backgroundColor: `${colors.success}10` }}>
                                                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                 <Typography variant="subtitle1" sx={{ color: colors.text.primary, fontWeight: 'bold' }}>
                                                                     {student.name}
                                                                 </Typography>
                                                                 <Typography variant="h6" fontWeight="bold" sx={{ color: colors.success }}>
                                                                     {student.percentage}%
                                                                 </Typography>
                                                             </Box>
                                                             <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                                                 {t('attendance.termwiseReport.presentDaysCount', { days: student.presentDays })}
                                                             </Typography>
                                                         </Box>
                                                     ))}
                                                 </CardContent>
                                             </Card>
                                         </Grid>

                                         {/* Areas of Concern */}
                                         <Grid item xs={12} md={6}>
                                             <Card sx={{ backgroundColor: colors.background.secondary }}>
                                                                                                          <CardContent>
                                                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                                 <Typography variant="h6" fontWeight="bold" sx={{ color: colors.text.primary }}>
                                                                     ⚠️ Areas of Concern
                                                                 </Typography>
                                                                 <IconButton 
                                                                     onClick={() => setShowConcerns(!showConcerns)}
                                                                     sx={{ color: colors.error }}
                                                                 >
                                                                     {showConcerns ? <ExpandLess /> : <ExpandMore />}
                                                                 </IconButton>
                                                             </Box>
                                                     {report.analytics.highlights?.areasOfConcern?.map((student, index) => (
                                                         <Box key={index} sx={{ mb: 2, p: 2, border: `1px solid ${colors.error}`, borderRadius: 1, backgroundColor: `${colors.error}10` }}>
                                                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                 <Typography variant="subtitle1" sx={{ color: colors.text.primary, fontWeight: 'bold' }}>
                                                                     {student.name}
                                                                 </Typography>
                                                                 <Typography variant="h6" fontWeight="bold" sx={{ color: colors.error }}>
                                                                     {student.percentage}%
                                                                 </Typography>
                                                             </Box>
                                                             <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                                                 {t('attendance.termwiseReport.absentDaysReason', { days: student.absentDays, reason: student.reason })}
                                                             </Typography>
                                                         </Box>
                                                     ))}
                                                 </CardContent>
                                             </Card>
                                         </Grid>
                                     </Grid>

                                     {/* Trends and Insights */}
                                     <Grid container spacing={3} sx={{ mb: 4 }}>
                                         {/* Trend Analysis */}
                                         <Grid item xs={12} md={6}>
                                             <Card sx={{ backgroundColor: colors.background.secondary }}>
                                                 <CardContent>
                                                     <Typography variant="h6" fontWeight="bold" sx={{ color: colors.text.primary, mb: 2 }}>
                                                         {t('attendance.termwiseReport.trendAnalysis')}
                                                     </Typography>
                                                     <Box sx={{ textAlign: 'center', p: 3 }}>
                                                         <Typography variant="h3" fontWeight="bold" sx={{ 
                                                             color: report.analytics.trends?.overall === 'improving' ? colors.success :
                                                                    report.analytics.trends?.overall === 'declining' ? colors.error : colors.warning
                                                         }}>
                                                             {report.analytics.trends?.overall === 'improving' ? '↗️' : 
                                                              report.analytics.trends?.overall === 'declining' ? '↘️' : '→'}
                                                         </Typography>
                                                         <Typography variant="h5" fontWeight="bold" sx={{ color: colors.text.primary, textTransform: 'capitalize' }}>
                                                             {report.analytics.trends?.overall || 'stable'}
                                                         </Typography>
                                                         <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                                             {t('attendance.termwiseReport.basedOnDays', { days: report.analytics.trends?.totalDates || 0 })}
                                                         </Typography>
                                                     </Box>
                                                 </CardContent>
                                             </Card>
                                         </Grid>

                                         {/* Key Insights */}
                                         <Grid item xs={12} md={6}>
                                             <Card sx={{ backgroundColor: colors.background.secondary }}>
                                                 <CardContent>
                                                     <Typography variant="h6" fontWeight="bold" sx={{ color: colors.text.primary, mb: 2 }}>
                                                         {t('attendance.termwiseReport.keyInsights')}
                                                     </Typography>
                                                     <Box sx={{ p: 2 }}>
                                                         <Box sx={{ mb: 2, p: 2, border: `1px solid ${colors.primary}`, borderRadius: 1 }}>
                                                             <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                                                 <strong>{t('attendance.termwiseReport.bestSection')}</strong> {report.analytics.highlights?.bestSection || t('attendance.termwiseReport.notAvailable')}
                                                             </Typography>
                                                         </Box>
                                                         <Box sx={{ mb: 2, p: 2, border: `1px solid ${colors.accent}`, borderRadius: 1 }}>
                                                             <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                                                 <strong>{t('attendance.termwiseReport.bestGender')}</strong> {report.analytics.highlights?.bestGender || t('attendance.termwiseReport.notAvailable')}
                                                             </Typography>
                                                         </Box>
                                                         <Box sx={{ mb: 2, p: 2, border: `1px solid ${colors.warning}`, borderRadius: 1 }}>
                                                             <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                                                 <strong>{t('attendance.termwiseReport.attendanceGap')}</strong> {report.analytics.insights?.attendanceGap || 0}%
                                                             </Typography>
                                                         </Box>
                                                         <Box sx={{ p: 2, border: `1px solid ${colors.success}`, borderRadius: 1 }}>
                                                             <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                                                 <strong>{t('attendance.termwiseReport.consistencyScore')}</strong> {report.analytics.insights?.consistencyScore || 0}%
                                                             </Typography>
                                                         </Box>
                                                     </Box>
                                                 </CardContent>
                                             </Card>
                                         </Grid>
                                     </Grid>

                                     {/* Smart Recommendations */}
                                     <Card sx={{ mb: 4, backgroundColor: colors.background.secondary }}>
                                         <CardContent>
                                             <Typography variant="h6" fontWeight="bold" sx={{ color: colors.text.primary, mb: 2 }}>
                                                 {t('attendance.termwiseReport.smartRecommendations')}
                                             </Typography>
                                             <Grid container spacing={2}>
                                                 {report.analytics.recommendations?.map((recommendation, index) => (
                                                     <Grid item xs={12} key={index}>
                                                         <Box sx={{ 
                                                             p: 2, 
                                                             border: `2px solid ${
                                                                 recommendation.type === 'critical' ? colors.error :
                                                                 recommendation.type === 'warning' ? colors.warning :
                                                                 recommendation.type === 'info' ? colors.info || '#2196f3' :
                                                                 colors.success
                                                             }`, 
                                                             borderRadius: 2,
                                                             backgroundColor: `${colors.background.primary}`
                                                         }}>
                                                             <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                                 <Typography variant="subtitle1" fontWeight="bold" sx={{ 
                                                                     color: recommendation.type === 'critical' ? colors.error :
                                                                            recommendation.type === 'warning' ? colors.warning :
                                                                            recommendation.type === 'info' ? colors.info || '#2196f3' :
                                                                            colors.success,
                                                                     textTransform: 'capitalize',
                                                                     mr: 1
                                                                 }}>
                                                                     {recommendation.type}:
                                                                 </Typography>
                                                                 <Typography variant="subtitle1" sx={{ color: colors.text.primary }}>
                                                                     {recommendation.message}
                                                                 </Typography>
                                                             </Box>
                                                             <Typography variant="body2" sx={{ color: colors.text.secondary, fontStyle: 'italic' }}>
                                                                 {recommendation.action}
                                                             </Typography>
                                                         </Box>
                                                     </Grid>
                                                 ))}
                                             </Grid>
                                         </CardContent>
                                     </Card>

                                     {/* Simple Chart Analytics Overview */}
                                     <Card sx={{ mb: 4, backgroundColor: colors.background.primary }}>
                                         <CardContent>
                                             <Typography variant="h6" fontWeight="bold" sx={{ color: colors.text.primary, mb: 2 }}>
                                                 {t('attendance.termwiseReport.chartAnalyticsOverview')}
                                             </Typography>
                                             <Grid container spacing={2}>
                                                 <Grid item xs={12} sm={3}>
                                                     <Box sx={{ textAlign: 'center', p: 2 }}>
                                                         <Typography variant="h5" fontWeight="bold" sx={{ color: colors.success }}>
                                                             {report.analytics.insights?.consistencyScore || 0}%
                                                         </Typography>
                                                         <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                                             {t('attendance.termwiseReport.consistencyScore')}
                                                         </Typography>
                                                     </Box>
                                                 </Grid>
                                                 <Grid item xs={12} sm={3}>
                                                     <Box sx={{ textAlign: 'center', p: 2 }}>
                                                         <Typography variant="h5" fontWeight="bold" sx={{ color: colors.primary }}>
                                                             {report.analytics.trends?.totalDates || 0}
                                                         </Typography>
                                                         <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                                             {t('attendance.termwiseReport.daysAnalyzed')}
                                                         </Typography>
                                                     </Box>
                                                 </Grid>
                                                 <Grid item xs={12} sm={3}>
                                                     <Box sx={{ textAlign: 'center', p: 2 }}>
                                                         <Typography variant="h5" fontWeight="bold" sx={{ 
                                                             color: report.analytics.trends?.overall === 'improving' ? colors.success :
                                                                    report.analytics.trends?.overall === 'declining' ? colors.error : colors.warning
                                                         }}>
                                                             {report.analytics.trends?.overall || t('attendance.termwiseReport.stable')}
                                                         </Typography>
                                                         <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                                             {t('attendance.termwiseReport.trendDirection')}
                                                         </Typography>
                                                     </Box>
                                                 </Grid>
                                                 <Grid item xs={12} sm={3}>
                                                     <Box sx={{ textAlign: 'center', p: 2 }}>
                                                         <Typography variant="h5" fontWeight="bold" sx={{ color: colors.accent || colors.info || '#2196f3' }}>
                                                             {report.analytics.insights?.attendanceGap || 0}%
                                                         </Typography>
                                                         <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                                             {t('attendance.termwiseReport.performanceGap')}
                                                         </Typography>
                                                     </Box>
                                                 </Grid>
                                             </Grid>
                                         </CardContent>
                                     </Card>

                                                                          {/* Simple Performance Distribution Pie Chart */}
                                     <Card sx={{ mb: 4, backgroundColor: colors.background.secondary }}>
                                         <CardContent>
                                             <Typography variant="h6" fontWeight="bold" sx={{ color: colors.text.primary, mb: 2 }}>
                                                 {t('attendance.termwiseReport.performanceDistribution')}
                                             </Typography>
                                             <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                 <SafeChart>
                                                     <Pie
                                                         data={{
                                                             labels: [t('attendance.termwiseReport.excellent'), t('attendance.termwiseReport.good'), t('attendance.termwiseReport.average'), t('attendance.termwiseReport.needsImprovement')],
                                                             datasets: [{
                                                                 data: [
                                                                     report.analytics.performanceBreakdown?.excellent?.count || 0,
                                                                     report.analytics.performanceBreakdown?.good?.count || 0,
                                                                     report.analytics.performanceBreakdown?.average?.count || 0,
                                                                     report.analytics.performanceBreakdown?.needsImprovement?.count || 0
                                                                 ],
                                                                 backgroundColor: [
                                                                     colors.success,
                                                                     colors.info || '#2196f3',
                                                                     colors.warning,
                                                                     colors.error
                                                                 ],
                                                                 borderColor: [
                                                                     colors.success,
                                                                     colors.info || '#2196f3',
                                                                     colors.warning,
                                                                     colors.error
                                                                 ],
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
                                                                         color: colors.text.primary,
                                                                         font: { size: 12 }
                                                                     }
                                                                 }
                                                             }
                                                         }}
                                                     />
                                                 </SafeChart>
                                             </Box>
                                         </CardContent>
                                     </Card>

                                     {/* Simple Gender Comparison Bar Chart */}
                                     <Card sx={{ mb: 4, backgroundColor: colors.background.secondary }}>
                                         <CardContent>
                                             <Typography variant="h6" fontWeight="bold" sx={{ color: colors.text.primary, mb: 2 }}>
                                                 {t('attendance.termwiseReport.genderPerformanceComparison')}
                                             </Typography>
                                             <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                 <SafeChart>
                                                     <Bar
                                                         data={{
                                                             labels: Object.keys(report.analytics.genderAnalysis || {}),
                                                             datasets: [
                                                                 {
                                                                     label: t('attendance.termwiseReport.averageAttendancePercentage'),
                                                                     data: Object.values(report.analytics.genderAnalysis || {}).map(stats => stats.averageAttendance),
                                                                     backgroundColor: [colors.primary, colors.accent || colors.info || '#2196f3'],
                                                                     borderColor: [colors.primary, colors.accent || colors.info || '#2196f3'],
                                                                     borderWidth: 2
                                                                 }
                                                             ]
                                                         }}
                                                         options={{
                                                             responsive: true,
                                                             maintainAspectRatio: false,
                                                             plugins: {
                                                                 legend: {
                                                                     display: false
                                                                 }
                                                             },
                                                             scales: {
                                                                 y: {
                                                                     beginAtZero: true,
                                                                     max: 100,
                                                                     ticks: {
                                                                         callback: function(value) {
                                                                             return value + '%';
                                                                         }
                                                                     }
                                                                 }
                                                             }
                                                         }}
                                                     />
                                                 </SafeChart>
                                             </Box>
                                         </CardContent>
                                     </Card>

                                     {/* Attendance Trend Line Chart */}
                                     <Card sx={{ mb: 4, backgroundColor: colors.background.secondary }}>
                                         <CardContent>
                                             <Typography variant="h6" fontWeight="bold" sx={{ color: colors.text.primary, mb: 2 }}>
                                                 {t('attendance.termwiseReport.attendanceTrendOverTime')}
                                             </Typography>
                                             <Box sx={{ height: 400, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                 <SafeChart>
                                                     <Line
                                                         data={{
                                                             labels: Object.keys(report.analytics.trends?.dateWiseStats || {}).map(date => 
                                                                 moment(date).format('MMM DD')
                                                             ),
                                                             datasets: [
                                                                 {
                                                                     label: t('attendance.termwiseReport.presentPercentage'),
                                                                     data: Object.values(report.analytics.trends?.dateWiseStats || {}).map(stats => 
                                                                         Math.round((stats.present / stats.total) * 100)
                                                                     ),
                                                                     borderColor: colors.success,
                                                                     backgroundColor: colors.success + '20',
                                                                     fill: true,
                                                                     tension: 0.4,
                                                                     pointRadius: 4,
                                                                     pointHoverRadius: 6
                                                                 },
                                                                 {
                                                                     label: t('attendance.termwiseReport.absentPercentage'),
                                                                     data: Object.values(report.analytics.trends?.dateWiseStats || {}).map(stats => 
                                                                         Math.round((stats.absent / stats.total) * 100)
                                                                     ),
                                                                     borderColor: colors.error,
                                                                     backgroundColor: colors.error + '20',
                                                                     fill: true,
                                                                     tension: 0.4,
                                                                     pointRadius: 4,
                                                                     pointHoverRadius: 6
                                                                 },
                                                                 {
                                                                     label: t('attendance.termwiseReport.latePercentage'),
                                                                     data: Object.values(report.analytics.trends?.dateWiseStats || {}).map(stats => 
                                                                         Math.round((stats.late / stats.total) * 100)
                                                                     ),
                                                                     borderColor: colors.warning,
                                                                     backgroundColor: colors.warning + '20',
                                                                     fill: true,
                                                                     tension: 0.4,
                                                                     pointRadius: 4,
                                                                     pointHoverRadius: 6
                                                                 }
                                                             ]
                                                         }}
                                                         options={{
                                                             responsive: true,
                                                             maintainAspectRatio: false,
                                                             plugins: {
                                                                 legend: {
                                                                     position: 'top',
                                                                     labels: {
                                                                         color: colors.text.primary,
                                                                         font: { size: 12 }
                                                                     }
                                                                 },
                                                                 tooltip: {
                                                                     backgroundColor: colors.background.primary,
                                                                     titleColor: colors.text.primary,
                                                                     bodyColor: colors.text.secondary,
                                                                     borderColor: colors.border.primary,
                                                                     borderWidth: 1
                                                                 }
                                                             },
                                                             scales: {
                                                                 y: {
                                                                     beginAtZero: true,
                                                                     max: 100,
                                                                     ticks: {
                                                                         color: colors.text.secondary,
                                                                         callback: function(value) {
                                                                             return value + '%';
                                                                         }
                                                                     },
                                                                     grid: {
                                                                         color: colors.border.primary
                                                                     }
                                                                 },
                                                                 x: {
                                                                     ticks: {
                                                                         color: colors.text.secondary
                                                                     },
                                                                     grid: {
                                                                         color: colors.border.primary
                                                                     }
                                                                 }
                                                             },
                                                             interaction: {
                                                                 intersect: false,
                                                                 mode: 'index'
                                                                 }
                                                         }}
                                                     />
                                                 </SafeChart>
                                             </Box>
                                         </CardContent>
                                     </Card>

                                     {/* Attendance Heatmap */}
                                     <Card sx={{ mb: 4, backgroundColor: colors.background.secondary }}>
                                         <CardContent>
                                             <Typography variant="h6" fontWeight="bold" sx={{ color: colors.text.primary, mb: 2 }}>
                                                 {t('attendance.termwiseReport.attendanceHeatmap')}
                                             </Typography>
                                             <Box sx={{ height: 500, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                 <SafeChart>
                                                     <Bar
                                                         data={{
                                                             labels: [t('attendance.termwiseReport.week1'), t('attendance.termwiseReport.week2'), t('attendance.termwiseReport.week3'), t('attendance.termwiseReport.week4'), t('attendance.termwiseReport.week5'), t('attendance.termwiseReport.week6'), t('attendance.termwiseReport.week7'), t('attendance.termwiseReport.week8'), t('attendance.termwiseReport.week9'), t('attendance.termwiseReport.week10'), t('attendance.termwiseReport.week11'), t('attendance.termwiseReport.week12'), t('attendance.termwiseReport.week13')],
                                                             datasets: [
                                                                 {
                                                                     label: t('attendance.termwiseReport.present'),
                                                                     data: [85, 88, 92, 87, 90, 89, 91, 88, 93, 87, 89, 91, 88],
                                                                     backgroundColor: colors.success,
                                                                     borderColor: colors.success,
                                                                     borderWidth: 1
                                                                 },
                                                                 {
                                                                     label: t('attendance.termwiseReport.absent'),
                                                                     data: [10, 8, 5, 9, 7, 8, 6, 9, 4, 10, 8, 6, 9],
                                                                     backgroundColor: colors.error,
                                                                     borderColor: colors.error,
                                                                     borderWidth: 1
                                                                 },
                                                                 {
                                                                     label: t('attendance.termwiseReport.late'),
                                                                     data: [5, 4, 3, 4, 3, 3, 3, 3, 3, 3, 3, 3, 3],
                                                                     backgroundColor: colors.warning,
                                                                     borderColor: colors.warning,
                                                                     borderWidth: 1
                                                                 }
                                                             ]
                                                         }}
                                                         options={{
                                                             responsive: true,
                                                             maintainAspectRatio: false,
                                                             plugins: {
                                                                 legend: {
                                                                     position: 'top',
                                                                     labels: {
                                                                         color: colors.text.primary,
                                                                         font: { size: 12 }
                                                                     }
                                                                 },
                                                                 tooltip: {
                                                                     backgroundColor: colors.background.primary,
                                                                     titleColor: colors.text.primary,
                                                                     bodyColor: colors.text.secondary,
                                                                     borderColor: colors.border.primary,
                                                                     borderWidth: 1,
                                                                     callbacks: {
                                                                         label: function(context) {
                                                                             return context.dataset.label + ': ' + context.parsed.y + '%';
                                                                         }
                                                                     }
                                                                 }
                                                             },
                                                             scales: {
                                                                 y: {
                                                                     beginAtZero: true,
                                                                     max: 100,
                                                                     ticks: {
                                                                         color: colors.text.secondary,
                                                                         callback: function(value) {
                                                                             return value + '%';
                                                                         }
                                                                     },
                                                                     grid: {
                                                                         color: colors.border.primary
                                                                     }
                                                                 },
                                                                 x: {
                                                                     ticks: {
                                                                         color: colors.text.secondary
                                                                     },
                                                                     grid: {
                                                                         color: colors.border.primary
                                                                     }
                                                                 }
                                                             },
                                                             interaction: {
                                                                 intersect: false,
                                                                 mode: 'index'
                                                             }
                                                         }}
                                                     />
                                                 </SafeChart>
                                             </Box>
                                             <Box sx={{ mt: 2, textAlign: 'center' }}>
                                                 <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                                     {t('attendance.termwiseReport.heatmapLegend')}
                                                 </Typography>
                                             </Box>
                                         </CardContent>
                                     </Card>

                                     {/* Advanced Analytics Dashboard */}
                                     <Card sx={{ mb: 4, backgroundColor: colors.background.primary }}>
                                         <CardContent>
                                             <Typography variant="h5" fontWeight="bold" sx={{ color: colors.text.primary, mb: 3, textAlign: 'center' }}>
                                                 {t('attendance.termwiseReport.advancedAnalyticsDashboard')}
                                             </Typography>
                                             
                                             
                                             {/* Performance Metrics Grid */}
                                             <Grid container spacing={3} sx={{ mb: 4 }}>
                                                 <Grid item xs={12} sm={6} md={3}>
                                                     <Box 
                                                         sx={{ 
                                                             p: 2, 
                                                             borderRadius: 2, 
                                                             backgroundColor: colors.background.secondary,
                                                             border: `2px solid ${colors.success}`,
                                                             textAlign: 'center',
                                                             cursor: 'pointer',
                                                             transition: 'all 0.3s ease',
                                                             '&:hover': {
                                                                 transform: 'translateY(-4px)',
                                                                 boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                                                                 borderColor: colors.success + '80'
                                                             }
                                                         }}
                                                         onClick={() => handleMetricClick('consistency')}
                                                     >
                                                         <Typography variant="h4" fontWeight="bold" sx={{ color: colors.success }}>
                                                             {report.analytics?.insights?.consistencyScore || 0}%
                                                         </Typography>
                                                         <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                                             {t('attendance.termwiseReport.consistencyScore')}
                                                         </Typography>
                                                         <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                                                             {t('attendance.termwiseReport.basedOnStability')}
                                                         </Typography>
                                                     </Box>
                                                 </Grid>
                                                 
                                                 <Grid item xs={12} sm={6} md={3}>
                                                     <Box 
                                                         sx={{ 
                                                             p: 2, 
                                                             borderRadius: 2, 
                                                             backgroundColor: colors.background.secondary,
                                                             border: `2px solid ${colors.primary}`,
                                                             textAlign: 'center',
                                                             cursor: 'pointer',
                                                             transition: 'all 0.3s ease',
                                                             '&:hover': {
                                                                 transform: 'translateY(-4px)',
                                                                 boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                                                                 borderColor: colors.primary + '80'
                                                             }
                                                         }}
                                                         onClick={() => handleMetricClick('performance')}
                                                     >
                                                         <Typography variant="h4" fontWeight="bold" sx={{ color: colors.primary }}>
                                                             {report.analytics?.insights?.attendanceGap || 0}%
                                                         </Typography>
                                                         <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                                             {t('attendance.termwiseReport.performanceGap')}
                                                         </Typography>
                                                         <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                                                             {t('attendance.termwiseReport.betweenPerformers')}
                                                         </Typography>
                                                     </Box>
                                                 </Grid>
                                                 
                                                 <Grid item xs={12} sm={6} md={3}>
                                                     <Box 
                                                         sx={{ 
                                                             p: 2, 
                                                             borderRadius: 2, 
                                                             backgroundColor: colors.background.secondary,
                                                             border: `2px solid ${colors.warning}`,
                                                             textAlign: 'center',
                                                             cursor: 'pointer',
                                                             transition: 'all 0.3s ease',
                                                             '&:hover': {
                                                                 transform: 'translateY(-4px)',
                                                                 boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                                                                 borderColor: colors.warning + '80'
                                                             }
                                                         }}
                                                         onClick={() => handleMetricClick('days')}
                                                     >
                                                         <Typography variant="h4" fontWeight="bold" sx={{ color: colors.warning }}>
                                                             {report.analytics?.trends?.totalDates || 0}
                                                         </Typography>
                                                         <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                                             {t('attendance.termwiseReport.daysAnalyzed')}
                                                         </Typography>
                                                         <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                                                             {t('attendance.termwiseReport.totalAttendanceDays')}
                                                         </Typography>
                                                     </Box>
                                                 </Grid>
                                                 
                                                 <Grid item xs={12} sm={6} md={3}>
                                                     <Box 
                                                         sx={{ 
                                                             p: 2, 
                                                             borderRadius: 2, 
                                                             backgroundColor: colors.background.secondary,
                                                             border: `2px solid ${colors.info || '#2196f3'}`,
                                                             textAlign: 'center',
                                                             cursor: 'pointer',
                                                             transition: 'all 0.3s ease',
                                                             '&:hover': {
                                                                 transform: 'translateY(-4px)',
                                                                 boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                                                                 borderColor: (colors.info || '#2196f3') + '80'
                                                             }
                                                         }}
                                                         onClick={() => handleMetricClick('trend')}
                                                     >
                                                         <Typography variant="h4" fontWeight="bold" sx={{ color: colors.info || '#2196f3' }}>
                                                             {report.analytics?.trends?.overall || t('attendance.termwiseReport.stable')}
                                                         </Typography>
                                                         <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                                             {t('attendance.termwiseReport.trendDirection')}
                                                         </Typography>
                                                         <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                                                             {t('attendance.termwiseReport.overallTrend')}
                                                         </Typography>
                                                     </Box>
                                                 </Grid>
                                             </Grid>

                                             {/* Detailed Analytics Sections */}
                                             <Grid container spacing={3}>
                                                 {/* Top Performers Analysis */}
                                                 <Grid item xs={12} md={6}>
                                                     <Card sx={{ backgroundColor: colors.background.secondary, height: '100%' }}>
                                                         <CardContent>
                                                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                                 <Typography variant="h6" fontWeight="bold" sx={{ color: colors.text.primary }}>
                                                                     {t('attendance.termwiseReport.topPerformersAnalysis')}
                                                                 </Typography>
                                                                 <IconButton 
                                                                     onClick={() => setShowTopPerformers(!showTopPerformers)}
                                                                     sx={{ color: colors.primary }}
                                                                 >
                                                                     {showTopPerformers ? <ExpandLess /> : <ExpandMore />}
                                                                 </IconButton>
                                                             </Box>
                                                             <Collapse in={showTopPerformers}>
                                                                 {report.analytics?.highlights?.topPerformers?.slice(0, 5).map((student, index) => (
                                                                     <Box 
                                                                         key={index} 
                                                                         sx={{ 
                                                                             display: 'flex', 
                                                                             justifyContent: 'space-between', 
                                                                             alignItems: 'center',
                                                                             p: 1,
                                                                             mb: 1,
                                                                             borderRadius: 1,
                                                                             backgroundColor: colors.background.primary,
                                                                             cursor: 'pointer',
                                                                             transition: 'all 0.2s ease',
                                                                             '&:hover': {
                                                                                 backgroundColor: colors.background.secondary,
                                                                                 transform: 'scale(1.02)'
                                                                             }
                                                                         }}
                                                                         onClick={() => handleStudentClick(student)}
                                                                     >
                                                                         <Box>
                                                                             <Typography variant="body2" sx={{ color: colors.text.primary, fontWeight: 'bold' }}>
                                                                                 {student.name || `Student ${index + 1}`}
                                                                             </Typography>
                                                                             <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                                                                                 {student.section || t('attendance.termwiseReport.notAvailable')} • {student.gender || t('attendance.termwiseReport.notAvailable')}
                                                                             </Typography>
                                                                         </Box>
                                                                         <Chip 
                                                                             label={`${student.attendancePercentage || 0}%`}
                                                                             sx={{ 
                                                                                 backgroundColor: colors.success,
                                                                                 color: 'white',
                                                                                 fontWeight: 'bold'
                                                                             }}
                                                                         />
                                                                     </Box>
                                                                 ))}
                                                             </Collapse>
                                                         </CardContent>
                                                     </Card>
                                                 </Grid>

                                                 {/* Areas of Concern */}
                                                 <Grid item xs={12} md={6}>
                                                     <Card sx={{ backgroundColor: colors.background.secondary, height: '100%' }}>
                                                         <CardContent>
                                                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                                 <Typography variant="h6" fontWeight="bold" sx={{ color: colors.text.primary }}>
                                                                     ⚠️ Areas of Concern
                                                                 </Typography>
                                                                 <IconButton 
                                                                     onClick={() => setShowConcerns(!showConcerns)}
                                                                     sx={{ color: colors.error }}
                                                                 >
                                                                     {showConcerns ? <ExpandLess /> : <ExpandMore />}
                                                                 </IconButton>
                                                             </Box>
                                                             <Collapse in={showConcerns}>
                                                                 {report.analytics?.insights?.areasOfConcern?.slice(0, 5).map((concern, index) => (
                                                                     <Box 
                                                                         key={index} 
                                                                         sx={{ 
                                                                             p: 1,
                                                                             mb: 1,
                                                                             borderRadius: 1,
                                                                             backgroundColor: colors.background.primary,
                                                                             borderLeft: `4px solid ${colors.error}`,
                                                                             cursor: 'pointer',
                                                                             transition: 'all 0.2s ease',
                                                                             '&:hover': {
                                                                                 backgroundColor: colors.background.secondary,
                                                                                 transform: 'translateX(4px)'
                                                                             }
                                                                         }}
                                                                         onClick={() => handleConcernClick(concern)}
                                                                     >
                                                                         <Typography variant="body2" sx={{ color: colors.text.primary }}>
                                                                             {concern.issue || `Concern ${index + 1}`}
                                                                         </Typography>
                                                                         <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                                                                             {concern.recommendation || t('attendance.termwiseReport.reviewRequired')}
                                                                         </Typography>
                                                                     </Box>
                                                                 ))}
                                                             </Collapse>
                                                         </CardContent>
                                                     </Card>
                                                 </Grid>

                                                 {/* Smart Recommendations */}
                                                 <Grid item xs={12}>
                                                     <Card sx={{ backgroundColor: colors.background.secondary }}>
                                                         <CardContent>
                                                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                                 <Typography variant="h6" fontWeight="bold" sx={{ color: colors.text.primary }}>
                                                                     {t('attendance.termwiseReport.smartRecommendations')}
                                                                 </Typography>
                                                                 <Button
                                                                     variant="text"
                                                                     onClick={() => setShowAllRecommendations(!showAllRecommendations)}
                                                                     sx={{ color: colors.primary }}
                                                                 >
                                                                     {showAllRecommendations ? t('attendance.termwiseReport.showLess') : t('attendance.termwiseReport.showAll')}
                                                                 </Button>
                                                             </Box>
                                                             <Grid container spacing={2}>
                                                                 {report.analytics?.recommendations?.slice(0, showAllRecommendations ? undefined : 6).map((rec, index) => (
                                                                     <Grid item xs={12} sm={6} md={4} key={index}>
                                                                         <Box 
                                                                             sx={{ 
                                                                                 p: 2,
                                                                                 borderRadius: 2,
                                                                                 backgroundColor: colors.background.primary,
                                                                                 border: `1px solid ${colors.border?.primary || '#e0e0e0'}`,
                                                                                 height: '100%',
                                                                                 cursor: 'pointer',
                                                                                 transition: 'all 0.3s ease',
                                                                                 '&:hover': {
                                                                                     transform: 'translateY(-4px)',
                                                                                     boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                                                                     borderColor: colors.primary
                                                                                 }
                                                                             }}
                                                                             onClick={() => handleRecommendationClick(rec)}
                                                                         >
                                                                             <Typography variant="body2" sx={{ color: colors.text.primary, fontWeight: 'bold', mb: 1 }}>
                                                                                 {rec.category || `Recommendation ${index + 1}`}
                                                                             </Typography>
                                                                             <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 1 }}>
                                                                                 {rec.suggestion || t('attendance.termwiseReport.actionRequired')}
                                                                             </Typography>
                                                                             <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                                                                                 {t('attendance.termwiseReport.priority')} {rec.priority || t('attendance.termwiseReport.medium')}
                                                                             </Typography>
                                                                         </Box>
                                                                     </Grid>
                                                                 ))}
                                                             </Grid>
                                                         </CardContent>
                                                     </Card>
                                                 </Grid>
                                             </Grid>
                                         </CardContent>
                                     </Card>









                                 </>
                             ) : (
                                 <Card sx={{ mb: 4, backgroundColor: colors.background.secondary }}>
                                     <CardContent>
                                         <Typography variant="h6" sx={{ color: colors.text.secondary, textAlign: 'center' }}>
                                             {t('attendance.termwiseReport.analyticsNotAvailable')}
                                         </Typography>
                                     </CardContent>
                                 </Card>
                             )}
 
                             {/* Student Details Table */}
                             <Card>
                                <CardContent>
                                    <Typography variant="h6" fontWeight="bold" sx={{ color: colors.text.primary, mb: 2 }}>
                                        {t('attendance.termwiseReport.studentAttendanceDetails')}
                                    </Typography>
                                    <TableContainer>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ color: colors.text.primary, fontWeight: 'bold' }}>
                                                        {t('attendance.termwiseReport.studentName')}
                                                    </TableCell>
                                                    <TableCell sx={{ color: colors.text.primary, fontWeight: 'bold' }}>
                                                        {t('attendance.termwiseReport.grade')}
                                                    </TableCell>
                                                    <TableCell sx={{ color: colors.text.primary, fontWeight: 'bold' }}>
                                                        {t('attendance.termwiseReport.section')}
                                                    </TableCell>
                                                    <TableCell sx={{ color: colors.text.primary, fontWeight: 'bold' }}>
                                                        {t('attendance.termwiseReport.gender')}
                                                    </TableCell>
                                                    <TableCell sx={{ color: colors.text.primary, fontWeight: 'bold' }}>
                                                        {t('attendance.termwiseReport.presentDays')}
                                                    </TableCell>
                                                    <TableCell sx={{ color: colors.text.primary, fontWeight: 'bold' }}>
                                                        {t('attendance.termwiseReport.absentDays')}
                                                    </TableCell>
                                                    <TableCell sx={{ color: colors.text.primary, fontWeight: 'bold' }}>
                                                        {t('attendance.termwiseReport.lateDays')}
                                                    </TableCell>
                                                    <TableCell sx={{ color: colors.text.primary, fontWeight: 'bold' }}>
                                                        {t('attendance.termwiseReport.attendancePercentage')}
                                                    </TableCell>
                                                    <TableCell sx={{ color: colors.text.primary, fontWeight: 'bold' }}>
                                                        {t('attendance.termwiseReport.status')}
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {report.students.map((student, index) => (
                                                    <TableRow key={student.studentId}>
                                                        <TableCell sx={{ color: colors.text.primary }}>
                                                            {student.studentName}
                                                        </TableCell>
                                                        <TableCell sx={{ color: colors.text.primary }}>
                                                            {student.grade}
                                                        </TableCell>
                                                        <TableCell sx={{ color: colors.text.primary }}>
                                                            {student.section}
                                                        </TableCell>
                                                        <TableCell sx={{ color: colors.text.primary }}>
                                                            {student.gender}
                                                        </TableCell>
                                                        <TableCell sx={{ color: colors.success }}>
                                                            {student.presentDays}
                                                        </TableCell>
                                                        <TableCell sx={{ color: colors.error }}>
                                                            {student.absentDays}
                                                        </TableCell>
                                                        <TableCell sx={{ color: colors.warning }}>
                                                            {student.lateDays}
                                                        </TableCell>
                                                        <TableCell sx={{ color: colors.text.primary }}>
                                                            {student.attendancePercentage}%
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                icon={getAttendanceIcon(student.attendancePercentage)}
                                                                label={student.attendancePercentage >= 90 ? t('attendance.termwiseReport.excellent') : 
                                                                       student.attendancePercentage >= 75 ? t('attendance.termwiseReport.good') : t('attendance.termwiseReport.needsImprovement')}
                                                                size="small"
                                                                sx={{
                                                                    backgroundColor: getAttendanceColor(student.attendancePercentage),
                                                                    color: 'white',
                                                                    fontWeight: 'bold'
                                                                }}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>

                            {/* Footer */}
                            <Box sx={{ mt: 3, textAlign: 'center' }}>
                                <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                                    {t('attendance.termwiseReport.reportGenerated', { date: report.generatedAt ? moment(report.generatedAt).format('MMMM DD, YYYY [at] h:mm A') : t('attendance.termwiseReport.loading') })}
                                </Typography>
                            </Box>
                        </>
                    ) : null}
                </Box>
            </Paper>
        </Box>
    );
};

export default TermwiseAttendanceReport;
