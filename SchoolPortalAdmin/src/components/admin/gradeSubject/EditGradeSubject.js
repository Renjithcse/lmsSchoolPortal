import React, { useMemo } from 'react'
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object } from "yup";
import * as yup from "yup";
import CustomModal from '../../Common/CustomModal';
import { Box, Grid, MenuItem } from '@mui/material';
import CustomButton from '../../Common/CustomButton';
import CustomSelect from '../../Common/CustomSelect';
import { SUBJECT_TYPE } from '../../../constant';
import CustomMultiSelect from '../../Common/CustomMultiSelect';
import { useSnackbar } from '../../../hooks/SnackBar';
import { useLocation } from 'react-router-dom';
import CustomInput from '../../Common/CustomInput';
import { useGetAllTeachersQuery, useUpdateGradeSubjectMutation } from '../../../Redux/features/Admin/GradeSubject';
import { useAbility } from '../../../AbilityContext';
import { useTranslation } from 'react-i18next';
const EditGradeSubject = ({ close, open, label, data }) => {
    const { t } = useTranslation();
    const location = useLocation()

    const { data: teachers } = useGetAllTeachersQuery()

    const [triggerUpdate, { isLoading }] = useUpdateGradeSubjectMutation();
    const ability  = useAbility();

    const schema = useMemo(() => object().shape({
        teacher: yup.string().required(t('gradeSubject.form.validation.teacherRequired'))
    }), [t]);

    const showSnackbar = useSnackbar()




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
            subjects: [],
            type: data?.type,
            subject: data?.subject?.subjectName
        }
    });


    const subjects = watch('subjects')


    const SubmitForm = async (datas) => {

        let value = {
            teacher: datas?.teacher
        }

        const subjects = await triggerUpdate({id: data?._id, data: value})

        if (subjects.error) {
            showSnackbar(t('gradeSubject.form.messages.updateError'), 'error')
            return
        }
        else {
            showSnackbar(t('gradeSubject.form.messages.updateSuccess'), 'success')
            reset()
            close()
        }


        //mutate(value)
    }

    return (
        <CustomModal close={close} open={open} label={label} width={'md'} block={true}>
            <Grid container spacing={2}>
                <Grid item xs={12} md={12} lg={6}>
                    <CustomInput
                        fieldName="type"
                        control={control}
                        fieldLabel={t('gradeSubject.form.subjectType')}
                        readonly
                    />
                </Grid>
                <Grid item xs={12} md={12} lg={6}>
                    <CustomInput
                        fieldName="subject"
                        control={control}
                        fieldLabel={t('gradeSubject.form.subjectName')}
                        readonly
                    />
                </Grid>
                <Grid item xl={12} lg={6}>
                    <CustomSelect
                        control={control}
                        error={errors.teacher}
                        fieldName="teacher"
                        fieldLabel={t('gradeSubject.form.teacher')}
                    >
                        <MenuItem value="" disabled >
                            <em>{t('gradeSubject.form.selectTeacher')}</em>
                        </MenuItem>
                        {teachers && teachers?.data.map((res, i) => (
                            <MenuItem value={res._id} >
                                {`${res?.employeeId}-${res?.employeeName}`}
                            </MenuItem>
                        ))}

                    </CustomSelect>
                </Grid>
            </Grid>
            <Box px={20} py={4} >
                {(ability.can("Create", "GradeSubject") || ability.can("Edit", "GradeSubject")) && <CustomButton
                    onClick={handleSubmit(SubmitForm)}
                    width="90%"
                    label={t('gradeSubject.form.actions.save')}
                    isIcon={false}
                    loading={isLoading}
                />}
            </Box>
        </CustomModal>
    )
}

export default EditGradeSubject