import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Alert,
    CircularProgress,
    Grid,
    Avatar,
    Tabs,
    Tab,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    DatePicker,
    Tooltip,
    LinearProgress,
    Badge,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
    CheckCircle as PresentIcon,
    Cancel as AbsentIcon,
    Schedule as LateIcon,
    Event as LeaveIcon,
    CalendarToday as CalendarIcon,
    Person as PersonIcon,
    School as SchoolIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Refresh as RefreshIcon,
    FilterList as FilterIcon,
    Download as DownloadIcon,
    Print as PrintIcon,
    Search as SearchIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    BarChart as BarChartIcon,
    PieChart as PieChartIcon,
    Timeline as TimelineIcon,
    Warning as WarningIcon,
    CheckCircleOutline as CheckIcon,
    CancelOutlined as CancelIcon,
    Schedule as ScheduleIcon,
    Event as EventIcon,
    Info as InfoIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import CustomOutletBox from '../../components/Common/CustomOutletBox';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from '../../hooks/SnackBar';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import {
  useGetStudentAttendanceQuery,
  useGetAttendanceByDateRangeQuery,
  useGetAttendanceDashboardQuery,
  useGetAttendanceSummaryReportQuery,
} from '../../Redux/features/Attendance/attendanceApiSlice';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const StudentAttendance = () => {
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();
    const primaryColor = themeColors.primary;
    const successColor = themeColors.success || '#10b981';
    const warningColor = themeColors.warning || '#f59e0b';
    const errorColor = themeColors.error || '#ef4444';
    const infoColor = themeColors.info || '#3b82f6';
    const accentColor = themeColors.accent || primaryColor;
    const inverseColor = themeColors.text.inverse;
    const dispatch = useDispatch();
    const showSnackbar = useSnackbar();

  // Get current logged-in student info
  const { user, student } = useSelector((state) => state.auth);
  
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(moment().month());
  const [selectedYear, setSelectedYear] = useState(moment().year());
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: moment().startOf('month').format('YYYY-MM-DD'),
    endDate: moment().endOf('month').format('YYYY-MM-DD')
  });

    // RTK Query hooks for API calls
    const {
        data: attendanceData,
        isLoading: attendanceLoading,
        error: attendanceError,
        refetch: refetchAttendance
    } = useGetAttendanceByDateRangeQuery({
        fromDate: dateRange.startDate,
        toDate: dateRange.endDate
    });


    const {
        data: dashboardData,
        isLoading: dashboardLoading,
        error: dashboardError
    } = useGetAttendanceDashboardQuery();

    const {
        data: summaryReport,
        isLoading: reportLoading,
        error: reportError
    } = useGetAttendanceSummaryReportQuery({
        reportDate: moment().format('YYYY-MM-DD'),
        summaryType: 'monthly'
    });

    // Combined loading and error states
    const loading = attendanceLoading || dashboardLoading || reportLoading;
    const error = attendanceError || dashboardError || reportError;

    // Handle date range changes
    const handleDateRangeChange = (newDateRange) => {
        setDateRange(newDateRange);
    };

    // Handle refresh
    const handleRefresh = () => {
        refetchAttendance();
        showSnackbar(t('studentAttendance.messages.refreshSuccess'), 'info');
    };

  // Process attendance data for display
  const processAttendanceData = () => {
    // Handle API response structure - data might be nested
    const records = attendanceData?.data || attendanceData || [];
    
    if (!records || !Array.isArray(records) || records.length === 0) {
      return null;
    }

    // Calculate statistics from attendance records
    const presentDays = records.filter(record => record.status === 'present').length;
    const absentDays = records.filter(record => record.status === 'absent').length;
    const lateDays = records.filter(record => record.status === 'late').length;
    const leaveDays = records.filter(record => record.status === 'leave').length;
    const totalDays = records.length;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    // Get student information from the first record (all records should have the same student)
    const firstRecord = records[0];
        const studentInfo = firstRecord?.student || {};
        const gradeInfo = firstRecord?.grade || {};
        const sectionInfo = firstRecord?.section || {};

    return {
      _id: studentInfo._id || 'current-student',
      student: {
        _id: studentInfo._id || 'current-student',
        studentName: studentInfo.studentName || user?.name || t('studentAttendance.fallback.currentStudent'),
        studentID: studentInfo.studentID || user?.email || t('studentAttendance.fallback.studentID'),
        image: studentInfo.image || user?.profileImage || null
      },
      grade: { gradeName: gradeInfo.gradeName || t('studentAttendance.fallback.currentGrade') },
      section: { sectionName: sectionInfo.sectionName || t('studentAttendance.fallback.currentSection') },
      attendance: records,
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      leaveDays,
      attendancePercentage
    };
  };

    // Process stats data for display
    const processStatsData = () => {
        const records = attendanceData?.data || attendanceData || [];
        
        // Debug: Log the attendance data structure
        console.log('Attendance Data Debug:', {
            attendanceData,
            records,
            recordsLength: records?.length,
            firstRecord: records?.[0]
        });
        
        if (!records || records.length === 0) return null;

        // Calculate statistics from attendance records
        const totalDays = records.length;
        const presentDays = records.filter(record => record.status === 'present').length;
        const absentDays = records.filter(record => record.status === 'absent').length;
        const lateDays = records.filter(record => record.status === 'late').length;
        const leaveDays = records.filter(record => record.status === 'leave').length;
        const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

        // Get current status (today's attendance)
        const currentStatus = records.find(
            record => {
                const recordDate = moment(record.date).format('YYYY-MM-DD');
                const today = moment().format('YYYY-MM-DD');
                return recordDate === today;
            }
        )?.status || 'not-marked';

        return {
            overallStats: {
                totalDays,
                presentDays,
                absentDays,
                lateDays,
                leaveDays,
                attendancePercentage,
                currentStatus
            },
            attendanceTrend: records.map(record => ({
                date: moment(record.date).format('YYYY-MM-DD'),
                present: record.status === 'present' ? 1 : 0,
                absent: record.status === 'absent' ? 1 : 0,
                late: record.status === 'late' ? 1 : 0,
                leave: record.status === 'leave' ? 1 : 0
            })),
            monthlyStats: {
                currentMonth: moment().format('MMMM YYYY'),
                totalWorkingDays: totalDays,
                attendedDays: presentDays,
                percentage: attendancePercentage
            }
        };
    };

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

    const getStatusIcon = (status) => {
        switch (status) {
            case 'present':
                return <PresentIcon sx={{ color: successColor }} />;
            case 'absent':
                return <AbsentIcon sx={{ color: errorColor }} />;
            case 'late':
                return <LateIcon sx={{ color: warningColor }} />;
            case 'leave':
                return <LeaveIcon sx={{ color: infoColor }} />;
            default:
                return <CancelIcon sx={{ color: themeColors.text.secondary }} />;
        }
    };

    const getStatusChip = (status) => {
        const statusConfig = {
            present: { label: t('studentAttendance.status.present'), color: 'success' },
            absent: { label: t('studentAttendance.status.absent'), color: 'error' },
            late: { label: t('studentAttendance.status.late'), color: 'warning' },
            leave: { label: t('studentAttendance.status.leave'), color: 'secondary' }
        };

        const config = statusConfig[status] || { label: t('studentAttendance.status.unknown'), color: 'default' };
        return <Chip label={config.label} color={config.color} size="small" />;
    };

    const getAttendanceColor = (percentage) => {
        if (percentage >= 90) return successColor;
        if (percentage >= 75) return warningColor;
        return errorColor;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'present': return 'success';
            case 'absent': return 'error';
            case 'late': return 'warning';
            case 'leave': return 'info';
            default: return 'default';
        }
    };


    const calculateDuration = (timeIn, timeOut) => {
        const start = moment(timeIn, 'HH:mm');
        const end = moment(timeOut, 'HH:mm');
        const duration = moment.duration(end.diff(start));
        const hours = Math.floor(duration.asHours());
        const minutes = duration.minutes();
        return `${hours}h ${minutes}m`;
    };


    const renderAttendanceOverview = () => {
        const statsData = processStatsData();

        return (
            <motion.div variants={itemVariants}>
                <Card
                    sx={{
                        mb: 3,
                        backgroundColor: themeColors.background.primary,
                        border: `1px solid ${themeColors.border.primary}`,
                    }}
                >
                    <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: themeColors.text.primary }}>
                            <BarChartIcon sx={{ color: primaryColor }} />
                            {t('studentAttendance.sections.overview')}
                        </Typography>

                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box textAlign="center" p={2}>
                                    <Typography variant="h4" fontWeight="bold" sx={{ color: primaryColor }}>
                                        {statsData?.overallStats?.totalDays || 0}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        {t('studentAttendance.stats.totalDays')}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box textAlign="center" p={2}>
                                    <Typography variant="h4" fontWeight="bold" sx={{ color: successColor }}>
                                        {statsData?.overallStats?.presentDays || 0}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        {t('studentAttendance.stats.presentDays')}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box textAlign="center" p={2}>
                                    <Typography variant="h4" fontWeight="bold" sx={{ color: errorColor }}>
                                        {statsData?.overallStats?.absentDays || 0}
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        {t('studentAttendance.stats.absentDays')}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box textAlign="center" p={2}>
                                    <Typography variant="h4" fontWeight="bold" sx={{ color: getAttendanceColor(statsData?.overallStats?.attendancePercentage || 0) }}>
                                        {statsData?.overallStats?.attendancePercentage?.toFixed(1) || 0}%
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                        {t('studentAttendance.stats.attendancePercentage')}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </motion.div>
        );
    };

    const renderAttendanceChart = () => {
        const statsData = processStatsData();

        return (
            <motion.div variants={itemVariants}>
                <Card
                    sx={{
                        mb: 3,
                        backgroundColor: themeColors.background.primary,
                        border: `1px solid ${themeColors.border.primary}`,
                    }}
                >
                    <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: themeColors.text.primary }}>
                            <TimelineIcon sx={{ color: primaryColor }} />
                            {t('studentAttendance.sections.trend')}
                        </Typography>

                        <Box height={300}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={statsData?.attendanceTrend || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={themeColors.border.primary} />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(value) => moment(value).format('MMM DD')}
                                        stroke={themeColors.text.secondary}
                                    />
                                    <YAxis stroke={themeColors.text.secondary} />
                                    <RechartsTooltip
                                        labelFormatter={(value) => moment(value).format('MMM DD, YYYY')}
                                        contentStyle={{
                                            backgroundColor: themeColors.background.secondary,
                                            borderColor: themeColors.border.primary,
                                            color: themeColors.text.primary,
                                        }}
                                    />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="present"
                                        stackId="1"
                                        stroke={successColor}
                                        fill={alpha(successColor, 0.6)}
                                        name={t('studentAttendance.status.present')}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="absent"
                                        stackId="1"
                                        stroke={errorColor}
                                        fill={alpha(errorColor, 0.6)}
                                        name={t('studentAttendance.status.absent')}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="late"
                                        stackId="1"
                                        stroke={warningColor}
                                        fill={alpha(warningColor, 0.6)}
                                        name={t('studentAttendance.status.late')}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="leave"
                                        stackId="1"
                                        stroke={infoColor}
                                        fill={alpha(infoColor, 0.6)}
                                        name={t('studentAttendance.status.leave')}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Box>
                    </CardContent>
                </Card>
            </motion.div>
        );
    };

    const renderStudentList = () => {
        // Process attendance data for current student
        const processedAttendanceData = processAttendanceData();

        return (
            <motion.div variants={itemVariants}>
                <Card
                    sx={{
                        backgroundColor: themeColors.background.primary,
                        border: `1px solid ${themeColors.border.primary}`,
                    }}
                >
                    <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: themeColors.text.primary }}>
                            <PersonIcon sx={{ color: primaryColor }} />
                            {t('studentAttendance.sections.summary')}
                        </Typography>

                        {processedAttendanceData && (
                            <Box>
                                {/* Student Info Card */}
                                <Card
                                    sx={{
                                        mb: 3,
                                        backgroundColor: themeColors.background.secondary,
                                        border: `1px solid ${themeColors.border.primary}`,
                                    }}
                                >
                                    <CardContent>
                                        <Box display="flex" alignItems="center" gap={3} mb={3}>
                                            <Avatar sx={{ bgcolor: primaryColor, width: 80, height: 80, color: inverseColor }}>
                                                {processedAttendanceData.student.studentName?.charAt(0) || 'S'}
                                            </Avatar>
                                            <Box flex={1}>
                                                <Typography variant="h5" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                                                    {processedAttendanceData.student.studentName}
                                                </Typography>
                                                <Typography variant="body1" sx={{ color: themeColors.text.secondary, mb: 1 }}>
                                                    {processedAttendanceData.student.studentID}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                    {processedAttendanceData.grade.gradeName} - {processedAttendanceData.section.sectionName}
                                                </Typography>
                                            </Box>
                                            <Box textAlign="right">
                                                <Typography variant="h4" fontWeight="bold" sx={{ color: getAttendanceColor(processedAttendanceData.attendancePercentage) }}>
                                                    {processedAttendanceData.attendancePercentage.toFixed(1)}%
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                    {t('studentAttendance.labels.overallAttendance')}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {/* Attendance Stats */}
                                        <Grid container spacing={2}>
                                            <Grid item xs={6} sm={3}>
                                                <Box textAlign="center" p={2} sx={{ backgroundColor: alpha(successColor, 0.1), borderRadius: 2 }}>
                                                    <Typography variant="h6" fontWeight="bold" sx={{ color: successColor }}>
                                                        {processedAttendanceData.presentDays}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                        {t('studentAttendance.stats.presentDays')}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={6} sm={3}>
                                                <Box textAlign="center" p={2} sx={{ backgroundColor: alpha(errorColor, 0.1), borderRadius: 2 }}>
                                                    <Typography variant="h6" fontWeight="bold" sx={{ color: errorColor }}>
                                                        {processedAttendanceData.absentDays}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                        {t('studentAttendance.stats.absentDays')}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={6} sm={3}>
                                                <Box textAlign="center" p={2} sx={{ backgroundColor: alpha(warningColor, 0.1), borderRadius: 2 }}>
                                                    <Typography variant="h6" fontWeight="bold" sx={{ color: warningColor }}>
                                                        {processedAttendanceData.lateDays}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                        {t('studentAttendance.stats.lateDays')}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={6} sm={3}>
                                                <Box textAlign="center" p={2} sx={{ backgroundColor: alpha(infoColor, 0.1), borderRadius: 2 }}>
                                                    <Typography variant="h6" fontWeight="bold" sx={{ color: infoColor }}>
                                                        {processedAttendanceData.leaveDays}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                        {t('studentAttendance.stats.leaveDays')}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>

                                {/* Attendance Progress */}
                                <Box mb={3}>
                                    <Typography variant="h6" gutterBottom sx={{ color: themeColors.text.primary }}>
                                        {t('studentAttendance.sections.progress')}
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={processedAttendanceData.attendancePercentage}
                                        sx={{
                                            height: 12,
                                            borderRadius: 6,
                                            mb: 2,
                                            backgroundColor: themeColors.background.secondary,
                                            '& .MuiLinearProgress-bar': {
                                                backgroundColor: getAttendanceColor(processedAttendanceData.attendancePercentage)
                                            }
                                        }}
                                    />
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                            {t('studentAttendance.labels.daysAttended', { present: processedAttendanceData.presentDays, total: processedAttendanceData.totalDays })}
                                        </Typography>
                                        <Typography
                                            variant="body2"
                                            fontWeight="bold"
                                            sx={{ color: getAttendanceColor(processedAttendanceData.attendancePercentage) }}
                                        >
                                            {processedAttendanceData.attendancePercentage.toFixed(1)}%
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        );
    };

    const renderDailyAttendance = () => {
        const processedAttendanceData = processAttendanceData();

        return (
            <motion.div variants={itemVariants}>
                <Card
                    sx={{
                        backgroundColor: themeColors.background.primary,
                        border: `1px solid ${themeColors.border.primary}`,
                    }}
                >
                    <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: themeColors.text.primary }}>
                            <CalendarIcon sx={{ color: primaryColor }} />
                            {t('studentAttendance.sections.dailyRecords')}
                        </Typography>

                        {processedAttendanceData && (
                            <TableContainer
                                sx={{
                                    backgroundColor: themeColors.background.secondary,
                                    border: `1px solid ${themeColors.border.primary}`,
                                }}
                            >
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: themeColors.background.secondary }}>
                                            <TableCell sx={{ color: themeColors.text.primary }}>{t('studentAttendance.table.date')}</TableCell>
                                            <TableCell sx={{ color: themeColors.text.primary }}>{t('studentAttendance.table.day')}</TableCell>
                                            <TableCell sx={{ color: themeColors.text.primary }}>{t('studentAttendance.table.status')}</TableCell>
                                            <TableCell sx={{ color: themeColors.text.primary }}>{t('studentAttendance.table.timeIn')}</TableCell>
                                            <TableCell sx={{ color: themeColors.text.primary }}>{t('studentAttendance.table.timeOut')}</TableCell>
                                            <TableCell sx={{ color: themeColors.text.primary }}>{t('studentAttendance.table.duration')}</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {processedAttendanceData.attendance.map((record, index) => (
                                            <TableRow
                                                key={`${processedAttendanceData._id}-${index}`}
                                                hover
                                                sx={{
                                                    '&:nth-of-type(odd)': {
                                                        backgroundColor: alpha(themeColors.background.secondary, 0.6),
                                                    },
                                                }}
                                            >
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ color: themeColors.text.primary }}>
                                                        {moment(record.date).format('DD MMM YYYY')}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                        {moment(record.date).format('dddd')}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={record.status}
                                                        color={getStatusColor(record.status)}
                                                        size="small"
                                                        icon={getStatusIcon(record.status)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {record.timeIn ? (
                                                        <Typography variant="body2" sx={{ color: themeColors.text.primary }}>
                                                            {record.timeIn}
                                                        </Typography>
                                                    ) : (
                                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                            -
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {record.timeOut ? (
                                                        <Typography variant="body2" sx={{ color: themeColors.text.primary }}>
                                                            {record.timeOut}
                                                        </Typography>
                                                    ) : (
                                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                            -
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {record.timeIn && record.timeOut ? (
                                                        <Typography variant="body2" sx={{ color: themeColors.text.primary }}>
                                                            {calculateDuration(record.timeIn, record.timeOut)}
                                                        </Typography>
                                                    ) : (
                                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                            -
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        );
    };

    if (loading) {
        return (
            <CustomOutletBox>
                <Box
                    display="flex"
                    flexDirection="column"
                    justifyContent="center"
                    alignItems="center"
                    minHeight="400px"
                >
                    <CircularProgress size={60} sx={{ color: themeColors.primary, mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        {t('studentAttendance.messages.loading')}
                    </Typography>
                </Box>
            </CustomOutletBox>
        );
    }

    if (error) {
        return (
            <CustomOutletBox>
                <Alert severity="error" sx={{ mb: 2 }}>
                    {t('studentAttendance.messages.loadError', { error: error?.data?.message || error?.message || t('studentAttendance.messages.defaultError') })}
                </Alert>
                <Box display="flex" justifyContent="center" mt={2}>
                    <Button variant="contained" onClick={handleRefresh}>
                        {t('studentAttendance.actions.retry')}
                    </Button>
                </Box>
            </CustomOutletBox>
        );
    }



    return (
        <CustomOutletBox>
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.div variants={itemVariants}>
                    <Box mb={3}>
                        <Typography variant="h4" gutterBottom sx={{
                            background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontWeight: 'bold'
                        }}>
                            {t('studentAttendance.title')}
                        </Typography>
                        <Typography variant="body1" sx={{ color: themeColors.text.secondary }}>
                            {t('studentAttendance.subtitle')}
                        </Typography>
                    </Box>
                </motion.div>

                {/* Tabs */}
                <motion.div variants={itemVariants}>
                    <Card
                        sx={{
                            mb: 3,
                            backgroundColor: themeColors.background.primary,
                            border: `1px solid ${themeColors.border.primary}`,
                        }}
                    >
                        <Box sx={{ borderBottom: 1, borderColor: themeColors.border.primary }}>
                            <Tabs
                                value={selectedTab}
                                onChange={(e, newValue) => setSelectedTab(newValue)}
                                textColor="inherit"
                                indicatorColor="primary"
                                sx={{
                                    '& .MuiTab-root': {
                                        color: themeColors.text.secondary,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        '&.Mui-selected': {
                                            color: primaryColor,
                                        },
                                    },
                                }}
                            >
                                <Tab label={t('studentAttendance.tabs.overview')} />
                                <Tab label={t('studentAttendance.tabs.summary')} />
                                <Tab label={t('studentAttendance.tabs.dailyRecords')} />
                                <Tab label={t('studentAttendance.tabs.reports')} />
                            </Tabs>
                        </Box>
                    </Card>
                </motion.div>

                {/* Tab Content */}
                {selectedTab === 0 && (
                    <>
                        {renderAttendanceOverview()}
                        {renderAttendanceChart()}
                    </>
                )}

                {selectedTab === 1 && renderStudentList()}

                {selectedTab === 2 && renderDailyAttendance()}

                {selectedTab === 3 && (
                    <motion.div variants={itemVariants}>
                        <Card
                            sx={{
                                backgroundColor: themeColors.background.primary,
                                border: `1px solid ${themeColors.border.primary}`,
                            }}
                        >
                            <CardContent>
                                <Typography variant="h6" gutterBottom sx={{ color: themeColors.text.primary }}>
                                    {t('studentAttendance.sections.reports')}
                                </Typography>
                                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                    {t('studentAttendance.messages.comingSoon')}
                                </Typography>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

            </motion.div>
        </CustomOutletBox>
    );
};

export default StudentAttendance;
