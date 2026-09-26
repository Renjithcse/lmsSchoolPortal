import React, { useEffect, useState, useMemo } from 'react'
import CustomSelect from '../Common/CustomSelect';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object } from "yup";
import * as yup from "yup";
import CustomMultiSelect from '../Common/CustomMultiSelect';
import { Box, Card, CardContent, Typography, Grid, Button, MenuItem } from '@mui/material';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext'
import { useLocation } from 'react-router-dom';
import { useSnackbar } from '../../hooks/SnackBar';
import { useGetTeacherGradePermissionsQuery, useLazyGetMySectionPermissionsQuery, useLazyGetNotRegisteredSubjectsQuery, useSaveTeacherSubjectPermissionMutation } from '../../Redux/features/Admin/TeachersSlice';
import { useLazyGetAllSectionByAcademicYearGradeGenderQuery } from '../../Redux/features/commonSlice';
import { capitalize } from 'lodash-es';
import UiBlocker from '../Common/UiBlocker';
import { useTranslation } from 'react-i18next';

const CreateSubjectPermission = ({ setView, view }) => {

    const { t } = useTranslation();
    const location = useLocation()
    const [genders, setGenders] = useState([])
    const { themeColors } = useThemeContext()
    const showSnackbar = useSnackbar()

    const schema = useMemo(() => object().shape({
        grade: yup.string().required(t('createSubjectPermission.validation.gradeRequired')),
        gender: yup.string().required(t('createSubjectPermission.validation.genderRequired')),
        section: yup.string().required(t('createSubjectPermission.validation.sectionRequired')),
        subjects: yup.array().required(t('createSubjectPermission.validation.subjectsRequired')).min(1, t('createSubjectPermission.validation.minSubjectsRequired')),
    }), [t]);
    const { data: grades, isLoading: permissionLoading } = useGetTeacherGradePermissionsQuery(location.state)
    const [getSections, { isLoading: sectionLoading, data: sections }] = useLazyGetMySectionPermissionsQuery()

    const [getSubjects, { isLoading: subjectLoading, data: subjects }] = useLazyGetNotRegisteredSubjectsQuery()

    const [triggerSave, { isLoading: saveLoading }] = useSaveTeacherSubjectPermissionMutation()

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
        defaultValues: {
            teacher: location?.state,
            subjects: []
        }
    });


    const grade = watch('grade')
    const gender = watch('gender')
    const section = watch('section')

    useEffect(() => {
        if (grade && gender) {
            getSections({ grade, gender })
        }
    }, [grade, gender])

    useEffect(() => {
        if (grade && gender && section) {
            getSubjects({ grade, gender, section, teacher: location.state })
        }
    }, [grade, gender, section])


    useEffect(() => {
        if (grade) {
            let selected = grades?.data?.find(grad => grad?.grade?._id === grade)
            if (selected) {
                setGenders(selected?.gender)
            }
        }
    }, [grade])



    const onSubmit = async (data) => {
        const subject = await triggerSave(data);

        if (subject.error) {
            showSnackbar(subject.error.data.message, 'error');
            return;
        }
        showSnackbar(t('createSubjectPermission.messages.saveSuccess'), 'success');
        setView('list')

    }

    return (
        <Box>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Button
                    variant="outlined"
                    onClick={() => setView('list')}
                    sx={{
                        borderColor: themeColors.border.primary,
                        color: themeColors.text.primary,
                        backgroundColor: themeColors.background.secondary,
                        '&:hover': {
                            borderColor: themeColors.primary,
                            backgroundColor: themeColors.background.tertiary
                        }
                    }}
                >
                    {t('createSubjectPermission.actions.back')}
                </Button>
                <Typography variant="h6" sx={{ color: themeColors.text.primary, fontWeight: 700 }}>
                    {t('createSubjectPermission.title')}
                </Typography>
            </Box>

            <Card sx={{ mb: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                <CardContent sx={{ p: 3 }}>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6} lg={3}>
                                <CustomSelect
                                    control={control}
                                    error={errors.grade}
                                    fieldName="grade"
                                    fieldLabel={t('createSubjectPermission.fieldLabel.grade')}
                                    size="16px"
                                    view={view === "edit"}
                                >
                                    <MenuItem value="" disabled >
                                        <em>{t('createSubjectPermission.placeholder.selectGrade')}</em>
                                    </MenuItem>
                                    {grades?.data && grades?.data?.map((res, i) => (
                                        <MenuItem key={i} value={res.grade?._id} >
                                            {capitalize(res?.grade?.gradeName)}
                                        </MenuItem>
                                    ))}

                                </CustomSelect>
                            </Grid>
                            <Grid item xs={12} md={6} lg={3}>
                                <CustomSelect
                                    control={control}
                                    error={errors.gender}
                                    fieldName="gender"
                                    fieldLabel={t('createSubjectPermission.fieldLabel.gender')}
                                    size="16px"
                                    view={view === "edit"}
                                >
                                    <MenuItem value="" disabled >
                                        <em>{t('createSubjectPermission.placeholder.selectGender')}</em>
                                    </MenuItem>
                                    {genders && genders.map((res, i) => (
                                        <MenuItem key={i} value={res} >
                                            {capitalize(res)}
                                        </MenuItem>
                                    ))}

                                </CustomSelect>
                            </Grid>
                            <Grid item xs={12} md={6} lg={3}>
                                <CustomSelect
                                    control={control}
                                    error={errors.section}
                                    fieldName="section"
                                    fieldLabel={t('createSubjectPermission.fieldLabel.section')}
                                    size="16px"
                                    view={view === "edit"}
                                >
                                    <MenuItem value="" disabled >
                                        <em>{t('createSubjectPermission.placeholder.selectSection')}</em>
                                    </MenuItem>
                                    {sections && sections?.data?.map((res, i) => (
                                        <MenuItem key={i} value={res._id} >
                                            {res?.sectionName}
                                        </MenuItem>
                                    ))}

                                </CustomSelect>
                            </Grid>
                            <Grid item xs={12} md={6} lg={3}>
                                <CustomMultiSelect
                                    control={control}
                                    error={errors.subjects}
                                    fieldName="subjects"
                                    fieldLabel={t('createSubjectPermission.fieldLabel.subjects')}
                                    size="16px"
                                    view={view === "edit"}
                                >
                                    <MenuItem value="" disabled >
                                        <em>{t('createSubjectPermission.placeholder.selectSubject')}</em>
                                    </MenuItem>
                                    {subjects?.data?.map((res, i) => (
                                        <MenuItem key={i} value={res?.subject?._id} >
                                            {res?.subject?.subjectName}
                                        </MenuItem>
                                    ))}
                                </CustomMultiSelect>
                            </Grid>
                            <Grid item xs={12} display="flex" justifyContent="flex-end" alignItems="center">
                                <Button
                                    variant="contained"
                                    onClick={handleSubmit(onSubmit)}
                                    sx={{
                                        backgroundColor: themeColors.primary,
                                        color: '#fff',
                                        px: 3,
                                        '&:hover': { backgroundColor: themeColors.primary }
                                    }}
                                >
                                    {t('createSubjectPermission.actions.createPermission')}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </CardContent>
            </Card>
            <UiBlocker open={permissionLoading || sectionLoading || subjectLoading || saveLoading} />
        </Box>
    )
}

export default CreateSubjectPermission