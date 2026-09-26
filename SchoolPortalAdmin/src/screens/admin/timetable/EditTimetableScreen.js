import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Breadcrumbs,
  Link
} from '@mui/material';
import { useForm } from 'react-hook-form';
import CustomInput from '../../../components/Common/CustomInput';
import CustomSelect from '../../../components/Common/CustomSelect';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from '../../../hooks/SnackBar';
import { ICONS } from '../../../assets/icons';
import {
  useUpdateTimetableMutation,
  useGetTimetableQuery,
  useLazyGetAvailableSubjectsAndTeachersQuery,
  useLazyGetSchoolTimingsForTimetableQuery
} from '../../../Redux/features/Admin/timetableApiSlice';
import CustomOutletBox from '../../../components/Common/CustomOutletBox';
import CustomBackDrop from '../../../components/Common/CustomBackDrop';
import { useTranslation } from 'react-i18next';
import { skipToken } from '@reduxjs/toolkit/query/react';

const EditTimetableScreen = () => {
  const { themeColors } = useThemeContext();
  const showSnackbar = useSnackbar();
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useTranslation();

  const [updateTimetable, { isLoading: isUpdating, isSuccess: updateSuccess, error: updateError }] =
    useUpdateTimetableMutation();
  const { data: timetableResponse, isFetching: timetableLoading, error: timetableFetchError } =
    useGetTimetableQuery(id ?? skipToken);
  const currentTimetable = timetableResponse?.data?.data || timetableResponse?.data;

  const [loadAvailableSubjects, { data: availableSubjectsResponse }] =
    useLazyGetAvailableSubjectsAndTeachersQuery();
  const [loadSchoolTimings, { data: schoolTimingsResponse }] =
    useLazyGetSchoolTimingsForTimetableQuery();

  const availableSubjects = availableSubjectsResponse?.data?.subjects || [];
  const schoolTimings = schoolTimingsResponse?.data;


  // React Hook Form
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: {
            name: '',
            status: 'draft'
        }
    });

  // Additional state for timetable data
  const [weeklyTimetable, setWeeklyTimetable] = useState({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: []
  });

  const [isAutoGenerating, setIsAutoGenerating] = useState(false);

  // Load timetable data when component mounts
  useEffect(() => {
    if (currentTimetable) {
      reset({
        name: currentTimetable.name || '',
        status: currentTimetable.status || 'draft'
      });

      if (currentTimetable.weeklyTimetable) {
        const transformedTimetable = {};
        Object.keys(currentTimetable.weeklyTimetable).forEach(day => {
          transformedTimetable[day] = currentTimetable.weeklyTimetable[day].map(period => ({
            ...period,
            subject: typeof period.subject === 'object' ? period.subject?._id : period.subject,
            teacher: typeof period.teacher === 'object' ? period.teacher?._id : period.teacher,
          }));
        });
        setWeeklyTimetable(transformedTimetable);
      }
    }
  }, [currentTimetable, reset]);

  useEffect(() => {
    if (
      currentTimetable?.grade &&
      currentTimetable?.gender &&
      currentTimetable?.section
    ) {
      loadSchoolTimings({
        gradeId: currentTimetable.grade._id || currentTimetable.grade,
        gender: currentTimetable.gender
      });
      loadAvailableSubjects({
        grade: currentTimetable.grade._id || currentTimetable.grade,
        gender: currentTimetable.gender,
        section: currentTimetable.section._id || currentTimetable.section
      });
    }
  }, [currentTimetable, loadAvailableSubjects, loadSchoolTimings]);

  useEffect(() => {
    if (updateSuccess) {
      showSnackbar(t('timetable.edit.messages.updateSuccess'), 'success');
      navigate('/timetable');
    }
  }, [updateSuccess, navigate, showSnackbar, t]);

  useEffect(() => {
    if (updateError) {
      const message = updateError?.data?.message || updateError?.message || t('timetable.edit.messages.genericError');
      showSnackbar(message, 'error');
    }
  }, [updateError, showSnackbar, t]);

  useEffect(() => {
    if (timetableFetchError) {
      const message = timetableFetchError?.data?.message || timetableFetchError?.message || t('timetable.edit.messages.genericError');
      showSnackbar(message, 'error');
    }
  }, [timetableFetchError, showSnackbar, t]);


  const onSubmit = (data) => {
    if (!data.name) {
      showSnackbar(t('timetable.edit.messages.fillRequiredFields'), 'error');
      return;
    }

    // Check if we have any periods
    const totalPeriods = Object.values(weeklyTimetable).reduce((total, day) => total + day.length, 0);
    if (totalPeriods === 0) {
      showSnackbar(t('timetable.edit.messages.addPeriods'), 'error');
      return;
    }

    // Clean and prepare weekly timetable data for backend
    const cleanedWeeklyTimetable = {};
    
    Object.keys(weeklyTimetable).forEach(day => {
      // Process all periods (both class and break periods)
      const allPeriods = weeklyTimetable[day]
        .map((period, index) => {
          if (period.isBreak) {
            // For break periods, preserve the original structure
            const cleanBreakPeriod = {
              period: period.period,
              startTime: period.startTime,
              endTime: period.endTime,
              duration: period.duration,
              isBreak: true,
              breakType: period.breakType || 'short'
            };
            
            // Include break name if available
            if (period.breakName && period.breakName.trim() !== '') {
              cleanBreakPeriod.breakName = period.breakName;
            }
            
            return cleanBreakPeriod;
          } else {
            // For class periods, clean and validate the data
            const cleanPeriod = {
              period: period.period,
              startTime: period.startTime,
              endTime: period.endTime,
              duration: period.duration,
              isBreak: false
            };
            
            // Use gradeSubject ID if selected
            if (period.gradeSubject && period.gradeSubject.trim() !== '') {
              cleanPeriod.gradeSubject = period.gradeSubject;
            }
            
            // Keep legacy fields for backward compatibility
            if (period.subject && period.subject.trim() !== '') {
              cleanPeriod.subject = period.subject;
            }
            if (period.teacher && period.teacher.trim() !== '') {
              cleanPeriod.teacher = period.teacher;
            }
            
            return cleanPeriod;
          }
        });
      
      cleanedWeeklyTimetable[day] = allPeriods;
    });

    // Combine form data with cleaned weekly timetable
    // Include academicYear, term, grade, gender, section from currentTimetable (read-only fields)
    const payload = {
      name: data.name,
      status: data.status,
      academicYear: currentTimetable.academicYear?._id || currentTimetable.academicYear,
      term: currentTimetable.term,
      grade: currentTimetable.grade?._id || currentTimetable.grade,
      gender: currentTimetable.gender,
      section: currentTimetable.section?._id || currentTimetable.section,
      weeklyTimetable: cleanedWeeklyTimetable
    };
    
    updateTimetable({ id, data: payload });
  };

  const handleCancel = () => {
    navigate('/timetable');
  };

  const updatePeriod = (day, index, field, value) => {
    // Only allow updating certain fields (gradeSubject and period number for class periods)
    const allowedFields = ['gradeSubject', 'period'];
    
    if (allowedFields.includes(field)) {
      setWeeklyTimetable(prev => ({
        ...prev,
        [day]: prev[day].map((period, i) => 
          i === index ? { ...period, [field]: value } : period
        )
      }));
    }
  };

  const days = useMemo(() => [
    { key: 'monday', label: t('timetable.create.days.monday') },
    { key: 'tuesday', label: t('timetable.create.days.tuesday') },
    { key: 'wednesday', label: t('timetable.create.days.wednesday') },
    { key: 'thursday', label: t('timetable.create.days.thursday') },
    { key: 'friday', label: t('timetable.create.days.friday') },
    { key: 'saturday', label: t('timetable.create.days.saturday') },
    { key: 'sunday', label: t('timetable.create.days.sunday') }
  ], [t]);

  return (
    <CustomOutletBox>
      <Box sx={{ p: 3 }}>
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
            onClick={() => navigate('/timetable')}
          >
            {t('timetable.breadcrumbs.timetable')} • {t('timetable.breadcrumbs.list')}
          </Link>
          <Typography sx={{ color: themeColors.text.primary }}>
            {t('timetable.breadcrumbs.edit')}
          </Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
            {t('timetable.edit.title')}
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              onClick={handleCancel}
              color="inherit"
            >
              {t('timetable.edit.actions.cancel')}
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit(onSubmit)}
              disabled={isUpdating}
              startIcon={isUpdating ? <CircularProgress size={20} /> : <ICONS.Save.component />}
            >
              {isUpdating ? t('timetable.edit.actions.updating') : t('timetable.edit.actions.update')}
            </Button>
          </Box>
        </Box>

        {/* Basic Information */}
        <Paper sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, mb: 3 }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: themeColors.text.primary }}>
              {t('timetable.create.sections.basicInfo')}
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <CustomInput
                        control={control}
                        fieldName="name"
                        fieldLabel={t('timetable.create.form.name')}
                        placeholder={t('timetable.create.form.namePlaceholder')}
                        error={errors.name}
                    />
                </Grid>

                <Grid item xs={12} sm={4} md={4}>
                    <Typography variant="caption" color="textSecondary" display="block">
                        {t('timetable.create.form.grade')}
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                        {currentTimetable?.grade?.gradeName || t('timetable.list.notAvailable')}
                    </Typography>
                </Grid>

                <Grid item xs={12} sm={4} md={4}>
                    <Typography variant="caption" color="textSecondary" display="block">
                        {t('timetable.create.form.gender')}
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                        {currentTimetable?.gender
                            ? currentTimetable.gender.charAt(0).toUpperCase() + currentTimetable.gender.slice(1)
                            : t('timetable.list.notAvailable')}
                    </Typography>
                </Grid>

                <Grid item xs={12} sm={4} md={4}>
                    <Typography variant="caption" color="textSecondary" display="block">
                        {t('timetable.create.form.section')}
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                        {currentTimetable?.section?.sectionName || t('timetable.list.notAvailable')}
                    </Typography>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <CustomSelect
                        control={control}
                        fieldName="status"
                        fieldLabel={t('timetable.create.form.status')}
                        error={errors.status}
                    >
                        <MenuItem value="draft">{t('timetable.create.form.statusDraft')}</MenuItem>
                        <MenuItem value="published">{t('timetable.create.form.statusPublished')}</MenuItem>
                        <MenuItem value="archived">{t('timetable.create.form.statusArchived')}</MenuItem>
                    </CustomSelect>
                </Grid>

              </Grid>
          </Box>
        </Paper>

        {/* Timetable Schedule */}
        {currentTimetable?.grade && currentTimetable?.gender && currentTimetable?.section && (
          <Paper sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: themeColors.text.primary }}>
                {t('timetable.create.sections.schedule')}
              </Typography>
              
              {isAutoGenerating && (
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CircularProgress size={20} />
                    <Typography>{t('timetable.create.messages.autoGenerating')}</Typography>
                  </Box>
                </Alert>
              )}
              
              {weeklyTimetable.monday.length > 0 && (
                <>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', backgroundColor: themeColors.background.secondary }}>
                            {t('timetable.create.table.day')}
                          </TableCell>
                          {weeklyTimetable.monday
                            .filter(period => !period.isBreak)
                            .sort((a, b) => a.period - b.period)
                            .map((period, index) => (
                            <TableCell 
                              key={index} 
                              align="center" 
                              sx={{ 
                                fontWeight: 'bold', 
                                backgroundColor: themeColors.background.secondary,
                                color: themeColors.text.primary,
                                minWidth: 150
                              }}
                            >
                              <Box>
                                <Typography variant="caption" fontWeight="bold">
                                  {t('timetable.create.table.period', { number: period.period })}
                                </Typography>
                                <Typography variant="caption" display="block">
                                  {period.startTime} - {period.endTime}
                                </Typography>
                                <Typography variant="caption" display="block" color="text.secondary">
                                  {t('timetable.create.table.duration', { minutes: period.duration })}
                                </Typography>
                              </Box>
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {days.map((day) => (
                          <TableRow key={day.key}>
                            <TableCell 
                              sx={{ 
                                fontWeight: 'bold', 
                                backgroundColor: themeColors.background.secondary,
                                position: 'sticky',
                                left: 0,
                                zIndex: 1
                              }}
                            >
                              {day.label}
                            </TableCell>
                            {weeklyTimetable[day.key]
                              .filter(period => !period.isBreak)
                              .sort((a, b) => a.period - b.period)
                              .map((period, periodIndex) => (
                              <TableCell key={periodIndex} align="center" sx={{ p: 1 }}>
                                <Box
                                  component="select"
                                  value={period.gradeSubject || ''}
                                  onChange={(e) => updatePeriod(day.key, weeklyTimetable[day.key].findIndex(p => p === period), 'gradeSubject', e.target.value)}
                                  sx={{
                                    width: '100%',
                                    height: '35px',
                                    padding: '4px 8px',
                                    border: `1px solid ${themeColors.border.primary}`,
                                    borderRadius: '4px',
                                    backgroundColor: themeColors.background.primary,
                                    color: themeColors.text.primary,
                                    fontSize: '12px',
                                    fontFamily: 'Raleway, sans-serif',
                                    '&:focus': {
                                      outline: 'none',
                                      borderColor: themeColors.primary,
                                      boxShadow: `0 0 0 2px ${themeColors.primary}20`
                                    }
                                  }}
                                >
                                  <option value="">{t('timetable.create.table.selectSubject')}</option>
                                  {availableSubjects.map((gradeSubject) => (
                                    <option key={gradeSubject._id} value={gradeSubject._id}>
                                      {gradeSubject.subject?.subjectName} {gradeSubject.teacher ? `- ${gradeSubject.teacher.employeeName}` : `(${t('timetable.create.table.noTeacher')})`}
                                    </option>
                                  ))}
                                </Box>
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  {/* Break Timings Information */}
                  <Box sx={{ mt: 3, mb: 3 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
                      {t('timetable.create.sections.breakTimings')}
                    </Typography>
                    <Grid container spacing={2}>
                      {(() => {
                        // Get breaks from the first day that has breaks, or from any day
                        const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                        let breaks = [];
                        
                        for (const day of allDays) {
                          if (weeklyTimetable[day] && weeklyTimetable[day].length > 0) {
                            const dayBreaks = weeklyTimetable[day].filter(period => period.isBreak);
                            if (dayBreaks.length > 0) {
                              breaks = dayBreaks;
                              break;
                            }
                          }
                        }
                        
                        return breaks.map((breakPeriod, index) => (
                          <Grid item xs={12} sm={6} md={4} key={index}>
                            <Card sx={{ 
                              backgroundColor: `${themeColors.warning}15`, 
                              border: `1px solid ${themeColors.warning}`,
                              borderRadius: 2
                            }}>
                              <CardContent sx={{ p: 2 }}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Chip 
                                    label={breakPeriod.breakName || breakPeriod.breakType || t('timetable.create.break')}
                                    color="warning"
                                    size="small"
                                    sx={{ fontWeight: 'bold' }}
                                  />
                                </Box>
                                <Typography variant="body2" sx={{ mt: 1, fontWeight: 'medium' }}>
                                  {breakPeriod.startTime} - {breakPeriod.endTime}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {t('timetable.create.breakDuration', { minutes: breakPeriod.duration })}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        ));
                      })()}
                      {(() => {
                        // Check if any day has breaks
                        const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                        const hasBreaks = allDays.some(day => 
                          weeklyTimetable[day] && weeklyTimetable[day].some(period => period.isBreak)
                        );
                        
                        if (!hasBreaks) {
                          return (
                            <Grid item xs={12}>
                              <Alert severity="info">
                                {t('timetable.create.messages.noBreaks')}
                              </Alert>
                            </Grid>
                          );
                        }
                        return null;
                      })()}
                    </Grid>
                  </Box>

                </>
              )}
              
              {weeklyTimetable.monday.length === 0 && (
                <Alert severity="info">
                  {t('timetable.create.messages.noPeriodsScheduled')}
                </Alert>
              )}
            </Box>
          </Paper>
        )}

        <CustomBackDrop open={isUpdating || timetableLoading} />
      </Box>
    </CustomOutletBox>
  );
};

export default EditTimetableScreen;
