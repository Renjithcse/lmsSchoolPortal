import { Box, Grid, MenuItem, Typography, Paper, Fade, Button } from '@mui/material'
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import CustomSelect from './CustomSelect'
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object } from "yup";
import * as yup from "yup";
import CustomButton from './CustomButton';
import UiBlocker from './UiBlocker';
import { useLazyGetMyGradePermissionsQuery, useLazyGetMyGenderPermissionsQuery, useLazyGetMySectionPermissionsQuery } from '../../Redux/features/Admin/TeachersSlice';
import { useGetAcademicYearQuery } from '../../Redux/features/commonSlice';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const CommonFilter = ({ 
    hide, 
    onFilterChange, 
    initialValues, 
    onSelectionChange, 
    title,
    showGender = true,
    showSection = true,
    showSubmit = false,
    submitLabel,
    onSubmit,
    resetRoute,
    onHide
}) => {
    const { t } = useTranslation();
    const [showSubmitButton, setShowSubmitButton] = useState(showSubmit);
    const { themeColors } = useTheme();
    
    const defaultSubmitLabel = submitLabel || t('commonFilter.actions.applyFilter');
    
    // Refs to track the last triggered values
    const lastYearId = useRef(null);
    const lastGradeId = useRef(null);
    const lastSectionParams = useRef(null);

    const { data: academicYear, isFetching: academicLoading } = useGetAcademicYearQuery()

    const [triggerGrades, { data: grades, refetch: gradeRefetch, isFetching: gradeLoading }] = useLazyGetMyGradePermissionsQuery()
    const [triggerGenders, { data: genders, refetch: genderRefetch, isFetching: genderLoading }] = useLazyGetMyGenderPermissionsQuery()
    const [triggerSections, { data: sections, refetch: sectionRefetch, isFetching: sectionLoading }] = useLazyGetMySectionPermissionsQuery()



    const schema = useMemo(() => object().shape({
        grade_id: yup.string().required(t('commonFilter.validation.gradeRequired')),
        gender: yup.string().when('showGender', {
            is: true,
            then: yup.string().required(t('commonFilter.validation.genderRequired')),
            otherwise: yup.string().optional()
        }),
        section: yup.string().when('showSection', {
            is: true,
            then: yup.string().required(t('commonFilter.validation.sectionRequired')),
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
        defaultValues: initialValues || {}
    });

    const grade = watch('grade_id')
    const gender = watch('gender')
    const section = watch('section')

    // Since we're now using string IDs directly, no need to extract _id
    const gradeId = useMemo(() => grade, [grade])





    // Function to get gender name by ID
    const getGenderName = useCallback((genderId) => {
        if (!genders?.data || !genderId) return '';
        // For simple array format, the genderId is the gender value itself
        return genderId;
    }, [genders?.data])

    // Function to get section name by ID
    const getSectionName = useCallback((sectionId) => {
        if (!sections?.data || !sectionId) return '';
        const section = sections.data.find(s => s._id === sectionId);
        return section ? section.sectionName : '';
    }, [sections?.data])

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
        return parts.join(' • ');
    }, [grade, gender, section, grades?.data, getGenderName, getSectionName])

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
                    setValue(key, initialValues[key])
                }
            })
        }
    }, [initialValues, setValue])

    // Handle data loading and ensure proper display values
    useEffect(() => {
        // Only clear values if the data is loaded but the value doesn't exist in the data
        if (grade && grades?.data && !grades.data.find(g => g._id === grade)) {
            // Grade value exists but not found in data, clear it
            setValue('grade_id', '');
        }
        
        if (section && sections?.data && !sections.data.find(s => s._id === section)) {
            // Section value exists but not found in data, clear it
            setValue('section', '');
        }
    }, [grade, section, grades?.data, sections?.data, setValue])

    useEffect(() => {
        if (!hide) {
            setShowSubmitButton(showSubmit)
        }
    }, [grade, gender, section, hide, showSubmit])

    // Auto-trigger grades when component loads
    useEffect(() => {
        if (!hide) {
            // Trigger grades without academic year - API will get it from Settings
            triggerGrades({});
        }
    }, [hide, triggerGrades])

    useEffect(() => {
        if (gradeId && gradeId !== lastGradeId.current) {
            const genderParams = {
                grade: gradeId
            };
            triggerGenders(genderParams);
            lastGradeId.current = gradeId;

            // Clear dependent fields when grade changes
            setValue('gender', '');
            setValue('section', '');
            lastSectionParams.current = null;
        }
    }, [gradeId, triggerGenders, setValue])

    useEffect(() => {
        if (!gradeId) {
            return;
        }

        const params = { grade: gradeId };
        if (showGender && gender) {
            params.gender = gender;
        }

        const paramsKey = `${gradeId}-${showGender ? (gender || 'all') : 'all'}`;
        if (lastSectionParams.current !== paramsKey) {
            triggerSections(params);
            lastSectionParams.current = paramsKey;
        }

        if (gender) {
            setValue('section', '');
        }
    }, [gradeId, gender, showGender, triggerSections, setValue])



    // Handle filter changes
    useEffect(() => {
        if (onFilterChange && (grade || gender || section)) {
            const filterData = {
                grade_id: grade,
                gender: gender,
                section: section
            }
            onFilterChange(filterData)
        }
    }, [grade, gender, section, onFilterChange])

    // Notify parent component of selection changes
    useEffect(() => {
        if (onSelectionChange) {
            const title = generateTitle();
            onSelectionChange({
                title,
                values: { grade_id: grade, gender: gender, section: section }
            });
        }
    }, [grade, gender, section, onSelectionChange])

    const handleFormSubmit = (data) => {
        if (onSubmit) {
            onSubmit(data);
        }
        
        // Hide the form after submission if onHide is provided
        if (onHide) {
            onHide()
        }
    }

    const handleButtonClick = () => {
        const formValues = {
            grade_id: grade,
            gender: gender,
            section: section
        };
        handleFormSubmit(formValues);
    }

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
                        {title && (
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
                                    {title}
                                </Typography>
                                <Typography 
                                    variant="body2" 
                                    sx={{ 
                                        color: 'rgba(255, 255, 255, 0.8)', 
                                        fontSize: '0.9rem',
                                        fontWeight: 400
                                    }}
                                >
                                    {t('commonFilter.subtitle')}
                                </Typography>
                            </Box>
                        )}
                        
                        <Grid container spacing={2} alignItems="stretch">
                            <Grid item xs={12} sm={6} md={showGender && showSection ? 4 : showGender || showSection ? 6 : 12}>
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
                                        {t('commonFilter.fields.grade')} {gradeLoading && `(${t('commonFilter.loading')})`}
                                    </Typography>
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
                                            <em>{t('commonFilter.placeholders.selectGrade')}</em>
                                        </MenuItem>
                                        {grades?.data && grades?.data?.map((res, i) => (
                                            <MenuItem key={res?._id} value={res._id}>
                                                {res?.gradeName}
                                            </MenuItem>
                                        ))}
                                    </CustomSelect>
                                </Box>
                            </Grid>

                            {showGender && (
                                <Grid item xs={12} sm={6} md={showSection ? 4 : 6}>
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
                                            {t('commonFilter.fields.gender')}
                                        </Typography>
                                        <CustomSelect
                                            view={hide}
                                            control={control}
                                            error={errors.gender}
                                            fieldName="gender"
                                            fieldLabel=""
                                            size="14px"
                                        >
                                            <MenuItem value="" disabled>
                                                <em>{t('commonFilter.placeholders.selectGender')}</em>
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

                            {showSection && (
                                <Grid item xs={12} sm={6} md={showGender ? 4 : 6}>
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
                                            {t('commonFilter.fields.section')} {sectionLoading && `(${t('commonFilter.loading')})`}
                                        </Typography>
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
                                                <em>{t('commonFilter.placeholders.selectSection')}</em>
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

                            {showSubmitButton && (
                                <Grid item xs={12} sm={6} md={3}>
                                    <CustomButton
                                        onClick={handleButtonClick}
                                        width="100%"
                                        label={defaultSubmitLabel}
                                        type="button"
                                        isIcon={false}
                                        sx={{
                                            background: `linear-gradient(45deg, ${themeColors.primary} 30%, ${themeColors.accent} 90%)`,
                                            borderRadius: 2,
                                            boxShadow: `0 4px 16px ${themeColors.primary}30`,
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: 'translateY(-1px)',
                                                boxShadow: `0 6px 20px ${themeColors.primary}40`,
                                            }
                                        }}
                                    />
                                </Grid>
                            )}
                        </Grid>
                    </Box>
                </Paper>
                <UiBlocker open={academicLoading || gradeLoading || gradeRefetch || genderLoading || sectionLoading} />
            </Box>
        </Fade>
    )
}

export default CommonFilter
