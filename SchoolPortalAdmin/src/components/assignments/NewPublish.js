import { Box, Grid, MenuItem } from '@mui/material';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import CustomButton from '../Common/CustomButton';
import CustomModal from '../Common/CustomModal';
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useLocation, useParams } from 'react-router-dom';
import CustomSelect from '../Common/CustomSelect';
import CustomMultiSelect from '../Common/CustomMultiSelect';
import CustomDatePicker from '../Common/CustomDatefilter';
import dayjs from 'dayjs';
import { useSnackbar } from '../../hooks/SnackBar';
import { useLazyNotPublishedSectionsQuery, useNewAssignmentPublishMutation } from '../../Redux/features/assignmentSlice';
import UiBlocker from '../Common/UiBlocker';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const NewPublish = ({ close, open, label, hide, state }) => {
    const { t } = useTranslation();
    const { themeColors } = useThemeContext();

    const params = useParams();

    const location = useLocation();


    const showSnackbar = useSnackbar();

    const schema = useMemo(() => yup.object().shape({
        gender: yup.string().required(t('assignments.newPublish.validation.genderRequired')),
        sections: yup.array().required(t('assignments.newPublish.validation.sectionRequired')).min(1, t('assignments.newPublish.validation.minSectionRequired')),
        startDate: yup.string().required(t('assignments.newPublish.validation.startDateRequired')),
        endDate: yup.string().required(t('assignments.newPublish.validation.endDateRequired')),
    }), [t]);








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
            sections: []
        }
    }
    );

    const [triggerSections, { data: sections, isFetching }] = useLazyNotPublishedSectionsQuery()

    const [triggerPublish, { isLoading: publishLoading }] = useNewAssignmentPublishMutation()

    const gender = watch("gender");


    const startDate = watch("startDate")



    useEffect(() => {
        if (gender) {
            let query = {
                assignment: params?.id,
                gender
            }

            triggerSections(query)
        }
    }, [gender])








    console.log({ errors })


    const onSubmit = async(data) => {

        console.log({ data, state: state })

        let datas = {
            ...data,
            assignment: state?.data?.assignment?._id,
            grade: state?.data?.assignment?.grade
        }

        let publish = await triggerPublish({ id: state?.data?.assignment?._id ,data: datas})

        if(publish.error){
            showSnackbar(t('assignments.newPublish.messages.publishError'), 'error')
            return
        }
        else{
            showSnackbar(t('assignments.newPublish.messages.publishSuccess'), 'success')
            close()
        }

        // let datas = {
        //     ...data,
        //     //exam: exam?._id
        // }
        // Handle form submission
        //mutate(datas);
    };
    //return null

    return (
        <CustomModal close={close} open={open} label={label} width={'sm'} block={true}>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <CustomSelect
                            control={control}
                            error={errors.gender}
                            fieldName="gender"
                            fieldLabel={t('assignments.newPublish.fields.gender')}
                            size="16px"
                        >
                            <MenuItem value="male">
                                <em>{t('assignments.newPublish.gender.male')}</em>
                            </MenuItem>
                            <MenuItem value="female">
                                <em>{t('assignments.newPublish.gender.female')}</em>
                            </MenuItem>
                        </CustomSelect>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <CustomMultiSelect
                            placeholder={t('assignments.newPublish.placeholders.section')}
                            readonly={hide}
                            control={control}
                            fieldLabel={t('assignments.newPublish.fields.section')}
                            fieldName={"sections"}
                        >
                            {sections?.data?.map(sec => (
                                <MenuItem value={sec?._id} key={sec?._id} >
                                    <em>{sec?.sectionName}</em>
                                </MenuItem>
                            ))}
                        </CustomMultiSelect>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <CustomDatePicker
                            placeholder={t('assignments.newPublish.placeholders.startDate')}
                            readonly={hide}
                            control={control}
                            error={errors.startDate}
                            fieldName="startDate"
                            fieldLabel={t('assignments.newPublish.fields.startDate')}
                            minDate={dayjs()}

                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <CustomDatePicker
                            placeholder={t('assignments.newPublish.placeholders.endDate')}
                            readonly={hide}
                            control={control}
                            error={errors.endDate}
                            fieldName="endDate"
                            fieldLabel={t('assignments.newPublish.fields.endDate')}
                            minDate={startDate ? startDate : dayjs()}
                        />
                    </Grid>
                </Grid>
                {!hide && (
                    <>
                        <hr />
                        <Box display={"flex"} alignItems={"center"} justifyContent={"center"} py={2}>
                            <CustomButton type="submit" label={t('assignments.newPublish.actions.save')} onClick={handleSubmit(onSubmit)} disable={isFetching || publishLoading} />
                        </Box>
                    </>
                )}
            </form>
            <UiBlocker open={isFetching || publishLoading} />
        </CustomModal>
    );
};

export default NewPublish;