import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Breadcrumbs,
  Link
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import dayjs from 'dayjs';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import CustomSelect from '../../../components/Common/CustomSelect';
import CustomInput from '../../../components/Common/CustomInput';
import CustomTextArea from '../../../components/Common/CustomTextArea';
import CustomDatePicker from '../../../components/Common/CustomDatefilter';
import { ICONS } from '../../../assets/icons';
import { useSnackbar } from '../../../hooks/SnackBar';
import { useAbility } from '../../../AbilityContext';
import { useTranslation } from 'react-i18next';
import { skipToken } from '@reduxjs/toolkit/query/react';
import {
  useGetLessonPlanQuery,
  useUpdateLessonPlanMutation,
} from '../../../Redux/features/Admin/lessonPlansApiSlice';

const EditLessonPlanScreen = () => {
  const { id, chapterId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const showSnackbar = useSnackbar();
  const ability = useAbility();
  const { themeColors } = useThemeContext();
  const { t } = useTranslation();

  const lessonPlanQuery = useGetLessonPlanQuery(id ?? skipToken);
  const lessonPlan = lessonPlanQuery?.data?.data;
  const lessonPlanLoading = lessonPlanQuery?.isFetching;
  const lessonPlanError = lessonPlanQuery?.error;
  const [updateLessonPlan, { isLoading: updating, isSuccess, isError, error: updateError }] =
    useUpdateLessonPlanMutation();
  const displayError = lessonPlanError || updateError;
  const incomingFilters = location.state?.filters;

  const [plan, setPlan] = useState({
    topic: '',
    subTopics: '',
    objectives: '',
    activities: '',
    resources: '',
    assessment: '',
    notes: '',
    status: 'planned',
    progress: 0,
    startDate: '',
    endDate: '',
    tags: '',
  });

  const {
    control,
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      status: 'planned',
      topic: '',
      subTopics: '',
      objectives: '',
      activities: '',
      resources: '',
      assessment: '',
      notes: '',
      startDate: null,
      endDate: null,
      progress: 0,
      tags: '',
    },
  });
  const startDateControlValue = watch('startDate');

  useEffect(() => {
    if (lessonPlan) {
      const formattedPlan = {
        topic: lessonPlan.topic || '',
        subTopics:
          Array.isArray(lessonPlan.subTopics) && lessonPlan.subTopics.length > 0
            ? lessonPlan.subTopics.join(', ')
            : lessonPlan.subTopics || '',
        objectives: lessonPlan.objectives || '',
        activities: lessonPlan.activities || '',
        resources:
          Array.isArray(lessonPlan.resources) && lessonPlan.resources.length > 0
            ? lessonPlan.resources.join(', ')
            : lessonPlan.resources || '',
        assessment: lessonPlan.assessment || '',
        notes: lessonPlan.notes || '',
        status: lessonPlan.status || 'planned',
        progress: lessonPlan.progress ?? 0,
        startDate: lessonPlan.startDate ? dayjs(lessonPlan.startDate).format('YYYY-MM-DD') : '',
        endDate: lessonPlan.endDate ? dayjs(lessonPlan.endDate).format('YYYY-MM-DD') : '',
        tags:
          Array.isArray(lessonPlan.tags) && lessonPlan.tags.length > 0
            ? lessonPlan.tags.join(', ')
            : lessonPlan.tags || '',
      };

      setPlan(formattedPlan);
      setValue('status', formattedPlan.status);
      setValue('topic', formattedPlan.topic);
      setValue('subTopics', formattedPlan.subTopics);
      setValue('objectives', formattedPlan.objectives);
      setValue('activities', formattedPlan.activities);
      setValue('resources', formattedPlan.resources);
      setValue('assessment', formattedPlan.assessment);
      setValue('notes', formattedPlan.notes);
      setValue('progress', formattedPlan.progress);
      setValue('tags', formattedPlan.tags);
      setValue('startDate', formattedPlan.startDate ? dayjs(formattedPlan.startDate) : null);
      setValue('endDate', formattedPlan.endDate ? dayjs(formattedPlan.endDate) : null);
    }
  }, [lessonPlan, setValue]);

  useEffect(() => {
    if (lessonPlanError) {
      const message = lessonPlanError?.data?.message || lessonPlanError?.message || t('lessonPlans.messages.error');
      showSnackbar(message, 'error');
    }
  }, [lessonPlanError, showSnackbar, t]);

  useEffect(() => {
    if (isError) {
      const message = updateError?.data?.message || updateError?.message || t('lessonPlans.messages.updateError');
      showSnackbar(message, 'error');
    }
  }, [isError, updateError, showSnackbar, t]);

  useEffect(() => {
    if (isSuccess) {
      showSnackbar(t('lessonPlans.messages.updateSuccess'), 'success');
      const chapterIdToUse = chapterId || lessonPlan?.chapter?._id;
      if (chapterIdToUse) {
        navigate(`/lesson-plans/chapter/${chapterIdToUse}/lesson-plans`);
      } else {
        navigate('/lesson-plans', { state: { filters: incomingFilters } });
      }
    }
  }, [isSuccess, navigate, showSnackbar, incomingFilters, chapterId, lessonPlan, t]);

  const handlePlanChange = (field, value, options = {}) => {
    let processedValue = value;

    if (field === 'progress') {
      processedValue = value === '' ? '' : Number(value);
    }

    setPlan((prev) => ({
      ...prev,
      [field]: processedValue,
    }));

    if (!options.skipSetValue) {
      setValue(field, processedValue, { shouldDirty: true });
    }
  };

  const validatePlan = () => {
    if (!plan.topic) {
      showSnackbar(t('lessonPlans.form.provideTopic'), 'error');
      return false;
    }
    const numericProgress = Number(plan.progress);
    if (numericProgress < 0 || numericProgress > 100) {
      showSnackbar(t('lessonPlans.form.progressRange'), 'error');
      return false;
    }
    if (plan.startDate && plan.endDate && dayjs(plan.startDate).isAfter(dayjs(plan.endDate))) {
      showSnackbar(t('lessonPlans.form.endDateBeforeStart'), 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validatePlan()) return;

    const payload = {
      topic: plan.topic,
      objectives: plan.objectives,
      activities: plan.activities,
      assessment: plan.assessment,
      notes: plan.notes,
      status: plan.status,
      progress: Number(plan.progress) || 0,
      startDate: plan.startDate || null,
      endDate: plan.endDate || null,
      tags: plan.tags ? (typeof plan.tags === 'string' ? plan.tags.split(',').map(t => t.trim()).filter(t => t) : plan.tags) : [],
    };

    // Add subTopics
    if (plan.subTopics) {
      if (typeof plan.subTopics === 'string') {
        payload.subTopics = plan.subTopics.split(',').map(t => t.trim()).filter(t => t);
      } else if (Array.isArray(plan.subTopics)) {
        payload.subTopics = plan.subTopics;
      }
    }

    // Add resources
    if (plan.resources) {
      if (typeof plan.resources === 'string') {
        payload.resources = plan.resources.split(',').map(t => t.trim()).filter(t => t);
      } else if (Array.isArray(plan.resources)) {
        payload.resources = plan.resources;
      }
    }

    updateLessonPlan({ id, data: payload });
  };

  if (lessonPlanLoading && !lessonPlan) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 3,
        backgroundColor: themeColors.background.primary,
        minHeight: '100vh',
      }}
    >
      {/* Breadcrumbs */}
      <Breadcrumbs separator="›" sx={{ mb: 2, '& .MuiBreadcrumbs-separator': { color: themeColors.text.secondary } }}>
        <Link
          underline="hover"
          sx={{ color: themeColors.text.secondary, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          {t('timetable.breadcrumbs.admin')}
        </Link>
        <Link
          underline="hover"
          sx={{ color: themeColors.text.secondary, cursor: 'pointer' }}
          onClick={() => navigate('/lesson-plans')}
        >
          {t('lessonPlans.title')}
        </Link>
        {(chapterId || lessonPlan?.chapter?._id) && lessonPlan?.chapter && (
          <Link
            underline="hover"
            sx={{ color: themeColors.text.secondary, cursor: 'pointer' }}
            onClick={() => {
              const chapterIdToUse = chapterId || lessonPlan?.chapter?._id;
              navigate(`/lesson-plans/chapter/${chapterIdToUse}/lesson-plans`);
            }}
          >
            {lessonPlan.chapter.chapterName || lessonPlan.chapter}
          </Link>
        )}
        <Typography sx={{ color: themeColors.text.primary }}>
          {t('lessonPlans.form.editTitle')}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={3}>
        {ability.can('Edit', 'LessonPlans') && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={updating}
            startIcon={updating ? <CircularProgress size={20} /> : <ICONS.Save.component />}
            sx={{
              backgroundColor: themeColors.primary,
              color: themeColors.text.inverse,
              '&:hover': {
                backgroundColor: themeColors.primary,
                opacity: 0.9,
              },
            }}
          >
            {updating ? t('lessonPlans.form.saving') : t('lessonPlans.form.updateLessonPlan')}
          </Button>
        )}
      </Box>

      {displayError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {displayError?.data?.message || displayError?.message || t('lessonPlans.messages.errorOccurred')}
        </Alert>
      )}

      {/* Chapter Information (read-only) */}
      {lessonPlan?.chapter && (
      <Card
        sx={{
          mb: 3,
          border: `1px solid ${themeColors.border.primary}`,
          backgroundColor: themeColors.background.secondary,
        }}
      >
        <CardContent>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
              {t('lessonPlans.form.chapterInformation')}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                  {t('lessonPlans.form.chapterName')}
                </Typography>
                <Typography variant="body1" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
                  {lessonPlan.chapter.chapterName || t('lessonPlans.notAvailable')}
                </Typography>
            </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                  {t('lessonPlans.form.grade')}
                </Typography>
                <Typography variant="body1" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
                  {lessonPlan.chapter.grade?.gradeName || t('lessonPlans.notAvailable')}
                </Typography>
            </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                  {t('lessonPlans.form.subject')}
                </Typography>
                <Typography variant="body1" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
                  {lessonPlan.chapter.subject?.subjectName || t('lessonPlans.notAvailable')}
                </Typography>
            </Grid>
            </Grid>
        </CardContent>
      </Card>
      )}

      <Card
        sx={{
          border: `1px solid ${themeColors.border.primary}`,
          backgroundColor: themeColors.background.secondary,
        }}
      >
        <CardContent>
          <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
            {t('lessonPlans.form.lessonPlanDetails')}
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <CustomInput
                fieldName="topic"
                control={control}
                fieldLabel={t('lessonPlans.form.lessonTopic')}
                placeholder={t('lessonPlans.form.lessonTopicPlaceholder')}
                changeValue={(value) => handlePlanChange('topic', value)}
                cust_value={plan.topic}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <CustomInput
                fieldName="subTopics"
                control={control}
                fieldLabel={t('lessonPlans.form.subTopics')}
                placeholder={t('lessonPlans.form.subTopicsPlaceholder')}
                changeValue={(value) => handlePlanChange('subTopics', value)}
                cust_value={plan.subTopics}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <CustomTextArea
                fieldName="objectives"
                control={control}
                fieldLabel={t('lessonPlans.form.learningObjectives')}
                placeholder={t('lessonPlans.form.learningObjectivesPlaceholder')}
                rows={4}
                changeValue={(value) => handlePlanChange('objectives', value)}
                defaultValue={plan.objectives}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <CustomTextArea
                fieldName="activities"
                control={control}
                fieldLabel={t('lessonPlans.form.activities')}
                placeholder={t('lessonPlans.form.activitiesPlaceholder')}
                rows={4}
                changeValue={(value) => handlePlanChange('activities', value)}
                defaultValue={plan.activities}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <CustomInput
                fieldName="resources"
                control={control}
                fieldLabel={t('lessonPlans.form.resources')}
                placeholder={t('lessonPlans.form.resourcesPlaceholder')}
                changeValue={(value) => handlePlanChange('resources', value)}
                cust_value={plan.resources}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <CustomTextArea
                fieldName="assessment"
                control={control}
                fieldLabel={t('lessonPlans.form.assessment')}
                placeholder={t('lessonPlans.form.assessmentPlaceholder')}
                rows={4}
                changeValue={(value) => handlePlanChange('assessment', value)}
                defaultValue={plan.assessment}
              />
            </Grid>

            <Grid item xs={12}>
              <CustomTextArea
                fieldName="notes"
                control={control}
                fieldLabel={t('lessonPlans.form.teacherNotes')}
                placeholder={t('lessonPlans.form.teacherNotesPlaceholder')}
                rows={3}
                changeValue={(value) => handlePlanChange('notes', value)}
                defaultValue={plan.notes}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <CustomDatePicker
                fieldName="startDate"
                control={control}
                fieldLabel={t('lessonPlans.form.startDate')}
                changeValue={(newValue) => {
                  const formatted = newValue ? dayjs(newValue).format('YYYY-MM-DD') : '';
                  handlePlanChange('startDate', formatted, { skipSetValue: true });
                  setValue('startDate', newValue);
                }}
                disabled={false}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <CustomDatePicker
                fieldName="endDate"
                control={control}
                fieldLabel={t('lessonPlans.form.endDate')}
                changeValue={(newValue) => {
                  const formatted = newValue ? dayjs(newValue).format('YYYY-MM-DD') : '';
                  handlePlanChange('endDate', formatted, { skipSetValue: true });
                  setValue('endDate', newValue);
                }}
                disabled={false}
                minDate={startDateControlValue || null}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <CustomSelect
                fieldName="status"
                control={control}
                fieldLabel={t('lessonPlans.form.status')}
                value={plan.status}
                onChangeValue={(value) => handlePlanChange('status', value)}
              >
                <MenuItem value="planned">{t('lessonPlans.form.statusPlanned')}</MenuItem>
                <MenuItem value="in-progress">{t('lessonPlans.form.statusInProgress')}</MenuItem>
                <MenuItem value="completed">{t('lessonPlans.form.statusCompleted')}</MenuItem>
              </CustomSelect>
            </Grid>

            <Grid item xs={12} md={6}>
              <CustomInput
                fieldName="progress"
                control={control}
                fieldLabel={t('lessonPlans.form.progress')}
                type="number"
                placeholder="0"
                inputProps={{ min: 0, max: 100 }}
                changeValue={(value) => handlePlanChange('progress', value)}
                cust_value={plan.progress}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <CustomInput
                fieldName="tags"
                control={control}
                fieldLabel={t('lessonPlans.form.tags')}
                placeholder={t('lessonPlans.form.tagsPlaceholder')}
                changeValue={(value) => handlePlanChange('tags', value)}
                cust_value={plan.tags}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button
              variant="outlined"
              onClick={() => {
                if (chapterId || lessonPlan?.chapter?._id) {
                  const chapterIdToUse = chapterId || lessonPlan?.chapter?._id;
                  navigate(`/lesson-plans/chapter/${chapterIdToUse}/lesson-plans`);
                } else {
                  navigate('/lesson-plans', { state: { filters: incomingFilters } });
                }
              }}
              startIcon={<CloseIcon />}
              sx={{
                borderColor: themeColors.border.primary,
                color: themeColors.text.primary,
                '&:hover': {
                  backgroundColor: themeColors.background.tertiary,
                  borderColor: themeColors.primary,
                },
              }}
            >
              {t('lessonPlans.form.cancel')}
            </Button>
            {ability.can('Edit', 'LessonPlans') && (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={updating}
                startIcon={updating ? <CircularProgress size={20} /> : <ICONS.Save.component />}
                sx={{
                  backgroundColor: themeColors.primary,
                  color: themeColors.text.inverse,
                  '&:hover': {
                    backgroundColor: themeColors.primary,
                    opacity: 0.9,
                  },
                }}
              >
                {updating ? t('lessonPlans.form.saving') : t('lessonPlans.form.updateLessonPlan')}
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EditLessonPlanScreen;

