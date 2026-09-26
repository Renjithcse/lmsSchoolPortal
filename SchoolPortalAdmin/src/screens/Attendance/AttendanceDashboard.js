import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
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
    LineElement,
    Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { 
    Box, 
    Grid, 
    Card, 
    CardContent, 
    Typography, 
    Avatar, 
    Button, 
    Chip, 
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    Select,
    MenuItem,
    Alert,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    InputLabel,
    Tabs,
    Tab,
    Divider
} from '@mui/material';

import CommonFilter from '../../components/Common/CommonFilter';
import ReportFilter from '../../components/Common/ReportFilter';
import ComprehensiveFilter from '../../components/Common/ComprehensiveFilter';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { 
    useGetAttendanceDashboardQuery,
    useBulkMarkAttendanceMutation,
    useGetRegisteredActiveStudentsQuery,
    useGetAttendanceByDateQuery,
    useUpdateAttendanceMutation
} from '../../Redux/features/Attendance/attendanceSlice';
import { useGetUsersByRoleQuery } from '../../Redux/features/Users/userDetailsSlice';
import { useLazyGetMyGradePermissionsQuery, useLazyGetMyGenderPermissionsQuery, useLazyGetMySectionPermissionsQuery } from '../../Redux/features/Admin/TeachersSlice';

import { useSnackbar } from '../../hooks/SnackBar';
import moment from 'moment/moment';
import { useTranslation } from 'react-i18next';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import BiometricIcon from '@mui/icons-material/Fingerprint';
import MobileIcon from '@mui/icons-material/PhoneAndroid';
import WebIcon from '@mui/icons-material/Web';
import RfidIcon from '@mui/icons-material/Contactless';
import GroupIcon from '@mui/icons-material/Group';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AttendanceReportMenu from '../../components/Attendance/AttendanceReportMenu';
import { useAbility } from '../../AbilityContext';

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
    LineElement,
    Filler
);

const AttendanceDashboard = () => {
    const { themeColors } = useThemeContext();
    const showSnackbar = useSnackbar();
    const { t } = useTranslation();
    const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));

    const ability = useAbility();

    const [manualAttendanceDialogOpen, setManualAttendanceDialogOpen] = useState(false);
    const [attendanceType, setAttendanceType] = useState('student'); // 'student' or 'teacher'
    const [attendanceData, setAttendanceData] = useState({});
    const [shouldFetchStudents, setShouldFetchStudents] = useState(false);
    const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [shouldClearStudents, setShouldClearStudents] = useState(false);
    const [reportMenuOpen, setReportMenuOpen] = useState(false);

    // Function to clear students data by setting state
    const clearStudentsDataState = () => {
        setShouldFetchStudents(false);
        setShouldClearStudents(true);
    };





    // Form for filters
    const { control: filtersControl } = useForm({
        defaultValues: {
            date: selectedDate,
            grade_id: ''
        }
    });

    // CommonFilter state for main filters
    const [filterValues, setFilterValues] = useState({
        academic_id: null,
        grade_id: null,
        gender: '',
        section: ''
    });

    // CommonFilter state for manual attendance
    const [manualAttendanceFilterValues, setManualAttendanceFilterValues] = useState({
        grade_id: null,
        gender: '',
        section: ''
    });

    // Refs to track the last triggered values for cascading filters
    const lastGradeId = useRef(null);
    const lastSectionParams = useRef(null);

    // API calls for cascading filters
    const [triggerGrades, { data: grades, isFetching: gradeLoading }] = useLazyGetMyGradePermissionsQuery();
    const [triggerGenders, { data: genders, isFetching: genderLoading }] = useLazyGetMyGenderPermissionsQuery();
    const [triggerSections, { data: sections, isFetching: sectionLoading }] = useLazyGetMySectionPermissionsQuery();

    // Fetch data
    const { data: dashboardData, isLoading: dashboardLoading, refetch: refetchDashboard } = useGetAttendanceDashboardQuery();

    const [bulkMarkAttendance] = useBulkMarkAttendanceMutation();
    const [updateAttendance] = useUpdateAttendanceMutation();

    // Query for attendance history (for statistics only)
    const { data: historyData } = useGetAttendanceByDateQuery({
        date: selectedDate
    }, {
        skip: false
    });

    // Query for fetching registered active students
    const queryParams = shouldFetchStudents && attendanceType === 'student' && manualAttendanceFilterValues.grade_id && manualAttendanceFilterValues.gender && manualAttendanceFilterValues.section ? {
        grade: manualAttendanceFilterValues.grade_id,
        gender: manualAttendanceFilterValues.gender,
        section: manualAttendanceFilterValues.section
    } : null;

    // Query for existing attendance data for manual attendance
    const existingAttendanceQueryParams = manualAttendanceDialogOpen ? {
        date: selectedDate,
        attendanceType: attendanceType,
        ...(attendanceType === 'student' && manualAttendanceFilterValues.grade_id ? { grade: manualAttendanceFilterValues.grade_id } : {})
    } : null;

    const { data: existingAttendanceData, isLoading: existingAttendanceLoading } = useGetAttendanceByDateQuery(
        existingAttendanceQueryParams,
        { skip: !existingAttendanceQueryParams }
    );

    // Query for fetching teachers
    const { data: teachersData, isLoading: teachersLoading, error: teachersError } = useGetUsersByRoleQuery(
        'teacher',
        { skip: attendanceType !== 'teacher' || !manualAttendanceDialogOpen }
    );



    const shouldSkip = !shouldFetchStudents || attendanceType !== 'student' || !manualAttendanceFilterValues.grade_id || !manualAttendanceFilterValues.gender || !manualAttendanceFilterValues.section || shouldClearStudents;

    const { data: studentsData, isLoading: studentsLoading, error: studentsError } = useGetRegisteredActiveStudentsQuery(
        queryParams,
        { skip: shouldSkip }
    );

    // Calculate real statistics from available data
    const calculateRealStatistics = () => {
        const stats = {
            totalStudents: 0,
            totalTeachers: 0,
            presentStudents: 0,
            presentTeachers: 0,
            absentStudents: 0,
            absentTeachers: 0,
            lateStudents: 0,
            lateTeachers: 0,
            halfDayStudents: 0,
            halfDayTeachers: 0,
            leaveStudents: 0,
            leaveTeachers: 0,
            studentAttendanceRate: 0,
            teacherAttendanceRate: 0,
            totalAttendanceRate: 0
        };

        // Calculate from history data (today's attendance)
        if (historyData?.data) {
            historyData.data.forEach(record => {
                if (record.attendanceType === 'student') {
                    stats.totalStudents++;
                    switch (record.status) {
                        case 'present':
                            stats.presentStudents++;
                            break;
                        case 'absent':
                            stats.absentStudents++;
                            break;
                        case 'late':
                            stats.lateStudents++;
                            break;
                        case 'half-day':
                            stats.halfDayStudents++;
                            break;
                        case 'leave':
                            stats.leaveStudents++;
                            break;
                    }
                } else if (record.attendanceType === 'teacher') {
                    stats.totalTeachers++;
                    switch (record.status) {
                        case 'present':
                            stats.presentTeachers++;
                            break;
                        case 'absent':
                            stats.absentTeachers++;
                            break;
                        case 'late':
                            stats.lateTeachers++;
                            break;
                        case 'half-day':
                            stats.halfDayTeachers++;
                            break;
                        case 'leave':
                            stats.leaveTeachers++;
                            break;
                    }
                }
            });
        }

        // Calculate attendance rates
        if (stats.totalStudents > 0) {
            stats.studentAttendanceRate = Math.round(((stats.presentStudents + stats.lateStudents + stats.halfDayStudents) / stats.totalStudents) * 100);
        }
        if (stats.totalTeachers > 0) {
            stats.teacherAttendanceRate = Math.round(((stats.presentTeachers + stats.lateTeachers + stats.halfDayTeachers) / stats.totalTeachers) * 100);
        }
        if (stats.totalStudents + stats.totalTeachers > 0) {
            stats.totalAttendanceRate = Math.round((((stats.presentStudents + stats.lateStudents + stats.halfDayStudents) + (stats.presentTeachers + stats.lateTeachers + stats.halfDayTeachers)) / (stats.totalStudents + stats.totalTeachers)) * 100);
        }

        return stats;
    };

    const realStats = calculateRealStatistics();

    // Prepare chart data
    const prepareChartData = () => {
        // Status distribution chart data
        const statusData = {
            labels: [
                t('attendance.dashboard.status.present'),
                t('attendance.dashboard.status.absent'),
                t('attendance.dashboard.status.late'),
                t('attendance.dashboard.status.halfDay'),
                t('attendance.dashboard.status.leave')
            ],
            datasets: [
                {
                    label: t('attendance.dashboard.charts.students'),
                    data: [
                        realStats.presentStudents,
                        realStats.absentStudents,
                        realStats.lateStudents,
                        realStats.halfDayStudents,
                        realStats.leaveStudents
                    ],
                    backgroundColor: [
                        themeColors.success,
                        themeColors.error,
                        themeColors.warning,
                        themeColors.accent,
                        themeColors.text.secondary
                    ],
                    borderColor: [
                        themeColors.success,
                        themeColors.error,
                        themeColors.warning,
                        themeColors.accent,
                        themeColors.text.secondary
                    ],
                    borderWidth: 1,
                },
                {
                    label: t('attendance.dashboard.charts.teachers'),
                    data: [
                        realStats.presentTeachers,
                        realStats.absentTeachers,
                        realStats.lateTeachers,
                        realStats.halfDayTeachers,
                        realStats.leaveTeachers
                    ],
                    backgroundColor: [
                        `${themeColors.success}80`,
                        `${themeColors.error}80`,
                        `${themeColors.warning}80`,
                        `${themeColors.accent}80`,
                        `${themeColors.text.secondary}80`
                    ],
                    borderColor: [
                        themeColors.success,
                        themeColors.error,
                        themeColors.warning,
                        themeColors.accent,
                        themeColors.text.secondary
                    ],
                    borderWidth: 1,
                }
            ]
        };

        // Attendance rate comparison chart data
        const attendanceRateData = {
            labels: [
                t('attendance.dashboard.charts.students'),
                t('attendance.dashboard.charts.teachers'),
                t('attendance.dashboard.charts.overall')
            ],
            datasets: [
                {
                    label: t('attendance.dashboard.charts.attendanceRate'),
                    data: [
                        realStats.studentAttendanceRate,
                        realStats.teacherAttendanceRate,
                        realStats.totalAttendanceRate
                    ],
                    backgroundColor: [
                        themeColors.primary,
                        themeColors.accent,
                        themeColors.success
                    ],
                    borderColor: [
                        themeColors.primary,
                        themeColors.accent,
                        themeColors.success
                    ],
                    borderWidth: 2,
                    borderRadius: 8,
                }
            ]
        };

        // Doughnut chart for overall distribution
        const overallDistributionData = {
            labels: [
                t('attendance.dashboard.status.present'),
                t('attendance.dashboard.status.absent'),
                t('attendance.dashboard.status.late'),
                t('attendance.dashboard.status.halfDay'),
                t('attendance.dashboard.status.leave')
            ],
            datasets: [
                {
                    data: [
                        realStats.presentStudents + realStats.presentTeachers,
                        realStats.absentStudents + realStats.absentTeachers,
                        realStats.lateStudents + realStats.lateTeachers,
                        realStats.halfDayStudents + realStats.halfDayTeachers,
                        realStats.leaveStudents + realStats.leaveTeachers
                    ],
                    backgroundColor: [
                        themeColors.success,
                        themeColors.error,
                        themeColors.warning,
                        themeColors.accent,
                        themeColors.text.secondary
                    ],
                    borderColor: [
                        themeColors.success,
                        themeColors.error,
                        themeColors.warning,
                        themeColors.accent,
                        themeColors.text.secondary
                    ],
                    borderWidth: 2,
                }
            ]
        };

        // Line chart for attendance trends (mock data for now)
        const attendanceTrendData = {
            labels: [
                t('dashboard.charts.days.mon'),
                t('dashboard.charts.days.tue'),
                t('dashboard.charts.days.wed'),
                t('dashboard.charts.days.thu'),
                t('dashboard.charts.days.fri'),
                t('attendance.dashboard.charts.sat'),
                t('attendance.dashboard.charts.sun')
            ],
            datasets: [
                {
                    label: t('attendance.dashboard.charts.studentAttendanceRate'),
                    data: [85, 88, 92, 87, 90, 0, 0], // Mock data
                    borderColor: themeColors.primary,
                    backgroundColor: `${themeColors.primary}20`,
                    tension: 0.4,
                    fill: true,
                },
                {
                    label: t('attendance.dashboard.charts.teacherAttendanceRate'),
                    data: [95, 92, 98, 94, 96, 0, 0], // Mock data
                    borderColor: themeColors.accent,
                    backgroundColor: `${themeColors.accent}20`,
                    tension: 0.4,
                    fill: true,
                }
            ]
        };

        return {
            statusData,
            attendanceRateData,
            overallDistributionData,
            attendanceTrendData
        };
    };

    const chartData = prepareChartData();

    // Chart options
    const chartOptions = {
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
            tooltip: {
                backgroundColor: themeColors.background.primary,
                titleColor: themeColors.text.primary,
                bodyColor: themeColors.text.primary,
                borderColor: themeColors.border.primary,
                borderWidth: 1,
            }
        },
        scales: {
            x: {
                ticks: {
                    color: themeColors.text.primary,
                },
                grid: {
                    color: themeColors.border.primary,
                }
            },
            y: {
                ticks: {
                    color: themeColors.text.primary,
                },
                grid: {
                    color: themeColors.border.primary,
                }
            }
        }
    };



    const handleManualAttendance = () => {
        setManualAttendanceDialogOpen(true);
        setShouldFetchStudents(false);
        setAttendanceData({});
        setShouldClearStudents(true);
        clearStudentsDataState();
        // Reset filter values to ensure clean state
        setManualAttendanceFilterValues({
            grade_id: null,
            gender: '',
            section: ''
        });
        // Reset section params tracking
        lastSectionParams.current = null;
        // Trigger grades loading for manual attendance dialog
        triggerGrades({});
    };



    const handleAttendanceStatusChange = (personId, status) => {
        setAttendanceData(prev => ({
            ...prev,
            [personId]: status
        }));
    };

    const handleConsolidateAll = (status) => {
        if (!manualAttendanceDialogOpen) return;
        setAttendanceData(prev => {
            const updated = { ...prev };
            if (studentsData?.data) {
                studentsData.data.forEach(student => {
                    updated[student._id] = status;
                });
            }
            return updated;
        });
    };

    const handleSubmitManualAttendance = async () => {
        try {
            setIsSubmitting(true);
            const isUpdate = existingAttendanceData?.data && existingAttendanceData.data.length > 0;
            
            if (isUpdate) {
                // Handle updates for existing attendance records
                const updatePromises = [];
                
                for (const [personId, status] of Object.entries(attendanceData)) {
                    // Find the existing attendance record for this person
                    const existingRecord = existingAttendanceData.data.find(record => 
                        (attendanceType === 'student' && record.student && record.student._id === personId) ||
                        (attendanceType === 'teacher' && record.teacher && record.teacher._id === personId)
                    );
                    
                    if (existingRecord) {
                        // Update existing record
                        updatePromises.push(
                            updateAttendance({
                                id: existingRecord._id,
                                status,
                                notes: 'Manually updated attendance'
                            }).unwrap()
                        );
                    } else {
                        // Create new record for this person
                        updatePromises.push(
                            bulkMarkAttendance({
                                attendanceData: [{
                                    attendanceType: attendanceType,
                                    status,
                                    notes: 'Manually marked attendance',
                                    [attendanceType === 'student' ? 'studentId' : 'teacherId']: personId
                                }],
                                date: selectedDate,
                                grade: attendanceType === 'student' ? manualAttendanceFilterValues.grade_id : null
                            }).unwrap()
                        );
                    }
                }
                
                await Promise.all(updatePromises);
            } else {
                // Handle new attendance records
                const attendanceRecords = Object.entries(attendanceData).map(([personId, status]) => ({
                    attendanceType: attendanceType,
                    status,
                    notes: 'Manually marked attendance',
                    [attendanceType === 'student' ? 'studentId' : 'teacherId']: personId
                }));

                await bulkMarkAttendance({
                    attendanceData: attendanceRecords,
                    date: selectedDate,
                    grade: attendanceType === 'student' ? manualAttendanceFilterValues.grade_id : null
                }).unwrap();
            }

            showSnackbar(t('attendance.dashboard.messages.success', { action: isUpdate ? t('attendance.dashboard.messages.updated') : t('attendance.dashboard.messages.marked') }), 'success');
            setManualAttendanceDialogOpen(false);
            setAttendanceData({});
            setShouldFetchStudents(false);
            setShouldClearStudents(true);
            clearStudentsDataState();
            // Clear students data by resetting the query
            if (attendanceType === 'student') {
                setManualAttendanceFilterValues({
                    grade_id: null,
                    gender: '',
                    section: ''
                });
            }
            refetchDashboard();
        } catch (error) {
            showSnackbar(error?.data?.message || t('attendance.dashboard.messages.failed'), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle CommonFilter changes for main filters
    const handleFilterChange = (newValues) => {
        setFilterValues(newValues);
        // You can add additional logic here to refetch data based on new filters
    };



    // Auto-trigger grades when manual attendance dialog opens for students
    useEffect(() => {
        if (manualAttendanceDialogOpen && attendanceType === 'student') {
            // Trigger grades without academic year - API will get it from Settings
            triggerGrades({});
            
            // If we already have grade and gender selected, trigger sections
            if (manualAttendanceFilterValues.grade_id && manualAttendanceFilterValues.gender) {
                const sectionParams = { grade: manualAttendanceFilterValues.grade_id, gender: manualAttendanceFilterValues.gender };
                const paramsKey = `${manualAttendanceFilterValues.grade_id}-${manualAttendanceFilterValues.gender}`;
                
                // Only trigger if parameters have changed
                if (lastSectionParams.current !== paramsKey) {
                    triggerSections(sectionParams);
                    lastSectionParams.current = paramsKey;
                }
            }
        }
    }, [manualAttendanceDialogOpen, attendanceType, triggerGrades, triggerSections, manualAttendanceFilterValues.grade_id, manualAttendanceFilterValues.gender]);

    // Clear attendance data when dialog opens or filter values change
    useEffect(() => {
        if (manualAttendanceDialogOpen) {
            setAttendanceData({});
        } else {
            // Clear students data when dialog closes
            setShouldFetchStudents(false);
            setAttendanceData({});
            setShouldClearStudents(true);
            clearStudentsDataState();
        }
    }, [manualAttendanceDialogOpen]);

    // Load existing attendance data when students/teachers are loaded and existing attendance data is available
    useEffect(() => {
        if (manualAttendanceDialogOpen && 
            existingAttendanceData?.data && 
            Object.keys(attendanceData).length === 0) {
            
            // Create a map of existing attendance data by person ID
            const existingAttendanceMap = {};
            existingAttendanceData.data.forEach(record => {
                if (attendanceType === 'student' && record.student && record.student._id) {
                    existingAttendanceMap[record.student._id] = record.status;
                } else if (attendanceType === 'teacher' && record.teacher && record.teacher._id) {
                    existingAttendanceMap[record.teacher._id] = record.status;
                }
            });
            
            // Pre-populate attendance data with existing values
            setAttendanceData(existingAttendanceMap);
        }
    }, [manualAttendanceDialogOpen, attendanceType, existingAttendanceData?.data, attendanceData]);

    // Clear attendance data when filter values change (new student list loaded)
    useEffect(() => {
        if (manualAttendanceDialogOpen && shouldFetchStudents) {
            setAttendanceData({});
        }
    }, [manualAttendanceFilterValues.grade_id, manualAttendanceFilterValues.gender, manualAttendanceFilterValues.section, manualAttendanceDialogOpen, shouldFetchStudents]);

    // Handle CommonFilter changes for manual attendance
    const handleManualAttendanceFilterChange = (newValues) => {
        // Handle the data structure from onSelectionChange
        const filterValues = newValues.values || newValues;
        
        setManualAttendanceFilterValues(filterValues);
        
        // Trigger cascading filter logic
        if (filterValues.grade_id && filterValues.gender) {
            const sectionParams = { grade: filterValues.grade_id, gender: filterValues.gender };
            const paramsKey = `${filterValues.grade_id}-${filterValues.gender}`;
            
            // Only trigger if parameters have changed
            if (lastSectionParams.current !== paramsKey) {
                triggerSections(sectionParams);
                lastSectionParams.current = paramsKey;
            }
        }
        
        // Check if all required filters are selected for students
        const allFiltersSelected = attendanceType === 'student' && 
            filterValues.grade_id && 
            filterValues.gender && 
            filterValues.section;
        
        if (allFiltersSelected) {
            setShouldFetchStudents(true);
            setShouldClearStudents(false);
        } else {
            setShouldFetchStudents(false);
        }
    };




    const getStatusColor = (status) => {
        switch (status) {
            case 'present': return themeColors.success || '#4caf50';
            case 'absent': return themeColors.error || '#f44336';
            case 'late': return themeColors.warning || '#ff9800';
            case 'half-day': return themeColors.accent || '#9c27b0';
            case 'leave': return themeColors.text?.secondary || '#666666';
            default: return themeColors.text?.secondary || '#666666';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'present': return <CheckCircleIcon />;
            case 'absent': return <CancelIcon />;
            case 'late': return <ScheduleIcon />;
            case 'half-day': return <TrendingUpIcon />;
            case 'leave': return <TrendingDownIcon />;
            default: return <PersonIcon />;
        }
    };

    const getAttendanceMethodIcon = (method) => {
        switch (method) {
            case 'biometric': return <BiometricIcon />;
            case 'rfid': return <RfidIcon />;
            case 'mobile': return <MobileIcon />;
            case 'web': return <WebIcon />;
            case 'manual': return <EditIcon />;
            default: return <PersonIcon />;
        }
    };

    const StatCard = ({ title, value, icon, color, subtitle, trend }) => (
        <Card sx={{ 
            backgroundColor: themeColors.background.primary, 
            border: `1px solid ${themeColors.border.primary}`,
            height: '100%'
        }}>
            <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: color }}>
                            {value}
                        </Typography>
                        <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 1 }}>
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                                {subtitle}
                            </Typography>
                        )}
                        {trend && (
                            <Box display="flex" alignItems="center" gap={0.5} mt={1}>
                                {trend > 0 ? (
                                    <TrendingUpIcon sx={{ fontSize: 16, color: themeColors.success }} />
                                ) : (
                                    <TrendingDownIcon sx={{ fontSize: 16, color: themeColors.error }} />
                                )}
                                <Typography variant="caption" sx={{ 
                                    color: trend > 0 ? themeColors.success : themeColors.error 
                                }}>
                                    {t('attendance.dashboard.trend', { percent: Math.abs(trend) })}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    <Avatar sx={{ 
                        width: 48, 
                        height: 48, 
                        backgroundColor: `${color}20`,
                        color: color 
                    }}>
                        {icon}
                    </Avatar>
                </Box>
            </CardContent>
        </Card>
    );

    const AttendanceCard = ({ attendance }) => (
        <Card sx={{ 
            backgroundColor: themeColors.background.primary, 
            border: `1px solid ${themeColors.border.primary}`,
            mb: 2
        }}>
            <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ 
                            width: 40, 
                            height: 40, 
                            backgroundColor: `${getStatusColor(attendance.status)}20`,
                            color: getStatusColor(attendance.status)
                        }}>
                            {getStatusIcon(attendance.status)}
                        </Avatar>
                        <Box>
                            <Typography variant="h6" sx={{ color: themeColors.text.primary }}>
                                {attendance.student?.name || attendance.teacher?.name}
                            </Typography>
                            <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                {attendance.student?.rollNumber || attendance.teacher?.employeeId}
                            </Typography>
                        </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                            icon={getAttendanceMethodIcon(attendance.attendanceMethod)}
                            label={attendance.attendanceMethod}
                            size="small"
                            sx={{
                                backgroundColor: themeColors.primary,
                                color: 'white',
                                fontWeight: 'bold'
                            }}
                        />
                        <Chip
                            icon={getStatusIcon(attendance.status)}
                            label={attendance.status}
                            size="small"
                            sx={{
                                backgroundColor: getStatusColor(attendance.status),
                                color: 'white',
                                fontWeight: 'bold'
                            }}
                        />
                    </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={2} mt={2}>
                    <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                        Time: {moment(attendance.timeIn).format('HH:mm')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                        Method: {attendance.attendanceMethod}
                    </Typography>
                    {attendance.location && (
                        <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                            GPS: {attendance.location.latitude}, {attendance.location.longitude}
                        </Typography>
                    )}
                </Box>
            </CardContent>
        </Card>
    );



    return (
        <Box sx={{ p: 3, backgroundColor: themeColors.background.secondary, minHeight: '100vh' }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ width: 48, height: 48, backgroundColor: themeColors.primary }}>
                        <SchoolIcon sx={{ fontSize: 24 }} />
                    </Avatar>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                            {t('attendance.dashboard.title')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                            {t('attendance.dashboard.subtitle')}
                        </Typography>
                    </Box>
                </Box>
                <Box display="flex" gap={2}>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={refetchDashboard}
                        sx={{
                            borderColor: themeColors.primary,
                            color: themeColors.primary,
                            '&:hover': {
                                borderColor: themeColors.primary,
                                backgroundColor: `${themeColors.primary}22`,
                            },
                        }}
                    >
                        {t('attendance.dashboard.actions.refresh')}
                    </Button>
                    {ability.can("Create", "Attendance") && <Button
                        variant="outlined"
                        startIcon={<GroupIcon />}
                        onClick={handleManualAttendance}
                        sx={{
                            borderColor: themeColors.accent,
                            color: themeColors.accent,
                            '&:hover': {
                                borderColor: themeColors.accent,
                                backgroundColor: `${themeColors.accent}22`,
                            },
                        }}
                    >
                        {t('attendance.dashboard.actions.manualAttendance')}
                    </Button>}
                </Box>
            </Box>

            {/* Statistics */}
            <Box mb={4}>
                <Typography variant="h5" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                    {t('attendance.dashboard.todaysOverview', { date: moment(selectedDate).format('MMMM DD, YYYY') })}
                </Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title={t('attendance.dashboard.stats.totalPresent')}
                            value={realStats.presentStudents + realStats.presentTeachers}
                            icon={<CheckCircleIcon />}
                            color={themeColors.success}
                            subtitle={t('attendance.dashboard.stats.presentSubtitle', { students: realStats.presentStudents, teachers: realStats.presentTeachers })}
                            trend={realStats.totalAttendanceRate > 0 ? realStats.totalAttendanceRate : null}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title={t('attendance.dashboard.stats.totalAbsent')}
                            value={realStats.absentStudents + realStats.absentTeachers}
                            icon={<CancelIcon />}
                            color={themeColors.error}
                            subtitle={t('attendance.dashboard.stats.absentSubtitle', { students: realStats.absentStudents, teachers: realStats.absentTeachers })}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title={t('attendance.dashboard.stats.lateArrivals')}
                            value={realStats.lateStudents + realStats.lateTeachers}
                            icon={<ScheduleIcon />}
                            color={themeColors.warning}
                            subtitle={t('attendance.dashboard.stats.lateSubtitle', { students: realStats.lateStudents, teachers: realStats.lateTeachers })}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title={t('attendance.dashboard.stats.halfDay')}
                            value={realStats.halfDayStudents + realStats.halfDayTeachers}
                            icon={<TrendingUpIcon />}
                            color={themeColors.accent}
                            subtitle={t('attendance.dashboard.stats.halfDaySubtitle', { students: realStats.halfDayStudents, teachers: realStats.halfDayTeachers })}
                        />
                    </Grid>
                </Grid>
                
                {/* Additional Statistics */}
                <Grid container spacing={3} sx={{ mt: 2 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title={t('attendance.dashboard.stats.studentAttendanceRate')}
                            value={`${realStats.studentAttendanceRate}%`}
                            icon={<SchoolIcon />}
                            color={realStats.studentAttendanceRate >= 90 ? themeColors.success : realStats.studentAttendanceRate >= 75 ? themeColors.warning : themeColors.error}
                            subtitle={t('attendance.dashboard.stats.studentRateSubtitle', { present: realStats.presentStudents + realStats.lateStudents + realStats.halfDayStudents, total: realStats.totalStudents })}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title={t('attendance.dashboard.stats.teacherAttendanceRate')}
                            value={`${realStats.teacherAttendanceRate}%`}
                            icon={<PersonIcon />}
                            color={realStats.teacherAttendanceRate >= 90 ? themeColors.success : realStats.teacherAttendanceRate >= 75 ? themeColors.warning : themeColors.error}
                            subtitle={t('attendance.dashboard.stats.teacherRateSubtitle', { present: realStats.presentTeachers + realStats.lateTeachers + realStats.halfDayTeachers, total: realStats.totalTeachers })}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title={t('attendance.dashboard.stats.onLeave')}
                            value={realStats.leaveStudents + realStats.leaveTeachers}
                            icon={<TrendingDownIcon />}
                            color={themeColors.text.secondary}
                            subtitle={t('attendance.dashboard.stats.leaveSubtitle', { students: realStats.leaveStudents, teachers: realStats.leaveTeachers })}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title={t('attendance.dashboard.stats.totalRecords')}
                            value={realStats.totalStudents + realStats.totalTeachers}
                            icon={<PersonIcon />}
                            color={themeColors.primary}
                            subtitle={t('attendance.dashboard.stats.recordsSubtitle', { students: realStats.totalStudents, teachers: realStats.totalTeachers })}
                        />
                    </Grid>
                </Grid>
            </Box>
             {/* Charts Section */}
             <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2, mt: 4 }}>
                                {t('attendance.dashboard.charts.visualAnalytics')}
                            </Typography>
                            
                            {/* Charts Grid */}
                            <Grid container spacing={3} sx={{ mb: 4 }}>
                                {/* Status Distribution Chart */}
                                <Grid item xs={12} md={6}>
                                    <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, height: 400 }}>
                                        <CardContent>
                                            <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                                                {t('attendance.dashboard.charts.statusDistribution')}
                                            </Typography>
                                            <Box sx={{ height: 300 }}>
                                                <Bar 
                                                    data={chartData.statusData} 
                                                    options={{
                                                        ...chartOptions,
                                                        plugins: {
                                                            ...chartOptions.plugins,
                                                            title: {
                                                                display: true,
                                                                text: t('attendance.dashboard.charts.statusByType'),
                                                                color: themeColors.text.primary,
                                                                font: { size: 14, weight: 'bold' }
                                                            }
                                                        }
                                                    }}
                                                />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Attendance Rate Comparison */}
                                <Grid item xs={12} md={6}>
                                    <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, height: 400 }}>
                                        <CardContent>
                                            <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                                                {t('attendance.dashboard.charts.rateComparison')}
                                            </Typography>
                                            <Box sx={{ height: 300 }}>
                                                <Bar 
                                                    data={chartData.attendanceRateData} 
                                                    options={{
                                                        ...chartOptions,
                                                        plugins: {
                                                            ...chartOptions.plugins,
                                                            title: {
                                                                display: true,
                                                                text: t('attendance.dashboard.charts.ratesPercent'),
                                                                color: themeColors.text.primary,
                                                                font: { size: 14, weight: 'bold' }
                                                            }
                                                        },
                                                        scales: {
                                                            ...chartOptions.scales,
                                                            y: {
                                                                ...chartOptions.scales.y,
                                                                beginAtZero: true,
                                                                max: 100
                                                            }
                                                        }
                                                    }}
                                                />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Overall Distribution Doughnut */}
                                <Grid item xs={12} md={6}>
                                    <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, height: 400 }}>
                                        <CardContent>
                                            <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                                                {t('attendance.dashboard.charts.overallDistribution')}
                                            </Typography>
                                            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                <Doughnut 
                                                    data={chartData.overallDistributionData} 
                                                    options={{
                                                        ...chartOptions,
                                                        plugins: {
                                                            ...chartOptions.plugins,
                                                            title: {
                                                                display: true,
                                                                text: t('attendance.dashboard.charts.totalDistribution'),
                                                                color: themeColors.text.primary,
                                                                font: { size: 14, weight: 'bold' }
                                                            }
                                                        }
                                                    }}
                                                />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Attendance Trends */}
                                <Grid item xs={12} md={6}>
                                    <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, height: 400 }}>
                                        <CardContent>
                                            <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                                                {t('attendance.dashboard.charts.weeklyTrends')}
                                            </Typography>
                                            <Box sx={{ height: 300 }}>
                                                <Line 
                                                    data={chartData.attendanceTrendData} 
                                                    options={{
                                                        ...chartOptions,
                                                        plugins: {
                                                            ...chartOptions.plugins,
                                                            title: {
                                                                display: true,
                                                                text: t('attendance.dashboard.charts.weeklyTrendsTitle'),
                                                                color: themeColors.text.primary,
                                                                font: { size: 14, weight: 'bold' }
                                                            }
                                                        },
                                                        scales: {
                                                            ...chartOptions.scales,
                                                            y: {
                                                                ...chartOptions.scales.y,
                                                                beginAtZero: true,
                                                                max: 100
                                                            }
                                                        }
                                                    }}
                                                />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

            
            
            

            {/* Statistics Section */}
            <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, mb: 3 }}>
                <Box sx={{ p: 3 }}>
                    




                        <Box>
                            <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                                {t('attendance.dashboard.detailedStatistics')}
                            </Typography>
                            
                            {/* Summary Cards */}
                            <Grid container spacing={3} sx={{ mb: 4 }}>
                                <Grid item xs={12} sm={6} md={4}>
                                    <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                                        <CardContent>
                                            <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.success }}>
                                                {realStats.totalAttendanceRate}%
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                {t('attendance.dashboard.stats.overallAttendanceRate')}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                                        <CardContent>
                                            <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.primary }}>
                                                {realStats.totalStudents + realStats.totalTeachers}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                {t('attendance.dashboard.stats.totalRecordsToday')}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                                        <CardContent>
                                            <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.warning }}>
                                                {realStats.lateStudents + realStats.lateTeachers}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                {t('attendance.dashboard.stats.lateArrivals')}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Detailed Breakdown */}
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                                        <CardContent>
                                            <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                                                {t('attendance.dashboard.stats.studentStatistics')}
                                            </Typography>
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                    {t('attendance.dashboard.stats.totalStudents')}: <strong style={{ color: themeColors.text.primary }}>{realStats.totalStudents}</strong>
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                    {t('attendance.dashboard.status.present')}: <strong style={{ color: themeColors.success }}>{realStats.presentStudents}</strong>
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                    {t('attendance.dashboard.status.absent')}: <strong style={{ color: themeColors.error }}>{realStats.absentStudents}</strong>
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                    {t('attendance.dashboard.status.late')}: <strong style={{ color: themeColors.warning }}>{realStats.lateStudents}</strong>
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                    {t('attendance.dashboard.status.halfDay')}: <strong style={{ color: themeColors.accent }}>{realStats.halfDayStudents}</strong>
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                    {t('attendance.dashboard.status.onLeave')}: <strong style={{ color: themeColors.text.secondary }}>{realStats.leaveStudents}</strong>
                                                </Typography>
                                            </Box>
                                            <Typography variant="h6" fontWeight="bold" sx={{ 
                                                color: realStats.studentAttendanceRate >= 90 ? themeColors.success : 
                                                       realStats.studentAttendanceRate >= 75 ? themeColors.warning : themeColors.error 
                                            }}>
                                                {t('attendance.dashboard.stats.attendanceRate')}: {realStats.studentAttendanceRate}%
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                                        <CardContent>
                                            <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                                                {t('attendance.dashboard.stats.teacherStatistics')}
                                            </Typography>
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                    {t('attendance.dashboard.stats.totalTeachers')}: <strong style={{ color: themeColors.text.primary }}>{realStats.totalTeachers}</strong>
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                    {t('attendance.dashboard.status.present')}: <strong style={{ color: themeColors.success }}>{realStats.presentTeachers}</strong>
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                    {t('attendance.dashboard.status.absent')}: <strong style={{ color: themeColors.error }}>{realStats.absentTeachers}</strong>
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                    {t('attendance.dashboard.status.late')}: <strong style={{ color: themeColors.warning }}>{realStats.lateTeachers}</strong>
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                    {t('attendance.dashboard.status.halfDay')}: <strong style={{ color: themeColors.accent }}>{realStats.halfDayTeachers}</strong>
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                    {t('attendance.dashboard.status.onLeave')}: <strong style={{ color: themeColors.text.secondary }}>{realStats.leaveTeachers}</strong>
                                                </Typography>
                                            </Box>
                                            <Typography variant="h6" fontWeight="bold" sx={{ 
                                                color: realStats.teacherAttendanceRate >= 90 ? themeColors.success : 
                                                       realStats.teacherAttendanceRate >= 75 ? themeColors.warning : themeColors.error 
                                            }}>
                                                {t('attendance.dashboard.stats.attendanceRate')}: {realStats.teacherAttendanceRate}%
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                           

                            
                        </Box>
                </Box>
            </Card>

            {/* Manual Attendance Dialog */}
            <Dialog 
                open={manualAttendanceDialogOpen} 
                onClose={() => setManualAttendanceDialogOpen(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle sx={{ color: themeColors.text.primary }}>
                    {t('attendance.dashboard.manual.title')} - {attendanceType === 'student' ? 
                        (() => {
                            if (gradeLoading) return t('attendance.dashboard.manual.loading');
                            if (!manualAttendanceFilterValues.grade_id) return t('attendance.dashboard.manual.selectGrade');
                            const gradeName = grades?.data?.find(g => g._id === manualAttendanceFilterValues.grade_id)?.gradeName;
                            const genderText = manualAttendanceFilterValues.gender ? ` (${manualAttendanceFilterValues.gender})` : '';
                            
                            // Only show loading for section if we have a section selected but sections data is still loading
                            if (manualAttendanceFilterValues.section && sectionLoading && !sections?.data) {
                                return `${gradeName || t('attendance.dashboard.manual.unknownGrade')}${genderText} - ${t('attendance.dashboard.manual.loading')}`;
                            }
                            

                            
                            const sectionName = sections?.data?.find(s => s._id === manualAttendanceFilterValues.section)?.sectionName;
                            const sectionText = manualAttendanceFilterValues.section ? ` - ${sectionName || manualAttendanceFilterValues.section}` : '';
                            return `${gradeName || t('attendance.dashboard.manual.unknownGrade')}${genderText}${sectionText}`;
                        })() : 
                        t('attendance.dashboard.charts.teachers')}
                </DialogTitle>
                <DialogContent>
                    <Box mb={3}>
                        <Typography variant="h6" sx={{ color: themeColors.text.primary, mb: 2 }}>
                            {t('attendance.dashboard.manual.attendanceType')}
                        </Typography>
                        <FormControl component="fieldset">
                            <RadioGroup
                                row
                                value={attendanceType}
                                onChange={(e) => {
                                    setAttendanceType(e.target.value);
                                    setShouldFetchStudents(false);
                                    setAttendanceData({});
                                    setShouldClearStudents(true);
                                    clearStudentsDataState();
                                    // Reset filter values when switching attendance type
                                    setManualAttendanceFilterValues({
                                        grade_id: null,
                                        gender: '',
                                        section: ''
                                    });
                                }}
                            >
                                <FormControlLabel
                                    value="student"
                                    control={<Radio sx={{ color: themeColors.primary }} />}
                                    label={t('attendance.dashboard.charts.students')}
                                    sx={{ color: themeColors.text.primary }}
                                />
                                <FormControlLabel
                                    value="teacher"
                                    control={<Radio sx={{ color: themeColors.primary }} />}
                                    label={t('attendance.dashboard.charts.teachers')}
                                    sx={{ color: themeColors.text.primary }}
                                />
                            </RadioGroup>
                        </FormControl>
                    </Box>

                    {attendanceType === 'student' && (
                        <Box mb={3}>
                            <Typography variant="h6" sx={{ color: themeColors.text.primary, mb: 2 }}>
                                {t('attendance.dashboard.manual.classConfiguration')}
                            </Typography>
                            <CommonFilter
                                showGender={true}
                                showSection={true}
                                showSubmit={false}
                                onSelectionChange={handleManualAttendanceFilterChange}
                                onHide={() => {}}
                                initialValues={manualAttendanceFilterValues}
                            />
                            

                            

                        </Box>
                    )}

                    <Box>
                        <Typography variant="h6" sx={{ color: themeColors.text.primary, mb: 2 }}>
                            {t('attendance.dashboard.manual.markFor', { type: attendanceType === 'student' ? t('attendance.dashboard.charts.students') : t('attendance.dashboard.charts.teachers') })}
                        </Typography>
                        
                       
                        
                       
                        
                        {attendanceType === 'student' && (
                            <>
                                <Box mb={2}>
                                    {studentsLoading && (
                                        <Alert severity="info" sx={{ mb: 2 }}>
                                            <LinearProgress sx={{ mb: 1 }} />
                                            {t('attendance.dashboard.manual.loadingStudents')}
                                        </Alert>
                                    )}
                                    {studentsError && (
                                        <Alert severity="error" sx={{ mb: 2 }}>
                                            {t('attendance.dashboard.manual.errorLoadingStudents', { error: studentsError?.data?.message || t('attendance.dashboard.manual.unknownError') })}
                                        </Alert>
                                    )}
                                    {studentsData?.data && studentsData.data.length > 0 && shouldFetchStudents && !shouldClearStudents && manualAttendanceDialogOpen && (
                                        <Alert severity="success" sx={{ mb: 2 }}>
                                            {t('attendance.dashboard.manual.foundStudents', { count: studentsData.data.length })}
                                        </Alert>
                                    )}
                                    {studentsData?.data && studentsData.data.length === 0 && shouldFetchStudents && !shouldClearStudents && manualAttendanceDialogOpen && (
                                        <Alert severity="warning" sx={{ mb: 2 }}>
                                            {t('attendance.dashboard.manual.noStudentsFound')}
                                        </Alert>
                                    )}
                                </Box>

                                {studentsData?.data && studentsData.data.length > 0 && shouldFetchStudents && !shouldClearStudents && (
                                    <Box mb={2} display="flex" flexWrap="wrap" gap={1} alignItems="center">
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary, mr: 1, fontWeight: 'bold' }}>
                                            {t('attendance.manual.consolidateAll')}:
                                        </Typography>
                                        {['present','absent','late','half-day','leave'].map((status) => (
                                            <Button
                                                key={status}
                                                size="small"
                                                variant="outlined"
                                                onClick={() => handleConsolidateAll(status)}
                                                sx={{
                                                    borderColor: getStatusColor(status),
                                                    color: getStatusColor(status),
                                                    '&:hover': {
                                                        borderColor: getStatusColor(status),
                                                        backgroundColor: `${getStatusColor(status)}20`
                                                    }
                                                }}
                                            >
                                                {t(`attendance.dashboard.status.${status}`)} {t('attendance.manual.all')}
                                            </Button>
                                        ))}
                                    </Box>
                                )}
                            </>
                        )}

                        {attendanceType === 'teacher' && (
                            <Box mb={2}>
                                {teachersLoading && (
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        <LinearProgress sx={{ mb: 1 }} />
                                        {t('attendance.dashboard.manual.loadingTeachers')}
                                    </Alert>
                                )}
                                {teachersError && (
                                    <Alert severity="error" sx={{ mb: 2 }}>
                                        {t('attendance.dashboard.manual.errorLoadingTeachers', { error: teachersError?.data?.message || t('attendance.dashboard.manual.unknownError') })}
                                    </Alert>
                                )}
                                {teachersData?.data && teachersData.data.length > 0 && (
                                    <Alert severity="success" sx={{ mb: 2 }}>
                                        {t('attendance.dashboard.manual.foundTeachers', { count: teachersData.data.length })}
                                    </Alert>
                                )}
                                {teachersData?.data && teachersData.data.length === 0 && (
                                    <Alert severity="warning" sx={{ mb: 2 }}>
                                        {t('attendance.dashboard.manual.noTeachersFound')}
                                    </Alert>
                                )}
                            </Box>
                        )}
                        <TableContainer component={Paper} sx={{ backgroundColor: themeColors.background.primary }}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ color: themeColors.text.primary, fontWeight: 'bold' }}>
                                                {attendanceType === 'student' ? t('attendance.dashboard.manual.rollNumber') : t('attendance.dashboard.manual.employeeId')}
                                            </TableCell>
                                            <TableCell sx={{ color: themeColors.text.primary, fontWeight: 'bold' }}>
                                                {t('attendance.dashboard.manual.name')}
                                            </TableCell>
                                            <TableCell sx={{ color: themeColors.text.primary, fontWeight: 'bold' }}>
                                                {t('attendance.dashboard.status.label')}
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {attendanceType === 'student' ? (
                                            studentsLoading ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} sx={{ textAlign: 'center', color: themeColors.text.secondary }}>
                                                        <LinearProgress sx={{ mb: 1 }} />
                                                        {t('attendance.dashboard.manual.loadingStudents')}
                                                    </TableCell>
                                                </TableRow>
                                            ) : studentsError ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} sx={{ textAlign: 'center', color: themeColors.error }}>
                                                        {t('attendance.dashboard.manual.errorLoadingStudents', { error: studentsError?.data?.message || t('attendance.dashboard.manual.unknownError') })}
                                                    </TableCell>
                                                </TableRow>
                                            ) : studentsData?.data?.length > 0 && shouldFetchStudents && !shouldClearStudents && manualAttendanceDialogOpen ? (
                                                studentsData.data.map((student) => (
                                                    <TableRow key={student._id}>
                                                        <TableCell sx={{ color: themeColors.text.primary }}>
                                                            {student.studentID}
                                                        </TableCell>
                                                        <TableCell sx={{ color: themeColors.text.primary }}>
                                                            <Box display="flex" alignItems="center" gap={1}>
                                                                {student.studentName}
                                                                {existingAttendanceData?.data?.some(record => 
                                                                    record.student && record.student._id === student._id
                                                                ) && (
                                                                    <Chip
                                                                        label={t('attendance.dashboard.manual.existing')}
                                                                        size="small"
                                                                        sx={{
                                                                            backgroundColor: themeColors.success,
                                                                            color: 'white',
                                                                            fontSize: '0.7rem',
                                                                            height: '20px'
                                                                        }}
                                                                    />
                                                                )}
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>
                                                            <FormControl component="fieldset">
                                                                <RadioGroup
                                                                    row
                                                                    value={attendanceData[student._id] || ''}
                                                                    onChange={(e) => handleAttendanceStatusChange(student._id, e.target.value)}
                                                                >
                                                                    <FormControlLabel
                                                                        value="present"
                                                                        control={<Radio sx={{ color: themeColors.success }} />}
                                                                        label={t('attendance.dashboard.status.present')}
                                                                        sx={{ color: themeColors.text.primary }}
                                                                    />
                                                                    <FormControlLabel
                                                                        value="absent"
                                                                        control={<Radio sx={{ color: themeColors.error }} />}
                                                                        label={t('attendance.dashboard.status.absent')}
                                                                        sx={{ color: themeColors.text.primary }}
                                                                    />
                                                                    <FormControlLabel
                                                                        value="late"
                                                                        control={<Radio sx={{ color: themeColors.warning }} />}
                                                                        label={t('attendance.dashboard.status.late')}
                                                                        sx={{ color: themeColors.text.primary }}
                                                                    />
                                                                    <FormControlLabel
                                                                        value="half-day"
                                                                        control={<Radio sx={{ color: themeColors.accent }} />}
                                                                        label={t('attendance.dashboard.status.halfDay')}
                                                                        sx={{ color: themeColors.text.primary }}
                                                                    />
                                                                    <FormControlLabel
                                                                        value="leave"
                                                                        control={<Radio sx={{ color: themeColors.text.secondary }} />}
                                                                        label={t('attendance.dashboard.status.leave')}
                                                                        sx={{ color: themeColors.text.primary }}
                                                                    />
                                                                </RadioGroup>
                                                            </FormControl>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            ) : !shouldFetchStudents || shouldClearStudents ? (
                                                <TableRow>
                                                    <TableCell colSpan={3} sx={{ textAlign: 'center', color: themeColors.text.secondary }}>
                                                        {t('attendance.dashboard.manual.selectFilters')}
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={3} sx={{ textAlign: 'center', color: themeColors.text.secondary }}>
                                                        {t('attendance.dashboard.manual.noStudentsFound')}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        ) : teachersLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={3} sx={{ textAlign: 'center', color: themeColors.text.secondary }}>
                                                    <LinearProgress sx={{ mb: 1 }} />
                                                    {t('attendance.dashboard.manual.loadingTeachers')}
                                                </TableCell>
                                            </TableRow>
                                        ) : teachersError ? (
                                            <TableRow>
                                                <TableCell colSpan={3} sx={{ textAlign: 'center', color: themeColors.error }}>
                                                    {t('attendance.dashboard.manual.errorLoadingTeachers', { error: teachersError?.data?.message || t('attendance.dashboard.manual.unknownError') })}
                                                </TableCell>
                                            </TableRow>
                                        ) : teachersData?.data?.length > 0 ? (
                                            teachersData.data.map((teacher) => (
                                                <TableRow key={teacher._id}>
                                                    <TableCell sx={{ color: themeColors.text.primary }}>
                                                        {teacher.employeeId || t('attendance.view.notAvailable')}
                                                    </TableCell>
                                                    <TableCell sx={{ color: themeColors.text.primary }}>
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            {teacher.employeeName || teacher.name}
                                                            {existingAttendanceData?.data?.some(record => 
                                                                record.teacher && record.teacher._id === teacher._id
                                                            ) && (
                                                                <Chip
                                                                    label={t('attendance.dashboard.manual.existing')}
                                                                    size="small"
                                                                    sx={{
                                                                        backgroundColor: themeColors.success,
                                                                        color: 'white',
                                                                        fontSize: '0.7rem',
                                                                        height: '20px'
                                                                    }}
                                                                />
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <FormControl component="fieldset">
                                                            <RadioGroup
                                                                row
                                                                value={attendanceData[teacher._id] || ''}
                                                                onChange={(e) => handleAttendanceStatusChange(teacher._id, e.target.value)}
                                                            >
                                                                <FormControlLabel
                                                                    value="present"
                                                                    control={<Radio sx={{ color: themeColors.success }} />}
                                                                    label={t('attendance.dashboard.status.present')}
                                                                    sx={{ color: themeColors.text.primary }}
                                                                />
                                                                <FormControlLabel
                                                                    value="absent"
                                                                    control={<Radio sx={{ color: themeColors.error }} />}
                                                                    label={t('attendance.dashboard.status.absent')}
                                                                    sx={{ color: themeColors.text.primary }}
                                                                />
                                                                <FormControlLabel
                                                                    value="late"
                                                                    control={<Radio sx={{ color: themeColors.warning }} />}
                                                                    label={t('attendance.dashboard.status.late')}
                                                                    sx={{ color: themeColors.text.primary }}
                                                                />
                                                                <FormControlLabel
                                                                    value="half-day"
                                                                    control={<Radio sx={{ color: themeColors.accent }} />}
                                                                    label={t('attendance.dashboard.status.halfDay')}
                                                                    sx={{ color: themeColors.text.primary }}
                                                                />
                                                                <FormControlLabel
                                                                    value="leave"
                                                                    control={<Radio sx={{ color: themeColors.text.secondary }} />}
                                                                    label={t('attendance.dashboard.status.leave')}
                                                                    sx={{ color: themeColors.text.primary }}
                                                                />
                                                            </RadioGroup>
                                                        </FormControl>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={3} sx={{ textAlign: 'center', color: themeColors.text.secondary }}>
                                                    {t('attendance.dashboard.manual.noTeachersFound')}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                        </TableContainer>

                        {studentsData?.data && studentsData.data.length > 0 && shouldFetchStudents && !shouldClearStudents && (
                            <Box mt={3} mb={2}>
                                <Card sx={{ backgroundColor: themeColors.background.secondary, border: `1px solid ${themeColors.border.primary}` }}>
                                    <CardContent>
                                        <Typography variant="h6" sx={{ color: themeColors.text.primary, mb: 2, fontWeight: 'bold' }}>
                                            {t('attendance.manual.summary.title')}
                                        </Typography>
                                        <Grid container spacing={2}>
                                            {['present','absent','late','half-day','leave'].map((statusKey) => (
                                                <Grid item xs={12} sm={6} md={2.4} key={statusKey}>
                                                    <Box
                                                        sx={{
                                                            p: 2,
                                                            borderRadius: 2,
                                                            backgroundColor: `${getStatusColor(statusKey)}15`,
                                                            border: `1px solid ${getStatusColor(statusKey)}`,
                                                            textAlign: 'center'
                                                        }}
                                                    >
                                                        <Typography variant="h4" sx={{ color: getStatusColor(statusKey), fontWeight: 'bold' }}>
                                                            {Object.values(attendanceData).filter(status => status === statusKey).length}
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary, mt: 0.5 }}>
                                                            {t(`attendance.dashboard.status.${statusKey}`)}
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Box>
                        )}
                        </Box>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setManualAttendanceDialogOpen(false)}
                        sx={{ color: themeColors.text.secondary }}
                    >
                        {t('attendance.dashboard.manual.cancel')}
                    </Button>
                    <Button 
                        onClick={handleSubmitManualAttendance}
                        disabled={
                            (() => {
                                const hasAttendanceData = Object.keys(attendanceData).length > 0;
                                const hasRequiredFilters = attendanceType === 'student' ? 
                                    (manualAttendanceFilterValues.grade_id && manualAttendanceFilterValues.gender && manualAttendanceFilterValues.section) : 
                                    true;
                                
                                return !hasAttendanceData || !hasRequiredFilters || isSubmitting;
                            })()
                        }
                        variant="contained"
                        sx={{
                            backgroundColor: themeColors.primary,
                            '&:hover': {
                                backgroundColor: themeColors.primary,
                                opacity: 0.9,
                            },
                        }}
                    >
                        {isSubmitting ? (
                            t('attendance.dashboard.manual.processing')
                        ) : (
                            existingAttendanceData?.data && existingAttendanceData.data.length > 0 ? 
                                t('attendance.dashboard.manual.updateAttendance', { count: Object.keys(attendanceData).length }) : 
                                t('attendance.dashboard.manual.submitAttendance', { count: Object.keys(attendanceData).length })
                        )}
                    </Button>
                </DialogActions>
            </Dialog>



            {/* Clear All Confirmation Dialog */}
            <Dialog
                open={clearConfirmOpen}
                onClose={() => setClearConfirmOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ color: themeColors.text.primary }}>
                    {t('attendance.dashboard.clearAll.title')}
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: themeColors.text.primary }}>
                        {t('attendance.dashboard.clearAll.confirm')}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setClearConfirmOpen(false)}
                        sx={{ color: themeColors.text.secondary }}
                    >
                        {t('attendance.dashboard.manual.cancel')}
                    </Button>
                    <Button 
                        onClick={() => {
                            setAttendanceData({});
                            setClearConfirmOpen(false);
                        }}
                        variant="contained"
                        sx={{
                            backgroundColor: themeColors.warning,
                            '&:hover': {
                                backgroundColor: themeColors.warning,
                                opacity: 0.9,
                            },
                        }}
                    >
                        {t('attendance.dashboard.clearAll.clearAll')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AttendanceDashboard;
