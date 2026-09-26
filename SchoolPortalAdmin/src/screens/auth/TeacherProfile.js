import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useTheme, alpha } from '@mui/material/styles';
import {
    Grid,
    Box,
    Typography,
    Card,
    Container,
    Alert,
    Stack,
    Avatar,
    useMediaQuery,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useLocation, useNavigate } from 'react-router-dom';
import CustomLoginInput from '../../components/Common/CustomLoginInputs';
import CustomButton from '../../components/Common/CustomButton';
import { useSnackbar } from '../../hooks/SnackBar';
import CustomBackDrop from '../../components/Common/CustomBackDrop';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { getAuthLayoutTokens } from '../../utils/authLayoutStyles';
import { useTranslation } from 'react-i18next';
import CustomSelect from '../../components/Common/CustomSelect';
import { MenuItem } from '@mui/material';
import CustomDatePicker from '../../components/Common/CustomDatefilter';
import CustomTextArea from '../../components/Common/CustomTextArea';
import { useNationalityListQuery, useReligionListQuery, useLazyStateListBasedOnCountryQuery, useLazyCityBasedOnStateQuery } from '../../Redux/features/commonSlice';
import Autocomplete from '../../components/Common/AutoComplete';
import ImagePicker from '../../components/Inputs/ImagePicker';
import dayjs from 'dayjs';

const TeacherProfile = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const showSnackbar = useSnackbar();
    const [profileError, setProfileError] = useState('');
    const { t } = useTranslation();
    const teacherId = location.state?.teacherId;

    const { data: nationalityData } = useNationalityListQuery();
    const { data: religions } = useReligionListQuery();
    const [triggerState, { data: stateList }] = useLazyStateListBasedOnCountryQuery();
    const [triggerCity, { data: cityList }] = useLazyCityBasedOnStateQuery();

    const schema = useMemo(() => yup.object().shape({
        profilePicture: yup.string(),
        designation: yup.string(),
        qualification: yup.string(),
        alternativeNumber: yup.string(),
        dob: yup.string(),
        gender: yup.string(),
        Religion: yup.string(),
        dateOfJoining: yup.string(),
        experienceInYears: yup.number().positive(),
        place: yup.string(),
        zip: yup.string(),
        communicationAddress: yup.string(),
        permanentAddress: yup.string(),
        nationality: yup.mixed(),
        province: yup.mixed(),
        city: yup.mixed(),
        passportNo: yup.string(),
        passportExpiry: yup.string(),
        iqamaNo: yup.string(),
        iqamaExpiry: yup.string(),
    }), []);

    const {
        handleSubmit,
        control,
        formState: { errors },
        watch,
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {},
    });

    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
    const { themeColors } = useThemeContext();
    const authTokens = getAuthLayoutTokens(theme, themeColors);
    const { isDarkMode } = authTokens;
    const heroShadow = isDarkMode
        ? `0 35px 80px -45px ${alpha('#000000', 0.85)}`
        : `0 35px 80px -40px ${alpha(themeColors.primary, 0.5)}`;

    const nationality = watch('nationality');
    const province = watch('province');

    useEffect(() => {
        if (nationality?._id || nationality) {
            triggerState(nationality?._id || nationality);
        }
    }, [nationality, triggerState]);

    useEffect(() => {
        if (province?._id || province) {
            triggerCity(province?._id || province);
        }
    }, [province, triggerCity]);

    const onSubmit = useCallback(
        async (formData) => {
            setProfileError('');
            
            // Format the data for submission
            const profileData = {
                profilePicture: formData.profilePicture || undefined,
                designation: formData.designation || undefined,
                qualification: formData.qualification || undefined,
                alternativeNumber: formData.alternativeNumber || undefined,
                dob: formData.dob ? dayjs(formData.dob).format('YYYY-MM-DD') : undefined,
                gender: formData.gender || undefined,
                Religion: formData.Religion || undefined,
                dateOfJoining: formData.dateOfJoining ? dayjs(formData.dateOfJoining).format('YYYY-MM-DD') : undefined,
                experienceInYears: formData.experienceInYears || undefined,
                place: formData.place || undefined,
                zip: formData.zip || undefined,
                communicationAddress: formData.communicationAddress || undefined,
                permanentAddress: formData.permanentAddress || undefined,
                nationality: nationality?._id || nationality || undefined,
                Province: province?._id || province || undefined,
                City: formData.city?._id || formData.city || undefined,
                passportNo: formData.passportNo || undefined,
                passportExpiry: formData.passportExpiry ? dayjs(formData.passportExpiry).format('YYYY-MM-DD') : undefined,
                iqamaNo: formData.iqamaNo || undefined,
                iqamaExpiry: formData.iqamaExpiry ? dayjs(formData.iqamaExpiry).format('YYYY-MM-DD') : undefined,
            };

            // Store profile data and navigate to password setup
            navigate('/teacher-password', { 
                state: { 
                    teacherId: teacherId || location.state,
                    profileData 
                } 
            });
        },
        [navigate, teacherId, location.state, nationality, province]
    );

    const handleSkip = useCallback(() => {
        navigate('/teacher-password', { 
            state: teacherId || location.state 
        });
    }, [navigate, teacherId, location.state]);

    if (!teacherId && !location.state) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Alert severity="error">Teacher ID not found. Please start registration again.</Alert>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                position: 'relative',
                overflow: 'auto',
                py: { xs: 4, md: 6 },
                px: { xs: 2, sm: 3 },
                background: authTokens.pageBackground,
            }}
        >
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    background: authTokens.pageOverlay,
                }}
            />
            <Container
                maxWidth="lg"
                sx={{
                    position: 'relative',
                    zIndex: 1,
                }}
            >
                <Grid container spacing={{ xs: 4, md: 6 }} alignItems="flex-start">
                    {isDesktop && (
                        <Grid item md={5} sx={{ display: 'flex' }}>
                            <Card
                                elevation={0}
                                sx={{
                                    borderRadius: 5,
                                    px: 4,
                                    py: 5,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    color: '#fff',
                                    background: authTokens.hero.background,
                                    boxShadow: heroShadow,
                                    position: 'sticky',
                                    top: 24,
                                    maxHeight: 'calc(100vh - 48px)',
                                }}
                            >
                                <Stack spacing={4} sx={{ position: 'relative', zIndex: 1 }}>
                                    <Stack spacing={2} alignItems="center">
                                        <Avatar
                                            sx={{
                                                width: 64,
                                                height: 64,
                                                bgcolor: authTokens.hero.avatarBackground,
                                                color: '#fff',
                                            }}
                                        >
                                            <PersonIcon fontSize="large" />
                                        </Avatar>
                                        <Typography variant="h3" sx={{ fontWeight: 700, textAlign: 'center' }}>
                                            {t('teacherProfile.heroTitle', 'Complete Your Profile')}
                                        </Typography>
                                        <Typography sx={{ color: authTokens.text.heroSubtitle, maxWidth: 360, textAlign: 'center' }}>
                                            {t('teacherProfile.heroSubtitle', 'Add your professional and personal details to complete your account setup.')}
                                        </Typography>
                                    </Stack>
                                </Stack>
                            </Card>
                        </Grid>
                    )}

                    <Grid item xs={12} md={7} sx={{ display: 'flex' }}>
                        <Card
                            elevation={isDesktop ? 12 : 8}
                            sx={{
                                borderRadius: 4,
                                p: { xs: 3, sm: 4 },
                                width: '100%',
                                backdropFilter: 'blur(12px)',
                                backgroundColor: authTokens.form.background,
                                border: `1px solid ${authTokens.form.borderColor}`,
                                boxShadow: authTokens.form.boxShadow,
                            }}
                        >
                            <Stack spacing={3}>
                                <Stack spacing={1} alignItems="center">
                                    <Avatar
                                        sx={{
                                            width: 64,
                                            height: 64,
                                            bgcolor: alpha(themeColors.primary, isDarkMode ? 0.25 : 0.13),
                                            border: `1px solid ${alpha(themeColors.primary, isDarkMode ? 0.35 : 0.31)}`,
                                        }}
                                    >
                                        <PersonIcon sx={{ color: themeColors.primary }} />
                                    </Avatar>
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: authTokens.text.formHeading }}>
                                        {t('teacherProfile.formTitle', 'Profile Information')}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{ color: authTokens.text.formBody, maxWidth: 400, textAlign: 'center' }}
                                    >
                                        {t('teacherProfile.formSubtitle', 'Please fill in your details. You can skip this step and complete it later.')}
                                    </Typography>
                                </Stack>

                                {profileError && (
                                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                                        {profileError}
                                    </Alert>
                                )}

                                <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                                    <Stack spacing={3}>
                                        {/* Profile Picture */}
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: authTokens.text.formHeading }}>
                                                {t('teacherProfile.profilePicture', 'Profile Picture')}
                                            </Typography>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12}>
                                                    <ImagePicker
                                                        fieldName="profilePicture"
                                                        control={control}
                                                        fieldLabel={t('teacherProfile.uploadPhoto', 'Upload Profile Photo')}
                                                        error={errors.profilePicture}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Box>

                                        {/* Personal Information */}
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: authTokens.text.formHeading }}>
                                                {t('teacherProfile.personalInfo', 'Personal Information')}
                                            </Typography>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} sm={6}>
                                                    <CustomLoginInput
                                                        type="text"
                                                        control={control}
                                                        error={errors.alternativeNumber}
                                                        fieldName="alternativeNumber"
                                                        placeholder={t('teacherProfile.alternativeNumber', 'Alternative Number')}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <CustomDatePicker
                                                        fieldName="dob"
                                                        control={control}
                                                        error={errors.dob}
                                                        fieldLabel={t('teacherProfile.dateOfBirth', 'Date of Birth')}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <CustomSelect
                                                        control={control}
                                                        error={errors.gender}
                                                        fieldName="gender"
                                                        fieldLabel={t('teacherProfile.gender', 'Gender')}
                                                    >
                                                        <MenuItem value="">{t('teacherProfile.selectGender', 'Select Gender')}</MenuItem>
                                                        <MenuItem value="male">{t('teacherProfile.male', 'Male')}</MenuItem>
                                                        <MenuItem value="female">{t('teacherProfile.female', 'Female')}</MenuItem>
                                                        <MenuItem value="other">{t('teacherProfile.other', 'Other')}</MenuItem>
                                                    </CustomSelect>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <CustomSelect
                                                        control={control}
                                                        error={errors.Religion}
                                                        fieldName="Religion"
                                                        fieldLabel={t('teacherProfile.religion', 'Religion')}
                                                    >
                                                        <MenuItem value="">{t('teacherProfile.selectReligion', 'Select Religion')}</MenuItem>
                                                        {religions?.map((religion) => (
                                                            <MenuItem key={religion._id} value={religion._id}>
                                                                {religion.religionName}
                                                            </MenuItem>
                                                        ))}
                                                    </CustomSelect>
                                                </Grid>
                                            </Grid>
                                        </Box>

                                        {/* Professional Information */}
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: authTokens.text.formHeading }}>
                                                {t('teacherProfile.professionalInfo', 'Professional Information')}
                                            </Typography>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} sm={6}>
                                                    <CustomLoginInput
                                                        type="text"
                                                        control={control}
                                                        error={errors.designation}
                                                        fieldName="designation"
                                                        placeholder={t('teacherProfile.designation', 'Designation')}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <CustomLoginInput
                                                        type="text"
                                                        control={control}
                                                        error={errors.qualification}
                                                        fieldName="qualification"
                                                        placeholder={t('teacherProfile.qualification', 'Qualification')}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <CustomDatePicker
                                                        fieldName="dateOfJoining"
                                                        control={control}
                                                        error={errors.dateOfJoining}
                                                        fieldLabel={t('teacherProfile.dateOfJoining', 'Date of Joining')}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <CustomLoginInput
                                                        type="number"
                                                        control={control}
                                                        error={errors.experienceInYears}
                                                        fieldName="experienceInYears"
                                                        placeholder={t('teacherProfile.experience', 'Experience (Years)')}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Box>

                                        {/* Address Information */}
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: authTokens.text.formHeading }}>
                                                {t('teacherProfile.addressInfo', 'Address Information')}
                                            </Typography>
                                            <Grid container spacing={2}>
                                                <Grid item xs={12}>
                                                    <Autocomplete
                                                        fieldName="nationality"
                                                        control={control}
                                                        fieldLabel={t('teacherProfile.nationality', 'Nationality')}
                                                        placeholder={t('teacherProfile.selectNationality', 'Select Nationality')}
                                                        options={nationalityData || []}
                                                        labelField="name"
                                                        error={errors.nationality}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Autocomplete
                                                        fieldName="province"
                                                        control={control}
                                                        fieldLabel={t('teacherProfile.province', 'Province')}
                                                        placeholder={t('teacherProfile.selectProvince', 'Select Province')}
                                                        options={stateList || []}
                                                        labelField="name"
                                                        error={errors.province}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Autocomplete
                                                        fieldName="city"
                                                        control={control}
                                                        fieldLabel={t('teacherProfile.city', 'City')}
                                                        placeholder={t('teacherProfile.selectCity', 'Select City')}
                                                        options={cityList || []}
                                                        labelField="name"
                                                        error={errors.city}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <CustomLoginInput
                                                        type="text"
                                                        control={control}
                                                        error={errors.place}
                                                        fieldName="place"
                                                        placeholder={t('teacherProfile.place', 'Place')}
                                                    />
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <CustomLoginInput
                                                        type="text"
                                                        control={control}
                                                        error={errors.zip}
                                                        fieldName="zip"
                                                        placeholder={t('teacherProfile.zipCode', 'Zip Code')}
                                                    />
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <CustomTextArea
                                                        control={control}
                                                        error={errors.communicationAddress}
                                                        fieldName="communicationAddress"
                                                        multiline={true}
                                                        height={80}
                                                        row={3}
                                                        fieldLabel={t('teacherProfile.communicationAddress', 'Communication Address')}
                                                    />
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <CustomTextArea
                                                        control={control}
                                                        error={errors.permanentAddress}
                                                        fieldName="permanentAddress"
                                                        multiline={true}
                                                        height={80}
                                                        row={3}
                                                        fieldLabel={t('teacherProfile.permanentAddress', 'Permanent Address')}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Box>

                                        {/* Action Buttons */}
                                        <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
                                            <CustomButton
                                                onClick={handleSkip}
                                                width="100%"
                                                label={t('teacherProfile.skip', 'Skip for Now')}
                                                backgroundColor={themeColors.text.secondary}
                                                sx={{
                                                    borderRadius: 3,
                                                    py: 1.3,
                                                    fontSize: '1rem',
                                                    fontWeight: 600,
                                                    textTransform: 'none',
                                                }}
                                            />
                                            <CustomButton
                                                onClick={handleSubmit(onSubmit)}
                                                width="100%"
                                                label={t('teacherProfile.continue', 'Continue')}
                                                backgroundColor={themeColors.primary}
                                                sx={{
                                                    borderRadius: 3,
                                                    py: 1.3,
                                                    fontSize: '1rem',
                                                    fontWeight: 600,
                                                    textTransform: 'none',
                                                }}
                                            />
                                        </Stack>
                                    </Stack>
                                </Box>
                            </Stack>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default TeacherProfile;

