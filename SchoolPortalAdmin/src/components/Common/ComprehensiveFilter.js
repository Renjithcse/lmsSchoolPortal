import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    Box,
    Grid,
    Typography,
    Paper,
    Fade,
    MenuItem,
    Chip
} from '@mui/material';
import CustomSelect from './CustomSelect';
import CustomInput from './CustomInput';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object } from "yup";
import * as yup from "yup";
import UiBlocker from './UiBlocker';
import { useLazyGetMyGradePermissionsQuery, useLazyGetMyGenderPermissionsQuery, useLazyGetMySectionPermissionsQuery } from '../../Redux/features/Admin/TeachersSlice';
import { useGetAcademicYearQuery } from '../../Redux/features/commonSlice';
import { useTheme } from '../../contexts/ThemeContext';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DateRangeIcon from '@mui/icons-material/DateRange';
import SchoolIcon from '@mui/icons-material/School';
import FilterListIcon from '@mui/icons-material/FilterList';
import GradeIcon from '@mui/icons-material/Grade';
import WcIcon from '@mui/icons-material/Wc';
import CategoryIcon from '@mui/icons-material/Category';
import { useTranslation } from 'react-i18next';

const ComprehensiveFilter = ({
    hide,
    onFilterChange,
    initialValues = {},
    title,
    showDateRange = true,
    showAcademicYear = true,
    showGrade = true,
    showGender = true,
    showSection = true,
    showSubmit = false,
    submitLabel,
    onSubmit,
    resetRoute,
    onHide,
    reportType = null
}) => {
    const { t } = useTranslation();
    const [showSubmitButton, setShowSubmitButton] = useState(showSubmit);
    const { themeColors } = useTheme();
    
    const defaultTitle = title || t('comprehensiveFilter.defaultTitle');
    const defaultSubmitLabel = submitLabel || t('comprehensiveFilter.actions.applyFilter');
    
    // Refs to track the last triggered values
    const lastYearId = useRef(null);
    const lastGradeId = useRef(null);

    const { data: academicYear, isFetching: academicLoading } = useGetAcademicYearQuery();

    const [triggerGrades, { data: grades, refetch: gradeRefetch, isFetching: gradeLoading }] = useLazyGetMyGradePermissionsQuery();
    const [triggerGenders, { data: genders, refetch: genderRefetch, isFetching: genderLoading }] = useLazyGetMyGenderPermissionsQuery();
    const [triggerSections, { data: sections, refetch: sectionRefetch, isFetching: sectionLoading }] = useLazyGetMySectionPermissionsQuery();

    // Schema for form validation
    const schema = useMemo(() => object().shape({
        grade_id: yup.string().when('showGrade', {
            is: true,
            then: yup.string().required(t('comprehensiveFilter.validation.gradeRequired')),
            otherwise: yup.string().optional()
        }),
        gender: yup.string().when('showGender', {
            is: true,
            then: yup.string().required(t('comprehensiveFilter.validation.genderRequired')),
            otherwise: yup.string().optional()
        }),
        section: yup.string().when('showSection', {
            is: true,
            then: yup.string().required(t('comprehensiveFilter.validation.sectionRequired')),
            otherwise: yup.string().optional()
        }),
        specificDate: yup.string().when('reportType', {
            is: 'date',
            then: yup.string().optional(),
            otherwise: yup.string().optional()
        }),
        startDate: yup.string().when('showDateRange', {
            is: true,
            then: yup.string().optional(),
            otherwise: yup.string().optional()
        }),
        endDate: yup.string().when('showDateRange', {
            is: true,
            then: yup.string().optional(),
            otherwise: yup.string().optional()
        }),
        academicYear: yup.string().when('showAcademicYear', {
            is: true,
            then: yup.string().optional(),
            otherwise: yup.string().optional()
        }),
    }), [t]);

    const {
        handleSubmit,
        control,
        setValue,
        setError,
        reset,
        formState: { errors },
        watch
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: initialValues || {},
        context: { reportType, showGrade, showGender, showSection, showDateRange, showAcademicYear }
    });

    const grade = watch('grade_id');
    const gender = watch('gender');
    const section = watch('section');
    const startDate = watch('startDate');
    const endDate = watch('endDate');
    const academicYearValue = watch('academicYear');
    const specificDate = watch('specificDate');

    // Since we're now using string IDs directly, no need to extract _id
    const gradeId = useMemo(() => grade, [grade]);

    // Function to get gender name by ID
    const getGenderName = useCallback((genderId) => {
        if (!genders?.data || !genderId) return '';
        return genderId;
    }, [genders?.data]);

    // Function to get section name by ID
    const getSectionName = useCallback((sectionId) => {
        if (!sections?.data || !sectionId) return '';
        const section = sections.data.find(s => s._id === sectionId);
        return section ? section.sectionName : '';
    }, [sections?.data]);

    // Function to generate title from selected values
    const generateTitle = useCallback(() => {
        const parts = [];
        // Find grade name by ID
        if (grade && grades?.data) {
            const gradeObj = grades.data.find(g => g._id === grade);
            if (gradeObj) parts.push(gradeObj.gradeName);
        }
        if (gender) parts.push(getGenderName(gender));
        if (section) parts.push(getSectionName(section));
        if (specificDate) parts.push(t('comprehensiveFilter.dateLabel', { date: specificDate }));
        if (startDate) parts.push(t('comprehensiveFilter.fromLabel', { date: startDate }));
        if (endDate) parts.push(t('comprehensiveFilter.toLabel', { date: endDate }));
        if (academicYearValue) parts.push(t('comprehensiveFilter.academicYearLabel', { year: academicYearValue }));
        return parts.join(' • ');
    }, [grade, gender, section, specificDate, startDate, endDate, academicYearValue, grades?.data, getGenderName, getSectionName]);

    // Helper function to get display name for grade
    const getGradeDisplayName = useCallback((gradeId) => {
        if (!gradeId || !grades?.data) return '';
        const gradeObj = grades.data.find(g => g._id === gradeId);
        return gradeObj ? gradeObj.gradeName : gradeId;
    }, [grades?.data]);

    // Helper function to get display name for section
    const getSectionDisplayName = useCallback((sectionId) => {
        if (!sectionId || !sections?.data) return '';
        const sectionObj = sections.data.find(s => s._id === sectionId);
        return sectionObj ? sectionObj.sectionName : sectionId;
    }, [sections?.data]);

    // Set initial values if provided
    useEffect(() => {
        if (initialValues) {
            Object.keys(initialValues).forEach(key => {
                if (initialValues[key]) {
                    setValue(key, initialValues[key]);
                }
            });
        }
    }, [initialValues, setValue]);

    // Handle data loading and ensure proper display values
    useEffect(() => {
        // Only clear values if the data is loaded but the value doesn't exist in the data
        if (grade && grades?.data && !grades.data.find(g => g._id === grade)) {
            setValue('grade_id', '');
        }
        
        if (section && sections?.data && !sections.data.find(s => s._id === section)) {
            setValue('section', '');
        }
    }, [grade, section, grades?.data, sections?.data, setValue]);

    useEffect(() => {
        if (!hide) {
            setShowSubmitButton(showSubmit);
        }
    }, [grade, gender, section, specificDate, startDate, endDate, academicYearValue, hide, showSubmit]);

    // Auto-trigger grades when component loads
    useEffect(() => {
        if (!hide) {
            triggerGrades({});
        }
    }, [hide, triggerGrades]);

    useEffect(() => {
        if(gradeId && gradeId !== lastGradeId.current){
            const data = {
                grade: gradeId
            };
            triggerGenders(data);
            triggerSections(data);
            lastGradeId.current = gradeId;
            
            // Clear dependent fields when grade changes
            setValue('gender', '');
            setValue('section', '');
        }
    }, [gradeId, triggerGenders, triggerSections, setValue]);

    // Handle filter changes
    useEffect(() => {
        if (onFilterChange && (grade || gender || section || specificDate || startDate || endDate || academicYearValue)) {
            const filterData = {
                grade_id: grade,
                gender: gender,
                section: section,
                specificDate: specificDate,
                startDate: startDate,
                endDate: endDate,
                academicYear: academicYearValue
            };
            onFilterChange(filterData);
        }
    }, [grade, gender, section, specificDate, startDate, endDate, academicYearValue, onFilterChange]);

    // Notify parent component of selection changes
    useEffect(() => {
        if (onFilterChange) {
            const title = generateTitle();
            onFilterChange({
                title,
                values: { 
                    grade_id: grade, 
                    gender: gender, 
                    section: section,
                    specificDate: specificDate,
                    startDate: startDate,
                    endDate: endDate,
                    academicYear: academicYearValue
                }
            });
        }
    }, [grade, gender, section, specificDate, startDate, endDate, academicYearValue, onFilterChange]);

    const handleFormSubmit = (data) => {
        if (onSubmit) {
            onSubmit(data);
        }
        
        // Hide the form after submission if onHide is provided
        if (onHide) {
            onHide();
        }
    };

    const handleButtonClick = () => {
        const formValues = {
            grade_id: grade,
            gender: gender,
            section: section,
            specificDate: specificDate,
            startDate: startDate,
            endDate: endDate,
            academicYear: academicYearValue
        };
        handleFormSubmit(formValues);
    };

    return (
        <Fade in={true} timeout={500}>
            <Box sx={{ width: '100%', py: 1 }}>
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
                        {(title || defaultTitle) && (
                            <Box sx={{ mb: 2, textAlign: 'center' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                    {reportType === 'date' && (
                                        <CalendarTodayIcon sx={{ color: 'white', fontSize: 28, mr: 1 }} />
                                    )}
                                    {reportType === 'range' && (
                                        <DateRangeIcon sx={{ color: 'white', fontSize: 28, mr: 1 }} />
                                    )}
                                    {reportType === 'academic_year' && (
                                        <SchoolIcon sx={{ color: 'white', fontSize: 28, mr: 1 }} />
                                    )}
                                    {!reportType && (
                                        <FilterListIcon sx={{ color: 'white', fontSize: 28, mr: 1 }} />
                                    )}
                                    <Typography 
                                        variant="h5" 
                                        sx={{ 
                                            color: 'white', 
                                            fontWeight: 700,
                                            fontSize: '1.5rem',
                                            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                        }}
                                    >
                                        {title || defaultTitle}
                                    </Typography>
                                </Box>
                                
                                {/* Report Type Indicator */}
                                {reportType && (
                                    <Box sx={{ mb: 1 }}>
                                        <Chip
                                            label={
                                                reportType === 'date' ? t('comprehensiveFilter.reportTypes.singleDate') :
                                                reportType === 'range' ? t('comprehensiveFilter.reportTypes.dateRange') :
                                                reportType === 'academic_year' ? t('comprehensiveFilter.reportTypes.academicYear') :
                                                t('comprehensiveFilter.reportTypes.custom')
                                            }
                                            sx={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                                color: 'white',
                                                fontWeight: 600,
                                                fontSize: '0.8rem',
                                                '& .MuiChip-label': {
                                                    px: 2
                                                }
                                            }}
                                        />
                                    </Box>
                                )}
                                
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        color: 'rgba(255, 255, 255, 0.8)', 
                                        fontSize: '0.9rem',
                                        fontWeight: 400
                                    }}
                                >
                                    {reportType === 'date' ? t('comprehensiveFilter.subtitles.singleDate') :
                                     reportType === 'range' ? t('comprehensiveFilter.subtitles.dateRange') :
                                     reportType === 'academic_year' ? t('comprehensiveFilter.subtitles.academicYear') :
                                     t('comprehensiveFilter.subtitles.default')}
                                </Typography>
                            </Box>
                        )}
                        
                        <Grid container spacing={2} alignItems="stretch">
                            {/* Specific Date Section - Only for date report type */}
                            {reportType === 'date' && (
                                <Grid item xs={12} sm={6} md={4}>
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
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                            <CalendarTodayIcon sx={{ color: themeColors.primary, fontSize: 16, mr: 0.5 }} />
                                            <Typography variant="subtitle2" sx={{ color: themeColors.primary, fontWeight: 600, fontSize: '0.875rem' }}>
                                                {t('comprehensiveFilter.fields.selectDate')}
                                            </Typography>
                                        </Box>
                                        <CustomInput
                                            name="specificDate"
                                            control={control}
                                            fieldLabel=""
                                            type="date"
                                            error={errors.specificDate}
                                            view={hide}
                                            defaultValue={initialValues.specificDate || ''}
                                        />
                                    </Box>
                                </Grid>
                            )}

                            {/* Date Range Section */}
                            {showDateRange && reportType !== 'date' && (
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
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                            <DateRangeIcon sx={{ color: themeColors.primary, fontSize: 16, mr: 0.5 }} />
                                            <Typography variant="subtitle2" sx={{ color: themeColors.primary, fontWeight: 600, fontSize: '0.875rem' }}>
                                                {t('comprehensiveFilter.fields.startDate')}
                                            </Typography>
                                        </Box>
                                                                                    <CustomInput
                                            name="startDate"
                                            control={control}
                                            fieldLabel=""
                                            type="date"
                                            error={errors.startDate}
                                            view={hide}
                                            defaultValue={initialValues.startDate || ''}
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
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                            <DateRangeIcon sx={{ color: themeColors.primary, fontSize: 16, mr: 0.5 }} />
                                            <Typography variant="subtitle2" sx={{ color: themeColors.primary, fontWeight: 600, fontSize: '0.875rem' }}>
                                                {t('comprehensiveFilter.fields.endDate')}
                                            </Typography>
                                        </Box>
                                                                                    <CustomInput
                                            name="endDate"
                                            control={control}
                                            fieldLabel=""
                                            type="date"
                                            error={errors.endDate}
                                            view={hide}
                                            defaultValue={initialValues.endDate || ''}
                                        />
                                        </Box>
                                    </Grid>
                                </>
                            )}

                            {/* Academic Year Section */}
                            {showAcademicYear && reportType !== 'date' && (
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
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                            <SchoolIcon sx={{ color: themeColors.primary, fontSize: 16, mr: 0.5 }} />
                                            <Typography variant="subtitle2" sx={{ color: themeColors.primary, fontWeight: 600, fontSize: '0.875rem' }}>
                                                {t('comprehensiveFilter.fields.academicYear')}
                                            </Typography>
                                        </Box>
                                        <CustomSelect
                                            view={hide}
                                            control={control}
                                            error={errors.academicYear}
                                            fieldName="academicYear"
                                            fieldLabel=""
                                            size="14px"
                                        >
                                            <MenuItem value="">{t('comprehensiveFilter.allYears')}</MenuItem>
                                            <MenuItem value="2024-2025">2024-2025</MenuItem>
                                            <MenuItem value="2023-2024">2023-2024</MenuItem>
                                            <MenuItem value="2022-2023">2022-2023</MenuItem>
                                            <MenuItem value="2021-2022">2021-2022</MenuItem>
                                        </CustomSelect>
                                    </Box>
                                </Grid>
                            )}

                            {/* Grade Section - Only show if not date report type */}
                            {showGrade && reportType !== 'date' && (
                                <Grid item xs={12} sm={6} md={showGender && showSection ? 2 : showGender || showSection ? 3 : 6}>
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
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                            <GradeIcon sx={{ color: themeColors.primary, fontSize: 16, mr: 0.5 }} />
                                            <Typography variant="subtitle2" sx={{ color: themeColors.primary, fontWeight: 600, fontSize: '0.875rem' }}>
                                                {t('comprehensiveFilter.fields.grade')} {gradeLoading && `(${t('comprehensiveFilter.loading')})`}
                                            </Typography>
                                        </Box>
                                        <CustomSelect
                                            view={hide}
                                            control={control}
                                            error={errors.grade_id}
                                            fieldName="grade_id"
                                            fieldLabel=""
                                            size="14px"
                                            disabled={gradeLoading}
                                        >
                                            <MenuItem value="" disabled>
                                                <em>{t('comprehensiveFilter.placeholders.selectGrade')}</em>
                                            </MenuItem>
                                            {grades?.data && grades?.data?.map((res, i) => (
                                                <MenuItem key={res?._id} value={res._id}>
                                                    {res?.gradeName}
                                                </MenuItem>
                                            ))}
                                        </CustomSelect>
                                    </Box>
                                </Grid>
                            )}

                            {/* Gender Section - Only show if not date report type */}
                            {showGender && reportType !== 'date' && (
                                <Grid item xs={12} sm={6} md={showSection ? 2 : 3}>
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
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                            <WcIcon sx={{ color: themeColors.primary, fontSize: 16, mr: 0.5 }} />
                                            <Typography variant="subtitle2" sx={{ color: themeColors.primary, fontWeight: 600, fontSize: '0.875rem' }}>
                                                {t('comprehensiveFilter.fields.gender')}
                                            </Typography>
                                        </Box>
                                        <CustomSelect
                                            view={hide}
                                            control={control}
                                            error={errors.gender}
                                            fieldName="gender"
                                            fieldLabel=""
                                            size="14px"
                                        >
                                            <MenuItem value="" disabled>
                                                <em>{t('comprehensiveFilter.placeholders.selectGender')}</em>
                                            </MenuItem>
                                            {genders?.data && genders?.data?.map((gender, i) => (
                                                <MenuItem key={gender} value={gender}>
                                                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                                                </MenuItem>
                                            ))}
                                        </CustomSelect>
                                    </Box>
                                </Grid>
                            )}

                            {/* Section Section - Only show if not date report type */}
                            {showSection && reportType !== 'date' && (
                                <Grid item xs={12} sm={6} md={showGender ? 2 : 3}>
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
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                            <CategoryIcon sx={{ color: themeColors.primary, fontSize: 16, mr: 0.5 }} />
                                            <Typography variant="subtitle2" sx={{ color: themeColors.primary, fontWeight: 600, fontSize: '0.875rem' }}>
                                                {t('comprehensiveFilter.fields.section')} {sectionLoading && `(${t('comprehensiveFilter.loading')})`}
                                            </Typography>
                                        </Box>
                                        <CustomSelect
                                            view={hide}
                                            control={control}
                                            error={errors.section}
                                            fieldName="section"
                                            fieldLabel=""
                                            size="14px"
                                            disabled={sectionLoading}
                                        >
                                            <MenuItem value="" disabled>
                                                <em>{t('comprehensiveFilter.placeholders.selectSection')}</em>
                                            </MenuItem>
                                            {sections?.data && sections?.data?.map((res, i) => (
                                                <MenuItem key={res?._id} value={res._id}>
                                                    {res?.sectionName}
                                                </MenuItem>
                                            ))}
                                        </CustomSelect>
                                    </Box>
                                </Grid>
                            )}

                            {/* Submit Button */}
                            {showSubmitButton && (
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
                                        <Typography variant="subtitle2" sx={{ mb: 0.5, color: themeColors.primary, fontWeight: 600, fontSize: '0.875rem' }}>
                                            {t('comprehensiveFilter.fields.actions')}
                                        </Typography>
                                        <Box
                                            onClick={handleButtonClick}
                                            sx={{
                                                background: `linear-gradient(45deg, ${themeColors.primary} 30%, ${themeColors.accent} 90%)`,
                                                borderRadius: 2,
                                                p: 1,
                                                textAlign: 'center',
                                                cursor: 'pointer',
                                                color: 'white',
                                                fontWeight: 600,
                                                boxShadow: `0 4px 16px ${themeColors.primary}30`,
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-1px)',
                                                    boxShadow: `0 6px 20px ${themeColors.primary}40`,
                                                }
                                            }}
                                        >
                                            {defaultSubmitLabel}
                                        </Box>
                                    </Box>
                                </Grid>
                            )}
                        </Grid>
                    </Box>
                </Paper>
                <UiBlocker open={academicLoading || gradeLoading || gradeRefetch || genderLoading || sectionLoading} />
            </Box>
        </Fade>
    );
};

export default ComprehensiveFilter;
