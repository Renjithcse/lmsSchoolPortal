import React, { useEffect, useState } from 'react'
import CustomDatePicker from '../../components/Common/CustomDatefilter'
import CustomInput from '../../components/Common/CustomInput'
import CustomSelect from '../../components/Common/CustomSelect'
import { MenuItem, Box, Card, CardContent, Typography, Grid } from '@mui/material'
// Removed CustomAutocomplete in favor of themed AutoComplete component
import CustomTextArea from '../../components/Common/CustomTextArea'
import CustomButton from '../../components/Common/CustomButton'
import { useSnackbar } from '../../hooks/SnackBar'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useLazyCityBasedOnStateQuery, useLazyStateListBasedOnCountryQuery, useNationalityListQuery, useReligionListQuery } from '../../Redux/features/commonSlice'
import { TRANSPORT_NAME } from '../../constant'
import { useForm } from 'react-hook-form'
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import UiBlocker from '../../components/Common/UiBlocker'
import CustomBackButton from '../../components/Common/CustomBackbutton'
import Button from '../../components/Inputs/Button'
import { useCreateStudentMutation, useGetSingleStudentDetailsQuery, useUpdateStudentMutation } from '../../Redux/features/Users/StudentSlice'
import dayjs from 'dayjs'
import Autocomplete from '../../components/Common/AutoComplete'
import { useTheme as useThemeContext } from '../../contexts/ThemeContext'
import PersonIcon from '@mui/icons-material/Person';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SchoolIcon from '@mui/icons-material/School';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

const EditStudent = () => {
    const showSnackbar = useSnackbar();
    const navigate = useNavigate()
    const location = useLocation()
    const params = useParams()
    const { themeColors } = useThemeContext()
    const { t } = useTranslation()

    // Validation schema - memoized with t dependency
    const schema = useMemo(() => yup.object().shape({
        studentID: yup.string().required(t('editStudent.validation.studentIDRequired')),
        studentName: yup.string().required(t('editStudent.validation.studentNameRequired')),
        Dob: yup.string().required(t('editStudent.validation.dobRequired')),
        Father_name: yup.string().required(t('editStudent.validation.fatherNameRequired')),
        Mother_name: yup.string().required(t('editStudent.validation.motherNameRequired')),
        Nationality: yup.object().required(t('editStudent.validation.nationalityRequired')),
        Province: yup.object().required(t('editStudent.validation.provinceRequired')),
        contactNo: yup.string().required(t('editStudent.validation.contactNoRequired')),
        Communication_no: yup.string().required(t('editStudent.validation.communicationNoRequired')),
        Admission_date: yup.string(),
        Religion: yup.string(),
        Email: yup.string().required(t('editStudent.validation.emailRequired')),
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

    const { data: nationality, isFetching: nationalityLoading } = useNationalityListQuery()
    const { data: religions, isFetching: religionLoading } = useReligionListQuery()
    const [triggerState, { data: stateList, isFetching: stateLoading }] = useLazyStateListBasedOnCountryQuery()
    const [triggerCity, { data: cityList, isFetching: cityLoading}] = useLazyCityBasedOnStateQuery()
    const [triggerUpdate, { isLoading: updateLoading }] = useUpdateStudentMutation()
    const { data: singleStudent, isFetching: singleStudentLoading} = useGetSingleStudentDetailsQuery(params?.id)
    const [state, setState] = useState(null)


    console.log({stateList})


    const {
        handleSubmit,
        control,
        setValue,
        setError,
        reset,
        formState: { errors },
        watch
    } = useForm({
        resolver: yupResolver(schema)

    });

    useEffect(() => {
        if(singleStudent){
            setFormValues()
        }
    }, [singleStudent])
    
    const setFormValues = async() => {
        // if(singleStudent?.Nationality){
        //     const state = await triggerState(singleStudent?.Nationality?._id)

        //     //setState(singleStudent?.Province)

        //     // setTimeout(() => {
        //     //     setValue("Province", singleStudent?.Province)
        //     // }, 1000);
            
        // }

        // if(singleStudent?.Province){
        //     triggerCity(singleStudent?.Province?.id)
        // }

        reset({
            ...singleStudent,
            Dob: singleStudent?.Dob ? dayjs(singleStudent?.Dob) : null,
            Admission_date: singleStudent?.Admission_date? dayjs(singleStudent?.Admission_date) : null,
            Passport_Expiry: singleStudent?.Passport_Expiry? dayjs(singleStudent?.Passport_Expiry) : null,
            Iqama_Expiry: singleStudent?.Iqama_Expiry? dayjs(singleStudent?.Iqama_Expiry) : null,
            Religion: singleStudent?.Religion?._id
        })
    }

    const country  = watch('Nationality');
    const province = watch('Province');
    const transportPick = watch('Transport_Pickup');
    const transportDrop = watch('Transport_Drop');

    useEffect(() => {
        setValue("Pickup_BusNo", "")
    }, [transportPick])

    useEffect(() => {
        setValue("Drop_BusNo", "")
    }, [transportDrop])
    
    

    useEffect(() => {
        if(country){
            getState()
        }
    }, [country])

    const getState = async() => {
        console.log({country})
        const stateList = await triggerState(country?._id)?.unwrap()
        // console.log({stateList})
        if(!stateList?.error && singleStudent){
            setState(singleStudent?.Province)
        }
    }

    useEffect(() => {
        if(province){
            triggerCity(province?.id)
        }
    }, [province])


    const SubmitForm = async(data) => {
        try {
            let datas = {
                ...data,
                _id: singleStudent?._id,
                Nationality: country?._id,
                Province: province?._id,
                City: data?.City?._id
            }
            const response = await triggerUpdate(datas)
            if(response.error){
                showSnackbar(t('editStudent.messages.updateFailed'), 'error')
                return
            }
            showSnackbar(t('editStudent.messages.updateSuccess'),'success')
            reset()
            navigate(-1)
        } catch (error) {
            showSnackbar(t('editStudent.messages.updateFailed'), 'error')
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
                {subtitle && (
                    <Typography variant="body2" color="text.secondary">
                        {subtitle}
                    </Typography>
                )}
            </Box>
        </Box>
    );

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
                <CustomBackButton />
                <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                    {t('editStudent.title')}
                </Typography>
            </Box>
            {/* Personal Information */}
            <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                    <SectionHeader icon={<PersonIcon />} title={t('editStudent.sections.personalInformation.title')} subtitle={t('editStudent.sections.personalInformation.subtitle')} />
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6} lg={3}>
                            <CustomInput
                                control={control}
                                error={errors.studentID}
                                fieldName="studentID"
                                fieldLabel={t('editStudent.fields.studentID')}
                            />
                        </Grid>
                        <Grid item xs={12} md={6} lg={3}>
                            <CustomInput
                                control={control}
                                error={errors.studentName}
                                fieldName="studentName"
                                fieldLabel={t('editStudent.fields.studentName')}
                            />
                        </Grid>
                        <Grid item xs={12} md={6} lg={3}>
                            <CustomDatePicker
                                fieldName='Dob'
                                control={control}
                                error={errors.Dob}
                                fieldLabel={t('editStudent.fields.dateOfBirth')}
                            />
                        </Grid>
                        <Grid item xs={12} md={6} lg={3}>
                            <CustomInput
                                control={control}
                                error={errors.Father_name}
                                fieldName="Father_name"
                                fieldLabel={t('editStudent.fields.fatherName')}
                            />
                        </Grid>
                        <Grid item xs={12} md={6} lg={3}>
                            <CustomInput
                                control={control}
                                error={errors.Mother_name}
                                fieldName="Mother_name"
                                fieldLabel={t('editStudent.fields.motherName')}
                            />
                        </Grid>
                        <Grid item xs={12} md={6} lg={3}>
                            <CustomInput
                                control={control}
                                error={errors.contactNo}
                                fieldName="contactNo"
                                fieldLabel={t('editStudent.fields.contactNumber')}
                            />
                        </Grid>
                        <Grid item xs={12} md={6} lg={3}>
                            <CustomInput
                                control={control}
                                error={errors.Communication_no}
                                fieldName="Communication_no"
                                fieldLabel={t('editStudent.fields.communicationNumber')}
                            />
                        </Grid>
                        <Grid item xs={12} md={6} lg={3}>
                            <CustomDatePicker
                                fieldName='Admission_date'
                                control={control}
                                error={errors.Admission_date}
                                fieldLabel={t('editStudent.fields.admissionDate')}
                            />
                        </Grid>
                        <Grid item xs={12} md={6} lg={3}>
                            <CustomSelect
                                control={control}
                                error={errors.Religion}
                                fieldName="Religion"
                                fieldLabel={t('editStudent.fields.religion')}
                                size="16px"
                                defaultValue={singleStudent?.Religion?._id}
                            >
                                <MenuItem value="" disabled >
                                    <em>{t('editStudent.placeholders.selectReligion')}</em>
                                </MenuItem>
                                {religions && religions?.map((res, i) => (
                                    <MenuItem key={res?._id} value={res?._id} >
                                        {res?.religionName}
                                    </MenuItem>
                                ))}
                            </CustomSelect>
                        </Grid>
                        <Grid item xs={12} md={6} lg={3}>
                            <CustomInput
                                control={control}
                                error={errors.Email}
                                fieldName="Email"
                                fieldLabel={t('editStudent.fields.email')}
                            />
                        </Grid>
                        <Grid item xs={12} md={6} lg={3}>
                            <CustomInput
                                control={control}
                                error={errors.Place_of_birth}
                                fieldName="Place_of_birth"
                                fieldLabel={t('editStudent.fields.placeOfBirth')}
                            />
                        </Grid>
                        <Grid item xs={12} md={6} lg={3}>
                            <CustomInput
                                control={control}
                                error={errors.Zip}
                                fieldName="Zip"
                                fieldLabel={t('editStudent.fields.zip')}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Location Information */}
            <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                    <SectionHeader icon={<LocationOnIcon />} title={t('editStudent.sections.locationInformation.title')} subtitle={t('editStudent.sections.locationInformation.subtitle')} />
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Autocomplete
                                fieldName="Nationality"
                                control={control}
                                fieldLabel={t('editStudent.fields.nationality')}
                                placeholder={t('editStudent.placeholders.selectNationality')}
                                options={nationality || []}
                                labelField="name"
                                error={errors.Nationality}
                                defaultValue={singleStudent?.Nationality}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            {!stateLoading && (
                                <Autocomplete
                                    fieldName="Province"
                                    control={control}
                                    fieldLabel={t('editStudent.fields.province')}
                                    placeholder={t('editStudent.placeholders.selectProvince')}
                                    options={stateList || []}
                                    labelField="name"
                                    error={errors.Province}
                                    defaultValue={singleStudent?.Province}
                                />
                            )}
                        </Grid>
                        <Grid item xs={12} md={6}>
                            {!cityLoading && (
                                <Autocomplete
                                    fieldName="City"
                                    control={control}
                                    fieldLabel={t('editStudent.fields.city')}
                                    placeholder={t('editStudent.placeholders.selectCity')}
                                    options={cityList || []}
                                    labelField={"name"}
                                    error={errors.City}
                                />
                            )}
                        </Grid>
                        <Grid item xs={12}>
                            <CustomTextArea
                                control={control}
                                error={errors.Communication_Address}
                                fieldName="Communication_Address"
                                multiline={true}
                                height={120}
                                row={10}
                                fieldLabel={t('editStudent.fields.communicationAddress')}
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
                                fieldLabel={t('editStudent.fields.permanentAddress')}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Academic Information */}
            <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                    <SectionHeader icon={<SchoolIcon />} title={t('editStudent.sections.academicInformation.title')} subtitle={t('editStudent.sections.academicInformation.subtitle')} />
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <CustomInput
                                control={control}
                                error={errors.Previous_School}
                                fieldName="Previous_School"
                                fieldLabel={t('editStudent.fields.previousSchool')}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <CustomInput
                                control={control}
                                error={errors.Hobbies}
                                fieldName="Hobbies"
                                fieldLabel={t('editStudent.fields.hobbies')}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <CustomInput
                                control={control}
                                error={errors.Health_Issue}
                                fieldName="Health_Issue"
                                fieldLabel={t('editStudent.fields.healthIssue')}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Document Information */}
            <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                    <SectionHeader icon={<ContactPhoneIcon />} title={t('editStudent.sections.documentInformation.title')} subtitle={t('editStudent.sections.documentInformation.subtitle')} />
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <CustomInput
                                control={control}
                                error={errors.Passport_No}
                                fieldName="Passport_No"
                                fieldLabel={t('editStudent.fields.passportNumber')}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <CustomDatePicker
                                fieldName='Passport_Expiry'
                                control={control}
                                error={errors.Passport_Expiry}
                                fieldLabel={t('editStudent.fields.passportExpiry')}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <CustomInput
                                control={control}
                                error={errors.Iqama_No}
                                fieldName="Iqama_No"
                                fieldLabel={t('editStudent.fields.iqamaNo')}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <CustomDatePicker
                                fieldName='Iqama_Expiry'
                                control={control}
                                error={errors.Iqama_Expiry}
                                fieldLabel={t('editStudent.fields.iqamaExpiry')}
                            />
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Transport Information */}
            <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                    <SectionHeader icon={<DirectionsBusIcon />} title={t('editStudent.sections.transportInformation.title')} subtitle={t('editStudent.sections.transportInformation.subtitle')} />
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <CustomSelect
                                control={control}
                                error={errors.Transport_Pickup}
                                fieldName="Transport_Pickup"
                                fieldLabel={t('editStudent.fields.transportPickup')}
                                size="16px"
                                defaultValue={singleStudent?.Transport_Pickup}
                            >
                                <MenuItem value="" disabled >
                                    <em>{t('editStudent.placeholders.selectPickup')}</em>
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
                                    fieldLabel={t('editStudent.fields.pickupBusNo')}
                                />
                            </Grid>
                        )}
                        <Grid item xs={12} md={6}>
                            <CustomSelect
                                control={control}
                                error={errors.Transport_Drop}
                                fieldName="Transport_Drop"
                                fieldLabel={t('editStudent.fields.transportDrop')}
                                size="16px"
                                defaultValue={singleStudent?.Transport_Drop}
                            >
                                <MenuItem value="" disabled >
                                    <em>{t('editStudent.placeholders.selectDrop')}</em>
                                </MenuItem>
                                {TRANSPORT_NAME && TRANSPORT_NAME?.map((res, i) => (
                                    <MenuItem key={res?.id} value={res.value} >
                                        {res?.name}
                                    </MenuItem>
                                ))}
                            </CustomSelect>
                        </Grid>
                        {transportDrop === "School Bus"  && (
                            <Grid item xs={12} md={6}>
                                <CustomInput
                                    control={control}
                                    error={errors.Drop_BusNo}
                                    fieldName="Drop_BusNo"
                                    fieldLabel={t('editStudent.fields.dropBusNo')}
                                />
                            </Grid>
                        )}
                    </Grid>
                </CardContent>
            </Card>
            <Box display="flex" justifyContent="flex-end">
                <Button label={t('editStudent.actions.update')} onClick={handleSubmit(SubmitForm)} />
            </Box>
            <UiBlocker open={nationalityLoading || stateLoading || religionLoading || cityLoading || updateLoading || singleStudentLoading} />
        </Box>
    )
}

export default EditStudent