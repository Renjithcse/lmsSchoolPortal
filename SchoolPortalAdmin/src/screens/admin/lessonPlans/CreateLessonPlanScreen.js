import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Alert,
  Chip,
  CircularProgress,
  Divider,
  Breadcrumbs,
  Link
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useForm } from 'react-hook-form';
import dayjs from 'dayjs';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import CustomSelect from '../../../components/Common/CustomSelect';
import CustomInput from '../../../components/Common/CustomInput';
import CustomTextArea from '../../../components/Common/CustomTextArea';
import { ICONS } from '../../../assets/icons';
import { useSnackbar } from '../../../hooks/SnackBar';
import { skipToken } from '@reduxjs/toolkit/query/react';
import {
  useCreateLessonPlanMutation,
  useGetChapterQuery,
  useLazyGetLessonPlanAvailableSubjectsQuery,
} from '../../../Redux/features/Admin/lessonPlansApiSlice';
import {
  useLazyGetMyGradePermissionsQuery,
  useLazyGetMyGenderPermissionsQuery,
  useLazyGetMySectionPermissionsQuery,
} from '../../../Redux/features/Admin/TeachersSlice';
import { useGetAcademicYearQuery } from '../../../Redux/features/commonSlice';
import { useAbility } from '../../../AbilityContext';
import CustomDatePicker from '../../../components/Common/CustomDatefilter';
import { useTranslation } from 'react-i18next';

const defaultPlanState = {
  topic: '',
  subTopics: '',
  objectives: '',
  activities: '',
  resources: '',
  assessment: '',
  notes: '',
  status: 'planned',
  startDate: '',
  endDate: '',
  tags: '',
  subject: '',
};

const CreateLessonPlanScreen = () => {
  const { themeColors } = useThemeContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { chapterId } = useParams();
  const showSnackbar = useSnackbar();
  const ability = useAbility();
  const { t } = useTranslation();

  const { data: academicYears, isLoading: academicLoading } = useGetAcademicYearQuery();

  const [getGradePermissions, { data: gradesResponse }] = useLazyGetMyGradePermissionsQuery();
  const [getGenderPermissions, { data: gendersResponse }] = useLazyGetMyGenderPermissionsQuery();
  const [getSectionPermissions, { data: sectionsResponse }] = useLazyGetMySectionPermissionsQuery();

  const chapterQuery = useGetChapterQuery(chapterId ?? skipToken);
  const chapter = chapterQuery?.data?.data;
  const chapterError = chapterQuery?.error;

  const [loadAvailableSubjects, { data: availableSubjectsResponse }] = useLazyGetLessonPlanAvailableSubjectsQuery();
  const availableSubjects = availableSubjectsResponse?.data || [];

  const [createLessonPlan, { isLoading: creating, isSuccess, isError, error: createError }] =
    useCreateLessonPlanMutation();
  const displayError = chapterError || createError;

  const [classInfoLocked, setClassInfoLocked] = useState(false);
  const [classInfo, setClassInfo] = useState({
    academicYear: '',
    grade: '',
    gender: '',
    section: '',
  });

  const [plan, setPlan] = useState(defaultPlanState);
  const prefillAppliedRef = useRef(false);
  const incomingFilters = location.state?.filters;

  const {
    control,
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      academicYear: '',
      grade: '',
      gender: '',
      section: '',
      subject: '',
      status: 'planned',
      startDate: null,
      endDate: null,
      topic: '',
      subTopics: '',
      objectives: '',
      activities: '',
      resources: '',
      assessment: '',
      notes: '',
      progress: 0,
      tags: '',
    },
  });
  const startDateControlValue = watch('startDate');

  useEffect(() => {
    if (!chapterId) {
      getGradePermissions();
      getGenderPermissions();
      getSectionPermissions();
    }
  }, [chapterId, getGradePermissions, getGenderPermissions, getSectionPermissions]);

  useEffect(() => {
    if (displayError) {
      const message = displayError?.data?.message || displayError?.message || t('lessonPlans.messages.createError');
      showSnackbar(message, 'error');
    }
  }, [displayError, showSnackbar, t]);

  useEffect(() => {
    if (isSuccess) {
      showSnackbar(t('lessonPlans.messages.createSuccess'), 'success');
      if (chapterId) {
        navigate(`/lesson-plans/chapter/${chapterId}/lesson-plans`);
      } else {
        navigate('/lesson-plans', { state: { filters: incomingFilters } });
      }
    }
  }, [isSuccess, navigate, showSnackbar, incomingFilters, chapterId, t]);

  const gradeOptions = useMemo(() => gradesResponse?.data || [], [gradesResponse]);
  const genderOptions = useMemo(() => gendersResponse?.data || [], [gendersResponse]);
  const sectionOptions = useMemo(() => sectionsResponse?.data || [], [sectionsResponse]);

  const handleClassInfoChange = (field, value) => {
    setClassInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
    setValue(field, value);
  };

  const lockClassInfo = () => {
    if (!classInfo.academicYear || !classInfo.grade || !classInfo.gender || !classInfo.section) {
      showSnackbar(t('lessonPlans.form.fillAllFields'), 'error');
      return;
    }
    loadAvailableSubjects({
      academicYear: classInfo.academicYear,
      grade: classInfo.grade,
      gender: classInfo.gender,
      section: classInfo.section,
    });
    setClassInfoLocked(true);
  };

  const unlockClassInfo = () => {
    setClassInfoLocked(false);
    setPlan(defaultPlanState);
    setValue('topic', '');
    setValue('subTopics', '');
    setValue('objectives', '');
    setValue('activities', '');
    setValue('resources', '');
    setValue('assessment', '');
    setValue('notes', '');
    setValue('status', 'planned');
    setValue('tags', '');
    setValue('subject', '');
    setValue('startDate', null);
    setValue('endDate', null);
  };

  const handlePlanChange = (field, value, options = {}) => {
    let processedValue = value;

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
    if (!chapterId && !plan.subject) {
      showSnackbar(t('lessonPlans.form.provideSubject'), 'error');
      return false;
    }
    if (plan.startDate && plan.endDate && dayjs(plan.startDate).isAfter(dayjs(plan.endDate))) {
      showSnackbar(t('lessonPlans.form.endDateBeforeStart'), 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    // If creating under a chapter, no need to lock class info
    if (!chapterId && !classInfoLocked) {
      showSnackbar(t('lessonPlans.form.lockClassInfoFirst'), 'error');
      return;
    }
    if (!validatePlan()) return;

    let payload = {
      topic: plan.topic,
      objectives: plan.objectives,
      activities: plan.activities,
      assessment: plan.assessment,
      notes: plan.notes,
      status: plan.status,
      startDate: plan.startDate || null,
      endDate: plan.endDate || null,
      tags: plan.tags ? (typeof plan.tags === 'string' ? plan.tags.split(',').map(t => t.trim()).filter(t => t) : plan.tags) : [],
    };

    // Order is not included - backend will auto-increment it

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

    // If creating under a chapter, use chapter reference
    if (chapterId) {
      payload.chapter = chapterId;
    } else {
      // Legacy support: include class fields if no chapter
      payload = {
        ...payload,
        ...classInfo,
        subject: plan.subject,
      };
    }

    createLessonPlan(payload);
  };

  const renderClassInfoSummary = () => {
    if (!classInfoLocked) return null;
    const gradeName = gradeOptions.find((item) => item._id === classInfo.grade)?.gradeName;
    const sectionName = sectionOptions.find((item) => item._id === classInfo.section)?.sectionName;
    const academicYearName = academicYears?.find((item) => item._id === classInfo.academicYear)?.academicYear;
    return (
      <Box
        mt={2}
        p={2}
        sx={{
          backgroundColor: themeColors.background.primary,
          borderRadius: 1,
          border: `1px solid ${themeColors.border.primary}`,
        }}
      >
        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
          <strong style={{ color: themeColors.text.primary }}>{t('lessonPlans.form.selectedClass')}:</strong>{' '}
          <span style={{ color: themeColors.text.primary }}>
            {gradeName} - {sectionName} ({classInfo.gender}) | {academicYearName}
          </span>
        </Typography>
      </Box>
    );
  };

  const renderAvailableSubjects = () => {
    if (!classInfoLocked) return null;
    if (!availableSubjects || availableSubjects.length === 0) {
      return (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {t('lessonPlans.form.noSubjectsFound')}
        </Alert>
      );
    }
    return (
      <Box display="flex" gap={1} flexWrap="wrap" sx={{ mt: 2 }}>
        {availableSubjects.map((subject) => (
          <Chip
            key={subject.subjectId}
            label={subject.subjectName}
            color={plan.subject === subject.subjectId ? 'primary' : 'default'}
            onClick={() => handlePlanChange('subject', subject.subjectId)}
            sx={{
              borderColor: themeColors.border.primary,
              color: themeColors.text.primary,
              backgroundColor:
                plan.subject === subject.subjectId
                  ? themeColors.primary
                  : themeColors.background.primary,
              '&:hover': {
                backgroundColor:
                  plan.subject === subject.subjectId
                    ? themeColors.primary
                    : themeColors.background.tertiary,
              },
            }}
            variant={plan.subject === subject.subjectId ? 'filled' : 'outlined'}
          />
        ))}
      </Box>
    );
  };

  useEffect(() => {
    if (
      !prefillAppliedRef.current &&
      incomingFilters &&
      incomingFilters.grade &&
      incomingFilters.gender &&
      incomingFilters.section &&
      academicYears &&
      academicYears.length > 0
    ) {
      prefillAppliedRef.current = true;
      const currentAcademic = academicYears.find((year) => year.isCurrent) || academicYears[0];
      const updatedClassInfo = {
        academicYear: currentAcademic?._id || '',
        grade: incomingFilters.grade,
        gender: incomingFilters.gender,
        section: incomingFilters.section,
      };
      setClassInfo(updatedClassInfo);
      setValue('academicYear', updatedClassInfo.academicYear);
      setValue('grade', updatedClassInfo.grade);
      setValue('gender', updatedClassInfo.gender);
      setValue('section', updatedClassInfo.section);

      if (incomingFilters.subject) {
        handlePlanChange('subject', incomingFilters.subject);
      }

      if (updatedClassInfo.academicYear && updatedClassInfo.grade && updatedClassInfo.gender && updatedClassInfo.section) {
    loadAvailableSubjects({
      academicYear: updatedClassInfo.academicYear,
      grade: updatedClassInfo.grade,
      gender: updatedClassInfo.gender,
      section: updatedClassInfo.section,
    });
        setClassInfoLocked(true);
      }
    }
  }, [incomingFilters, academicYears, setValue]);

  useEffect(() => {
    setValue('topic', plan.topic);
    setValue('subTopics', plan.subTopics);
    setValue('objectives', plan.objectives);
    setValue('activities', plan.activities);
    setValue('resources', plan.resources);
    setValue('assessment', plan.assessment);
    setValue('notes', plan.notes);
    setValue('status', plan.status);
    setValue('tags', plan.tags);
    setValue('startDate', plan.startDate ? dayjs(plan.startDate) : null);
    setValue('endDate', plan.endDate ? dayjs(plan.endDate) : null);
  }, [plan, setValue]);

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
        {chapterId && chapter && (
          <Link
            underline="hover"
            sx={{ color: themeColors.text.secondary, cursor: 'pointer' }}
            onClick={() => navigate(`/lesson-plans/chapter/${chapterId}/lesson-plans`)}
          >
            {chapter.chapterName}
          </Link>
        )}
        <Typography sx={{ color: themeColors.text.primary }}>
          {chapterId ? t('lessonPlans.form.createLessonPlanForChapter') : t('lessonPlans.form.createTitle')}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={3}>
        {ability.can('Create', 'LessonPlans') && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={creating || (!chapterId && !classInfoLocked)}
            startIcon={creating ? <CircularProgress size={20} /> : <ICONS.Save.component />}
            sx={{
              backgroundColor: themeColors.primary,
              color: themeColors.text.inverse,
              '&:hover': {
                backgroundColor: themeColors.primary,
                opacity: 0.9,
              },
            }}
          >
            {creating ? t('lessonPlans.form.creating') : t('lessonPlans.form.saveLessonPlan')}
          </Button>
        )}
      </Box>

      {displayError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {displayError?.data?.message || displayError?.message || t('lessonPlans.messages.errorOccurred')}
        </Alert>
      )}

      {/* Chapter Information (when creating under a chapter) */}
      {chapterId && chapter && (
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
                  {chapter.chapterName}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                  {t('lessonPlans.form.grade')}
                </Typography>
                <Typography variant="body1" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
                  {chapter.grade?.gradeName || t('lessonPlans.notAvailable')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                  {t('lessonPlans.form.subject')}
                </Typography>
                <Typography variant="body1" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
                  {chapter.subject?.subjectName || t('lessonPlans.notAvailable')}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Class Information (only show if not creating under a chapter) */}
      {!chapterId && (
        <Card
          sx={{
            mb: 3,
            border: `1px solid ${themeColors.border.primary}`,
            backgroundColor: themeColors.background.secondary,
          }}
        >
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
                {t('lessonPlans.form.classInformation')}
              </Typography>
            {!classInfoLocked ? (
              <Button
                variant="contained"
                size="small"
                onClick={lockClassInfo}
                startIcon={<ICONS.Save.component />}
                sx={{
                  backgroundColor: themeColors.primary,
                  color: themeColors.text.inverse,
                  '&:hover': {
                    backgroundColor: themeColors.primary,
                    opacity: 0.9,
                  },
                }}
              >
                {t('lessonPlans.form.lockContinue')}
              </Button>
            ) : (
              <Button
                variant="outlined"
                size="small"
                onClick={unlockClassInfo}
                startIcon={<ICONS.Edit.component />}
                sx={{
                  borderColor: themeColors.border.primary,
                  color: themeColors.text.primary,
                  backgroundColor: themeColors.background.primary,
                  '&:hover': {
                    backgroundColor: themeColors.background.tertiary,
                    borderColor: themeColors.primary,
                  },
                }}
              >
                {t('lessonPlans.form.editClassInfo')}
              </Button>
            )}
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <CustomSelect
                fieldName="academicYear"
                control={control}
                fieldLabel={t('lessonPlans.form.academicYear')}
                onChangeValue={(value) => handleClassInfoChange('academicYear', value)}
                disabled={classInfoLocked}
              >
                {academicLoading ? (
                  <MenuItem disabled>{t('lessonPlans.form.loading')}</MenuItem>
                ) : (
                  academicYears?.map((year) => (
                    <MenuItem key={year._id} value={year._id}>
                      {year.academicYear}
                    </MenuItem>
                  ))
                )}
              </CustomSelect>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <CustomSelect
                fieldName="grade"
                control={control}
                fieldLabel={t('lessonPlans.form.grade')}
                onChangeValue={(value) => handleClassInfoChange('grade', value)}
                disabled={classInfoLocked}
              >
                {gradeOptions.map((grade) => (
                  <MenuItem key={grade._id} value={grade._id}>
                    {grade.gradeName}
                  </MenuItem>
                ))}
              </CustomSelect>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <CustomSelect
                fieldName="gender"
                control={control}
                fieldLabel={t('lessonPlans.form.gender')}
                onChangeValue={(value) => handleClassInfoChange('gender', value)}
                disabled={classInfoLocked}
              >
                {genderOptions.map((gender) => (
                  <MenuItem key={gender} value={gender}>
                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  </MenuItem>
                ))}
              </CustomSelect>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <CustomSelect
                fieldName="section"
                control={control}
                fieldLabel={t('lessonPlans.form.section')}
                onChangeValue={(value) => handleClassInfoChange('section', value)}
                disabled={classInfoLocked}
              >
                {sectionOptions.map((section) => (
                  <MenuItem key={section._id} value={section._id}>
                    {section.sectionName}
                  </MenuItem>
                ))}
              </CustomSelect>
            </Grid>
          </Grid>

          {renderClassInfoSummary()}
        </CardContent>
      </Card>
      )}

      {/* Lesson Plan Form (show if chapterId is present OR classInfoLocked) */}
      {(chapterId || classInfoLocked) ? (
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
              {/* Only show subject selection if not creating under a chapter */}
              {!chapterId && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ color: themeColors.text.secondary, mb: 1 }}>
                    {t('lessonPlans.form.selectSubject')}
                  </Typography>
                  {renderAvailableSubjects()}
                </Grid>
              )}

              <Grid item xs={12} md={6}>
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
                    handlePlanChange('startDate', formatted);
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
                    handlePlanChange('endDate', formatted);
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
                  onChangeValue={(value) => handlePlanChange('status', value)}
                  defaultValue="planned"
                >
                  <MenuItem value="planned">{t('lessonPlans.form.statusPlanned')}</MenuItem>
                  <MenuItem value="in-progress">{t('lessonPlans.form.statusInProgress')}</MenuItem>
                  <MenuItem value="completed">{t('lessonPlans.form.statusCompleted')}</MenuItem>
                </CustomSelect>
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
                onClick={() => navigate('/lesson-plans', { state: { filters: incomingFilters } })}
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
            {ability.can('Create', 'LessonPlans') && (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={creating}
                startIcon={creating ? <CircularProgress size={20} /> : <ICONS.Save.component />}
                sx={{
                  backgroundColor: themeColors.primary,
                  color: themeColors.text.inverse,
                  '&:hover': {
                    backgroundColor: themeColors.primary,
                    opacity: 0.9,
                  },
                }}
              >
                {creating ? t('lessonPlans.form.saving') : t('lessonPlans.form.createLessonPlan')}
              </Button>
            )}
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card
          sx={{
            border: `1px solid ${themeColors.border.primary}`,
            backgroundColor: themeColors.background.secondary,
          }}
        >
          <CardContent>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
              {t('lessonPlans.form.instructions')}
            </Typography>
            <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 1 }}>
              {t('lessonPlans.form.instruction1')}
            </Typography>
            <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 1 }}>
              {t('lessonPlans.form.instruction2')}
            </Typography>
            <Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 1 }}>
              {t('lessonPlans.form.instruction3')}
            </Typography>
            <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
              {t('lessonPlans.form.instruction4')}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default CreateLessonPlanScreen;

