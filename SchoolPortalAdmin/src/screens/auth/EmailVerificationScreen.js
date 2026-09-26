import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useLocation, useNavigate } from 'react-router-dom';

import CustomOutletBox from '../../components/Common/CustomOutletBox';
import CustomButton from '../../components/Common/CustomButton';
import { useSnackbar } from '../../hooks/SnackBar';
import {
  useGetMyProfileQuery,
  useSendVerificationCodeMutation,
  useVerifyEmailOrPhoneMutation,
} from '../../Redux/features/Users/userDetailsSlice';
import { getAuthLayoutTokens } from '../../utils/authLayoutStyles';
import { useTranslation } from 'react-i18next';

const EmailVerificationScreen = () => {
  const theme = useTheme();
  const { themeColors } = useThemeContext();
  const { t } = useTranslation();
  const authTokens = getAuthLayoutTokens(theme, themeColors);
  const { isDarkMode } = authTokens;
  const panelBackground = isDarkMode ? alpha(themeColors.background.secondary, 0.94) : themeColors.background.secondary;
  const cardBackground = isDarkMode ? alpha(themeColors.background.primary, 0.98) : themeColors.background.primary;
  const cardBorderColor = authTokens.form.borderColor;
  const cardShadow = authTokens.form.boxShadow;
  const navigate = useNavigate();
  const location = useLocation();
  const showSnackbar = useSnackbar();

  const redirectTo = location.state?.redirectTo || '/';
  const promptTwoFactor = Boolean(location.state?.promptTwoFactor);

  const { data: profileData, isLoading, isFetching, refetch } = useGetMyProfileQuery();
  const [sendVerificationCode, { isLoading: isSending }] = useSendVerificationCodeMutation();
  const [verifyEmail, { isLoading: isVerifying }] = useVerifyEmailOrPhoneMutation();

  const [hasRedirected, setHasRedirected] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const verificationSchema = useMemo(() => yup.object().shape({
    code: yup
      .string()
      .required(t('emailVerification.validation.codeRequired'))
      .matches(/^[0-9]{6}$/, t('emailVerification.validation.codeFormat')),
  }), [t]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(verificationSchema),
    defaultValues: { code: '' },
  });

  const userEmail = location.state?.email || profileData?.user?.email || '';
  const emailVerified = Boolean(profileData?.user?.emailVerified);

  const isStaff = useMemo(() => {
    const roleName = profileData?.user?.role;
    return roleName === 'admin' || roleName === 'user';
  }, [profileData?.user?.role]);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((prev) => Math.max(prev - 1, 0)), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [cooldown]);

  useEffect(() => {
    if (emailVerified && !hasRedirected && profileData) {
      setHasRedirected(true);
      if (promptTwoFactor && isStaff && !profileData.user?.twoFactorEnabled) {
        showSnackbar(t('emailVerification.messages.verifiedWithTwoFactor'), 'success');
        navigate('/profile', { state: { focusTab: 'security' }, replace: true });
      } else {
        showSnackbar(t('emailVerification.messages.verified'), 'success');
        navigate(redirectTo, { replace: true });
      }
    }
  }, [emailVerified, hasRedirected, profileData, promptTwoFactor, isStaff, showSnackbar, navigate, redirectTo, t]);

  const handleSendCode = useCallback(async () => {
    try {
      await sendVerificationCode({ medium: 'email' }).unwrap();
      showSnackbar(t('emailVerification.messages.codeSent'), 'success');
      setCooldown(60);
    } catch (error) {
      const message = error?.data?.message || t('emailVerification.messages.sendError');
      showSnackbar(message, 'error');
    }
  }, [sendVerificationCode, showSnackbar, t]);

  const onSubmit = useCallback(
    async ({ code }) => {
      try {
        await verifyEmail({ code, medium: 'email' }).unwrap();
        reset({ code: '' });
        await refetch();
      } catch (error) {
        const message = error?.data?.message || t('emailVerification.messages.invalidCode');
        showSnackbar(message, 'error');
      }
    },
    [verifyEmail, reset, refetch, showSnackbar, t]
  );

  if (isLoading) {
    return (
      <CustomOutletBox>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </CustomOutletBox>
    );
  }

  return (
    <CustomOutletBox>
      <Box
        p={3}
        maxWidth="720px"
        margin="0 auto"
        sx={{
          color: themeColors.text.primary,
          backgroundColor: panelBackground,
          borderRadius: 3,
          border: `1px solid ${cardBorderColor}`,
          boxShadow: cardShadow,
        }}
      >
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom sx={{ color: themeColors.text.primary }}>
              {t('emailVerification.title')}
            </Typography>
            <Typography variant="body1" sx={{ color: themeColors.text.secondary }}>
              {t('emailVerification.subtitle')}
            </Typography>
          </Box>

          {!emailVerified && (
            <Alert
              severity="info"
              variant="outlined"
              sx={{
                borderRadius: 2,
                backgroundColor: isDarkMode ? alpha(themeColors.background.primary, 0.85) : themeColors.background.secondary,
                borderColor: cardBorderColor,
                color: themeColors.text.primary,
              }}
            >
              {t('emailVerification.codeWillBeSent')} <strong>{userEmail}</strong>
            </Alert>
          )}

          <Card
            variant="outlined"
            sx={{
              backgroundColor: cardBackground,
              borderColor: cardBorderColor,
              boxShadow: cardShadow,
            }}
          >
            <CardContent sx={{ color: themeColors.text.primary }}>
              <Stack spacing={2.5}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ color: themeColors.text.primary }}>
                  {t('emailVerification.step1.title')}
                </Typography>
                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                  {t('emailVerification.step1.description')}
                </Typography>
                <CustomButton
                  label={cooldown > 0 ? t('emailVerification.step1.resendIn', { seconds: cooldown }) : t('emailVerification.step1.sendCode')}
                  onClick={handleSendCode}
                  disable={isSending || cooldown > 0}
                  loading={isSending}
                  type="button"
                />
              </Stack>
            </CardContent>
          </Card>

          <Card
            variant="outlined"
            sx={{
              backgroundColor: cardBackground,
              borderColor: cardBorderColor,
              boxShadow: cardShadow,
            }}
          >
            <CardContent sx={{ color: themeColors.text.primary }}>
              <Stack spacing={2}>
                <Typography variant="subtitle1" fontWeight={600} sx={{ color: themeColors.text.primary }}>
                  {t('emailVerification.step2.title')}
                </Typography>
                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                  {t('emailVerification.step2.description')}
                </Typography>

                <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                  <Stack spacing={2}>
                    <Controller
                      control={control}
                      name="code"
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label={t('emailVerification.form.codeLabel')}
                          placeholder={t('emailVerification.form.codePlaceholder')}
                          error={Boolean(errors.code)}
                          helperText={errors.code?.message}
                          inputProps={{ inputMode: 'numeric', maxLength: 6 }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: themeColors.background.secondary,
                              borderRadius: 2,
                            },
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: themeColors.border.primary,
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: themeColors.border.focus,
                            },
                            '& .MuiInputLabel-root': {
                              color: themeColors.text.secondary,
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                              color: themeColors.primary,
                            },
                            '& .MuiFormHelperText-root': {
                              color: themeColors.text.secondary,
                            },
                          }}
                        />
                      )}
                    />

                    <CustomButton
                      type="submit"
                      label={t('emailVerification.form.verifyButton')}
                      loading={isVerifying}
                      disable={isVerifying || isFetching}
                    />
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Divider sx={{ borderColor: themeColors.border.primary, opacity: 0.6 }} />

          <Stack spacing={1}>
            <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
              {t('emailVerification.help.title')}
            </Typography>
            <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
              {t('emailVerification.help.description', { email: userEmail })}
            </Typography>
            {emailVerified && (
              <Button
                onClick={() => navigate(redirectTo)}
                sx={{
                  alignSelf: 'flex-start',
                  color: themeColors.primary,
                }}
              >
                {t('emailVerification.help.returnToDashboard')}
              </Button>
            )}
          </Stack>
        </Stack>
      </Box>
    </CustomOutletBox>
  );
};

export default EmailVerificationScreen;

