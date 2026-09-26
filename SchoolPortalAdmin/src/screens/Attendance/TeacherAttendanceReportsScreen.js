import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    MenuItem,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Stack,
    IconButton,
    Fade,
    Button,
    Alert
} from '@mui/material';
import moment from 'moment/moment';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { 
    useGetAttendanceByDateQuery,
    useGetAttendanceByDateRangeQuery,
    useGetTermwiseAttendanceReportQuery
} from '../../Redux/features/Attendance/attendanceSlice';
import { useGetSettingQuery } from '../../Redux/features/Admin/SettingsSlice';
import { useLazyGetMyGradePermissionsQuery, useLazyGetMyGenderPermissionsQuery, useLazyGetMySectionPermissionsQuery } from '../../Redux/features/Admin/TeachersSlice';
import { useListAcademicYearsQuery } from '../../Redux/features/Admin/academicSlice';
import { useQuery } from '@tanstack/react-query';
import { getTermHistories, getTermsByAcademicYear } from '../../api/termHistory';
import { useSnackbar } from '../../hooks/SnackBar';
import CommonFilter from '../../components/Common/CommonFilter';
import CustomButton from '../../components/Common/CustomButton';
import CustomSelect from '../../components/Common/CustomSelect';
import CustomInput from '../../components/Common/CustomInput';
import CustomDatePicker from '../../components/Common/CustomDatefilter';
import { useForm } from 'react-hook-form';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import SearchIcon from '@mui/icons-material/Search';
import dayjs from 'dayjs';
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
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

const TeacherAttendanceReportsScreen = () => {
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();
    const showSnackbar = useSnackbar();
    
    // Filter values (for form, not submitted yet)
    const [filterValues, setFilterValues] = useState({
        grade_id: null,
        gender: '',
        section: ''
    });
    
    // Submitted filter values (used for queries)
    const [submittedFilters, setSubmittedFilters] = useState({
        grade_id: null,
        gender: '',
        section: ''
    });
    
    // Track if filters have been submitted
    const [filtersSubmitted, setFiltersSubmitted] = useState(false);
    
    // Form for report configuration
    const { control: reportControl, watch: watchReport, setValue: setReportValue } = useForm({
        defaultValues: {
            reportMode: 'date',
            academicYearId: '',
            selectedTerm: '',
            startDate: dayjs(),
            endDate: dayjs(),
            singleDate: dayjs()
        }
    });
    
    // Watch form values
    const reportMode = watchReport('reportMode') || 'date';
    const academicYearId = watchReport('academicYearId') || '';
    const selectedTerm = watchReport('selectedTerm') || '';
    const startDateValue = watchReport('startDate');
    const endDateValue = watchReport('endDate');
    const singleDateValue = watchReport('singleDate');
    
    // Convert dayjs to string format for API
    const startDate = startDateValue ? dayjs(startDateValue).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
    const endDate = endDateValue ? dayjs(endDateValue).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
    const singleDate = singleDateValue ? dayjs(singleDateValue).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
    
    // Refs to track the last triggered values for cascading filters
    const lastSectionParams = useRef(null);
    
    // API calls for cascading filters
    const [triggerGrades, { data: grades, isFetching: gradeLoading }] = useLazyGetMyGradePermissionsQuery();
    const [triggerGenders, { data: genders, isFetching: genderLoading }] = useLazyGetMyGenderPermissionsQuery();
    const [triggerSections, { data: sections, isFetching: sectionLoading }] = useLazyGetMySectionPermissionsQuery();
    
    // Academic years
    const { data: academicYearsData } = useListAcademicYearsQuery();
    
    // Terms for selected academic year
    const { data: termsData, isLoading: termsLoading } = useQuery({
        queryKey: ['termsByAcademicYear', academicYearId],
        queryFn: () => getTermsByAcademicYear(academicYearId),
        enabled: !!academicYearId && (reportMode === 'academicYear' || reportMode === 'term'),
        retry: 2
    });
    
    // Get all term histories for academic year to calculate date range
    const { data: allTermsData } = useQuery({
        queryKey: ['allTermHistories', academicYearId],
        queryFn: () => getTermHistories({ academicYear: academicYearId }),
        enabled: !!academicYearId && reportMode === 'academicYear',
        retry: 2
    });
    
    // Calculate date range for academic year
    const academicYearDateRange = useMemo(() => {
        if (reportMode === 'academicYear' && allTermsData?.data?.data?.termHistories) {
            const termHistories = allTermsData.data.data.termHistories;
            if (termHistories.length === 0) return null;
            
            const dates = termHistories.map(th => ({
                start: new Date(th.startDate),
                end: new Date(th.endDate)
            }));
            
            const earliestStart = new Date(Math.min(...dates.map(d => d.start.getTime())));
            const latestEnd = new Date(Math.max(...dates.map(d => d.end.getTime())));
            
            return {
                startDate: moment(earliestStart).format('YYYY-MM-DD'),
                endDate: moment(latestEnd).format('YYYY-MM-DD')
            };
        }
        return null;
    }, [allTermsData, reportMode]);
    
    // Get selected term dates
    const selectedTermDates = useMemo(() => {
        if (reportMode === 'term' && termsData?.data?.data && selectedTerm) {
            const term = termsData.data.data.find(t => t.term === selectedTerm);
            if (term) {
                return {
                    startDate: moment(term.startDate).format('YYYY-MM-DD'),
                    endDate: moment(term.endDate).format('YYYY-MM-DD')
                };
            }
        }
        return null;
    }, [termsData, selectedTerm, reportMode]);
    
    // Get settings for default academic year
    const { data: settingsData } = useGetSettingQuery();
    
    // Build query parameters based on report mode (only when filters are submitted)
    const queryParams = useMemo(() => {
        if (!filtersSubmitted) return null;
        
        const allFiltersSelected = submittedFilters.grade_id && submittedFilters.gender && submittedFilters.section;
        
        if (!allFiltersSelected) return null;
        
        const baseParams = {
            grade: submittedFilters.grade_id,
            gender: submittedFilters.gender,
            section: submittedFilters.section
        };
        
        switch (reportMode) {
            case 'academicYear':
                if (!academicYearId || !academicYearDateRange) return null;
                return {
                    ...baseParams,
                    fromDate: academicYearDateRange.startDate,
                    toDate: academicYearDateRange.endDate,
                    academicYear: academicYearId
                };
            
            case 'term':
                if (!academicYearId || !selectedTerm) return null;
                return {
                    ...baseParams,
                    academicYear: academicYearId,
                    term: selectedTerm
                };
            
            case 'dateRange':
                if (!startDate || !endDate) return null;
                return {
                    ...baseParams,
                    fromDate: startDate,
                    toDate: endDate
                };
            
            case 'date':
                if (!singleDate) return null;
                return {
                    ...baseParams,
                    date: singleDate
                };
            
            default:
                return null;
        }
    }, [reportMode, submittedFilters, academicYearId, selectedTerm, academicYearDateRange, selectedTermDates, startDate, endDate, singleDate, filtersSubmitted]);
    
    // Termwise report query
    const { data: termwiseData, isLoading: termwiseLoading, error: termwiseError, refetch: refetchTermwise } = useGetTermwiseAttendanceReportQuery(
        reportMode === 'term' && queryParams ? queryParams : undefined,
        { skip: !filtersSubmitted || reportMode !== 'term' || !queryParams }
    );
    
    // Debug logging
    useEffect(() => {
        console.log('Query Debug:', {
            filtersSubmitted,
            queryParams,
            reportMode,
            submittedFilters,
            academicYearId,
            selectedTerm,
            startDate,
            endDate,
            singleDate
        });
    }, [filtersSubmitted, reportMode, queryParams, submittedFilters, academicYearId, selectedTerm, startDate, endDate, singleDate]);
    
    const { data: dateRangeData, isLoading: dateRangeLoading, refetch: refetchDateRange } = useGetAttendanceByDateRangeQuery(
        (reportMode === 'academicYear' || reportMode === 'dateRange') && queryParams ? queryParams : undefined,
        { skip: !filtersSubmitted || (reportMode !== 'academicYear' && reportMode !== 'dateRange') || !queryParams }
    );
 
    const { data: dateData, isLoading: dateLoading, refetch: refetchDate } = useGetAttendanceByDateQuery(
        reportMode === 'date' && queryParams ? queryParams : undefined,
        { skip: !filtersSubmitted || reportMode !== 'date' || !queryParams }
    );

    useEffect(() => {
        if (!filtersSubmitted || !queryParams) {
            return;
        }

        if (reportMode === 'term') {
            refetchTermwise();
        } else if (reportMode === 'date') {
            refetchDate();
        } else if (reportMode === 'academicYear' || reportMode === 'dateRange') {
            refetchDateRange();
        }
    }, [filtersSubmitted, queryParams, reportMode, refetchTermwise, refetchDate, refetchDateRange]);
    
    // Auto-trigger grades on mount and handle section loading
    useEffect(() => {
        triggerGrades({});
        
        // If filters are already set, trigger sections
        if (filterValues.grade_id && filterValues.gender) {
            const sectionParams = { grade: filterValues.grade_id, gender: filterValues.gender };
            const paramsKey = `${filterValues.grade_id}-${filterValues.gender}`;
            
            if (lastSectionParams.current !== paramsKey) {
                triggerSections(sectionParams);
                lastSectionParams.current = paramsKey;
            }
        }
    }, [triggerGrades, triggerSections, filterValues.grade_id, filterValues.gender]);
    
    // Handle filter changes (only updates form, doesn't trigger query)
    const handleFilterChange = (newValues) => {
        const updatedFilters = newValues.values || newValues;
        const hasChanged =
            updatedFilters.grade_id !== filterValues.grade_id ||
            updatedFilters.gender !== filterValues.gender ||
            updatedFilters.section !== filterValues.section;

        setFilterValues(updatedFilters);

        if (!hasChanged) {
            return;
        }

        setFiltersSubmitted(false); // Reset submitted state only when values change

        if (updatedFilters.grade_id && updatedFilters.gender) {
            const sectionParams = { grade: updatedFilters.grade_id, gender: updatedFilters.gender };
            const paramsKey = `${updatedFilters.grade_id}-${updatedFilters.gender}`;

            // Only trigger if parameters have changed
            if (lastSectionParams.current !== paramsKey) {
                triggerSections(sectionParams);
                lastSectionParams.current = paramsKey;
            }
        } else {
            // Reset ref if filters are cleared
            lastSectionParams.current = null;
        }
    };
    
    // Handle submit button click
    const handleSubmitFilters = () => {
        // Validate all required filters are selected
        if (!filterValues.grade_id || !filterValues.gender || !filterValues.section) {
            showSnackbar(t('attendance.reports.validation.selectFilters'), 'warning');
            return;
        }
        
        // Validate report mode specific requirements
        if ((reportMode === 'term' || reportMode === 'academicYear') && !academicYearId) {
            showSnackbar(t('attendance.reports.validation.selectAcademicYear'), 'warning');
            return;
        }
        
        if (reportMode === 'term' && !selectedTerm) {
            showSnackbar(t('attendance.reports.validation.selectTerm'), 'warning');
            return;
        }
        
        if (reportMode === 'dateRange' && (!startDate || !endDate)) {
            showSnackbar(t('attendance.reports.validation.selectDateRange'), 'warning');
            return;
        }
        
        if (reportMode === 'date' && !singleDate) {
            showSnackbar(t('attendance.reports.validation.selectDate'), 'warning');
            return;
        }
        
        // Set submitted filters and trigger query
        setSubmittedFilters(filterValues);
        setFiltersSubmitted(true);
        showSnackbar(t('attendance.reports.messages.generating', { type: reportMode }), 'info');
    };
    
    // Handle report mode change
    const handleReportModeChange = (value) => {
        setReportValue('reportMode', value);
        setReportValue('selectedTerm', '');
        setReportValue('academicYearId', '');
        setFiltersSubmitted(false);
    };
    
    // Handle academic year change
    const handleAcademicYearChange = (value) => {
        setReportValue('academicYearId', value);
        setReportValue('selectedTerm', '');
        setFiltersSubmitted(false);
    };
    
    // Handle term change
    const handleTermChange = (value) => {
        setReportValue('selectedTerm', value);
        setFiltersSubmitted(false);
    };
    
    // Handle date changes
    const handleStartDateChange = (value) => {
        setReportValue('startDate', value);
        setFiltersSubmitted(false);
    };
    
    const handleEndDateChange = (value) => {
        setReportValue('endDate', value);
        setFiltersSubmitted(false);
    };
    
    const handleSingleDateChange = (value) => {
        setReportValue('singleDate', value);
        setFiltersSubmitted(false);
    };
    
    // Get attendance data based on mode
    const attendanceData = useMemo(() => {
        if (reportMode === 'date') {
            // Backend returns: { status, message, data: [...] }
            // RTK Query returns the response directly
            return dateData?.data || [];
        } else if (reportMode === 'term') {
            // Termwise report returns student statistics, convert to attendance-like format for display
            // Backend returns: { status, message, data: { students, summary, termInfo, analytics } }
            // RTK Query returns the response directly, so: termwiseData.data.students
            if (!termwiseData) {
                console.log('Termwise data is null/undefined');
                return [];
            }
            
            // Try different possible response structures
            const students = termwiseData?.data?.students || 
                           termwiseData?.students || 
                           (Array.isArray(termwiseData?.data) ? termwiseData.data : []);
            
            console.log('Full Termwise Data Object:', termwiseData);
            console.log('Termwise Data.data:', termwiseData?.data);
            console.log('Students array:', students);
            console.log('Students length:', students.length);
            console.log('Is students an array?', Array.isArray(students));
            
            if (!Array.isArray(students)) {
                console.error('Students is not an array:', students);
                return [];
            }
            
            if (students.length === 0 && termwiseData) {
                console.warn('No students found in termwise data. Available paths:', {
                    'termwiseData': termwiseData,
                    'termwiseData?.data': termwiseData?.data,
                    'termwiseData?.data?.students': termwiseData?.data?.students,
                    'termwiseData?.students': termwiseData?.students,
                });
            }
            
            // Convert student stats to attendance records format for consistency
            const converted = students.flatMap(student => {
                if (!student || typeof student !== 'object') return [];
                // Create a summary record for each student
                return [{
                    student: {
                        _id: student.studentId || student._id || student.student?._id,
                        studentID: student.studentId || student.studentID || student.student?.studentID,
                        studentName: student.studentName || student.name || student.student?.studentName
                    },
                    grade: { gradeName: student.grade || student.gradeName || student.grade?.gradeName },
                    section: { sectionName: student.section || student.sectionName || student.section?.sectionName },
                    status: 'summary',
                    presentDays: student.presentDays || 0,
                    absentDays: student.absentDays || 0,
                    lateDays: student.lateDays || 0,
                    attendancePercentage: student.attendancePercentage || 0,
                    totalDays: student.totalDays || 0
                }];
            });
            console.log('Converted attendance data:', converted);
            console.log('Converted length:', converted.length);
            return converted;
        } else {
            // Backend returns: { status, message, data: [...] }
            return dateRangeData?.data || [];
        }
    }, [reportMode, dateData, dateRangeData, termwiseData]);
    
    // Get termwise summary data
    const termwiseSummary = useMemo(() => {
        if (reportMode === 'term' && termwiseData) {
            // Backend returns: { status, message, data: { students, summary, termInfo, analytics } }
            // RTK Query returns the response directly, so: termwiseData.data
            const summary = termwiseData.data || null;
            
            console.log('Termwise Summary:', {
                'termwiseData': termwiseData,
                'termwiseData?.data': termwiseData?.data,
                'selected': summary
            });
            
            return summary;
        }
        return null;
    }, [reportMode, termwiseData]);
    
    const isLoading = reportMode === 'date' ? dateLoading : (reportMode === 'term' ? termwiseLoading : dateRangeLoading);
    
    // Calculate statistics
    const statistics = useMemo(() => {
        if (reportMode === 'term' && termwiseSummary) {
            // Use termwise summary statistics
            return {
                total: termwiseSummary.summary?.totalStudents || 0,
                present: termwiseSummary.summary?.totalPresentDays || 0,
                absent: termwiseSummary.summary?.totalAbsentDays || 0,
                late: termwiseSummary.summary?.totalLateDays || 0,
                halfDay: 0,
                leave: 0,
                attendanceRate: termwiseSummary.summary?.overallAttendancePercentage || 0
            };
        }
        
        if (!attendanceData || attendanceData.length === 0) {
            return {
                total: 0,
                present: 0,
                absent: 0,
                late: 0,
                halfDay: 0,
                leave: 0,
                attendanceRate: 0
            };
        }
        
        const stats = {
            total: attendanceData.length,
            present: 0,
            absent: 0,
            late: 0,
            halfDay: 0,
            leave: 0
        };
        
        attendanceData.forEach(record => {
            if (record.status === 'summary') {
                // Handle termwise summary records
                stats.present += record.presentDays || 0;
                stats.absent += record.absentDays || 0;
                stats.late += record.lateDays || 0;
            } else {
                switch (record.status) {
                    case 'present':
                        stats.present++;
                        break;
                    case 'absent':
                        stats.absent++;
                        break;
                    case 'late':
                        stats.late++;
                        break;
                    case 'half-day':
                        stats.halfDay++;
                        break;
                    case 'leave':
                        stats.leave++;
                        break;
                }
            }
        });
        
        stats.attendanceRate = stats.total > 0 
            ? Math.round(((stats.present + stats.late + stats.halfDay) / (stats.present + stats.absent + stats.late + stats.halfDay + stats.leave || stats.total)) * 100)
            : 0;
        
        return stats;
    }, [attendanceData, reportMode, termwiseSummary]);
    
    // Prepare chart data
    const chartData = useMemo(() => {
        const statusData = {
            labels: [
                t('attendance.dashboard.status.present'),
                t('attendance.dashboard.status.absent'),
                t('attendance.dashboard.status.late'),
                t('attendance.dashboard.status.halfDay'),
                t('attendance.dashboard.status.leave')
            ],
            datasets: [{
                label: t('attendance.reports.charts.attendanceStatus'),
                data: [
                    statistics.present,
                    statistics.absent,
                    statistics.late,
                    statistics.halfDay,
                    statistics.leave
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
            }]
        };
        
        // Daily attendance trend (if date range or termwise)
        const dailyTrend = { labels: [], datasets: [] };
        if (reportMode === 'term' && termwiseSummary?.analytics?.trends?.dateWiseStats) {
            // Use termwise analytics data for daily trend
            const dateWiseStats = termwiseSummary.analytics.trends.dateWiseStats;
            const sortedDates = Object.keys(dateWiseStats).sort();
            dailyTrend.labels = sortedDates.map(d => moment(d).format('MMM DD'));
            dailyTrend.datasets = [{
                label: t('attendance.dashboard.charts.attendanceRate'),
                data: sortedDates.map(d => {
                    const dayStats = dateWiseStats[d];
                    return dayStats.total > 0 ? Math.round((dayStats.present / dayStats.total) * 100) : 0;
                }),
                borderColor: themeColors.primary,
                backgroundColor: `${themeColors.primary}20`,
                tension: 0.4,
                fill: true,
            }];
        } else if (reportMode === 'dateRange' || reportMode === 'academicYear') {
            const dateMap = {};
            attendanceData.forEach(record => {
                if (record.date) {
                    const date = moment(record.date).format('YYYY-MM-DD');
                    if (!dateMap[date]) {
                        dateMap[date] = { present: 0, total: 0 };
                    }
                    dateMap[date].total++;
                    if (['present', 'late', 'half-day'].includes(record.status)) {
                        dateMap[date].present++;
                    }
                }
            });
            
            const sortedDates = Object.keys(dateMap).sort();
            dailyTrend.labels = sortedDates.map(d => moment(d).format('MMM DD'));
            dailyTrend.datasets = [{
                label: t('attendance.dashboard.charts.attendanceRate'),
                data: sortedDates.map(d => {
                    const dayStats = dateMap[d];
                    return dayStats.total > 0 ? Math.round((dayStats.present / dayStats.total) * 100) : 0;
                }),
                borderColor: themeColors.primary,
                backgroundColor: `${themeColors.primary}20`,
                tension: 0.4,
                fill: true,
            }];
        }
        
        return { statusData, dailyTrend };
    }, [statistics, attendanceData, reportMode, themeColors, termwiseSummary, t]);
    
    // Chart options
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: themeColors.text.primary,
                    font: { size: 12 }
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
                ticks: { color: themeColors.text.primary },
                grid: { color: themeColors.border.primary }
            },
            y: {
                ticks: { color: themeColors.text.primary },
                grid: { color: themeColors.border.primary },
                beginAtZero: true
            }
        }
    };
    
    // Export to Excel
    const exportToExcel = () => {
        if (!attendanceData || attendanceData.length === 0) {
            showSnackbar(t('attendance.reports.export.noData'), 'warning');
            return;
        }
        
        const wb = XLSX.utils.book_new();
        
        // Summary Sheet
        const summaryData = [
            [t('attendance.reports.export.summaryTitle')],
            [''],
            [t('attendance.reports.export.reportMode'), reportMode],
            [t('attendance.reports.export.generatedDate'), moment().format('DD-MM-YYYY HH:mm')],
            [''],
            [t('attendance.reports.export.statistics')],
            [t('attendance.reports.stats.totalRecords'), statistics.total],
            [t('attendance.dashboard.status.present'), statistics.present],
            [t('attendance.dashboard.status.absent'), statistics.absent],
            [t('attendance.dashboard.status.late'), statistics.late],
            [t('attendance.dashboard.status.halfDay'), statistics.halfDay],
            [t('attendance.dashboard.status.leave'), statistics.leave],
            [t('attendance.reports.stats.attendanceRate'), `${statistics.attendanceRate}%`]
        ];
        
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
        
        // Attendance Data Sheet
        const attendanceSheetData = reportMode === 'term' 
            ? [[t('attendance.reports.table.term'), t('attendance.reports.table.studentId'), t('attendance.reports.table.studentName'), t('attendance.reports.table.attendancePercent'), t('attendance.reports.table.presentDays'), t('attendance.reports.table.absentDays'), t('attendance.reports.table.lateDays'), t('attendance.reports.table.totalDays')]]
            : [[t('attendance.reports.table.date'), t('attendance.reports.table.studentId'), t('attendance.reports.table.studentName'), t('attendance.dashboard.status.label'), t('attendance.reports.table.timeIn'), t('attendance.reports.table.method')]];
        
        attendanceData.forEach(record => {
            if (reportMode === 'term' && record.status === 'summary') {
                attendanceSheetData.push([
                    termwiseSummary?.termInfo?.term || '',
                    record.student?.studentID || '',
                    record.student?.studentName || '',
                    `${record.attendancePercentage || 0}%`,
                    record.presentDays || 0,
                    record.absentDays || 0,
                    record.lateDays || 0,
                    record.totalDays || 0
                ]);
            } else {
                attendanceSheetData.push([
                    record.date ? moment(record.date).format('DD-MM-YYYY') : '',
                    record.student?.studentID || '',
                    record.student?.studentName || '',
                    record.status || '',
                    record.timeIn ? moment(record.timeIn).format('HH:mm') : '',
                    record.attendanceMethod || ''
                ]);
            }
        });
        
        const attendanceSheet = XLSX.utils.aoa_to_sheet(attendanceSheetData);
        XLSX.utils.book_append_sheet(wb, attendanceSheet, 'Attendance Data');
        
        const fileName = `attendance_report_${moment().format('YYYY-MM-DD_HH-mm')}.xlsx`;
        XLSX.writeFile(wb, fileName);
        showSnackbar(t('attendance.reports.export.excelSuccess'), 'success');
    };
    
    // Export to PDF
    const exportToPDF = () => {
        if (!attendanceData || attendanceData.length === 0) {
            showSnackbar(t('attendance.reports.export.noData'), 'warning');
            return;
        }
        
        const doc = new jsPDF();
        
        // Title
        doc.setFontSize(20);
        doc.text(t('attendance.reports.export.reportTitle'), 20, 20);
        
        doc.setFontSize(12);
        doc.text(`${t('attendance.reports.export.generatedOn')}: ${moment().format('DD-MM-YYYY HH:mm')}`, 20, 35);
        doc.text(`${t('attendance.reports.export.reportMode')}: ${reportMode}`, 20, 45);
        
        // Statistics
        doc.setFontSize(16);
        doc.text(t('attendance.reports.export.statistics'), 20, 65);
        doc.setFontSize(10);
        doc.text(`${t('attendance.reports.stats.totalRecords')}: ${statistics.total}`, 20, 80);
        doc.text(`${t('attendance.dashboard.status.present')}: ${statistics.present}`, 20, 90);
        doc.text(`${t('attendance.dashboard.status.absent')}: ${statistics.absent}`, 20, 100);
        doc.text(`${t('attendance.dashboard.status.late')}: ${statistics.late}`, 20, 110);
        doc.text(`${t('attendance.dashboard.status.halfDay')}: ${statistics.halfDay}`, 20, 120);
        doc.text(`${t('attendance.dashboard.status.leave')}: ${statistics.leave}`, 20, 130);
        doc.text(`${t('attendance.reports.stats.attendanceRate')}: ${statistics.attendanceRate}%`, 20, 140);
        
        // Attendance Table
        doc.setFontSize(16);
        doc.text(t('attendance.reports.export.attendanceData'), 20, 160);
        
        let tableData, tableHeaders;
        if (reportMode === 'term') {
            tableHeaders = [[t('attendance.reports.table.term'), t('attendance.reports.table.studentId'), t('attendance.reports.table.studentName'), t('attendance.reports.table.attendancePercent'), t('attendance.dashboard.status.present'), t('attendance.dashboard.status.absent'), t('attendance.dashboard.status.late'), t('attendance.reports.table.totalDays')]];
            tableData = attendanceData
                .filter(record => record.status === 'summary')
                .map(record => [
                    termwiseSummary?.termInfo?.term || '',
                    record.student?.studentID || '',
                    record.student?.studentName || '',
                    `${record.attendancePercentage || 0}%`,
                    record.presentDays || 0,
                    record.absentDays || 0,
                    record.lateDays || 0,
                    record.totalDays || 0
                ]);
        } else {
            tableHeaders = [[t('attendance.reports.table.date'), t('attendance.reports.table.studentId'), t('attendance.reports.table.studentName'), t('attendance.dashboard.status.label'), t('attendance.reports.table.timeIn')]];
            tableData = attendanceData.map(record => [
                record.date ? moment(record.date).format('DD-MM-YYYY') : '',
                record.student?.studentID || '',
                record.student?.studentName || '',
                record.status || '',
                record.timeIn ? moment(record.timeIn).format('HH:mm') : ''
            ]);
        }
        
        autoTable(doc, {
            startY: 170,
            head: tableHeaders,
            body: tableData,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 139, 202] }
        });
        
        const fileName = `attendance_report_${moment().format('YYYY-MM-DD_HH-mm')}.pdf`;
        doc.save(fileName);
        showSnackbar(t('attendance.reports.export.pdfSuccess'), 'success');
    };

    // console.log({filtersSubmitted})
    
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
            
            {/* Report Configuration - Matching CommonFilter Design */}
            <Fade in={true} timeout={500}>
                <Box sx={{ width: '100%', mb: 3 }}>
                    <Paper 
                        elevation={0}
                        sx={{
                            background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.accent} 100%)`,
                            borderRadius: 3,
                            overflow: 'hidden',
                            position: 'relative',
                            width: '100%',
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(10px)',
                            }
                        }}
                    >
                        <Box sx={{ p: 2, position: 'relative', zIndex: 1 }}>
                            {/* Title Section */}
                            <Box sx={{ mb: 2, textAlign: 'center' }}>
                                <Typography 
                                    variant="h5" 
                                    sx={{ 
                                        color: 'white', 
                                        fontWeight: 700,
                                        fontSize: '1.5rem',
                                        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                        mb: 0.5
                                    }}
                                >
                                    {t('attendance.reports.configuration.title')}
                                </Typography>
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        color: 'rgba(255, 255, 255, 0.8)', 
                                        fontSize: '0.9rem',
                                        fontWeight: 400
                                    }}
                                >
                                    {t('attendance.reports.configuration.subtitle')}
                                </Typography>
                            </Box>
                            
                            <Grid container spacing={2} alignItems="stretch">
                                {/* Report Mode */}
                                <Grid item xs={12} sm={6} md={3}>
                                    <Box sx={{ 
                                        background: themeColors.background.primary, 
                                        borderRadius: 2, 
                                        p: 1.5,
                                        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                                        border: `1px solid ${themeColors.border.primary}`,
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-1px)',
                                            boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                                        }
                                    }}>
                                        <CustomSelect
                                            control={reportControl}
                                            fieldName="reportMode"
                                            fieldLabel={t('attendance.reports.configuration.reportMode')}
                                            size="0.875rem"
                                            onChangeValue={handleReportModeChange}
                                        >
                                            <MenuItem value="date">{t('attendance.reports.configuration.byDate')}</MenuItem>
                                            <MenuItem value="dateRange">{t('attendance.reports.configuration.byDateRange')}</MenuItem>
                                            <MenuItem value="term">{t('attendance.reports.configuration.byTerm')}</MenuItem>
                                            <MenuItem value="academicYear">{t('attendance.reports.configuration.byAcademicYear')}</MenuItem>
                                        </CustomSelect>
                                    </Box>
                                </Grid>
                                
                                {/* Academic Year (for term and academicYear modes) */}
                                {(reportMode === 'term' || reportMode === 'academicYear') && (
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Box sx={{ 
                                            background: themeColors.background.primary, 
                                            borderRadius: 2, 
                                            p: 1.5,
                                            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                                            border: `1px solid ${themeColors.border.primary}`,
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-1px)',
                                                boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                                            }
                                        }}>
                                            <CustomSelect
                                                control={reportControl}
                                                fieldName="academicYearId"
                                                fieldLabel={`${t('attendance.reports.configuration.academicYear')} ${termsLoading ? `(${t('attendance.reports.configuration.loading')})` : ''}`}
                                                size="0.875rem"
                                                disabled={termsLoading}
                                                onChangeValue={handleAcademicYearChange}
                                            >
                                                <MenuItem value="" disabled>
                                                    <em>{t('attendance.reports.configuration.selectAcademicYear')}</em>
                                                </MenuItem>
                                                {academicYearsData?.map((ay) => (
                                                    <MenuItem key={ay._id} value={ay._id}>
                                                        {ay.academicYear}
                                                    </MenuItem>
                                                ))}
                                            </CustomSelect>
                                        </Box>
                                    </Grid>
                                )}
                                
                                {/* Term Selection (for term mode) */}
                                {reportMode === 'term' && academicYearId && (
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Box sx={{ 
                                            background: themeColors.background.primary, 
                                            borderRadius: 2, 
                                            p: 1.5,
                                            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                                            border: `1px solid ${themeColors.border.primary}`,
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-1px)',
                                                boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                                            }
                                        }}>
                                            <CustomSelect
                                                control={reportControl}
                                                fieldName="selectedTerm"
                                                fieldLabel={`${t('attendance.reports.configuration.term')} ${termsLoading ? `(${t('attendance.reports.configuration.loading')})` : ''}`}
                                                size="0.875rem"
                                                disabled={termsLoading}
                                                onChangeValue={handleTermChange}
                                            >
                                                <MenuItem value="" disabled>
                                                    <em>{t('attendance.reports.configuration.selectTerm')}</em>
                                                </MenuItem>
                                                {termsData?.data?.data?.map((term, index) => (
                                                    <MenuItem key={index} value={term.term}>
                                                        {term.term}
                                                    </MenuItem>
                                                ))}
                                            </CustomSelect>
                                        </Box>
                                    </Grid>
                                )}
                                
                                {/* Date Range (for dateRange mode) */}
                                {reportMode === 'dateRange' && (
                                    <>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Box sx={{ 
                                                background: themeColors.background.primary, 
                                                borderRadius: 2, 
                                                p: 1.5,
                                                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                                                border: `1px solid ${themeColors.border.primary}`,
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-1px)',
                                                    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                                                }
                                            }}>
                                                <CustomDatePicker
                                                    control={reportControl}
                                                    fieldName="startDate"
                                                    fieldLabel={t('attendance.reports.configuration.startDate')}
                                                    changeValue={handleStartDateChange}
                                                />
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Box sx={{ 
                                                background: themeColors.background.primary, 
                                                borderRadius: 2, 
                                                p: 1.5,
                                                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                                                border: `1px solid ${themeColors.border.primary}`,
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-1px)',
                                                    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                                                }
                                            }}>
                                                <CustomDatePicker
                                                    control={reportControl}
                                                    fieldName="endDate"
                                                    fieldLabel={t('attendance.reports.configuration.endDate')}
                                                    changeValue={handleEndDateChange}
                                                />
                                            </Box>
                                        </Grid>
                                    </>
                                )}
                                
                                {/* Single Date (for date mode) */}
                                {reportMode === 'date' && (
                                    <Grid item xs={12} sm={6} md={3}>
                                        <Box sx={{ 
                                            background: themeColors.background.primary, 
                                            borderRadius: 2, 
                                            p: 1.5,
                                            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                                            border: `1px solid ${themeColors.border.primary}`,
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-1px)',
                                                boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                                            }
                                        }}>
                                            <CustomDatePicker
                                                control={reportControl}
                                                fieldName="singleDate"
                                                fieldLabel={t('attendance.reports.configuration.date')}
                                                changeValue={handleSingleDateChange}
                                            />
                                        </Box>
                                    </Grid>
                                )}
                            </Grid>
                        </Box>
                    </Paper>
                </Box>
            </Fade>
            
            {/* Class Configuration - Using CommonFilter */}
            <Box sx={{ mb: 3 }}>
                <CommonFilter
                    title={t('attendance.manual.classConfiguration')}
                    showGender={true}
                    showSection={true}
                    showSubmit={false}
                    onSelectionChange={handleFilterChange}
                    onHide={() => {}}
                    initialValues={filterValues}
                />
            </Box>
            
            {/* Submit Button */}
            <Box display="flex" justifyContent="flex-end" mb={3}>
                <CustomButton
                    onClick={handleSubmitFilters}
                    label={t('attendance.reports.actions.generateReport')}
                    isIcon={true}
                    ICON={SearchIcon}
                    width="200px"
                />
            </Box>
            
            {/* Report Display */}
            {filtersSubmitted && (
                <>
                    {isLoading ? (
                        <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                            <CardContent>
                                <LinearProgress sx={{ mb: 2 }} />
                                <Typography sx={{ color: themeColors.text.secondary, textAlign: 'center' }}>
                                    {t('attendance.reports.loading')}
                                </Typography>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Statistics Cards */}
                            <Grid container spacing={3} sx={{ mb: 3 }}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                                        <CardContent>
                                            <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.primary }}>
                                                {statistics.total}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                {t('attendance.reports.stats.totalRecords')}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                                        <CardContent>
                                            <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.success }}>
                                                {statistics.present}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                {t('attendance.dashboard.status.present')}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                                        <CardContent>
                                            <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.error }}>
                                                {statistics.absent}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                {t('attendance.dashboard.status.absent')}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                                        <CardContent>
                                            <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.primary }}>
                                                {statistics.attendanceRate}%
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                                {t('attendance.reports.stats.attendanceRate')}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                            
                            {/* Charts */}
                            <Grid container spacing={3} sx={{ mb: 3 }}>
                                <Grid item xs={12} md={6}>
                                    <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, height: 400 }}>
                                        <CardContent>
                                            <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                                                {t('attendance.dashboard.charts.statusDistribution')}
                                            </Typography>
                                            <Box sx={{ height: 300 }}>
                                                <Bar data={chartData.statusData} options={chartOptions} />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, height: 400 }}>
                                        <CardContent>
                                            <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                                                {t('attendance.reports.charts.statusOverview')}
                                            </Typography>
                                            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                <Doughnut data={chartData.statusData} options={chartOptions} />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                                {((reportMode === 'dateRange' || reportMode === 'academicYear' || reportMode === 'term') && chartData.dailyTrend.labels.length > 0) && (
                                    <Grid item xs={12}>
                                        <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, height: 400 }}>
                                            <CardContent>
                                                <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                                                    {t('attendance.reports.charts.dailyTrend')}
                                                </Typography>
                                                <Box sx={{ height: 300 }}>
                                                    <Line data={chartData.dailyTrend} options={{ ...chartOptions, scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, max: 100 } } }} />
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                )}
                            </Grid>
                            
                            {/* Export Buttons */}
                            <Box display="flex" justifyContent="flex-end" gap={2} mb={3}>
                                <Button
                                    variant="outlined"
                                    startIcon={<TableChartIcon />}
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
                                    {t('attendance.reports.export.excel')}
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<PictureAsPdfIcon />}
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
                                    {t('attendance.reports.export.pdf')}
                                </Button>
                            </Box>
                            
                            {/* Attendance Table */}
                            <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                                <CardContent>
                                    <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
                                        {t('attendance.reports.attendanceDetails')}
                                    </Typography>
                                    <TableContainer component={Paper} sx={{ backgroundColor: themeColors.background.primary }}>
                                        <Table>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ color: themeColors.text.primary, fontWeight: 'bold' }}>
                                                        {reportMode === 'term' ? t('attendance.reports.table.term') : t('attendance.reports.table.date')}
                                                    </TableCell>
                                                    <TableCell sx={{ color: themeColors.text.primary, fontWeight: 'bold' }}>{t('attendance.reports.table.studentId')}</TableCell>
                                                    <TableCell sx={{ color: themeColors.text.primary, fontWeight: 'bold' }}>{t('attendance.reports.table.studentName')}</TableCell>
                                                    <TableCell sx={{ color: themeColors.text.primary, fontWeight: 'bold' }}>{t('attendance.dashboard.status.label')}</TableCell>
                                                    <TableCell sx={{ color: themeColors.text.primary, fontWeight: 'bold' }}>
                                                        {reportMode === 'term' ? t('attendance.reports.table.attendanceDetails') : t('attendance.reports.table.timeIn')}
                                                    </TableCell>
                                                    <TableCell sx={{ color: themeColors.text.primary, fontWeight: 'bold' }}>
                                                        {reportMode === 'term' ? t('attendance.reports.table.totalDays') : t('attendance.reports.table.method')}
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {attendanceData.length > 0 ? (
                                                    attendanceData.map((record, index) => {
                                                        if (reportMode === 'term' && record.status === 'summary') {
                                                            // Display termwise student statistics
                                                            return (
                                                                <TableRow key={index}>
                                                                    <TableCell sx={{ color: themeColors.text.primary }}>
                                                                        {termwiseSummary?.termInfo?.term || t('attendance.reports.notAvailable')}
                                                                    </TableCell>
                                                                    <TableCell sx={{ color: themeColors.text.primary }}>
                                                                        {record.student?.studentID || t('attendance.reports.notAvailable')}
                                                                    </TableCell>
                                                                    <TableCell sx={{ color: themeColors.text.primary }}>
                                                                        {record.student?.studentName || t('attendance.reports.notAvailable')}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Chip
                                                                            label={`${record.attendancePercentage}%`}
                                                                            size="small"
                                                                            sx={{
                                                                                backgroundColor: 
                                                                                    record.attendancePercentage >= 80 ? themeColors.success :
                                                                                    record.attendancePercentage >= 60 ? themeColors.warning :
                                                                                    themeColors.error,
                                                                                color: 'white',
                                                                                fontWeight: 'bold'
                                                                            }}
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell sx={{ color: themeColors.text.primary }}>
                                                                        {t('attendance.reports.table.present')}: {record.presentDays || 0} | {t('attendance.reports.table.absent')}: {record.absentDays || 0} | {t('attendance.reports.table.late')}: {record.lateDays || 0}
                                                                    </TableCell>
                                                                    <TableCell sx={{ color: themeColors.text.primary }}>
                                                                        {t('attendance.reports.table.totalDays')}: {record.totalDays || 0}
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        }
                                                        // Regular attendance records
                                                        return (
                                                            <TableRow key={index}>
                                                                <TableCell sx={{ color: themeColors.text.primary }}>
                                                                    {record.date ? moment(record.date).format('DD-MM-YYYY') : t('attendance.reports.notAvailable')}
                                                                </TableCell>
                                                                <TableCell sx={{ color: themeColors.text.primary }}>
                                                                    {record.student?.studentID || t('attendance.reports.notAvailable')}
                                                                </TableCell>
                                                                <TableCell sx={{ color: themeColors.text.primary }}>
                                                                    {record.student?.studentName || t('attendance.reports.notAvailable')}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Chip
                                                                        label={record.status ? t(`attendance.dashboard.status.${record.status}`) || record.status : t('attendance.reports.notAvailable')}
                                                                        size="small"
                                                                        sx={{
                                                                            backgroundColor: 
                                                                                record.status === 'present' ? themeColors.success :
                                                                                record.status === 'absent' ? themeColors.error :
                                                                                record.status === 'late' ? themeColors.warning :
                                                                                record.status === 'half-day' ? themeColors.accent :
                                                                                themeColors.text.secondary,
                                                                            color: 'white',
                                                                            fontWeight: 'bold'
                                                                        }}
                                                                    />
                                                                </TableCell>
                                                                <TableCell sx={{ color: themeColors.text.primary }}>
                                                                    {record.timeIn ? moment(record.timeIn).format('HH:mm') : t('attendance.reports.notAvailable')}
                                                                </TableCell>
                                                                <TableCell sx={{ color: themeColors.text.primary }}>
                                                                    {record.attendanceMethod || t('attendance.reports.notAvailable')}
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={6} sx={{ textAlign: 'center', color: themeColors.text.secondary }}>
                                                            {t('attendance.reports.noData')}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </>
            )}
            
            {!filtersSubmitted && (
                <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                    <CardContent>
                        <Alert severity="info">
                            {t('attendance.reports.selectFiltersMessage')}
                        </Alert>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default TeacherAttendanceReportsScreen;

