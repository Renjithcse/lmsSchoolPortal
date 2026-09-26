import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    Box,
    Drawer,
    Typography,
    Paper,
    Fade,
    MenuItem,
    Button,
    Alert,
    LinearProgress
} from '@mui/material';
import CustomSelect from '../Common/CustomSelect';
import CustomInput from '../Common/CustomInput';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object } from "yup";
import * as yup from "yup";
import { useLazyGetMyGradePermissionsQuery, useLazyGetMyGenderPermissionsQuery, useLazyGetMySectionPermissionsQuery } from '../../Redux/features/Admin/TeachersSlice';
import { useGetAcademicYearQuery } from '../../Redux/features/commonSlice';
import { getTermsByAcademicYear } from '../../api/termHistory';
import { useTheme } from '../../contexts/ThemeContext';
import AttendanceSummaryReport from './AttendanceSummaryReport';
import ClasswiseAttendanceReport from './ClasswiseAttendanceReport';
import TodayOverallReport from './TodayOverallReport';
import TermwiseAttendanceReport from './TermwiseAttendanceReport';
import moment from 'moment/moment';
import { useTranslation } from 'react-i18next';

// Icons
import AssessmentIcon from '@mui/icons-material/Assessment';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DateRangeIcon from '@mui/icons-material/DateRange';
import SchoolIcon from '@mui/icons-material/School';
import GradeIcon from '@mui/icons-material/Grade';
import WcIcon from '@mui/icons-material/Wc';
import CategoryIcon from '@mui/icons-material/Category';
import TodayIcon from '@mui/icons-material/Today';
import TimelineIcon from '@mui/icons-material/Timeline';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';

const AttendanceReportMenu = ({ open, onClose, onGenerateReport, selectedReportType: propSelectedReportType }) => {
    const { t } = useTranslation();
    const { themeColors } = useTheme();
    const [selectedReportType, setSelectedReportType] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [summaryReportOpen, setSummaryReportOpen] = useState(false);
    const [classwiseReportOpen, setClasswiseReportOpen] = useState(false);
    const [todayOverallReportOpen, setTodayOverallReportOpen] = useState(false);
    const [termwiseReportOpen, setTermwiseReportOpen] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [terms, setTerms] = useState([]);
    const [termsLoading, setTermsLoading] = useState(false);
    
    // Debug: Monitor dialog states
    useEffect(() => {
        console.log('Dialog states changed:', {
            summaryReportOpen,
            classwiseReportOpen,
            todayOverallReportOpen,
            termwiseReportOpen
        });
    }, [summaryReportOpen, classwiseReportOpen, todayOverallReportOpen, termwiseReportOpen]);
    
    // Debug: Monitor reportData changes
    useEffect(() => {
        console.log('ReportData changed:', reportData);
    }, [reportData]);
    
    // Refs to track the last triggered values for cascading filters
    const lastAcademicYear = useRef(null);
    const lastGradeId = useRef(null);

    // API calls - using same structure as CommonFilter
    const { data: academicYear, isFetching: academicLoading } = useGetAcademicYearQuery();
    const [triggerGrades, { data: grades, isFetching: gradeLoading }] = useLazyGetMyGradePermissionsQuery();
    const [triggerGenders, { data: genders, isFetching: genderLoading }] = useLazyGetMyGenderPermissionsQuery();
    const [triggerSections, { data: sections, isFetching: sectionLoading }] = useLazyGetMySectionPermissionsQuery();

    console.log({academicYear});

    // Form validation schema - simplified to avoid yup.when issues
    const schema = object().shape({
        academicYear: yup.string().optional(),
        grade_id: yup.string().optional(),
        gender: yup.string().optional(),
        section: yup.string().optional(),
        term: yup.string().optional(),
        fromDate: yup.string().optional(),
        toDate: yup.string().optional(),
        reportDate: yup.string().optional(),
        summaryType: yup.string().optional(),
        reportType: yup.string().optional()
    });

    const {
        handleSubmit,
        control,
        setValue,
        reset,
        setError,
        formState: { errors },
        watch
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            academicYear: '',
            grade_id: '',
            gender: '',
            section: '',
            term: '',
            fromDate: '',
            toDate: '',
            reportDate: '',
            summaryType: '',
            reportType: selectedReportType?.id || ''
        },
        context: { reportType: selectedReportType?.id || '' }
    });

    const watchedValues = watch();
    const academicYearValue = watchedValues.academicYear;
    const gradeValue = watchedValues.grade_id;
    const genderValue = watchedValues.gender;

    // Get terms from termHistory API based on academic year and active status
    const getTermsFromAcademicYear = useCallback(async () => {
        if (!academicYearValue) {
            setTerms([]);
            return;
        }
        
        try {
            setTermsLoading(true);
            const response = await getTermsByAcademicYear(academicYearValue);
            
            // Filter for active terms only
            const activeTerms = response?.data?.data || response?.data || [];
            const filteredTerms = activeTerms
                .filter(term => term.isActive === true)
                .map(term => ({ 
                    value: term.term, 
                    label: term.term 
                }));
            
            setTerms(filteredTerms);
        } catch (error) {
            console.error('Error fetching terms:', error);
            setTerms([]);
        } finally {
            setTermsLoading(false);
        }
    }, [academicYearValue]);

    // Fetch terms when academic year changes
    useEffect(() => {
        if (academicYearValue) {
            getTermsFromAcademicYear();
        } else {
            setTerms([]);
        }
        // Clear term field when academic year changes
        setValue('term', '');
    }, [academicYearValue, getTermsFromAcademicYear, setValue]);


    // Get academic years from API
    const getAcademicYears = useCallback(() => {
        if (!academicYear) {
            return [
                { value: '2024-2025', label: '2024-2025' },
                { value: '2023-2024', label: '2023-2024' },
                { value: '2022-2023', label: '2022-2023' },
                { value: '2021-2022', label: '2021-2022' }
            ];
        }
        
        // If the API returns an array of academic year objects (correct structure)
        if (Array.isArray(academicYear)) {
            const options = academicYear?.map(yearObj => {
                return { 
                    value: yearObj._id, // Use _id instead of academicYear
                    label: yearObj.academicYear 
                };
            });
            return options;
        }
        
        
    }, [academicYear]);


    // Update form when selected report type changes
    useEffect(() => {
        if (selectedReportType) {
            setValue('reportType', selectedReportType.id);
        }
    }, [selectedReportType, setValue]);

    // Handle prop selected report type
    useEffect(() => {
        if (propSelectedReportType) {
            console.log('Prop selected report type received:', propSelectedReportType);
            setSelectedReportType(propSelectedReportType);
            setShowFilters(propSelectedReportType.requiresFilters);
            reset({
                academicYear: '',
                grade_id: '',
                gender: '',
                section: '',
                term: '',
                fromDate: '',
                toDate: '',
                reportDate: '',
                summaryType: '',
                reportType: propSelectedReportType.id
            });
        }
    }, [propSelectedReportType, reset]);

    // Cascading filter effects - using same logic as CommonFilter
    useEffect(() => {
        if (selectedReportType && selectedReportType.requiresFilters) {
            // Trigger grades when component loads
            triggerGrades({});
        }
    }, [selectedReportType, triggerGrades]);

    useEffect(() => {
        if (academicYearValue && academicYearValue !== lastAcademicYear.current) {
            lastAcademicYear.current = academicYearValue;
            // Trigger grades for the selected academic year
            triggerGrades({ academicYear: academicYearValue });
            // Clear dependent fields
            setValue('grade_id', '');
            setValue('gender', '');
            setValue('section', '');
        }
    }, [academicYearValue, triggerGrades, setValue]);

    useEffect(() => {
        if (gradeValue && gradeValue !== lastGradeId.current) {
            lastGradeId.current = gradeValue;
            const data = { grade: gradeValue };
            if (academicYearValue) data.academicYear = academicYearValue;
            
            triggerGenders(data);
            triggerSections(data);
            
            // Clear dependent fields when grade changes
            setValue('gender', '');
            setValue('section', '');
        }
    }, [gradeValue, academicYearValue, triggerGenders, triggerSections, setValue]);

    // Handle form submission
    const onSubmit = (data) => {
        // Debug: Log the form data being submitted
        console.log('Form data being submitted:', data);
        console.log('Academic year value:', data.academicYear);
        console.log('Academic year type:', typeof data.academicYear);
        
        // Manual validation based on report type
        let isValid = true;
        const errors = {};

        if (selectedReportType.id === 'datewise-summary') {
            if (!data.reportDate) {
                errors.reportDate = { message: t('attendance.reportMenu.validation.dateRequired') };
                isValid = false;
            }
            if (!data.summaryType) {
                errors.summaryType = { message: t('attendance.reportMenu.validation.summaryTypeRequired') };
                isValid = false;
            }
        } else if (selectedReportType.id === 'classwise') {
            if (!data.academicYear) {
                errors.academicYear = { message: t('attendance.reportMenu.validation.academicYearRequired') };
                isValid = false;
            }
            if (!data.grade_id) {
                errors.grade_id = { message: t('attendance.reportMenu.validation.gradeRequired') };
                isValid = false;
            }
            if (!data.fromDate) {
                errors.fromDate = { message: t('attendance.reportMenu.validation.fromDateRequired') };
                isValid = false;
            }
            if (!data.toDate) {
                errors.toDate = { message: t('attendance.reportMenu.validation.toDateRequired') };
                isValid = false;
            }
        } else if (selectedReportType.id === 'termwise') {
            if (!data.academicYear) {
                errors.academicYear = { message: t('attendance.reportMenu.validation.academicYearRequired') };
                isValid = false;
            }
            if (!data.grade_id) {
                errors.grade_id = { message: t('attendance.reportMenu.validation.gradeRequired') };
                isValid = false;
            }
            if (!data.term) {
                errors.term = { message: t('attendance.reportMenu.validation.termRequired') };
                isValid = false;
            }
        }

        if (!isValid) {
            // Set errors manually
            Object.keys(errors).forEach(key => {
                setError(key, errors[key]);
            });
            return;
        }

        // For all report types, call onGenerateReport if available
        // This allows the parent to handle any external logic if needed
        if (onGenerateReport) {
            onGenerateReport({
                reportType: selectedReportType.id,
                ...data
            });
        }

        if (selectedReportType.id === 'datewise-summary') {
            // Open summary report dialog
            setReportData({
                reportType: selectedReportType.id,
                ...data
            });
            setSummaryReportOpen(true);
        } else if (selectedReportType.id === 'classwise') {
            // Open classwise report dialog
            setReportData({
                reportType: selectedReportType.id,
                ...data
            });
            setClasswiseReportOpen(true);
        } else if (selectedReportType.id === 'termwise') {
            // Open termwise report dialog
            console.log('Opening termwise report dialog with data:', data);
            console.log('Data structure check:', {
                hasAcademicYear: !!data.academicYear,
                hasTerm: !!data.term,
                hasGrade: !!data.grade_id,
                academicYearValue: data.academicYear,
                termValue: data.term,
                gradeValue: data.grade_id
            });
            const reportDataToSet = {
                reportType: selectedReportType.id,
                ...data
            };
            console.log('Setting reportData to:', reportDataToSet);
            setReportData(reportDataToSet);
            setTermwiseReportOpen(true);
            console.log('Termwise dialog state set to true');
            console.log('Current reportData state will be:', reportDataToSet);
        } else if (selectedReportType.id === 'today-overall') {
            // Open today's overall report dialog
            setReportData({
                reportType: selectedReportType.id,
                ...data
            });
            setTodayOverallReportOpen(true);
        }
    };

    const academicYearOptions = getAcademicYears();
    
    // Summary type options for datewise report
    const summaryTypeOptions = useMemo(() => [
        { value: 'all-classes', label: t('attendance.reportMenu.summaryTypes.allClasses') },
        { value: 'grade-wise', label: t('attendance.reportMenu.summaryTypes.gradeWise') },
        { value: 'gender-wise', label: t('attendance.reportMenu.summaryTypes.genderWise') }
    ], [t]);

    return (
        <>
            <Drawer
            anchor="right"
            open={open}
            onClose={() => {
                setSelectedReportType(null);
                setShowFilters(false);
                onClose();
            }}
            sx={{
                '& .MuiDrawer-paper': {
                    width: 400,
                    backgroundColor: themeColors.background.secondary,
                    borderLeft: `1px solid ${themeColors.border.primary}`,
                }
            }}
        >
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <Box sx={{ 
                    p: 2, 
                    background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.accent} 100%)`,
                    color: 'white'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {selectedReportType ? selectedReportType.title : t('attendance.reportMenu.title')}
                        </Typography>
                        <Button
                            onClick={() => {
                                setSelectedReportType(null);
                                setShowFilters(false);
                                onClose();
                            }}
                            sx={{ color: 'white', minWidth: 'auto' }}
                        >
                            <CloseIcon />
                        </Button>
                    </Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {selectedReportType ? selectedReportType.description : t('attendance.reportMenu.description')}
                    </Typography>
                </Box>

                {/* Report Configuration */}
                <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>

                    {/* Filters Section */}
                    {showFilters && selectedReportType && (
                        <Fade in={showFilters} timeout={300}>
                            <Paper sx={{ 
                                mt: 3, 
                                p: 2, 
                                background: themeColors.background.primary,
                                border: `1px solid ${themeColors.border.primary}`,
                                borderRadius: 2
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <AssessmentIcon sx={{ color: themeColors.primary, mr: 1 }} />
                                    <Typography variant="h6" sx={{ color: themeColors.text.primary, fontWeight: 600 }}>
                                        {t('attendance.reportMenu.configuration')}
                                    </Typography>
                                </Box>
                                


                                <form onSubmit={handleSubmit(onSubmit)}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {/* Academic Year */}
                                    {(selectedReportType.id === 'classwise' || selectedReportType.id === 'termwise') && (
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                <SchoolIcon sx={{ color: themeColors.primary, fontSize: 16, mr: 0.5 }} />
                                                <Typography variant="subtitle2" sx={{ color: themeColors.primary, fontWeight: 600 }}>
                                                    {t('attendance.reportMenu.fields.academicYear')}
                                                </Typography>
                                            </Box>
                                            <CustomSelect
                                                control={control}
                                                error={errors?.academicYear}
                                                fieldName="academicYear"
                                                fieldLabel=""
                                                size="14px"
                                                disabled={academicLoading}
                                            >
                                                <MenuItem value="" disabled>
                                                    <em>{academicLoading ? t('attendance.reportMenu.loading') : t('attendance.reportMenu.placeholders.selectAcademicYear')}</em>
                                                </MenuItem>
                                                {academicYearOptions.length > 0 ? (
                                                    academicYearOptions?.map((option) => (
                                                        <MenuItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </MenuItem>
                                                    ))
                                                ) : (
                                                    <MenuItem value="" disabled>
                                                        <em>{t('attendance.reportMenu.noAcademicYears')}</em>
                                                    </MenuItem>
                                                )}
                                            </CustomSelect>
                                        </Box>
                                    )}

                                    {/* Date for Date-wise Summary Report */}
                                    {selectedReportType.id === 'datewise-summary' && (
                                        <>
                                            <Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                    <CalendarTodayIcon sx={{ color: themeColors.primary, fontSize: 16, mr: 0.5 }} />
                                                    <Typography variant="subtitle2" sx={{ color: themeColors.primary, fontWeight: 600 }}>
                                                        {t('attendance.reportMenu.fields.selectDate')}
                                                    </Typography>
                                                </Box>
                                                <CustomInput
                                                    name="reportDate"
                                                    control={control}
                                                    fieldLabel=""
                                                    type="date"
                                                    error={errors?.reportDate}
                                                />
                                            </Box>
                                            <Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                    <AssessmentIcon sx={{ color: themeColors.primary, fontSize: 16, mr: 0.5 }} />
                                                    <Typography variant="subtitle2" sx={{ color: themeColors.primary, fontWeight: 600 }}>
                                                        {t('attendance.reportMenu.fields.summaryType')}
                                                    </Typography>
                                                </Box>
                                                <CustomSelect
                                                    control={control}
                                                    error={errors?.summaryType}
                                                    fieldName="summaryType"
                                                    fieldLabel=""
                                                    size="14px"
                                                >
                                                    <MenuItem value="" disabled>
                                                        <em>{t('attendance.reportMenu.placeholders.selectSummaryType')}</em>
                                                    </MenuItem>
                                                    {summaryTypeOptions?.map((option) => (
                                                        <MenuItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </MenuItem>
                                                    ))}
                                                </CustomSelect>
                                            </Box>
                                        </>
                                    )}

                                    {/* Date Range for Class-wise Report */}
                                    {selectedReportType.id === 'classwise' && (
                                        <>
                                            <Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                    <DateRangeIcon sx={{ color: themeColors.primary, fontSize: 16, mr: 0.5 }} />
                                                    <Typography variant="subtitle2" sx={{ color: themeColors.primary, fontWeight: 600 }}>
                                                        {t('attendance.reportMenu.fields.fromDate')}
                                                    </Typography>
                                                </Box>
                                                <CustomInput
                                                    name="fromDate"
                                                    control={control}
                                                    fieldLabel=""
                                                    type="date"
                                                    error={errors?.fromDate}
                                                />
                                            </Box>
                                            <Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                    <DateRangeIcon sx={{ color: themeColors.primary, fontSize: 16, mr: 0.5 }} />
                                                    <Typography variant="subtitle2" sx={{ color: themeColors.primary, fontWeight: 600 }}>
                                                        {t('attendance.reportMenu.fields.toDate')}
                                                    </Typography>
                                                </Box>
                                                <CustomInput
                                                    name="toDate"
                                                    control={control}
                                                    fieldLabel=""
                                                    type="date"
                                                    error={errors?.toDate}
                                                />
                                            </Box>
                                        </>
                                    )}

                                    {/* Term for Term-wise Report */}
                                    {selectedReportType.id === 'termwise' && (
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                <TimelineIcon sx={{ color: themeColors.primary, fontSize: 16, mr: 0.5 }} />
                                                <Typography variant="subtitle2" sx={{ color: themeColors.primary, fontWeight: 600 }}>
                                                    {t('attendance.reportMenu.fields.term')} {termsLoading && `(${t('attendance.reportMenu.loading')})`}
                                                </Typography>
                                            </Box>
                                            <CustomSelect
                                                control={control}
                                                error={errors?.term}
                                                fieldName="term"
                                                fieldLabel=""
                                                size="14px"
                                                disabled={termsLoading}
                                            >
                                                <MenuItem value="" disabled>
                                                    <em>{termsLoading ? t('attendance.reportMenu.loadingTerms') : t('attendance.reportMenu.placeholders.selectTerm')}</em>
                                                </MenuItem>
                                                {terms?.map((option) => (
                                                    <MenuItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </MenuItem>
                                                ))}
                                            </CustomSelect>
                                        </Box>
                                    )}

                                    {/* Grade */}
                                    {(selectedReportType.id === 'classwise' || selectedReportType.id === 'termwise') && (
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                <GradeIcon sx={{ color: themeColors.primary, fontSize: 16, mr: 0.5 }} />
                                                <Typography variant="subtitle2" sx={{ color: themeColors.primary, fontWeight: 600 }}>
                                                    {t('attendance.reportMenu.fields.grade')} {gradeLoading && `(${t('attendance.reportMenu.loading')})`}
                                                </Typography>
                                            </Box>
                                            <CustomSelect
                                                control={control}
                                                error={errors?.grade_id}
                                                fieldName="grade_id"
                                                fieldLabel=""
                                                size="14px"
                                                disabled={gradeLoading}
                                            >
                                                <MenuItem value="" disabled>
                                                    <em>{t('attendance.reportMenu.placeholders.selectGrade')}</em>
                                                </MenuItem>
                                                {grades?.data && grades.data.map((grade) => (
                                                    <MenuItem key={grade._id} value={grade._id}>
                                                        {grade.gradeName}
                                                    </MenuItem>
                                                ))}
                                            </CustomSelect>
                                        </Box>
                                    )}

                                    {/* Gender */}
                                    {(selectedReportType.id === 'classwise' || selectedReportType.id === 'termwise') && (
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                <WcIcon sx={{ color: themeColors.primary, fontSize: 16, mr: 0.5 }} />
                                                <Typography variant="subtitle2" sx={{ color: themeColors.primary, fontWeight: 600 }}>
                                                    {t('attendance.reportMenu.fields.gender')} {genderLoading && `(${t('attendance.reportMenu.loading')})`}
                                                </Typography>
                                            </Box>
                                            <CustomSelect
                                                control={control}
                                                error={errors?.gender}
                                                fieldName="gender"
                                                fieldLabel=""
                                                size="14px"
                                                disabled={genderLoading}
                                            >
                                                <MenuItem value="" disabled>
                                                    <em>{t('attendance.reportMenu.placeholders.selectGender')}</em>
                                                </MenuItem>
                                                {genders?.data && genders.data.map((gender) => (
                                                    <MenuItem key={gender} value={gender}>
                                                        {gender.charAt(0).toUpperCase() + gender.slice(1)}
                                                    </MenuItem>
                                                ))}
                                            </CustomSelect>
                                        </Box>
                                    )}

                                    {/* Section */}
                                    {(selectedReportType.id === 'classwise' || selectedReportType.id === 'termwise') && (
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                                <CategoryIcon sx={{ color: themeColors.primary, fontSize: 16, mr: 0.5 }} />
                                                <Typography variant="subtitle2" sx={{ color: themeColors.primary, fontWeight: 600 }}>
                                                    {t('attendance.reportMenu.fields.section')} {sectionLoading && `(${t('attendance.reportMenu.loading')})`}
                                                </Typography>
                                            </Box>
                                            <CustomSelect
                                                control={control}
                                                error={errors?.section}
                                                fieldName="section"
                                                fieldLabel=""
                                                size="14px"
                                                disabled={sectionLoading}
                                            >
                                                <MenuItem value="" disabled>
                                                    <em>{t('attendance.reportMenu.placeholders.selectSection')}</em>
                                                </MenuItem>
                                                {sections?.data && sections.data.map((section) => (
                                                    <MenuItem key={section._id} value={section._id}>
                                                        {section.sectionName}
                                                    </MenuItem>
                                                ))}
                                            </CustomSelect>
                                        </Box>
                                    )}

                                    {/* Loading Indicator */}
                                    {(academicLoading || gradeLoading || genderLoading || sectionLoading) && (
                                        <Alert severity="info" sx={{ mt: 1 }}>
                                            <LinearProgress sx={{ mb: 1 }} />
                                            {t('attendance.reportMenu.loadingFilterOptions')}
                                        </Alert>
                                    )}

                                    {/* Generate Report Button */}
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        startIcon={<PrintIcon />}
                                        disabled={academicLoading || gradeLoading || genderLoading || sectionLoading}
                                        sx={{
                                            mt: 2,
                                            background: `linear-gradient(45deg, ${themeColors.primary} 30%, ${themeColors.accent} 90%)`,
                                            color: 'white',
                                            fontWeight: 600,
                                            py: 1.5,
                                            '&:hover': {
                                                background: `linear-gradient(45deg, ${themeColors.primary} 40%, ${themeColors.accent} 100%)`,
                                            }
                                        }}
                                    >
                                        {t('attendance.reportMenu.actions.generateReport')}
                                    </Button>
                                    </Box>
                                </form>
                            </Paper>
                        </Fade>
                    )}

                    {/* Quick Report Buttons for Simple Reports */}
                    {selectedReportType && !selectedReportType.requiresFilters && (
                        <Fade in={true} timeout={300}>
                            <Paper sx={{ 
                                mt: 3, 
                                p: 2, 
                                background: themeColors.background.primary,
                                border: `1px solid ${themeColors.border.primary}`,
                                borderRadius: 2
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <AssessmentIcon sx={{ color: themeColors.primary, mr: 1 }} />
                                    <Typography variant="h6" sx={{ color: themeColors.text.primary, fontWeight: 600 }}>
                                        {t('attendance.reportMenu.actions.generateReport')}
                                    </Typography>
                                </Box>
                                
                                <Button
                                    onClick={() => {
                                        if (selectedReportType.id === 'today-overall') {
                                            setReportData({
                                                reportType: selectedReportType.id,
                                                date: moment().format('YYYY-MM-DD')
                                            });
                                            setTodayOverallReportOpen(true);
                                            // Also call onGenerateReport to notify parent
                                            if (onGenerateReport) {
                                                onGenerateReport({
                                                    reportType: selectedReportType.id,
                                                    date: moment().format('YYYY-MM-DD')
                                                });
                                            }
                                        } else if (onGenerateReport) {
                                            onGenerateReport({
                                                reportType: selectedReportType.id,
                                                date: selectedReportType.id === 'datewise-summary' ? moment().format('YYYY-MM-DD') : undefined
                                            });
                                        }
                                    }}
                                    variant="contained"
                                    startIcon={<PrintIcon />}
                                    fullWidth
                                    sx={{
                                        background: `linear-gradient(45deg, ${themeColors.primary} 30%, ${themeColors.accent} 90%)`,
                                        color: 'white',
                                        fontWeight: 600,
                                        py: 1.5,
                                        '&:hover': {
                                            background: `linear-gradient(45deg, ${themeColors.primary} 40%, ${themeColors.accent} 100%)`,
                                        }
                                    }}
                                >
                                    {t('attendance.reportMenu.actions.generateReport')} {selectedReportType?.title}
                                </Button>
                            </Paper>
                        </Fade>
                    )}
                </Box>
            </Box>
        </Drawer>

        {/* Summary Report Dialog */}
        <AttendanceSummaryReport
            open={summaryReportOpen}
            onClose={() => setSummaryReportOpen(false)}
            reportData={reportData}
        />

        {/* Classwise Report Dialog */}
        <ClasswiseAttendanceReport
            open={classwiseReportOpen}
            onClose={() => setClasswiseReportOpen(false)}
            reportData={reportData}
        />

        {/* Today's Overall Report Dialog */}
        <TodayOverallReport
            open={todayOverallReportOpen}
            onClose={() => setTodayOverallReportOpen(false)}
            reportData={reportData}
        />

        {/* Termwise Report Dialog */}
        <TermwiseAttendanceReport
            open={termwiseReportOpen}
            onClose={() => setTermwiseReportOpen(false)}
            reportData={reportData}
        />
    </>
    );
};

export default AttendanceReportMenu;
