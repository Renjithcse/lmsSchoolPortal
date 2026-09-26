import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { useSnackbar } from '../../hooks/SnackBar';
import { useTranslation } from 'react-i18next';
import SearchIcon from '@mui/icons-material/Search';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import { useNavigate } from 'react-router-dom';
import { useGetStudentLessonPlanSubjectsQuery } from '../../Redux/features/Student/studentLessonPlansApiSlice';

const StudentLessonPlans = () => {
  const { themeColors } = useThemeContext();
  const { t } = useTranslation();
  const primaryColor = themeColors.primary;
  const secondaryColor = themeColors.secondary || themeColors.primary;
  const successColor = themeColors.success || themeColors.primary;
  const warningColor = themeColors.warning || '#f59e0b';
  const infoColor = themeColors.info || '#3b82f6';
  const inverseColor = themeColors.text.inverse;

  const navigate = useNavigate();
  const showSnackbar = useSnackbar();

  const {
    data: subjectsData,
    error: subjectsError,
    isFetching: subjectsLoading,
  } = useGetStudentLessonPlanSubjectsQuery();

  const subjects = subjectsData?.data?.subjects || [];
  const student = subjectsData?.data?.student || null;

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (subjectsError) {
      const message =
        subjectsError?.data?.message ||
        subjectsError?.message ||
        t('studentLessonPlans.messages.defaultError', { defaultValue: 'Unable to load lesson plans' });
      showSnackbar(message, 'error');
    }
  }, [subjectsError, showSnackbar, t]);

  const filteredSubjects = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return subjects;
    return subjects.filter((item) => {
      const subjectName = item.subject?.subjectName?.toLowerCase() || '';
      const teacherName = item.teacher?.employeeName?.toLowerCase() || '';
      return subjectName.includes(normalized) || teacherName.includes(normalized);
    });
  }, [subjects, searchQuery]);

  const overallStats = useMemo(() => {
    const totals = subjects.reduce(
      (acc, subject) => {
        const stats = subject.stats || {};
        acc.total += stats.total || 0;
        acc.completed += stats.completed || 0;
        acc.inProgress += stats.inProgress || 0;
        acc.planned += stats.planned || 0;
        acc.averageProgressAccum += stats.averageProgress || 0;
        acc.count += 1;
        return acc;
      },
      { total: 0, completed: 0, inProgress: 0, planned: 0, averageProgressAccum: 0, count: 0 }
    );

    return {
      total: totals.total,
      completed: totals.completed,
      inProgress: totals.inProgress,
      planned: totals.planned,
      averageProgress: totals.count > 0 ? Math.round(totals.averageProgressAccum / totals.count) : 0,
    };
  }, [subjects]);

  const handleSelectSubject = (subjectId) => {
    if (!subjectId) return;
    navigate(`/students/lesson-plans/${subjectId}`);
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
          mb: 4,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
            {t('studentLessonPlans.title')}
          </Typography>
          {student && (
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              <SchoolIcon fontSize="inherit" sx={{ mr: 0.5 }} />
              {student.name} • {student.grade} - {student.section} • {student.academicYear}
            </Typography>
          )}
          <Grid container spacing={3} mt={2}>
            <Grid item xs={12} sm={3}>
              <Box textAlign="center">
                <Typography variant="h3" fontWeight="bold">
                  {overallStats.total}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  {t('studentLessonPlans.stats.totalPlans')}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box textAlign="center">
                <Typography variant="h3" fontWeight="bold">
                  {overallStats.completed}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  {t('studentLessonPlans.stats.completed')}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box textAlign="center">
                <Typography variant="h3" fontWeight="bold">
                  {overallStats.inProgress}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  {t('studentLessonPlans.stats.inProgress')}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Box textAlign="center">
                <Typography variant="h3" fontWeight="bold">
                  {overallStats.averageProgress}%
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.85 }}>
                  {t('studentLessonPlans.stats.avgProgress')}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
        <Box
          sx={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: alpha(inverseColor, 0.15),
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -50,
            left: -50,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: alpha(inverseColor, 0.1),
          }}
        />
      </Paper>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} gap={2} flexWrap="wrap">
        <Typography variant="h5" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
          {t('studentLessonPlans.sections.subjects')}
        </Typography>
        <TextField
          size="small"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={t('studentLessonPlans.placeholders.search')}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: themeColors.text.secondary }} />
              </InputAdornment>
            ),
          }}
          sx={{
            minWidth: 260,
            backgroundColor: themeColors.background.secondary,
            borderRadius: 2,
          }}
        />
      </Box>

      {subjectsLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
          <CircularProgress sx={{ color: primaryColor }} />
        </Box>
      ) : filteredSubjects.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          {t('studentLessonPlans.messages.noSubjectsFound')}
        </Alert>
      ) : (
        <Grid container spacing={3} mb={6}>
          {filteredSubjects.map((subject) => {
            const stats = subject.stats || {};
            return (
              <Grid item xs={12} sm={6} md={4} key={subject.gradeSubjectId || subject.subject?._id}>
                <Card
                  onClick={() => handleSelectSubject(subject.subject?._id || subject.subjectId)}
                  sx={{
                    borderRadius: 3,
                    height: '100%',
                    cursor: 'pointer',
                    border: `1px solid ${themeColors.border.primary}`,
                    background: `linear-gradient(145deg, ${themeColors.background.primary} 0%, ${themeColors.background.secondary} 100%)`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: primaryColor,
                      boxShadow: `0 12px 24px ${alpha(primaryColor, 0.15)}`,
                      transform: 'translateY(-6px)',
                    },
                  }}
                >
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar
                        sx={{
                          backgroundColor: alpha(primaryColor, 0.15),
                          color: primaryColor,
                          width: 56,
                          height: 56,
                        }}
                      >
                        <MenuBookIcon />
                      </Avatar>
                      <Box flex={1}>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                          {subject.subject?.subjectName}
                        </Typography>
                        {subject.teacher && (
                          <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                            <PersonIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                            {subject.teacher.employeeName}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Box display="flex" gap={2} flexWrap="wrap">
                      <Chip
                        icon={<AssignmentTurnedInIcon fontSize="small" />}
                        label={t('studentLessonPlans.labels.plans', { count: stats.total || 0 })}
                        sx={{
                          backgroundColor: alpha(primaryColor, 0.15),
                          color: primaryColor,
                          fontWeight: 600,
                        }}
                      />
                      <Chip
                        icon={<CheckCircleIcon fontSize="small" />}
                        label={t('studentLessonPlans.labels.completed', { count: stats.completed || 0 })}
                        sx={{
                          backgroundColor: alpha(successColor, 0.15),
                          color: successColor,
                          fontWeight: 600,
                        }}
                      />
                      <Chip
                        icon={<HourglassBottomIcon fontSize="small" />}
                        label={t('studentLessonPlans.labels.inProgress', { count: stats.inProgress || 0 })}
                        sx={{
                          backgroundColor: alpha(infoColor, 0.15),
                          color: infoColor,
                          fontWeight: 600,
                        }}
                      />
                      <Chip
                        icon={<PendingActionsIcon fontSize="small" />}
                        label={t('studentLessonPlans.labels.planned', { count: stats.planned || 0 })}
                        sx={{
                          backgroundColor: alpha(warningColor, 0.15),
                          color: warningColor,
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                    <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                      {t('studentLessonPlans.labels.viewDescription')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};

export default StudentLessonPlans;

