import { Box, Grid, Typography } from '@mui/material'
import React, { useMemo } from 'react'
import CustomModal from '../Common/CustomModal'
import CustomDatePicker from '../Common/CustomDatefilter'
import CustomButton from '../Common/CustomButton'
import { useForm } from 'react-hook-form';
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import dayjs from 'dayjs'
import { updatePublishedExam } from '../../api/onlineExam'
import { useMutation } from '@tanstack/react-query'
import { useSnackbar } from '../../hooks/SnackBar'
import { useTranslation } from 'react-i18next';

const EditPublish = ({data, open, close, label, hide}) => {
    const { t } = useTranslation();
    const showSnackbar = useSnackbar();

    const schema = useMemo(() => yup.object().shape({
        startDate: yup.string().required(t('editPublish.validation.startDateRequired')),
        endDate: yup.string().required(t('editPublish.validation.endDateRequired')),
    }), [t]);

    const publishedExam = data?.publishedExam ?? data?.data?.publishedExam ?? data;
    const gradeLabel =
        publishedExam?.grade?.gradeName ||
        publishedExam?.grade?.grade ||
        publishedExam?.grade?.name ||
        publishedExam?.grade;
    const sectionLabel = publishedExam?.section?.sectionName || publishedExam?.section?.name;
    const questionBankLabel = publishedExam?.questionBank?.questionBankName || publishedExam?.questionBank?.name;
    const subjectLabel =
        publishedExam?.questionBank?.subject?.subjectName ||
        publishedExam?.exam?.subject?.subjectName ||
        publishedExam?.exam?.subjectId?.subjectName ||
        publishedExam?.exam?.subjectName ||
        publishedExam?.subject?.subjectName ||
        publishedExam?.subject;
    const genderLabel =
        publishedExam?.gender === "male" ? t('publishedExamDetails.gender.boys') : t('publishedExamDetails.gender.girls');


    const { mutate, isPending } = useMutation({
		mutationFn: updatePublishedExam,
		onSuccess: async (data) => {
			showSnackbar(t('editPublish.messages.updateSuccess'), 'success');
			close()
		},
		onError: (error, variables, context) => {
			showSnackbar(error?.message, 'error');
		},
	});

    const {
        handleSubmit,
        control,
        setValue,
        setError,
        reset,
        watch,
        formState: { errors }
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            startDate: dayjs(data?.startDate),
            endDate: dayjs(data?.endDate)
        }
    })

    const startDate = watch('startDate')

    
    

    


    const onSubmit = (formData) => {
        const payload = {
            id: publishedExam?._id,
            ...formData,
        };
        mutate(payload);
    }

    
    return (
        <CustomModal close={close} open={open} label={label} width={'sm'} block={true}>
            <Box mb={3}>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                    {t('editPublish.details.title')}
                </Typography>
                <Grid container spacing={1}>
                    <Grid item xs={6} sm={4}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {t('editPublish.details.grade')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                            {gradeLabel || t('publishedExamDetails.na')}
                        </Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {t('editPublish.details.section')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                            {sectionLabel || t('publishedExamDetails.na')}
                        </Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {t('editPublish.details.gender')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                            {genderLabel || t('publishedExamDetails.na')}
                        </Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {t('editPublish.details.questionBank')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                            {questionBankLabel || t('publishedExamDetails.na')}
                        </Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {t('editPublish.details.subject')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                            {subjectLabel || t('publishedExamDetails.na')}
                        </Typography>
                    </Grid>
                    <Grid item xs={6} sm={4}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {t('editPublish.details.questionCount')}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                            {publishedExam?.numberOfQuestions ?? publishedExam?.totalQuestionsInBank ?? t('publishedExamDetails.na')}
                        </Typography>
                    </Grid>
                </Grid>
            </Box>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <CustomDatePicker
                            placeholder={t('editPublish.placeholder.startDate')}
                            readonly={hide}
                            control={control}
                            error={errors.startDate}
                            fieldName="startDate"
                            fieldLabel={t('editPublish.fieldLabel.startDate')}
                            minDate={dayjs()}
                            disabled={dayjs() >= dayjs(data?.startDate)}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <CustomDatePicker
                            placeholder={t('editPublish.placeholder.endDate')}
                            readonly={hide}
                            control={control}
                            error={errors.endDate}
                            fieldName="endDate"
                            fieldLabel={t('editPublish.fieldLabel.endDate')}
                            minDate={startDate ? startDate : dayjs()}
                        />
                    </Grid>
                </Grid>
                <>
                    <hr />
                    <Box display={"flex"} alignItems={"center"} justifyContent={"center"} py={2}>
                        <CustomButton type="submit" label={t('editPublish.actions.update')} onClick={handleSubmit(onSubmit)} disable={isPending} />
                    </Box>
                </>
            </form>
        </CustomModal>
    )
}

export default EditPublish