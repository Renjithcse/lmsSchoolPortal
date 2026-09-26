import React, { useEffect } from 'react'
import CustomDatePicker from '../../components/Common/CustomDatefilter'
import CustomInput from '../../components/Common/CustomInput'
import CustomSelect from '../../components/Common/CustomSelect'
import { MenuItem, Card, CardContent, Typography, Box, Grid, Divider, Chip } from '@mui/material'
import CustomAutocomplete from '../../components/Common/CustomAutoComplete'
import CustomTextArea from '../../components/Common/CustomTextArea'
import CustomButton from '../../components/Common/CustomButton'
import { useSnackbar } from '../../hooks/SnackBar'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLazyCityBasedOnStateQuery, useLazyStateListBasedOnCountryQuery, useNationalityListQuery, useReligionListQuery } from '../../Redux/features/commonSlice'
import { TRANSPORT_NAME } from '../../constant'
import { useForm } from 'react-hook-form'
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import UiBlocker from '../../components/Common/UiBlocker'
import CustomBackButton from '../../components/Common/CustomBackbutton'
import Button from '../../components/Inputs/Button'
import { useCreateStudentMutation } from '../../Redux/features/Users/StudentSlice'
import Autocomplete from '../../components/Common/AutoComplete'
import dayjs from 'dayjs'
import PersonIcon from '@mui/icons-material/Person';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SchoolIcon from '@mui/icons-material/School';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext'
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

const NewStudent = () => {
    const showSnackbar = useSnackbar();
    const navigate = useNavigate()
    const location = useLocation()
    const { themeColors } = useThemeContext()
    const { t } = useTranslation()

    const { data: nationality, isFetching: nationalityLoading } = useNationalityListQuery()
    const { data: religions, isFetching: religionLoading } = useReligionListQuery()
    const [triggerState, { data: stateList, isFetching: stateLoading }] = useLazyStateListBasedOnCountryQuery()
    const [triggerCity, { data: cityList, isFetching: cityLoading }] = useLazyCityBasedOnStateQuery()
    const [triggerCreate, { isLoading: createLoading }] = useCreateStudentMutation()

    // Validation schema - memoized with t dependency
    const schema = useMemo(() => yup.object().shape({
        studentID: yup.string().required(t('newStudent.validation.studentIDRequired')),
        studentName: yup.string().required(t('newStudent.validation.studentNameRequired')),
        Dob: yup.string().required(t('newStudent.validation.dobRequired')),
        Father_name: yup.string().required(t('newStudent.validation.fatherNameRequired')),
        Mother_name: yup.string().required(t('newStudent.validation.motherNameRequired')),
        Nationality: yup.object().required(t('newStudent.validation.nationalityRequired')),
        Province: yup.object().required(t('newStudent.validation.provinceRequired')),
        contactNo: yup.string().required(t('newStudent.validation.contactNoRequired')),
        Communication_no: yup.string().required(t('newStudent.validation.communicationNoRequired')),
        Admission_date: yup.string(),
        Religion: yup.string(),
        Email: yup.string().required(t('newStudent.validation.emailRequired')),
        Place_of_birth: yup.string(),
        City: yup.object(),
        Zip: yup.string(),
        Communication_Address: yup.string(),
        Permanent_Address: yup.string(),
        Previous_School: yup.string(),
        Hobbies: yup.string(),
        Health_Issue: yup.string(),
        Passport_No: yup.string(),
        Passport_Expiry: yup.string(),
        Iqama_No: yup.string(),
        Iqama_Expiry: yup.string(),
        Transport_Pickup: yup.string(),
        Pickup_BusNo: yup.string(),
        Transport_Drop: yup.string(),
        Drop_BusNo: yup.string(),
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
        mode: 'onBlur'
    });


    const country = watch('Nationality');
    const province = watch('Province');
    const transportPick = watch('Transport_Pickup');
    const transportDrop = watch('Transport_Drop');

    console.log({ province })

    useEffect(() => {
        setValue("Pickup_BusNo", "")
    }, [transportPick])

    useEffect(() => {
        setValue("Drop_BusNo", "")
    }, [transportDrop])



    useEffect(() => {
        if (country) {
            console.log({country})
            triggerState(country?._id)
        }
    }, [country])

    useEffect(() => {
        if (province) {
            triggerCity(province?._id)
        }
    }, [province])


    const SubmitForm = async (data) => {
        try {
            let datas = {
                ...data,
                Nationality: country?._id,
                Province: province?._id,
                City: data?.City?._id,
                Dob: dayjs(data?.Dob).format("YYYY-MM-DD"),
                ...location.state
            }
            const response = await triggerCreate(datas)
            if (response.error) {
                showSnackbar(t('newStudent.messages.createFailed'), 'error')
                return
            }
            showSnackbar(t('newStudent.messages.createSuccess'), 'success')
            reset()
            navigate(-1)
        } catch (error) {
            showSnackbar(t('newStudent.messages.createFailed'), 'error')
        }
    }

    const SectionHeader = ({ icon, title, subtitle }) => (
        <Box display="flex" alignItems="center" gap={2} mb={3}>
            <Box
                sx={{
                    backgroundColor: themeColors.primary,
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                }}
            >
                {icon}
            </Box>
            <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                    {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {subtitle}
                </Typography>
            </Box>
        </Box>
    );

    const RequiredField = ({ children, required = false }) => (
        <Box>
            {children}
        </Box>
    );

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
                <CustomBackButton />
                <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                    {t('newStudent.title')}
                </Typography>
            </Box>

            <form onSubmit={handleSubmit(SubmitForm)}>
                {/* Personal Information */}
                <Card sx={{ mb: 3, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                    <CardContent sx={{ p: 3 }}>
                        <SectionHeader 
                            icon={<PersonIcon />} 
                            title={t('newStudent.sections.personalInformation.title')} 
                            subtitle={t('newStudent.sections.personalInformation.subtitle')}
                        />
                        
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6} lg={3}>
                                <RequiredField required>
                                    <CustomInput
                                        control={control}
                                        error={errors.studentID}
                                        fieldName="studentID"
                                        fieldLabel={t('newStudent.fields.studentID')}
                                    />
                                </RequiredField>
                            </Grid>
                            <Grid item xs={12} md={6} lg={3}>
                                <RequiredField required>
                                    <CustomInput
                                        control={control}
                                        error={errors.studentName}
                                        fieldName="studentName"
                                        fieldLabel={t('newStudent.fields.studentName')}
                                    />
                                </RequiredField>
                            </Grid>
                            <Grid item xs={12} md={6} lg={3}>
                                <RequiredField required>
                                    <CustomDatePicker
                                        fieldName='Dob'
                                        control={control}
                                        error={errors.Dob}
                                        fieldLabel={t('newStudent.fields.dateOfBirth')}
                                    />
                                </RequiredField>
                            </Grid>
                            <Grid item xs={12} md={6} lg={3}>
                                <RequiredField required>
                                    <CustomInput
                                        control={control}
                                        error={errors.Father_name}
                                        fieldName="Father_name"
                                        fieldLabel={t('newStudent.fields.fatherName')}
                                    />
                                </RequiredField>
                            </Grid>
                            <Grid item xs={12} md={6} lg={3}>
                                <RequiredField required>
                                    <CustomInput
                                        control={control}
                                        error={errors.Mother_name}
                                        fieldName="Mother_name"
                                        fieldLabel={t('newStudent.fields.motherName')}
                                    />
                                </RequiredField>
                            </Grid>
                            <Grid item xs={12} md={6} lg={3}>
                                <RequiredField required>
                                    <CustomInput
                                        control={control}
                                        error={errors.contactNo}
                                        fieldName="contactNo"
                                        fieldLabel={t('newStudent.fields.contactNumber')}
                                    />
                                </RequiredField>
                            </Grid>
                            <Grid item xs={12} md={6} lg={3}>
                                <RequiredField required>
                                    <CustomInput
                                        control={control}
                                        error={errors.Communication_no}
                                        fieldName="Communication_no"
                                        fieldLabel={t('newStudent.fields.communicationNumber')}
                                    />
                                </RequiredField>
                            </Grid>
                            <Grid item xs={12} md={6} lg={3}>
                                <CustomDatePicker
                                    fieldName='Admission_date'
                                    control={control}
                                    error={errors.Admission_date}
                                    fieldLabel={t('newStudent.fields.admissionDate')}
                                />
                            </Grid>
                            <Grid item xs={12} md={6} lg={3}>
                                <CustomSelect
                                    control={control}
                                    error={errors.Religion}
                                    fieldName="Religion"
                                    fieldLabel={t('newStudent.fields.religion')}
                                    size="16px"
                                >
                                    <MenuItem value="" disabled >
                                        <em>{t('newStudent.placeholders.selectReligion')}</em>
                                    </MenuItem>
                                    {religions && religions?.map((res, i) => (
                                        <MenuItem key={res?._id} value={res?._id} >
                                            {res?.religionName}
                                        </MenuItem>
                                    ))}
                                </CustomSelect>
                            </Grid>
                            <Grid item xs={12} md={6} lg={3}>
                                <RequiredField required>
                                    <CustomInput
                                        control={control}
                                        error={errors.Email}
                                        fieldName="Email"
                                        fieldLabel={t('newStudent.fields.email')}
                                    />
                                </RequiredField>
                            </Grid>
                            <Grid item xs={12} md={6} lg={3}>
                                <CustomInput
                                    control={control}
                                    error={errors.Place_of_birth}
                                    fieldName="Place_of_birth"
                                    fieldLabel={t('newStudent.fields.placeOfBirth')}
                                />
                            </Grid>
                            <Grid item xs={12} md={6} lg={3}>
                                <CustomInput
                                    control={control}
                                    error={errors.Zip}
                                    fieldName="Zip"
                                    fieldLabel={t('newStudent.fields.zip')}
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Location Information */}
                <Card sx={{ mb: 3, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                    <CardContent sx={{ p: 3 }}>
                        <SectionHeader 
                            icon={<LocationOnIcon />} 
                            title={t('newStudent.sections.locationInformation.title')} 
                            subtitle={t('newStudent.sections.locationInformation.subtitle')}
                        />
                        
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <RequiredField required>
                                    <Autocomplete
                                        fieldName="Nationality"
                                        control={control}
                                        fieldLabel={t('newStudent.fields.nationality')}
                                        placeholder={t('newStudent.placeholders.selectNationality')}
                                        options={nationality}
                                        labelField="name"
                                        error={errors.Nationality}
                                    />
                                </RequiredField>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <RequiredField required>
                                    <Autocomplete
                                        fieldName="Province"
                                        control={control}
                                        fieldLabel={t('newStudent.fields.province')}
                                        placeholder={t('newStudent.placeholders.selectProvince')}
                                        options={stateList}
                                        labelField="name"
                                        error={errors.Province}
                                    />
                                </RequiredField>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Autocomplete
                                    fieldName="City"
                                    control={control}
                                    fieldLabel={t('newStudent.fields.city')}
                                    placeholder={t('newStudent.placeholders.selectCity')}
                                    options={cityList}
                                    labelField="name"
                                    error={errors.City}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <CustomTextArea
                                    control={control}
                                    error={errors.Communication_Address}
                                    fieldName="Communication_Address"
                                    multiline={true}
                                    height={120}
                                    row={10}
                                    fieldLabel={t('newStudent.fields.communicationAddress')}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <CustomTextArea
                                    control={control}
                                    error={errors.Permanent_Address}
                                    fieldName="Permanent_Address"
                                    multiline={true}
                                    height={90}
                                    row={10}
                                    fieldLabel={t('newStudent.fields.permanentAddress')}
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Academic Information */}
                <Card sx={{ mb: 3, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                    <CardContent sx={{ p: 3 }}>
                        <SectionHeader 
                            icon={<SchoolIcon />} 
                            title={t('newStudent.sections.academicInformation.title')} 
                            subtitle={t('newStudent.sections.academicInformation.subtitle')}
                        />
                        
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <CustomInput
                                    control={control}
                                    error={errors.Previous_School}
                                    fieldName="Previous_School"
                                    fieldLabel={t('newStudent.fields.previousSchool')}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <CustomInput
                                    control={control}
                                    error={errors.Hobbies}
                                    fieldName="Hobbies"
                                    fieldLabel={t('newStudent.fields.hobbies')}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <CustomInput
                                    control={control}
                                    error={errors.Health_Issue}
                                    fieldName="Health_Issue"
                                    fieldLabel={t('newStudent.fields.healthIssue')}
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Document Information */}
                <Card sx={{ mb: 3, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                    <CardContent sx={{ p: 3 }}>
                        <SectionHeader 
                            icon={<ContactPhoneIcon />} 
                            title={t('newStudent.sections.documentInformation.title')} 
                            subtitle={t('newStudent.sections.documentInformation.subtitle')}
                        />
                        
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <CustomInput
                                    control={control}
                                    error={errors.Passport_No}
                                    fieldName="Passport_No"
                                    fieldLabel={t('newStudent.fields.passportNumber')}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <CustomDatePicker
                                    fieldName='Passport_Expiry'
                                    control={control}
                                    error={errors.Passport_Expiry}
                                    fieldLabel={t('newStudent.fields.passportExpiry')}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <CustomInput
                                    control={control}
                                    error={errors.Iqama_No}
                                    fieldName="Iqama_No"
                                    fieldLabel={t('newStudent.fields.iqamaNo')}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <CustomDatePicker
                                    fieldName='Iqama_Expiry'
                                    control={control}
                                    error={errors.Iqama_Expiry}
                                    fieldLabel={t('newStudent.fields.iqamaExpiry')}
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                {/* Transport Information */}
                <Card sx={{ mb: 3, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                    <CardContent sx={{ p: 3 }}>
                        <SectionHeader 
                            icon={<DirectionsBusIcon />} 
                            title={t('newStudent.sections.transportInformation.title')} 
                            subtitle={t('newStudent.sections.transportInformation.subtitle')}
                        />
                        
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <CustomSelect
                                    control={control}
                                    error={errors.Transport_Pickup}
                                    fieldName="Transport_Pickup"
                                    fieldLabel={t('newStudent.fields.transportPickup')}
                                    size="16px"
                                >
                                    <MenuItem value="" disabled >
                                        <em>{t('newStudent.placeholders.selectPickup')}</em>
                                    </MenuItem>
                                    {TRANSPORT_NAME && TRANSPORT_NAME?.map((res, i) => (
                                        <MenuItem key={res?.id} value={res.value} >
                                            {res?.name}
                                        </MenuItem>
                                    ))}
                                </CustomSelect>
                            </Grid>
                            {transportPick === "School Bus" && (
                                <Grid item xs={12} md={6}>
                                    <CustomInput
                                        control={control}
                                        error={errors.Pickup_BusNo}
                                        fieldName="Pickup_BusNo"
                                        fieldLabel={t('newStudent.fields.pickupBusNo')}
                                    />
                                </Grid>
                            )}
                            <Grid item xs={12} md={6}>
                                <CustomSelect
                                    control={control}
                                    error={errors.Transport_Drop}
                                    fieldName="Transport_Drop"
                                    fieldLabel={t('newStudent.fields.transportDrop')}
                                    size="16px"
                                >
                                    <MenuItem value="" disabled >
                                        <em>{t('newStudent.placeholders.selectDrop')}</em>
                                    </MenuItem>
                                    {TRANSPORT_NAME && TRANSPORT_NAME?.map((res, i) => (
                                        <MenuItem key={res?.id} value={res.value} >
                                            {res?.name}
                                        </MenuItem>
                                    ))}
                                </CustomSelect>
                            </Grid>
                            {transportDrop === "School Bus" && (
                                <Grid item xs={12} md={6}>
                                    <CustomInput
                                        control={control}
                                        error={errors.Drop_BusNo}
                                        fieldName="Drop_BusNo"
                                        fieldLabel={t('newStudent.fields.dropBusNo')}
                                    />
                                </Grid>
                            )}
                        </Grid>
                    </CardContent>
                </Card>

                {/* Submit Button */}
                <Box display="flex" justifyContent="flex-end" mt={3}>
                    <Button 
                        label={t('newStudent.actions.saveStudent')} 
                        onClick={handleSubmit(SubmitForm)}
                        sx={{
                            backgroundColor: themeColors.primary,
                            color: 'white',
                            px: 4,
                            py: 1.5,
                            '&:hover': {
                                backgroundColor: themeColors.primary,
                                opacity: 0.9
                            }
                        }}
                    />
                </Box>
            </form>

            <UiBlocker open={nationalityLoading || stateLoading || religionLoading || cityLoading || createLoading} />
        </Box>
    )
}

export default NewStudent