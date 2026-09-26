import React, { useEffect, useState, useMemo } from 'react'
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object } from "yup";
import * as yup from "yup";
import CustomMultiSelect from '../Common/CustomMultiSelect';
import { Box, Card, CardContent, Typography, Grid, Button, MenuItem } from '@mui/material';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext'
import { useLocation } from 'react-router-dom';
import { useSnackbar } from '../../hooks/SnackBar';
import { useLazyGetNotRegisteredSubjectsQuery, useSaveTeacherSubjectPermissionMutation, useUpdateSubjectPermissionMutation } from '../../Redux/features/Admin/TeachersSlice';
import UiBlocker from '../Common/UiBlocker';
import CustomInput from '../Common/CustomInput';
import { capitalize } from 'lodash-es';
import { useListGradeSubjectsQuery } from '../../Redux/features/Admin/GradeSubject';
import { useTranslation } from 'react-i18next';

const EditSubjectPermission = ({ setView, view, datas }) => {

    const { t } = useTranslation();
    const location = useLocation()
    const showSnackbar = useSnackbar()
    const { themeColors } = useThemeContext()

    const schema = useMemo(() => object().shape({
        grade: yup.string(),
        gender: yup.string(),
        section: yup.string(),
        subjects: yup.array().required(t('editSubjectPermission.validation.subjectsRequired')).min(1, t('editSubjectPermission.validation.minSubjectsRequired')),
    }), [t]);

    const { isLoading: subjectLoading, data: subjects } = useListGradeSubjectsQuery({ grade: datas?.grade?._id, gender: datas?.gender, section: datas?.section?._id})

    const [triggerUpdate, { isLoading: saveLoading }] = useUpdateSubjectPermissionMutation()

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


    useEffect(() => {
        if(datas){
            reset({
                grade: datas.grade?.gradeName,
                gender: datas.gender,
                section: datas.section?.sectionName,
                subjects: datas?.subjects?.map(subject => subject?._id)
            })

        }
        
    }, [datas])
    


    


    

    

    


    



    const onSubmit = async (data) => {
        let datass = {
            subjects: data?.subjects,
        }
        const subject = await triggerUpdate({id: datas?._id, data: datass});

        if (subject.error) {
            showSnackbar(subject.error.data.message, 'error');
            return;
        }
        showSnackbar(t('editSubjectPermission.messages.updateSuccess'), 'success');
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
                    {t('editSubjectPermission.actions.back')}
                </Button>
                <Typography variant="h6" sx={{ color: themeColors.text.primary, fontWeight: 700 }}>
                    {t('editSubjectPermission.title')}
                </Typography>
            </Box>

            <Card sx={{ mb: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                <CardContent sx={{ p: 3 }}>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6} lg={3}>
                                <CustomInput 
                                    control={control}
                                    error={errors.grade}
                                    fieldName={"grade"}
                                    fieldLabel={t('editSubjectPermission.fieldLabel.grade')}
                                    readonly
                                />
                            </Grid>
                            <Grid item xs={12} md={6} lg={3}>
                                <CustomInput 
                                    control={control}
                                    error={errors.gender}
                                    fieldName={"gender"}
                                    fieldLabel={t('editSubjectPermission.fieldLabel.gender')}
                                    readonly
                                />
                            </Grid>
                            <Grid item xs={12} md={6} lg={3}>
                                <CustomInput 
                                    control={control}
                                    error={errors.section}
                                    fieldName={"section"}
                                    fieldLabel={t('editSubjectPermission.fieldLabel.section')}
                                    readonly
                                />
                            </Grid>
                            <Grid item xs={12} md={6} lg={3}>
                                <CustomMultiSelect
                                    control={control}
                                    error={errors.subjects}
                                    fieldName="subjects"
                                    fieldLabel={t('editSubjectPermission.fieldLabel.subjects')}
                                    size="16px"
                                >
                                    <MenuItem value="" disabled >
                                        <em>{t('editSubjectPermission.placeholder.selectSubject')}</em>
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
                                    {t('editSubjectPermission.actions.updatePermission')}
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                </CardContent>
            </Card>
            <UiBlocker open={subjectLoading || saveLoading} />
        </Box>
    )
}

export default EditSubjectPermission