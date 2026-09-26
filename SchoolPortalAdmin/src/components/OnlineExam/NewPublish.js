import { Box, Grid, MenuItem } from '@mui/material';
import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import CustomInput from '../Common/CustomInput';
import CustomButton from '../Common/CustomButton';
import CustomModal from '../Common/CustomModal';
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useOutletContext, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getNotPublishedSections, getAllQuestionBanks, publishExam, viewPublishedExam, updatePublishedExam } from '../../api/onlineExam';
import CustomSelect from '../Common/CustomSelect';
import CustomMultiSelect from '../Common/CustomMultiSelect';
import CustomDateTimePicker from '../Common/CustomDateTimePicker';
import dayjs from 'dayjs';
import { useSnackbar } from '../../hooks/SnackBar';
import UiBlocker from '../Common/UiBlocker';
import { useTranslation } from 'react-i18next';

const NewPublish = ({ close, open, label, hide, id, state, publish: publishProp }) => {

    const { t } = useTranslation();
    const [maxQuestions, setMaxQuestions] = useState(0)
    const [sectionsOptions, setSectionsOptions] = useState([]);
    const isEdit = Boolean(id);

    const exam = useOutletContext();
    const subjectId = exam?.subjectId?._id || exam?.subjectId;
    const gradeId = exam?.grade?._id || exam?.grade;
    const questionBankFilters = useMemo(() => {
        if (!subjectId || !gradeId) return null;
        return {
            subjectId,
            gradeId
        };
    }, [subjectId, gradeId]);
    const queryClient = useQueryClient();
    const showSnackbar = useSnackbar();

    const schema = useMemo(() => yup.object().shape({
        questionBank: yup.string().required(t('onlineExam.newPublish.validation.questionBankRequired')),
        gender: yup.string().required(t('onlineExam.newPublish.validation.genderRequired')),
        sections: yup.array().required(t('onlineExam.newPublish.validation.sectionRequired')).min(1, t('onlineExam.newPublish.validation.minSectionRequired')),
        numberOfQuestions: yup.number().required(t('onlineExam.newPublish.validation.numberOfQuestionsRequired')),
        duration: yup.string().required(t('onlineExam.newPublish.validation.durationRequired')),
        startDate: yup.string().required(t('onlineExam.newPublish.validation.startDateRequired')),
        endDate: yup.string().required(t('onlineExam.newPublish.validation.endDateRequired')),
    }), [t]);

    console.log({ exam })

    // Get question banks for the exam's subject
    const { data, isLoading } = useQuery({ 
        queryKey: ['questionBanks', questionBankFilters], 
        queryFn: () => getAllQuestionBanks(questionBankFilters),
        enabled: Boolean(questionBankFilters)
    });

    // Load existing publish for edit mode (if not passed via props)
    const { data: existingPublishData } = useQuery({
        queryKey: ['publishView', id],
        queryFn: () => viewPublishedExam(id),
        enabled: isEdit && !publishProp && !!id
    });

    const { mutate, isPending } = useMutation({
        mutationFn: publishExam,
        onSuccess: async (data) => {
            showSnackbar(t('onlineExam.newPublish.messages.publishSuccess'), 'success');
            await queryClient.invalidateQueries({ queryKey: ['publishedExams', exam?._id] })
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
            examName: null,
            sections: []
        }
    }
    );

    const gender = watch("gender");
    const questionBank = watch("questionBank")
    const startDate = watch("startDate")

    useEffect(() => {
        if (questionBank) {
            let selected = data?.questionBanks?.find(ques => ques?._id === questionBank);

            if (selected) {
                setMaxQuestions(selected?.questionCount)
            }
        }
    }, [questionBank])

    const { data: sections, isLoading: sectionLoading } = useQuery({ 
        queryKey: ['sections', exam?._id, gender], 
        queryFn: () => getNotPublishedSections(exam?._id, gender), 
        enabled: !!gender && !isEdit 
    });

    console.log({ errors })

    const onSubmit = (data) => {

        if (data?.numberOfQuestions > maxQuestions) {
            setError("numberOfQuestions", { type: 'custom', message: t('onlineExam.newPublish.validation.numberOfQuestionsMax') })
            return false
        }

        if (isEdit) {
            // Update published exam
            const payload = {
                id,
                questionBank: data?.questionBank,
                gender: data?.gender,
                section: Array.isArray(data?.sections) ? data?.sections?.[0] : data?.sections,
                numberOfQuestions: data?.numberOfQuestions,
                duration: data?.duration,
                startDate: data?.startDate,
                endDate: data?.endDate,
            };
            updateMutate(payload);
        } else {
            let datas = {
                ...data,
                exam: exam?._id
            }
            // Handle form submission
            mutate(datas);
        }
    };

    // Prefill for edit mode
    useEffect(() => {
        if (!isEdit) return;
        const publish = publishProp || existingPublishData?.publish;
        if (!publish) return;

        // Prefill defaults
        reset({
            questionBank: publish?.questionBank?._id || publish?.questionBank,
            gender: publish?.gender || '',
            sections: publish?.section?._id ? [publish.section._id] : (Array.isArray(publish?.sections) ? publish.sections : []),
            numberOfQuestions: publish?.numberOfQuestions || 0,
            duration: publish?.duration || 0,
            startDate: publish?.startDate ? dayjs(publish.startDate) : null,
            endDate: publish?.endDate ? dayjs(publish.endDate) : null,
        });

        // Sections option only current section
        if (publish?.section) {
            setSectionsOptions([{ _id: publish.section._id, sectionName: publish.section.sectionName }]);
        }
        // Set max questions from selected QB if available
        const qbFromList = data?.questionBanks?.find(q => q?._id === (publish?.questionBank?._id || publish?.questionBank));
        if (qbFromList?.questionCount) setMaxQuestions(qbFromList.questionCount);
    }, [isEdit, publishProp, existingPublishData, data]);

    const { mutate: updateMutate, isPending: isUpdating } = useMutation({
        mutationFn: updatePublishedExam,
        onSuccess: async () => {
            showSnackbar(t('onlineExam.newPublish.messages.updateSuccess'), 'success');
            await queryClient.invalidateQueries({ queryKey: ['publishedExams', exam?._id] });
            close();
        },
        onError: (error) => {
            showSnackbar(error?.message || t('onlineExam.newPublish.messages.updateError'), 'error');
        }
    });

    return (
        <CustomModal close={ close } open={ open } label={ label } width={ 'sm' } block={ true }>
            <form onSubmit={ handleSubmit(onSubmit) }>
                <Grid container spacing={ 2 }>
                    <Grid item xs={ 12 } md={ 6 }>
                        <CustomSelect
                            control={ control }
                            error={ errors.questionBank }
                            fieldName="questionBank"
                            fieldLabel={t('onlineExam.newPublish.fieldLabel.questionBank')}
                            size="16px"
                        >
                            { data?.questionBanks?.map((res) => (
                                <MenuItem key={ res._id } value={ res?._id }>
                                    { res.questionBankName }
                                </MenuItem>
                            )) }
                        </CustomSelect>
                    </Grid>
                    <Grid item xs={ 12 } md={ 6 }>
                        <CustomSelect
                            control={ control }
                            error={ errors.gender }
                            fieldName="gender"
                            fieldLabel={t('onlineExam.newPublish.fieldLabel.gender')}
                            size="16px"
                        >
                            <MenuItem value="male">
                                <em>{t('onlineExam.newPublish.gender.male')}</em>
                            </MenuItem>
                            <MenuItem value="female">
                                <em>{t('onlineExam.newPublish.gender.female')}</em>
                            </MenuItem>
                        </CustomSelect>
                    </Grid>
                    <Grid item xs={ 12 } md={ 6 }>
                        <CustomMultiSelect
                            placeholder={ t('onlineExam.newPublish.placeholder.section') }
                            readonly={ hide }
                            control={ control }
                            fieldLabel={t('onlineExam.newPublish.fieldLabel.section')}
                            fieldName={ "sections" }
                        >
                            { (isEdit ? sectionsOptions : sections)?.map(sec => (
                                <MenuItem value={ sec?._id } key={ sec?._id } >
                                    <em>{ sec?.sectionName }</em>
                                </MenuItem>
                            )) }
                        </CustomMultiSelect>
                    </Grid>
                    <Grid item xs={ 12 } md={ 6 }>
                        <CustomInput
                            placeholder={ t('onlineExam.newPublish.placeholder.numberOfQuestions') }
                            readonly={ hide }
                            control={ control }
                            type={ "number" }
                            error={ errors.numberOfQuestions }
                            fieldName="numberOfQuestions"
                            fieldLabel={ maxQuestions ? t('onlineExam.newPublish.fieldLabel.numberOfQuestionsWithMax', { max: maxQuestions }) : t('onlineExam.newPublish.fieldLabel.numberOfQuestions') }
                        />
                    </Grid>
                    <Grid item xs={ 12 } md={ 6 }>
                        <CustomInput
                            placeholder={ t('onlineExam.newPublish.placeholder.duration') }
                            readonly={ hide }
                            control={ control }
                            error={ errors.duration }
                            fieldName="duration"
                            type={ "number" }
                            fieldLabel={t('onlineExam.newPublish.fieldLabel.duration')}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <CustomDateTimePicker
                            placeholder={t('onlineExam.newPublish.placeholder.startDate')}
                            readonly={hide}
                            control={control}
                            error={errors.startDate}
                            fieldName="startDate"
                            fieldLabel={t('onlineExam.newPublish.fieldLabel.startDate')}
                            minDateTime={dayjs()}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <CustomDateTimePicker
                            placeholder={t('onlineExam.newPublish.placeholder.endDate')}
                            readonly={hide}
                            control={control}
                            error={errors.endDate}
                            fieldName="endDate"
                            fieldLabel={t('onlineExam.newPublish.fieldLabel.endDate')}
                            minDateTime={startDate ? startDate : dayjs()}
                        />
                    </Grid>
                </Grid>
                { !hide && (
                    <>
                        <hr />
                        <Box display={ "flex" } alignItems={ "center" } justifyContent={ "center" } py={ 2 }>
                            <CustomButton type="submit" label={ t('onlineExam.newPublish.actions.save') } onClick={ handleSubmit(onSubmit) } disable={ isLoading } />
                        </Box>
                    </>
                ) }
            </form>
            <UiBlocker open={isLoading || isPending || sectionLoading || isUpdating} />
        </CustomModal>
    );
};

export default NewPublish;