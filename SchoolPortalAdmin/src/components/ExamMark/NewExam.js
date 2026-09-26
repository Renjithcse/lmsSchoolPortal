import React, { useEffect, useState, useMemo } from 'react'
import CustomModal from '../Common/CustomModal'
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object } from "yup";
import * as yup from "yup";
import { useSnackbar } from '../../hooks/SnackBar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Box, Grid } from '@mui/material';
import CustomInput from '../Common/CustomInput';
import CustomButton from '../Common/CustomButton';
import CustomDatePicker from '../Common/CustomDatefilter';
import { useLocation } from 'react-router-dom';
import { useCreateExamMutation, useUpdateExamMutation } from '../../Redux/features/MarkEntry';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

const NewExam = ({ close, open, label, hide, item, }) => {
    const { t } = useTranslation();
    const showSnackbar = useSnackbar();
    const queryClient = useQueryClient();

    const location = useLocation();

    const schema = useMemo(() => object().shape({
        examName: yup.string().required(t('examMark.newExam.validation.examNameRequired')),
        examDate: yup.date().required(t('examMark.newExam.validation.examDateRequired')),
        publishDate: yup.date().required(t('examMark.newExam.validation.publishDateRequired')),
    }), [t]);

    const [createExam] = useCreateExamMutation()
    const [updateExam] = useUpdateExamMutation()


    const {
        handleSubmit,
        control,
        setValue,
        setError,
        reset,
        formState: { errors }
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            examName: '',
            examDate: null,
            publishDate: null,
        }

    });


    useEffect(() => {
        if (item) {
            setValue('examName', item?.examName);
            setValue('examDate', item?.examDate ? dayjs(item.examDate) : null);
            setValue('publishDate', item?.publishDate ? dayjs(item.publishDate) : null);
        }
    }, [item]);




    const SubmitForm = async(data) => {
        const { state } = location;
        const value = {
            examName: data?.examName,
            examDate: data?.examDate ? data.examDate.toISOString() : null,
            publishDate: data?.publishDate ? data.publishDate.toISOString() : null,
            ...state
        }

        try {
            if (item) {
                // Update existing exam
                const result = await updateExam({ id: item._id, data: value }).unwrap();
                showSnackbar(t('examMark.newExam.messages.updateSuccess'), 'success');
            } else {
                // Create new exam
                const result = await createExam(value).unwrap();
                showSnackbar(t('examMark.newExam.messages.createSuccess'), 'success');
            }
            close();
        } catch (error) {
            showSnackbar(error?.data?.message || t('examMark.newExam.messages.operationFailed'), 'error');
        }
    }
    return (
        <CustomModal close={close} open={open} label={label} width={'sm'} block={true}>
            <Grid container spacing={2}>
                <Grid item xl={12} lg={12} md={12} sm={12} xs={12}>
                    <CustomInput
                        placeholder={t('examMark.newExam.placeholder.examName')}
                        readonly={hide}
                        control={control}
                        error={errors.examName}
                        fieldName="examName"
                        fieldLabel={t('examMark.newExam.fieldLabel.examName')}
                    />
                </Grid>
                <Grid item xl={6} lg={6} md={6} sm={12} xs={12}>
                    <CustomDatePicker
                        placeholder={t('examMark.newExam.placeholder.examDate')}
                        readonly={hide}
                        control={control}
                        error={errors.examDate}
                        fieldName="examDate"
                        fieldLabel={t('examMark.newExam.fieldLabel.examDate')}
                        minDate={dayjs()}
                    />
                </Grid>
                <Grid item xl={6} lg={6} md={6} sm={12} xs={12}>
                    <CustomDatePicker
                        placeholder={t('examMark.newExam.placeholder.publishDate')}
                        readonly={hide}
                        control={control}
                        error={errors.publishDate}
                        fieldName="publishDate"
                        fieldLabel={t('examMark.newExam.fieldLabel.publishDate')}
                        minDate={dayjs()}
                    />
                </Grid>
            </Grid>
            {!hide &&
                <Box px={20} py={4} >
                    <CustomButton
                        onClick={handleSubmit(SubmitForm)}
                        width="100%"
                        label={item ? t('examMark.newExam.actions.update') : t('examMark.newExam.actions.save')}
                        isIcon={false}
                    />
                </Box>}
        </CustomModal>
    )
}

export default NewExam