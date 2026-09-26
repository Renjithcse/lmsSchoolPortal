import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  LinearProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { useSnackbar } from '../../hooks/SnackBar';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import InsightsIcon from '@mui/icons-material/Insights';
import { skipToken } from '@reduxjs/toolkit/query/react';
import moment from 'moment';
import {
  useGetStudentLessonPlanSubjectsQuery,
  useGetStudentLessonPlansBySubjectQuery
} from '../../Redux/features/Student/studentLessonPlansApiSlice';

const statusConfig = (themeColors, t) => ({
  planned: {
    label: t('studentLessonPlanSubject.status.planned'),
    color: themeColors.warning,
    background: alpha(themeColors.warning, 0.12),
  },
  'in-progress': {
    label: t('studentLessonPlanSubject.status.inProgress'),
    color: themeColors.info,
    background: alpha(themeColors.info, 0.12),
  },
  completed: {
    label: t('studentLessonPlanSubject.status.completed'),
    color: themeColors.success,
    background: alpha(themeColors.success, 0.12),
  },
});

const StudentLessonPlanSubject = () => {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const showSnackbar = useSnackbar();
  const { themeColors } = useThemeContext();
  const { t } = useTranslation();
  const primaryColor = themeColors.primary;
  const secondaryColor = themeColors.secondary || themeColors.primary;
  const successColor = themeColors.success || themeColors.primary;
  const infoColor = themeColors.info || '#3b82f6';
  const warningColor = themeColors.warning || '#f59e0b';
  const inverseColor = themeColors.text.inverse;

  const {
    data: subjectsData,
    error: subjectsError,
    isFetching: subjectsLoading,
  } = useGetStudentLessonPlanSubjectsQuery();

  const {
    data: plansData,
    error: plansError,
    isFetching: plansLoading,
  } = useGetStudentLessonPlansBySubjectQuery(subjectId ?? skipToken);

  const subjects = subjectsData?.data?.subjects || [];
  const subjectPlans = plansData?.data?.plans || [];
  const subjectSummary = plansData?.data?.summary || null;
  const fallbackSubjectEntry = subjects.find((subject) =>
    subject.subject?._id?.toString() === subjectId
  );
  const currentSubject = plansData?.data?.subject || fallbackSubjectEntry?.subject || null;
  const currentTeacher =
    plansData?.data?.teacher || fallbackSubjectEntry?.teacher || null;

  useEffect(() => {
    const error = subjectsError || plansError;
    if (error) {
      const message =
        error?.data?.message ||
        error?.message ||
        t('studentLessonPlanSubject.messages.defaultError');
      showSnackbar(message, 'error');
    }
  }, [subjectsError, plansError, showSnackbar, t]);

  const statusMap = statusConfig(themeColors, t);

  const renderPlanCard = (plan) => {
    const status = statusMap[plan.status] || statusMap.planned;

    return (
      <Grid item xs={12} key={plan._id}>
        <Card
          sx={{
            borderRadius: 3,
            border: `1px solid ${themeColors.border.primary}`,
            backgroundColor: themeColors.background.secondary,
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: primaryColor,
              boxShadow: `0 8px 16px ${alpha(primaryColor, 0.15)}`,
            },
          }}
        >
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
              <Box flex={1}>
                <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 1 }}>
                  {plan.topic}
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
                  <Chip
                    label={status.label}
                    sx={{
                      backgroundColor: status.background,
                      color: status.color,
                      fontWeight: 600,
                    }}
                  />
                  <Chip
                    icon={<InsightsIcon fontSize="small" />}
                    label={`${plan.progress || 0}%`}
                    sx={{
                      backgroundColor: alpha(primaryColor, 0.15),
                      color: primaryColor,
                      fontWeight: 600,
                    }}
                  />
                </Box>
              </Box>
              <Box textAlign="right" minWidth={200}>
                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                  <CalendarTodayIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                  {plan.startDate ? moment(plan.startDate).format('MMM DD, YYYY') : t('studentLessonPlanSubject.labels.tbd')} -{' '}
                  {plan.endDate ? moment(plan.endDate).format('MMM DD, YYYY') : t('studentLessonPlanSubject.labels.tbd')}
                </Typography>
                <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                  {t('studentLessonPlanSubject.labels.updated', { time: moment(plan.updatedAt || plan.createdAt).fromNow() })}
                </Typography>
              </Box>
            </Box>

            <Box mt={2}>
              <LinearProgress
                variant="determinate"
                value={plan.progress || 0}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: alpha(primaryColor, 0.15),
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: status.color,
                  },
                }}
              />
            </Box>

            <Grid container spacing={2} mt={2}>
              {plan.objectives && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ color: themeColors.text.primary, mb: 1 }}>
                    {t('studentLessonPlanSubject.sections.objectives')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                    {plan.objectives}
                  </Typography>
                </Grid>
              )}
              {plan.activities && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ color: themeColors.text.primary, mb: 1 }}>
                    {t('studentLessonPlanSubject.sections.activities')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                    {plan.activities}
                  </Typography>
                </Grid>
              )}
              {plan.resources && plan.resources.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ color: themeColors.text.primary, mb: 1 }}>
                    {t('studentLessonPlanSubject.sections.resources')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                    {Array.isArray(plan.resources) ? plan.resources.join(', ') : plan.resources}
                  </Typography>
                </Grid>
              )}
              {plan.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ color: themeColors.text.primary, mb: 1 }}>
                    {t('studentLessonPlanSubject.sections.notes')}
                  </Typography>
                  <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                    {plan.notes}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    );
  };

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: 2,
        backgroundColor: themeColors.background.primary,
        minHeight: '100vh',
        color: themeColors.text.primary,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
          color: inverseColor,
          borderRadius: 3,
          p: 3,
          mb: 3,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box display="flex" alignItems="center" gap={2} sx={{ position: 'relative', zIndex: 1 }}>
          <IconButton
            onClick={() => navigate('/students/lesson-plans')}
            sx={{
              backgroundColor: alpha(inverseColor, 0.2),
              color: inverseColor,
              '&:hover': { backgroundColor: alpha(inverseColor, 0.3) },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ color: inverseColor }}>
              {currentSubject?.subjectName || t('studentLessonPlanSubject.fallback.title')}
            </Typography>
            {currentTeacher && (
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                <PersonIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                {currentTeacher.employeeName}
              </Typography>
            )}
          </Box>
        </Box>
        <Box
          sx={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: alpha(inverseColor, 0.1),
          }}
        />
      </Paper>

      {subjectsLoading || plansLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
          <CircularProgress sx={{ color: primaryColor }} />
        </Box>
      ) : subjectPlans && subjectPlans.length > 0 ? (
        <>
          {subjectSummary && (
            <Box mb={3} display="flex" gap={2} flexWrap="wrap">
              <Chip
                label={t('studentLessonPlanSubject.summary.total', { count: subjectSummary.total || 0 })}
                sx={{ backgroundColor: alpha(primaryColor, 0.15), color: primaryColor, fontWeight: 600 }}
              />
              <Chip
                label={t('studentLessonPlanSubject.summary.completed', { count: subjectSummary.completed || 0 })}
                sx={{ backgroundColor: alpha(successColor, 0.15), color: successColor, fontWeight: 600 }}
              />
              <Chip
                label={t('studentLessonPlanSubject.summary.inProgress', { count: subjectSummary.inProgress || 0 })}
                sx={{ backgroundColor: alpha(infoColor, 0.15), color: infoColor, fontWeight: 600 }}
              />
              <Chip
                label={t('studentLessonPlanSubject.summary.planned', { count: subjectSummary.planned || 0 })}
                sx={{ backgroundColor: alpha(warningColor, 0.15), color: warningColor, fontWeight: 600 }}
              />
            </Box>
          )}

          <Grid container spacing={3} mb={6}>
            {subjectPlans.map(renderPlanCard)}
          </Grid>
        </>
      ) : (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          {t('studentLessonPlanSubject.messages.noPlansFound')}
        </Alert>
      )}
    </Container>
  );
};

export default StudentLessonPlanSubject;
