import React, { useCallback, useMemo, useState } from 'react';
import { useTheme, alpha } from '@mui/material/styles';
import {
    Grid,
    Box,
    Typography,
    Card,
    Container,
    Alert,
    Stack,
    Chip,
    Avatar,
    useMediaQuery,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import CustomLoginInput from '../../components/Common/CustomLoginInputs';
import CustomButton from '../../components/Common/CustomButton';
import { useSnackbar } from '../../hooks/SnackBar';
import CustomBackDrop from '../../components/Common/CustomBackDrop';
import { useVerifyStudentMutation } from '../../Redux/features/Users/StudentSlice';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { useTranslation } from 'react-i18next';
import { getAuthLayoutTokens } from '../../utils/authLayoutStyles';

const StudentRegister = () => {
    const navigate = useNavigate();
    const showSnackbar = useSnackbar();
    const [registerError, setRegisterError] = useState('');
    const { t } = useTranslation();

    const [triggerVerify, { isLoading }] = useVerifyStudentMutation();

    const schema = useMemo(() => yup.object().shape({
        studentId: yup.string().required(t('studentRegister.validation.studentIdRequired')),
        dob: yup.string().required(t('studentRegister.validation.dobRequired')),
        phoneNumber: yup.string().required(t('studentRegister.validation.phoneNumberRequired')),
    }), [t]);

    const {
        handleSubmit,
        control,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(schema),
    });

    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
    const { themeColors } = useThemeContext();
    const authTokens = getAuthLayoutTokens(theme, themeColors);
    const { isDarkMode } = authTokens;
    const heroShadow = isDarkMode
        ? `0 35px 80px -45px ${alpha('#000000', 0.85)}`
        : `0 35px 80px -40px ${alpha(themeColors.primary, 0.5)}`;

    const onSubmit = useCallback(
        async (formData) => {
            setRegisterError('');
            const response = await triggerVerify(formData);
            if (response.error) {
                const errorMessage = response.error?.data?.message || t('studentRegister.messages.verificationFailed');
                setRegisterError(errorMessage);
                showSnackbar(errorMessage, 'error');
                return;
            }

            showSnackbar(t('studentRegister.messages.verificationSuccess'), 'success');
            navigate('/student-password', { state: response?.data?.data });
        },
        [triggerVerify, showSnackbar, navigate, t]
    );

    const checklistItems = useMemo(
        () => t('studentRegister.checklistItems', { returnObjects: true }) || [],
        [t]
    );

    const tipsList = useMemo(
        () => (
            <Stack spacing={1.8}>
                {checklistItems.map((tip) => (
                    <Stack key={tip} direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                            sx={{
                                width: 32,
                                height: 32,
                                bgcolor: authTokens.hero.avatarBackground,
                                color: '#fff',
                            }}
                        >
                            <CheckCircleRoundedIcon fontSize="small" />
                        </Avatar>
                        <Typography variant="body2" sx={{ color: authTokens.text.heroSubtitle }}>
                            {tip}
                        </Typography>
                    </Stack>
                ))}
            </Stack>
        ),
        [checklistItems, authTokens.hero.avatarBackground, authTokens.text.heroSubtitle]
    );

    return (
        <Box
            sx={{
                minHeight: '100vh',
                position: 'relative',
                overflow: 'hidden',
                py: { xs: 4, md: 6 },
                px: { xs: 2, sm: 3 },
                background: authTokens.pageBackground,
                display: 'flex',
                alignItems: 'center',
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
                    minHeight: { xs: 'auto', md: '70vh' },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Grid container spacing={{ xs: 4, md: 6 }} alignItems="stretch">
                    {isDesktop && (
                        <Grid item md={6} sx={{ display: 'flex' }}>
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
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                            >
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        opacity: authTokens.hero.overlayOpacity,
                                        background: `
                                            radial-gradient(circle at 30% 20%, #fff 0%, transparent 45%),
                                            radial-gradient(circle at 70% 80%, #fff 0%, transparent 45%),
                                            url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.4' opacity='0.25'%3E%3Cpath d='M0 60h120M60 0v120M20 0v120M100 0v120M0 20h120M0 100h120'/%3E%3C/g%3E%3C/svg%3E")
                                        `,
                                    }}
                                />
                                <Stack spacing={4} sx={{ position: 'relative', zIndex: 1, flexGrow: 1 }}>
                                    <Stack spacing={2} alignItems="center">
                                        <Avatar
                                            sx={{
                                                width: 64,
                                                height: 64,
                                                bgcolor: authTokens.hero.avatarBackground,
                                                color: '#fff',
                                            }}
                                        >
                                            <SchoolIcon fontSize="large" />
                                        </Avatar>
                                        <Typography variant="h3" sx={{ fontWeight: 700, textAlign: 'center' }}>
                                            {t('studentRegister.heroTitle')}
                                        </Typography>
                                        <Typography sx={{ color: authTokens.text.heroSubtitle, maxWidth: 360, textAlign: 'center' }}>
                                            {t('studentRegister.heroSubtitle')}
                                        </Typography>
                                    </Stack>
                                    <Stack spacing={1.2}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                            {t('studentRegister.checklistTitle')}
                                        </Typography>
                                        {tipsList}
                                    </Stack>
                                </Stack>
                            </Card>
                        </Grid>
                    )}

                    <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
                        <Card
                            elevation={isDesktop ? 12 : 8}
                            sx={{
                                borderRadius: 4,
                                p: { xs: 3, sm: 4 },
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                backdropFilter: 'blur(12px)',
                                backgroundColor: authTokens.form.background,
                                border: `1px solid ${authTokens.form.borderColor}`,
                                boxShadow: authTokens.form.boxShadow,
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            <Box
                                sx={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: authTokens.form.overlayBackground,
                                    opacity: authTokens.form.overlayOpacity,
                                }}
                            />
                            <Stack spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
                                <Stack spacing={1} alignItems="center">
                                    <Avatar
                                        sx={{
                                            width: 64,
                                            height: 64,
                                            bgcolor: alpha(themeColors.primary, isDarkMode ? 0.25 : 0.13),
                                            border: `1px solid ${alpha(themeColors.primary, isDarkMode ? 0.35 : 0.31)}`,
                                        }}
                                    >
                                        <CheckCircleRoundedIcon sx={{ color: themeColors.primary }} />
                                    </Avatar>
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: authTokens.text.formHeading }}>
                                        {t('studentRegister.formTitle')}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{ color: authTokens.text.formBody, maxWidth: 320, textAlign: 'center' }}
                                    >
                                        {t('studentRegister.formSubtitle')}
                                    </Typography>
                                </Stack>

                                {registerError && (
                                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                                        {registerError}
                                    </Alert>
                                )}

                                <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                                    <Stack spacing={2.5}>
                                        <CustomLoginInput
                                            type="text"
                                            control={control}
                                            error={errors.studentId}
                                            fieldName="studentId"
                                            placeholder={t('studentRegister.form.studentIdPlaceholder')}
                                        />
                                        <CustomLoginInput
                                            type="date"
                                            control={control}
                                            error={errors.dob}
                                            fieldName="dob"
                                            placeholder={t('studentRegister.form.dobPlaceholder')}
                                        />
                                        <CustomLoginInput
                                            type="tel"
                                            control={control}
                                            error={errors.phoneNumber}
                                            fieldName="phoneNumber"
                                            placeholder={t('studentRegister.form.phoneNumberPlaceholder')}
                                        />

                                        <CustomButton
                                            onClick={handleSubmit(onSubmit)}
                                            width="100%"
                                            label={t('studentRegister.actions.verify')}
                                            loading={isLoading}
                                            backgroundColor={themeColors.primary}
                                            sx={{
                                                borderRadius: 3,
                                                py: 1.3,
                                                fontSize: '1rem',
                                                fontWeight: 600,
                                                textTransform: 'none',
                                            }}
                                        />

                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary, textAlign: 'center' }}>
                                            {t('studentRegister.help')}
                                        </Typography>
                                    </Stack>
                                </Box>
                            </Stack>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
            {isLoading && <CustomBackDrop loading={isLoading} />}
        </Box>
    );
};

export default StudentRegister;

