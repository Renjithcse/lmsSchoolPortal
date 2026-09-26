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
    Link,
    useMediaQuery,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import CustomLoginInput from '../../components/Common/CustomLoginInputs';
import CustomButton from '../../components/Common/CustomButton';
import { useSnackbar } from '../../hooks/SnackBar';
import { userStore } from '../../store/userStore';
import CustomBackDrop from '../../components/Common/CustomBackDrop';
import { useRegisterTeacherMutation, useTeacherCodeVerifyMutation } from '../../Redux/features/auth/userSlice';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { useTranslation } from 'react-i18next';
import { getAuthLayoutTokens } from '../../utils/authLayoutStyles';

const TeacherRegister = () => {
    const navigate = useNavigate();
    const showSnackbar = useSnackbar();
    const updateUser = userStore((state) => state.updateuser);
    const [enableCode, setEnableCode] = useState(false);
    const [registerError, setRegisterError] = useState('');
    const { t } = useTranslation();

    const [triggerTeacherRegister, { isLoading }] = useRegisterTeacherMutation();
    const [teacherCodeVerify, { isLoading: isCodeVerifyLoading }] = useTeacherCodeVerifyMutation();

    const schema = useMemo(() => yup.object().shape({
        email: yup.string().email(t('teacherRegister.validation.emailInvalid')).required(t('teacherRegister.validation.emailRequired')),
        code: yup.string(),
    }), [t]);

    const {
        handleSubmit,
        control,
        formState: { errors },
        getValues,
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

    const handleSendCode = useCallback(async (data) => {
        setRegisterError('');
        const response = await triggerTeacherRegister(data);
        if (response.error) {
            const errorMessage = response.error?.data?.message || t('teacherRegister.messages.registrationFailed');
            setRegisterError(errorMessage);
            showSnackbar(errorMessage, 'error');
            return;
        }
        setEnableCode(true);
        updateUser({ email: data.email });
        showSnackbar(t('teacherRegister.messages.codeSent'), 'success');
    }, [triggerTeacherRegister, showSnackbar, updateUser, t]);

    const handleVerifyCode = useCallback(async (data) => {
        if (!data.code) {
            showSnackbar(t('teacherRegister.messages.codeRequired'), 'error');
            return;
        }
        const verification = await teacherCodeVerify({
            email: getValues('email'),
            code: data.code,
        });

        if (verification.error) {
            const errorMessage = verification.error?.data?.message || t('teacherRegister.messages.verificationFailed');
            showSnackbar(errorMessage, 'error');
            return;
        }

        showSnackbar(t('teacherRegister.messages.emailVerified'), 'success');
        navigate('/teacher-profile', { state: verification?.data?.userId });
    }, [teacherCodeVerify, navigate, getValues, showSnackbar, t]);

    const submitHandler = enableCode ? handleVerifyCode : handleSendCode;

    const featureBlocks = useMemo(() => {
        const features = t('teacherRegister.features', { returnObjects: true }) || [];
        return (
            <Stack spacing={2.3}>
                {features.map((item) => (
                    <Stack key={item.title} direction="row" spacing={2} alignItems="flex-start">
                        <Avatar
                            sx={{
                                width: 36,
                                height: 36,
                                bgcolor: authTokens.hero.avatarBackground,
                                color: '#fff',
                            }}
                        >
                            <CheckCircleRoundedIcon fontSize="small" />
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {item.title}
                            </Typography>
                            <Typography variant="body2" sx={{ color: authTokens.text.heroSubtitle }}>
                                {item.description}
                            </Typography>
                        </Box>
                    </Stack>
                ))}
            </Stack>
        );
    }, [authTokens.hero.avatarBackground, authTokens.text.heroSubtitle, t]);

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
                                            <PersonAddIcon fontSize="large" />
                                        </Avatar>
                                        <Typography variant="h3" sx={{ fontWeight: 700, textAlign: 'center' }}>
                                            {t('teacherRegister.heroTitle')}
                                        </Typography>
                                        <Typography sx={{ color: authTokens.text.heroSubtitle, maxWidth: 360, textAlign: 'center' }}>
                                            {t('teacherRegister.heroSubtitle')}
                                        </Typography>
                                    </Stack>
                                    <Stack spacing={2}>
                                        {featureBlocks}
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
                                        {t('teacherRegister.formTitle')}
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        sx={{ color: authTokens.text.formBody, maxWidth: 320, textAlign: 'center' }}
                                    >
                                        {t('teacherRegister.formSubtitle')}
                                    </Typography>
                                </Stack>

                                {registerError && (
                                    <Alert severity="error" sx={{ borderRadius: 2 }}>
                                        {registerError}
                                    </Alert>
                                )}

                                <Box component="form" onSubmit={handleSubmit(submitHandler)}>
                                    <Stack spacing={2.5}>
                                        <CustomLoginInput
                                            type="text"
                                            control={control}
                                            error={errors.email}
                                            fieldName="email"
                                            placeholder={t('teacherRegister.form.emailPlaceholder')}
                                            readOnly={enableCode}
                                        />

                                    </Stack>
                                    <Stack spacing={2.5} sx={{ mt: 2.5 }}>
                                        {enableCode && (
                                            <CustomLoginInput
                                                type="text"
                                                control={control}
                                                error={errors.code}
                                                fieldName="code"
                                                placeholder={t('teacherRegister.form.codePlaceholder')}
                                            />
                                        )}

                                        <CustomButton
                                            onClick={handleSubmit(submitHandler)}
                                            width="100%"
                                            label={
                                                enableCode
                                                    ? t('teacherRegister.actions.verifyCode')
                                                    : t('teacherRegister.actions.sendCode')
                                            }
                                            loading={isLoading || isCodeVerifyLoading}
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
                                            {t('teacherRegister.help')}
                                        </Typography>
                                    </Stack>
                                </Box>
                            </Stack>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
            {(isLoading || isCodeVerifyLoading) && <CustomBackDrop loading={isLoading || isCodeVerifyLoading} />}
        </Box>
    );
};

export default TeacherRegister;

