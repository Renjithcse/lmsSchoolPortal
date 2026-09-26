import React, { useEffect, useState, useMemo } from 'react';
import {
    Box,
    Grid,
    TextField,
    Typography,
    Card,
    CardContent,
    Avatar,
    FormControlLabel,
    Switch,
    MenuItem,
    FormHelperText
} from '@mui/material';
import CustomModal from '../../Common/CustomModal';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { object, string, date } from "yup";
import * as yup from "yup";
import CustomInput from '../../Common/CustomInput';
import CustomTextArea from '../../Common/CustomTextArea';
import CustomButton from '../../Common/CustomButton';
import CustomSelect from '../../Common/CustomSelect';
import { useSnackbar } from '../../../hooks/SnackBar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTermHistory, updateTermHistory } from '../../../api/termHistory';
import { getAcademic } from '../../../api/academic';
import { useQuery } from '@tanstack/react-query';
import UiBlocker from '../../Common/UiBlocker';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useTranslation } from 'react-i18next';

const TermHistoryForm = ({ close, open, label, hide, item, btnLabel, onSubmit }) => {
    const { t } = useTranslation();
    const { themeColors } = useThemeContext();
    const showSnackbar = useSnackbar();
    const queryClient = useQueryClient();

    // Get academic years for dropdown
    const { data: academicYears, isLoading: academicLoading } = useQuery({
        queryKey: ['academicget'],
        queryFn: getAcademic,
    });

    // Debug log for academic years data
    useEffect(() => {
        console.log('Academic years data:', academicYears); // Debug log
    }, [academicYears]);

    // State to store available terms for selected academic year
    const [availableTerms, setAvailableTerms] = useState([]);
    const [selectedAcademicYear, setSelectedAcademicYear] = useState('');

    const schema = useMemo(() => object().shape({
        academicYear: yup.string().required(t('termHistory.form.validation.academicYearRequired')),
        term: yup.string().required(t('termHistory.form.validation.termRequired')).min(2, t('termHistory.form.validation.termMinLength')),
        startDate: yup.string().required(t('termHistory.form.validation.startDateRequired')),
        endDate: yup.string().required(t('termHistory.form.validation.endDateRequired')).test(
            'end-date-after-start',
            t('termHistory.form.validation.endDateAfterStart'),
            function (value) {
                const { startDate } = this.parent;
                if (!startDate || !value) return true;
                return new Date(value) > new Date(startDate);
            }
        ),
        description: yup.string().max(500, t('termHistory.form.validation.descriptionMaxLength')),
        isActive: yup.boolean()
    }), [t]);

    const {
        handleSubmit,
        control,
        setValue,
        reset,
        watch,
        formState: { errors }
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            academicYear: '',
            term: '',
            startDate: '',
            endDate: '',
            description: '',
            isActive: false
        }
    });

    const watchedAcademicYear = watch('academicYear');

    // Update available terms when academic year changes
    useEffect(() => {
        console.log('Academic year changed:', watchedAcademicYear); // Debug log
        if (watchedAcademicYear && academicYears?.data) {
            const selectedAcademic = academicYears.data.find(academic => academic._id === watchedAcademicYear);
            console.log('Selected academic:', selectedAcademic); // Debug log
            if (selectedAcademic && selectedAcademic.terms) {
                console.log('Available terms:', selectedAcademic.terms); // Debug log
                setAvailableTerms(selectedAcademic.terms);
                setSelectedAcademicYear(watchedAcademicYear);
                // Don't clear term field if we're editing and the term exists in the available terms
                if (!item || !item.term || !selectedAcademic.terms.includes(item.term)) {
                    setValue('term', '');
                }
            } else {
                setAvailableTerms([]);
                setValue('term', '');
            }
        } else if (watchedAcademicYear && academicYears) {
            // Try alternative data structure
            const selectedAcademic = academicYears.find(academic => academic._id === watchedAcademicYear);
            console.log('Selected academic (alt):', selectedAcademic); // Debug log
            if (selectedAcademic && selectedAcademic.terms) {
                console.log('Available terms (alt):', selectedAcademic.terms); // Debug log
                setAvailableTerms(selectedAcademic.terms);
                setSelectedAcademicYear(watchedAcademicYear);
                // Don't clear term field if we're editing and the term exists in the available terms
                if (!item || !item.term || !selectedAcademic.terms.includes(item.term)) {
                    setValue('term', '');
                }
            } else {
                setAvailableTerms([]);
                setValue('term', '');
            }
        } else {
            setAvailableTerms([]);
            setValue('term', '');
        }
    }, [watchedAcademicYear, academicYears, setValue, item]);

    useEffect(() => {
        if (item) {
            const academicYearId = item?.academicYear?._id || item?.academicYear;
            const termValue = item?.term || '';

            // Set academic year first
            setValue('academicYear', academicYearId);

            // Set other fields
            setValue('startDate', item?.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '');
            setValue('endDate', item?.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '');
            setValue('description', item?.description || '');
            setValue('isActive', item?.isActive || false);

            // Set term value
            setValue('term', termValue);
        } else {
            reset();
        }
    }, [item, setValue, reset]);

    const { mutate, isPending } = useMutation({
        mutationFn: onSubmit || (item ? updateTermHistory : createTermHistory),
        onSuccess: async (data) => {
            if (!onSubmit) {
                showSnackbar(item ? t('termHistory.messages.updateSuccess') : t('termHistory.messages.createSuccess'), 'success');
                await queryClient.invalidateQueries({ queryKey: ["termHistories"] });
                await queryClient.invalidateQueries({ queryKey: ["academicget"] });
            }
        },
        onError: (error) => {
            if (!onSubmit) {
                showSnackbar(error?.response?.data?.message || t('termHistory.messages.genericError'), 'error');
            }
        },
    });

    const SubmitForm = (data) => {
        const formData = {
            ...data,
            startDate: new Date(data.startDate).toISOString(),
            endDate: new Date(data.endDate).toISOString(),
        };

        if (item) {
            formData.id = item._id;
        }

        // Close modal immediately and show loading
        close();

        // Submit the form data using the provided onSubmit function or the mutation
        if (onSubmit) {
            onSubmit(formData);
        } else {
            mutate(formData);
        }
    };



    return (
        <CustomModal close={close} open={open} label={label} width={'md'} btnLabel={btnLabel} block={true}>
            <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, borderRadius: 2 }}>
                <CardContent>
                    <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                        <Avatar sx={{ width: 36, height: 36, backgroundColor: `${themeColors.primary}22`, color: themeColors.primary }}>
                            <CalendarMonthIcon sx={{ fontSize: 20 }} />
                        </Avatar>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                            {t('termHistory.form.title')}
                        </Typography>
                    </Box>

                    <form onSubmit={handleSubmit(SubmitForm)}>
                        <Grid container spacing={3}>
                            {/* Academic Year */}
                            <Grid item xs={12} md={6}>
                                <Box>
                                    <Typography variant="subtitle2" sx={{ color: themeColors.primary, fontWeight: 600, mb: 0.5 }}>
                                        {t('termHistory.form.fields.academicYear')}
                                    </Typography>
                                    <CustomSelect
                                        control={control}
                                        error={errors?.academicYear}
                                        fieldName="academicYear"
                                        fieldLabel=""
                                        size="14px"
                                        disabled={academicLoading}
                                    >
                                        {academicYears?.data?.map((academic) => (
                                            <MenuItem key={academic._id} value={academic._id}>
                                                {academic.academicYear}
                                            </MenuItem>
                                        )) || academicYears?.map((academic) => (
                                            <MenuItem key={academic._id} value={academic._id}>
                                                {academic.academicYear}
                                            </MenuItem>
                                        ))}
                                    </CustomSelect>
                                </Box>
                            </Grid>

                            {/* Term Name */}
                            <Grid item xs={12} md={6}>
                                <CustomSelect
                                    control={control}
                                    error={errors?.term}
                                    fieldName="term"
                                    fieldLabel={t('termHistory.form.fields.termName')}
                                    size="14px"
                                    disabled={!selectedAcademicYear || availableTerms.length === 0}
                                >
                                    {availableTerms?.map((term, index) => (
                                        <MenuItem key={index} value={term}>
                                            {term}
                                        </MenuItem>
                                    ))}
                                </CustomSelect>
                            </Grid>

                            {/* Start Date */}
                            <Grid item xs={12} md={6}>
                                <CustomInput
                                    control={control}
                                    error={errors?.startDate}
                                    fieldName="startDate"
                                    fieldLabel={t('termHistory.form.fields.startDate')}
                                    type="date"
                                    size="14px"
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            </Grid>

                            {/* End Date */}
                            <Grid item xs={12} md={6}>
                                <CustomInput
                                    control={control}
                                    error={errors?.endDate}
                                    fieldName="endDate"
                                    fieldLabel={t('termHistory.form.fields.endDate')}
                                    type="date"
                                    size="14px"
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            </Grid>



                            {/* Description */}
                            <Grid item xs={12}>
                                <CustomTextArea
                                    control={control}
                                    error={errors?.description}
                                    fieldName="description"
                                    fieldLabel={t('termHistory.form.fields.description')}
                                    placeholder={t('termHistory.form.placeholders.description')}
                                    rows={3}
                                />
                            </Grid>

                            {/* Active Status */}
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={watch('isActive') || false}
                                                onChange={(e) => setValue('isActive', e.target.checked)}
                                                sx={{
                                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                                        color: themeColors.primary,
                                                    },
                                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                        backgroundColor: themeColors.primary,
                                                    },
                                                }}
                                            />
                                        }
                                        label={
                                            <Typography variant="body2" sx={{ color: themeColors.text.primary }}>
                                                {t('termHistory.form.fields.setAsActive')}
                                            </Typography>
                                        }
                                    />
                                    <FormHelperText sx={{ color: themeColors.text.secondary, ml: 1 }}>
                                        {t('termHistory.form.helperText.onlyOneActive')}
                                    </FormHelperText>
                                </Box>
                            </Grid>
                        </Grid>

                        {/* Action Buttons */}
                        <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
                            <CustomButton
                                label={t('termHistory.form.actions.cancel')}
                                onClick={close}
                                variant="outlined"
                                sx={{
                                    borderColor: themeColors.border.primary,
                                    color: themeColors.text.primary,
                                    '&:hover': {
                                        borderColor: themeColors.primary,
                                        color: themeColors.primary,
                                    }
                                }}
                            />
                            <CustomButton
                                label={item ? t('termHistory.form.actions.update') : t('termHistory.form.actions.create')}
                                type="submit"
                                disabled={isPending}
                                sx={{
                                    backgroundColor: themeColors.primary,
                                    color: 'white',
                                    '&:hover': {
                                        backgroundColor: themeColors.primary,
                                        opacity: 0.9,
                                    },
                                    '&:disabled': {
                                        backgroundColor: themeColors.border.primary,
                                        color: themeColors.text.secondary,
                                    }
                                }}
                            />
                        </Box>
                    </form>
                </CardContent>
            </Card>
            <UiBlocker open={isPending} />
        </CustomModal>
    );
};

export default TermHistoryForm;

