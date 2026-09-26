import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    Grid,
    Card,
    CardContent,
    CardActions,
    Chip
} from '@mui/material';
import { useTheme } from '../../contexts/ThemeContext';
import AttendanceReportMenu from '../../components/Attendance/AttendanceReportMenu';
import TodayOverallReport from '../../components/Attendance/TodayOverallReport';
import moment from 'moment/moment';
import { useTranslation } from 'react-i18next';

// Icons
import AssessmentIcon from '@mui/icons-material/Assessment';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DateRangeIcon from '@mui/icons-material/DateRange';
import SchoolIcon from '@mui/icons-material/School';
import GradeIcon from '@mui/icons-material/Grade';
import TodayIcon from '@mui/icons-material/Today';
import TimelineIcon from '@mui/icons-material/Timeline';
import PrintIcon from '@mui/icons-material/Print';
import MenuIcon from '@mui/icons-material/Menu';

const AttendanceReportsScreen = () => {
    const { themeColors } = useTheme();
    const { t } = useTranslation();
    const [reportMenuOpen, setReportMenuOpen] = useState(false);
    const [selectedReportType, setSelectedReportType] = useState(null);
    const [todayOverallReportOpen, setTodayOverallReportOpen] = useState(false);

    // Report type options
    const reportTypes = [
        {
            id: 'datewise-summary',
            title: t('attendance.reports.types.datewise.title'),
            description: t('attendance.reports.types.datewise.description'),
            icon: <CalendarTodayIcon />,
            color: themeColors.primary,
            requiresFilters: true
        },
        {
            id: 'classwise',
            title: t('attendance.reports.types.classwise.title'),
            description: t('attendance.reports.types.classwise.description'),
            icon: <GradeIcon />,
            color: themeColors.accent,
            requiresFilters: true
        },
        {
            id: 'today-overall',
            title: t('attendance.reports.types.todayOverall.title'),
            description: t('attendance.reports.types.todayOverall.description'),
            icon: <TodayIcon />,
            color: themeColors.success,
            requiresFilters: false
        },
        {
            id: 'termwise',
            title: t('attendance.reports.types.termwise.title'),
            description: t('attendance.reports.types.termwise.description'),
            icon: <TimelineIcon />,
            color: themeColors.warning,
            requiresFilters: true
        }
    ];

    const handleGenerateReport = (reportData) => {
        console.log('Generating report:', reportData);
        
        // For reports that have their own dialogs, don't close the menu
        // The dialogs will handle the report display
        if (['classwise', 'termwise'].includes(reportData.reportType)) {
            console.log('Report type has its own dialog, keeping menu open');
            return;
        }
        
        // For today-overall, open the report dialog directly
        if (reportData.reportType === 'today-overall') {
            console.log('Today overall report generated, opening dialog');
            setReportMenuOpen(false);
            setTodayOverallReportOpen(true);
            return;
        }
        
        // For datewise-summary, close menu and let the report dialog handle it
        if (reportData.reportType === 'datewise-summary') {
            console.log('Datewise summary report generated, closing menu');
            setReportMenuOpen(false);
            return;
        }
        
        // For other report types, show alert and close menu
        alert(t('attendance.reports.messages.generating', { type: reportData.reportType }));
        setReportMenuOpen(false);
    };

    const handleReportTypeSelect = (reportType) => {
        console.log('Selected report type:', reportType);
        
        // Set the selected report type
        setSelectedReportType(reportType);
        
        // Open the report menu with the selected report type
        setReportMenuOpen(true);
    };

    const handleQuickReport = (reportType) => {
        const reportData = {
            reportType: reportType.id,
            date: moment().format('YYYY-MM-DD')
        };
        handleGenerateReport(reportData);
    };

    return (
        <Box sx={{ p: 3, backgroundColor: themeColors.background.secondary, minHeight: '100vh' }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                    <AssessmentIcon sx={{ fontSize: 32, color: themeColors.primary }} />
                    <Box>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                            {t('attendance.reports.title')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                            {t('attendance.reports.subtitle')}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Quick Report Cards */}
            <Typography variant="h5" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 3 }}>
                {t('attendance.reports.quickReports')}
            </Typography>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {reportTypes.map((reportType) => (
                    <Grid item xs={12} sm={6} md={3} key={reportType.id}>
                        <Card sx={{ 
                            height: '100%',
                            backgroundColor: themeColors.background.primary,
                            border: `1px solid ${themeColors.border.primary}`,
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 8px 25px ${reportType.color}30`,
                                borderColor: reportType.color,
                            }
                        }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box display="flex" alignItems="center" mb={2}>
                                    <Box sx={{ 
                                        p: 1, 
                                        borderRadius: 2, 
                                        backgroundColor: `${reportType.color}20`,
                                        color: reportType.color,
                                        mr: 2
                                    }}>
                                        {reportType.icon}
                                    </Box>
                                    <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                        {reportType.title}
                                    </Typography>
                                </Box>
                                
                                <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 2 }}>
                                    {reportType.description}
                                </Typography>
                                
                                <Chip
                                    label={reportType.requiresFilters ? t('attendance.reports.advanced') : t('attendance.reports.quick')}
                                    size="small"
                                    sx={{
                                        backgroundColor: reportType.requiresFilters ? themeColors.warning : themeColors.success,
                                        color: 'white',
                                        fontWeight: 'bold'
                                    }}
                                />
                            </CardContent>
                            
                            <CardActions sx={{ p: 2, pt: 0 }}>
                                {!reportType.requiresFilters ? (
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<PrintIcon />}
                                        onClick={() => handleQuickReport(reportType)}
                                        sx={{
                                            borderColor: reportType.color,
                                            color: reportType.color,
                                            '&:hover': {
                                                borderColor: reportType.color,
                                                backgroundColor: `${reportType.color}10`,
                                            }
                                        }}
                                    >
                                        {t('attendance.reports.actions.generateReport')}
                                    </Button>
                                ) : (
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        startIcon={<MenuIcon />}
                                        onClick={() => handleReportTypeSelect(reportType)}
                                        sx={{
                                            borderColor: reportType.color,
                                            color: reportType.color,
                                            '&:hover': {
                                                borderColor: reportType.color,
                                                backgroundColor: `${reportType.color}10`,
                                            }
                                        }}
                                    >
                                        {t('attendance.reports.actions.selectOptions')}
                                    </Button>
                                )}
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Information Section */}
            <Paper sx={{ 
                p: 3, 
                backgroundColor: themeColors.background.primary,
                border: `1px solid ${themeColors.border.primary}`,
                borderRadius: 2
            }}>
                <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                    {t('attendance.reports.explained.title')}
                </Typography>
                
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: themeColors.primary, mb: 1 }}>
                                {t('attendance.reports.explained.datewise.title')}
                            </Typography>
                            <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                {t('attendance.reports.explained.datewise.description')}
                            </Typography>
                        </Box>
                        
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: themeColors.accent, mb: 1 }}>
                                {t('attendance.reports.explained.classwise.title')}
                            </Typography>
                            <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                {t('attendance.reports.explained.classwise.description')}
                            </Typography>
                        </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: themeColors.success, mb: 1 }}>
                                {t('attendance.reports.explained.todayOverall.title')}
                            </Typography>
                            <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                {t('attendance.reports.explained.todayOverall.description')}
                            </Typography>
                        </Box>
                        
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: themeColors.warning, mb: 1 }}>
                                {t('attendance.reports.explained.termwise.title')}
                            </Typography>
                            <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                {t('attendance.reports.explained.termwise.description')}
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Attendance Report Menu Drawer */}
            <AttendanceReportMenu
                open={reportMenuOpen}
                onClose={() => {
                    setReportMenuOpen(false);
                    setSelectedReportType(null);
                }}
                onGenerateReport={handleGenerateReport}
                selectedReportType={selectedReportType}
            />

            {/* Today's Overall Report Dialog */}
            <TodayOverallReport
                open={todayOverallReportOpen}
                onClose={() => setTodayOverallReportOpen(false)}
            />
        </Box>
    );
};

export default AttendanceReportsScreen;

