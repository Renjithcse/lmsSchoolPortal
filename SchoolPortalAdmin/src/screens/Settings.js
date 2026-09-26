import React, { useEffect, useState, useMemo } from 'react'
import CustomOutletBox from '../components/Common/CustomOutletBox'
import { COLORS } from '../assets/colors'
import { useGetAcademicYearQuery } from '../Redux/features/commonSlice';
import UiBlocker from '../components/Common/UiBlocker';
import CustomSelect from '../components/Common/CustomSelect';
import { MenuItem } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from "@hookform/resolvers/yup";
import { object } from "yup";
import * as yup from "yup";
import CustomButton from '../components/Common/CustomButton';
import { useCreateSettingMutation, useGetSettingQuery, useUpdateSettingMutation } from '../Redux/features/Admin/SettingsSlice';
import { useSnackbar } from '../hooks/SnackBar';
import { useTranslation } from 'react-i18next';

const Settings = () => {
    const { t } = useTranslation();
    const [terms, setTerms] = useState([]);

    const { data: academicYears, isLoading: academicLoading } = useGetAcademicYearQuery();

    const showSnackbar = useSnackbar()

    const { data: setting, isLoading} = useGetSettingQuery();
    const [triggerCreate, { isLoading: createLoading }] = useCreateSettingMutation();
    const [triggerUpdate, { isLoading: updateLoading }] = useUpdateSettingMutation();

    const schema = useMemo(() => object().shape({
        academicYear: yup.string().required(t('settings.general.form.academicYearRequired')),
        term: yup.string().required(t('settings.general.form.termRequired')),
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
        defaultValues: {
            academicYear: '',
            term: '',
        }

    });

    useEffect(() => {
        if (setting?.data && academicYears.length > 0){
            let academic = academicYears?.find(aca => aca?._id === academicYear)
            if (academic) {
                setTerms(academic?.terms)
            }
            reset({
                academicYear: setting?.data?.academicYear,
                term: setting?.data?.term,
            })
        } else {
            setValue('academicYear', '')
            setValue('term', '')
        }
    }, [setting?.data])
    

    const academicYear = watch('academicYear')

    useEffect(() => {
        if (academicYear) {
            let academic = academicYears?.find(aca => aca?._id === academicYear)
            if (academic) {
                setTerms(academic?.terms)
            }
        }

    }, [academicYear])

    const onSubmit = async(data) => {
        // Submit the form
        if(setting?.data){
            const settings = await triggerUpdate({id: setting?.data._id, data })

            if(settings.error) {
                showSnackbar(t('settings.general.messages.updateError'), 'error')
                return
            }

            showSnackbar(t('settings.general.messages.updateSuccess'),'success')
        }
        else{
            const settings = await triggerCreate(data)

            if(settings.error) {
                showSnackbar(t('settings.general.messages.createError'), 'error')
                return
            }
    
            showSnackbar(t('settings.general.messages.createSuccess'),'success')
        }
        
    }



    return (
        <CustomOutletBox>
            <div className='flex flex-col p-5'>
                <h1 className="text-3xl font-bold text-gray-800 mb-6" style={{ color: COLORS.primary }}>
                    {t('settings.title')}
                </h1>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-5 shadow-md p-5'>
                    <CustomSelect
                        control={control}
                        error={errors.academicYear}
                        fieldName="academicYear"
                        fieldLabel={t('settings.general.form.academicYear')}
                    >
                        <MenuItem value="" disabled >
                            <em>{t('settings.general.form.selectAcademicYear')}</em>
                        </MenuItem>
                        {academicYears?.map((res, i) => (
                            <MenuItem value={res._id}>
                                {res?.academicYear}
                            </MenuItem>
                        ))}

                    </CustomSelect>
                    <CustomSelect
                        control={control}
                        error={errors.term}
                        fieldName="term"
                        fieldLabel={t('settings.general.form.currentTerm')}
                        size="16px"
                        onChangeValue={null}
                    >
                        <MenuItem value="" disabled >
                            <em>{t('settings.general.form.selectTerm')}</em>
                        </MenuItem>
                        {terms?.map((res, i) => (
                            <MenuItem value={res}>
                                {res}
                            </MenuItem>
                        ))}
                    </CustomSelect>
                    <div className='pt-6 flex items-end justify-end'>
                    <CustomButton
                        onClick={handleSubmit(onSubmit)}
                        label={t('settings.general.actions.submit')}
                        isIcon={false}
                        width="150px"
                    />
                    </div>
                </div>
            </div>
            <UiBlocker open={academicLoading} />
        </CustomOutletBox>
    )
}

export default Settings