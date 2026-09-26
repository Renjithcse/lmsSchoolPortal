import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    Alert,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Avatar,
    Grid
} from '@mui/material';
import moment from 'moment/moment';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { 
    useBulkMarkAttendanceMutation,
    useGetRegisteredActiveStudentsQuery,
    useGetAttendanceByDateQuery,
    useUpdateAttendanceMutation
} from '../../Redux/features/Attendance/attendanceSlice';
import { useLazyGetMyGradePermissionsQuery, useLazyGetMyGenderPermissionsQuery, useLazyGetMySectionPermissionsQuery } from '../../Redux/features/Admin/TeachersSlice';
import { useGetSettingQuery } from '../../Redux/features/Admin/SettingsSlice';
import { useSnackbar } from '../../hooks/SnackBar';
import CommonFilter from '../../components/Common/CommonFilter';
import { useTranslation } from 'react-i18next';
import SchoolIcon from '@mui/icons-material/School';
import GroupIcon from '@mui/icons-material/Group';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const ManualAttendanceScreen = () => {
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();
    const showSnackbar = useSnackbar();
    const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
    const attendanceType = 'student'; // Always student
    const [attendanceData, setAttendanceData] = useState({});
    const [shouldFetchStudents, setShouldFetchStudents] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [shouldClearStudents, setShouldClearStudents] = useState(false);
    const [canModify, setCanModify] = useState(true);
    const [modificationTimeMessage, setModificationTimeMessage] = useState('');

    // Fetch settings to check modification time
    const { data: settingsData } = useGetSettingQuery();

    // Check if current time is before modification time
    useEffect(() => {
        if (settingsData?.data?.attendanceSettings?.modificationTime) {
            const modificationTime = settingsData.data.attendanceSettings.modificationTime;
            const now = moment();
            const today = moment().format('YYYY-MM-DD');
            const modificationDateTime = moment(`${today} ${modificationTime}`, 'YYYY-MM-DD HH:mm');
            
            if (now.isAfter(modificationDateTime)) {
                setCanModify(false);
                setModificationTimeMessage(t('attendance.manual.modificationTimePassed', { time: modificationTime, currentTime: now.format('HH:mm') }));
            } else {
                setCanModify(true);
                setModificationTimeMessage(t('attendance.manual.modificationTimeAllowed', { time: modificationTime }));
            }
        }
    }, [settingsData, selectedDate]);

    // Manual attendance filter values
    const [manualAttendanceFilterValues, setManualAttendanceFilterValues] = useState({
        grade_id: null,
        gender: '',
        section: ''
    });

    // Refs to track the last triggered values for cascading filters
    const lastSectionParams = useRef(null);

    // API calls for cascading filters
    const [triggerGrades, { data: grades, isFetching: gradeLoading }] = useLazyGetMyGradePermissionsQuery();
    const [triggerGenders, { data: genders, isFetching: genderLoading }] = useLazyGetMyGenderPermissionsQuery();
    const [triggerSections, { data: sections, isFetching: sectionLoading }] = useLazyGetMySectionPermissionsQuery();

    const [bulkMarkAttendance] = useBulkMarkAttendanceMutation();
    const [updateAttendance] = useUpdateAttendanceMutation();

    // Check if all filters are selected
    const allManualFiltersSelected = manualAttendanceFilterValues.grade_id && manualAttendanceFilterValues.gender && manualAttendanceFilterValues.section;

    // Query for existing attendance data - only fetch when all filters are selected
    const existingAttendanceQueryParams = allManualFiltersSelected ? {
        date: selectedDate,
        attendanceType: attendanceType,
        grade: manualAttendanceFilterValues.grade_id,
        gender: manualAttendanceFilterValues.gender,
        section: manualAttendanceFilterValues.section
    } : null;

    const { data: existingAttendanceData, isLoading: existingAttendanceLoading } = useGetAttendanceByDateQuery(
        existingAttendanceQueryParams,
        { skip: !allManualFiltersSelected || !existingAttendanceQueryParams }
    );

    // Query for fetching registered active students
    const queryParams = shouldFetchStudents && manualAttendanceFilterValues.grade_id && manualAttendanceFilterValues.gender && manualAttendanceFilterValues.section ? {
        grade: manualAttendanceFilterValues.grade_id,
        gender: manualAttendanceFilterValues.gender,
        section: manualAttendanceFilterValues.section
    } : null;

    const shouldSkip = !shouldFetchStudents || !manualAttendanceFilterValues.grade_id || !manualAttendanceFilterValues.gender || !manualAttendanceFilterValues.section || shouldClearStudents;

    const { data: studentsData, isLoading: studentsLoading, error: studentsError } = useGetRegisteredActiveStudentsQuery(
        queryParams,
        { skip: shouldSkip }
    );

    // Function to clear students data by setting state
    const clearStudentsDataState = () => {
        setShouldFetchStudents(false);
        setShouldClearStudents(true);
    };

    // Auto-trigger grades when component mounts
    useEffect(() => {
        triggerGrades({});
        
        if (manualAttendanceFilterValues.grade_id && manualAttendanceFilterValues.gender) {
            const sectionParams = { grade: manualAttendanceFilterValues.grade_id, gender: manualAttendanceFilterValues.gender };
            const paramsKey = `${manualAttendanceFilterValues.grade_id}-${manualAttendanceFilterValues.gender}`;
            
            if (lastSectionParams.current !== paramsKey) {
                triggerSections(sectionParams);
                lastSectionParams.current = paramsKey;
            }
        }
    }, [triggerGrades, triggerSections, manualAttendanceFilterValues.grade_id, manualAttendanceFilterValues.gender]);

    // Load existing attendance data and set default "present" for students without existing data
    useEffect(() => {
        if (studentsData?.data && studentsData.data.length > 0 && shouldFetchStudents && !shouldClearStudents) {
            setAttendanceData(prev => {
                const newAttendanceData = { ...prev };
                const existingStudentIds = new Set();
                
                // First, load existing attendance data if available
                if (existingAttendanceData?.data) {
                    existingAttendanceData.data.forEach(record => {
                        if (record.student && record.student._id) {
                            existingStudentIds.add(record.student._id);
                            newAttendanceData[record.student._id] = record.status;
                        }
                    });
                }
                
                // Then, set default "present" for students without existing attendance data
                studentsData.data.forEach(student => {
                    if (!newAttendanceData[student._id]) {
                        newAttendanceData[student._id] = 'present';
                    }
                });
                
                return newAttendanceData;
            });
        }
    }, [studentsData?.data, shouldFetchStudents, shouldClearStudents, existingAttendanceData?.data]);

    // Clear attendance data when filter values change
    useEffect(() => {
        if (shouldFetchStudents) {
            setAttendanceData({});
        }
    }, [manualAttendanceFilterValues.grade_id, manualAttendanceFilterValues.gender, manualAttendanceFilterValues.section, shouldFetchStudents]);

    const handleAttendanceStatusChange = (personId, status) => {
        if (!canModify) {
            showSnackbar(t('attendance.manual.modificationTimePassedMessage'), 'error');
            return;
        }
        setAttendanceData(prev => ({
            ...prev,
            [personId]: status
        }));
    };

    // Consolidation function to set all students to a specific status
    const handleConsolidateAll = (status) => {
        if (!canModify) {
            showSnackbar(t('attendance.manual.modificationTimePassedMessage'), 'error');
            return;
        }
        
        if (!studentsData?.data || studentsData.data.length === 0) {
            showSnackbar(t('attendance.manual.noStudentsToConsolidate'), 'warning');
            return;
        }

        const consolidatedData = {};
        studentsData.data.forEach(student => {
            consolidatedData[student._id] = status;
        });
        
        setAttendanceData(consolidatedData);
        showSnackbar(t('attendance.manual.consolidated', { status: t(`attendance.dashboard.status.${status}`), count: studentsData.data.length }), 'success');
    };

    const handleSubmitManualAttendance = async () => {
        if (!canModify) {
            showSnackbar(t('attendance.manual.modificationTimePassedMessage'), 'error');
            return;
        }

        try {
            setIsSubmitting(true);
            const isUpdate = existingAttendanceData?.data && existingAttendanceData.data.length > 0;
            
            if (isUpdate) {
                const updatePromises = [];
                
                for (const [personId, status] of Object.entries(attendanceData)) {
                    const existingRecord = existingAttendanceData.data.find(record => 
                        record.student && record.student._id === personId
                    );
                    
                    if (existingRecord) {
                        updatePromises.push(
                            updateAttendance({
                                id: existingRecord._id,
                                status,
                                notes: 'Manually updated attendance'
                            }).unwrap()
                        );
                    } else {
                        updatePromises.push(
                            bulkMarkAttendance({
                                attendanceData: [{
                                    attendanceType: attendanceType,
                                    status,
                                    notes: 'Manually marked attendance',
                                    studentId: personId
                                }],
                                date: selectedDate,
                                grade: manualAttendanceFilterValues.grade_id
                            }).unwrap()
                        );
                    }
                }
                
                await Promise.all(updatePromises);
            } else {
                const attendanceRecords = Object.entries(attendanceData).map(([personId, status]) => ({
                    attendanceType: attendanceType,
                    status,
                    notes: 'Manually marked attendance',
                    studentId: personId
                }));

                await bulkMarkAttendance({
                    attendanceData: attendanceRecords,
                    date: selectedDate,
                    grade: manualAttendanceFilterValues.grade_id
                }).unwrap();
            }

            showSnackbar(t('attendance.manual.messages.success', { action: isUpdate ? t('attendance.manual.messages.updated') : t('attendance.manual.messages.marked') }), 'success');
            setAttendanceData({});
            setShouldFetchStudents(false);
            setShouldClearStudents(true);
            clearStudentsDataState();
            setManualAttendanceFilterValues({
                grade_id: null,
                gender: '',
                section: ''
            });
        } catch (error) {
            showSnackbar(error?.data?.message || t('attendance.manual.messages.failed'), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle CommonFilter changes for manual attendance
    const handleManualAttendanceFilterChange = (newValues) => {
        const filterValues = newValues.values || newValues;
        
        setManualAttendanceFilterValues(filterValues);
        
        if (filterValues.grade_id && filterValues.gender) {
            const sectionParams = { grade: filterValues.grade_id, gender: filterValues.gender };
            const paramsKey = `${filterValues.grade_id}-${filterValues.gender}`;
            
            if (lastSectionParams.current !== paramsKey) {
                triggerSections(sectionParams);
                lastSectionParams.current = paramsKey;
            }
        }
        
        const allFiltersSelected = filterValues.grade_id && 
            filterValues.gender && 
            filterValues.section;
        
        if (allFiltersSelected) {
            setShouldFetchStudents(true);
            setShouldClearStudents(false);
        } else {
            setShouldFetchStudents(false);
        }
    };

    return (
        <Box sx={{ p: 3, backgroundColor: themeColors.background.secondary, minHeight: '100vh' }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Avatar sx={{ width: 48, height: 48, backgroundColor: themeColors.primary }}>
                        <GroupIcon sx={{ fontSize: 24 }} />
                    </Avatar>
                    <Box>
                        <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                            {t('attendance.manual.title')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                            {t('attendance.manual.subtitle')}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            {/* Modification Time Alert */}
            {modificationTimeMessage && (
                <Alert 
                    severity={canModify ? "info" : "warning"} 
                    icon={canModify ? <AccessTimeIcon /> : <CancelIcon />}
                    sx={{ mb: 3 }}
                >
                    {modificationTimeMessage}
                </Alert>
            )}

            {/* Main Card */}
            <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                <CardContent>
                    {/* Date Selection */}
                    <Box mb={3}>
                        <Typography variant="h6" sx={{ color: themeColors.text.primary, mb: 2 }}>
                            {t('attendance.manual.selectDate')}
                        </Typography>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {
                                setSelectedDate(e.target.value);
                                setAttendanceData({});
                            }}
                            style={{
                                padding: '8px',
                                borderRadius: '4px',
                                border: `1px solid ${themeColors.border.primary}`,
                                backgroundColor: themeColors.background.primary,
                                color: themeColors.text.primary,
                                fontSize: '16px'
                            }}
                        />
                    </Box>

                    {/* Student Filters */}
                    <Box mb={3}>
                        <Typography variant="h6" sx={{ color: themeColors.text.primary, mb: 2 }}>
                            {t('attendance.manual.classConfiguration')}
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

                    {/* Students Table */}
                    <Box>
                        <Typography variant="h6" sx={{ color: themeColors.text.primary, mb: 2 }}>
                            {t('attendance.manual.markFor', { type: t('attendance.manual.students') })}
                        </Typography>
                        
                        <Box mb={2}>
                            {studentsLoading && (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    <LinearProgress sx={{ mb: 1 }} />
                                    {t('attendance.manual.loadingStudents')}
                                </Alert>
                            )}
                            {studentsError && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {t('attendance.manual.errorLoadingStudents', { error: studentsError?.data?.message || t('attendance.manual.unknownError') })}
                                </Alert>
                            )}
                            {studentsData?.data && studentsData.data.length > 0 && shouldFetchStudents && !shouldClearStudents && (
                                <Alert severity="success" sx={{ mb: 2 }}>
                                    {t('attendance.manual.foundStudents', { count: studentsData.data.length })}
                                </Alert>
                            )}
                            {studentsData?.data && studentsData.data.length === 0 && shouldFetchStudents && !shouldClearStudents && (
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                    {t('attendance.manual.noStudentsFound')}
                                </Alert>
                            )}
                        </Box>

                        {/* Consolidation Buttons */}
                        {studentsData?.data && studentsData.data.length > 0 && shouldFetchStudents && !shouldClearStudents && (
                            <Box mb={2} display="flex" flexWrap="wrap" gap={1} alignItems="center">
                                <Typography variant="body2" sx={{ color: themeColors.text.secondary, mr: 1, fontWeight: 'bold' }}>
                                    {t('attendance.manual.consolidateAll')}:
                                </Typography>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleConsolidateAll('present')}
                                    disabled={!canModify}
                                    sx={{
                                        borderColor: themeColors.success,
                                        color: themeColors.success,
                                        '&:hover': {
                                            borderColor: themeColors.success,
                                            backgroundColor: `${themeColors.success}20`
                                        },
                                        '&:disabled': {
                                            borderColor: themeColors.text.disabled,
                                            color: themeColors.text.disabled
                                        }
                                    }}
                                >
                                    {t('attendance.dashboard.status.present')} {t('attendance.manual.all')}
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleConsolidateAll('absent')}
                                    disabled={!canModify}
                                    sx={{
                                        borderColor: themeColors.error,
                                        color: themeColors.error,
                                        '&:hover': {
                                            borderColor: themeColors.error,
                                            backgroundColor: `${themeColors.error}20`
                                        },
                                        '&:disabled': {
                                            borderColor: themeColors.text.disabled,
                                            color: themeColors.text.disabled
                                        }
                                    }}
                                >
                                    {t('attendance.dashboard.status.absent')} {t('attendance.manual.all')}
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleConsolidateAll('late')}
                                    disabled={!canModify}
                                    sx={{
                                        borderColor: themeColors.warning,
                                        color: themeColors.warning,
                                        '&:hover': {
                                            borderColor: themeColors.warning,
                                            backgroundColor: `${themeColors.warning}20`
                                        },
                                        '&:disabled': {
                                            borderColor: themeColors.text.disabled,
                                            color: themeColors.text.disabled
                                        }
                                    }}
                                >
                                    {t('attendance.dashboard.status.late')} {t('attendance.manual.all')}
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleConsolidateAll('half-day')}
                                    disabled={!canModify}
                                    sx={{
                                        borderColor: themeColors.accent,
                                        color: themeColors.accent,
                                        '&:hover': {
                                            borderColor: themeColors.accent,
                                            backgroundColor: `${themeColors.accent}20`
                                        },
                                        '&:disabled': {
                                            borderColor: themeColors.text.disabled,
                                            color: themeColors.text.disabled
                                        }
                                    }}
                                >
                                    {t('attendance.dashboard.status.halfDay')} {t('attendance.manual.all')}
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleConsolidateAll('leave')}
                                    disabled={!canModify}
                                    sx={{
                                        borderColor: themeColors.text.secondary,
                                        color: themeColors.text.secondary,
                                        '&:hover': {
                                            borderColor: themeColors.text.secondary,
                                            backgroundColor: `${themeColors.text.secondary}20`
                                        },
                                        '&:disabled': {
                                            borderColor: themeColors.text.disabled,
                                            color: themeColors.text.disabled
                                        }
                                    }}
                                >
                                    {t('attendance.dashboard.status.leave')} {t('attendance.manual.all')}
                                </Button>
                            </Box>
                        )}

                        <TableContainer component={Paper} sx={{ backgroundColor: themeColors.background.primary }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ color: themeColors.text.primary, fontWeight: 'bold', width: '60px' }}>
                                            {t('attendance.manual.sno')}
                                        </TableCell>
                                        <TableCell sx={{ color: themeColors.text.primary, fontWeight: 'bold' }}>
                                            {t('attendance.manual.rollNumber')}
                                        </TableCell>
                                        <TableCell sx={{ color: themeColors.text.primary, fontWeight: 'bold' }}>
                                            {t('attendance.manual.name')}
                                        </TableCell>
                                        <TableCell sx={{ color: themeColors.text.primary, fontWeight: 'bold' }}>
                                            {t('attendance.dashboard.status.label')}
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {studentsLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} sx={{ textAlign: 'center', color: themeColors.text.secondary }}>
                                                <LinearProgress sx={{ mb: 1 }} />
                                                {t('attendance.manual.loading')}
                                            </TableCell>
                                        </TableRow>
                                    ) : studentsError ? (
                                        <TableRow>
                                            <TableCell colSpan={4} sx={{ textAlign: 'center', color: themeColors.error }}>
                                                {t('attendance.manual.errorLoadingStudents', { error: studentsError?.data?.message || t('attendance.manual.unknownError') })}
                                            </TableCell>
                                        </TableRow>
                                    ) : studentsData?.data?.length > 0 && shouldFetchStudents && !shouldClearStudents ? (
                                        studentsData.data.map((student, index) => (
                                            <TableRow key={student._id}>
                                                <TableCell sx={{ color: themeColors.text.primary }}>
                                                    {index + 1}
                                                </TableCell>
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
                                                                label={t('attendance.manual.existing')}
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
                                                            disabled={!canModify}
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
                                            <TableCell colSpan={4} sx={{ textAlign: 'center', color: themeColors.text.secondary }}>
                                                {t('attendance.manual.selectFilters')}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} sx={{ textAlign: 'center', color: themeColors.text.secondary }}>
                                                {t('attendance.manual.noStudentsFound')}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>

                    {/* Attendance Summary */}
                    {studentsData?.data && studentsData.data.length > 0 && shouldFetchStudents && !shouldClearStudents && (
                        <Box mt={3} mb={2}>
                            <Card sx={{ backgroundColor: themeColors.background.secondary, border: `1px solid ${themeColors.border.primary}` }}>
                                <CardContent>
                                    <Typography variant="h6" sx={{ color: themeColors.text.primary, mb: 2, fontWeight: 'bold' }}>
                                        {t('attendance.manual.summary.title')}
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6} md={2.4}>
                                            <Box
                                                sx={{
                                                    p: 2,
                                                    borderRadius: 2,
                                                    backgroundColor: `${themeColors.success}15`,
                                                    border: `1px solid ${themeColors.success}`,
                                                    textAlign: 'center'
                                                }}
                                            >
                                                <Typography variant="h4" sx={{ color: themeColors.success, fontWeight: 'bold' }}>
                                                    {Object.values(attendanceData).filter(status => status === 'present').length}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: themeColors.text.secondary, mt: 0.5 }}>
                                                    {t('attendance.dashboard.status.present')}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={2.4}>
                                            <Box
                                                sx={{
                                                    p: 2,
                                                    borderRadius: 2,
                                                    backgroundColor: `${themeColors.error}15`,
                                                    border: `1px solid ${themeColors.error}`,
                                                    textAlign: 'center'
                                                }}
                                            >
                                                <Typography variant="h4" sx={{ color: themeColors.error, fontWeight: 'bold' }}>
                                                    {Object.values(attendanceData).filter(status => status === 'absent').length}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: themeColors.text.secondary, mt: 0.5 }}>
                                                    {t('attendance.dashboard.status.absent')}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={2.4}>
                                            <Box
                                                sx={{
                                                    p: 2,
                                                    borderRadius: 2,
                                                    backgroundColor: `${themeColors.warning}15`,
                                                    border: `1px solid ${themeColors.warning}`,
                                                    textAlign: 'center'
                                                }}
                                            >
                                                <Typography variant="h4" sx={{ color: themeColors.warning, fontWeight: 'bold' }}>
                                                    {Object.values(attendanceData).filter(status => status === 'late').length}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: themeColors.text.secondary, mt: 0.5 }}>
                                                    {t('attendance.dashboard.status.late')}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={2.4}>
                                            <Box
                                                sx={{
                                                    p: 2,
                                                    borderRadius: 2,
                                                    backgroundColor: `${themeColors.accent}15`,
                                                    border: `1px solid ${themeColors.accent}`,
                                                    textAlign: 'center'
                                                }}
                                            >
                                                <Typography variant="h4" sx={{ color: themeColors.accent, fontWeight: 'bold' }}>
                                                    {Object.values(attendanceData).filter(status => status === 'half-day').length}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: themeColors.text.secondary, mt: 0.5 }}>
                                                    {t('attendance.dashboard.status.halfDay')}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={2.4}>
                                            <Box
                                                sx={{
                                                    p: 2,
                                                    borderRadius: 2,
                                                    backgroundColor: `${themeColors.text.secondary}15`,
                                                    border: `1px solid ${themeColors.text.secondary}`,
                                                    textAlign: 'center'
                                                }}
                                            >
                                                <Typography variant="h4" sx={{ color: themeColors.text.secondary, fontWeight: 'bold' }}>
                                                    {Object.values(attendanceData).filter(status => status === 'leave').length}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: themeColors.text.secondary, mt: 0.5 }}>
                                                    {t('attendance.dashboard.status.leave')}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                    <Box mt={2} pt={2} sx={{ borderTop: `1px solid ${themeColors.border.primary}` }}>
                                        <Grid container spacing={2} alignItems="center">
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body1" sx={{ color: themeColors.text.primary, fontWeight: 'bold' }}>
                                                    {t('attendance.manual.summary.total')}: <span style={{ color: themeColors.primary }}>{studentsData.data.length}</span>
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body1" sx={{ color: themeColors.text.primary, fontWeight: 'bold' }}>
                                                    {t('attendance.manual.summary.marked')}: <span style={{ color: themeColors.primary }}>{Object.keys(attendanceData).length}</span>
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body1" sx={{ color: themeColors.text.primary, fontWeight: 'bold' }}>
                                                    {t('attendance.manual.summary.pending')}: <span style={{ color: themeColors.warning }}>{studentsData.data.length - Object.keys(attendanceData).length}</span>
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <Typography variant="body1" sx={{ color: themeColors.text.primary, fontWeight: 'bold' }}>
                                                    {t('attendance.manual.summary.completion')}: <span style={{ color: themeColors.success }}>{studentsData.data.length > 0 ? Math.round((Object.keys(attendanceData).length / studentsData.data.length) * 100) : 0}%</span>
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Box>
                    )}

                    {/* Submit Button */}
                    <Box display="flex" justifyContent="flex-end" mt={3}>
                        <Button
                            onClick={handleSubmitManualAttendance}
                            disabled={
                                (() => {
                                    const hasAttendanceData = Object.keys(attendanceData).length > 0;
                                    const hasRequiredFilters = manualAttendanceFilterValues.grade_id && 
                                        manualAttendanceFilterValues.gender && 
                                        manualAttendanceFilterValues.section;
                                    
                                    return !hasAttendanceData || !hasRequiredFilters || isSubmitting || !canModify;
                                })()
                            }
                            variant="contained"
                            sx={{
                                backgroundColor: themeColors.primary,
                                '&:hover': {
                                    backgroundColor: themeColors.primary,
                                    opacity: 0.9,
                                },
                                '&:disabled': {
                                    backgroundColor: themeColors.text.secondary,
                                }
                            }}
                        >
                            {isSubmitting ? (
                                t('attendance.manual.processing')
                            ) : (
                                existingAttendanceData?.data && existingAttendanceData.data.length > 0 ? 
                                    t('attendance.manual.updateAttendance', { count: Object.keys(attendanceData).length }) : 
                                    t('attendance.manual.submitAttendance', { count: Object.keys(attendanceData).length })
                            )}
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default ManualAttendanceScreen;

