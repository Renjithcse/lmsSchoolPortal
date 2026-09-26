import { Grid } from '@mui/material'
import React, { forwardRef, useImperativeHandle, useMemo } from 'react'
import CustomInput from '../Common/CustomInput'
import Button from '../Inputs/Button'
import { COLORS } from '../../assets/colors'
import { useForm } from 'react-hook-form'
import { yupResolver } from "@hookform/resolvers/yup";
import { object } from "yup";
import * as yup from "yup";
import { useTranslation } from 'react-i18next';

const SubCategory = forwardRef(({ onComplete, onCancel }, ref) => {
    const { t } = useTranslation();

    const schema = useMemo(() => object().shape({
        name: yup.string().required(t('examMark.subCategory.validation.nameRequired')),
        mark: yup.number().required(t('examMark.subCategory.validation.markRequired'))
    }), [t]);

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
            name: '',
            mark: ''
        }
    });

    const addSubCategory = (data) => {
        onComplete(data)
    }

    useImperativeHandle(ref, () => ({
        setMarkError: setMarkError,
        resetForm: resetForm
    }));

    const setMarkError = (data) => {
        setError('subCategoryMark', { type: 'custom', message: data })
    };

    const resetForm = () => {
        reset()
        setError('subCategoryMark', null)
    }


    return (
        <Grid container spacing={2} px={2} alignItems={"center"}>
            <Grid item sx={12} md={4}>
                <CustomInput
                    placeholder={t('examMark.subCategory.placeholder.name')}
                    control={control}
                    error={errors.name}
                    fieldName="name"
                    fieldLabel={t('examMark.subCategory.fieldLabel.name')}
                />

            </Grid>
            <Grid item sx={12} md={4}>
                <CustomInput
                    placeholder={t('examMark.subCategory.placeholder.mark')}
                    control={control}
                    error={errors.mark}
                    fieldName="mark"
                    fieldLabel={t('examMark.subCategory.fieldLabel.mark')}
                    type={"number"}
                />

            </Grid>
            <Grid item sx={12} md={4} gap={2} display={"flex"} direction={"row"}>
                <Button label={t('examMark.subCategory.actions.add')} onClick={handleSubmit(addSubCategory) } backgroundColor={COLORS.primary} />
                <Button label={t('examMark.subCategory.actions.cancel')} onClick={onCancel} backgroundColor={COLORS.secondary} />
            </Grid>
        </Grid>
    )
})

export default SubCategory