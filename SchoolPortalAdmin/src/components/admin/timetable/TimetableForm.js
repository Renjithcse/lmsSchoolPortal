import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from '../../../hooks/SnackBar';
import { ICONS } from '../../../assets/icons';
import { useLazyGetMyGradePermissionsQuery, useLazyGetMyGenderPermissionsQuery, useLazyGetMySectionPermissionsQuery } from '../../../Redux/features/Admin/TeachersSlice';
import { useGetAcademicYearQuery } from '../../../Redux/features/commonSlice';
import {
  createTimetableAsync,
  updateTimetableAsync,
  getAvailableSubjectsAndTeachersAsync,
  getSchoolTimingsForTimetableAsync,
  generateTimetableTemplateAsync,
  clearError,
  clearSuccess
} from '../../../Redux/features/Admin/timetableSlice';
import { useTranslation } from 'react-i18next';

const TimetableForm = ({ open, onClose, item, mode }) => {
  const { t } = useTranslation();
  const { themeColors } = useThemeContext();
  const dispatch = useDispatch();
  const showSnackbar = useSnackbar();
  
  const { loading, error, success, availableSubjects, schoolTimings, template } = useSelector(state => state.timetable);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    academicYear: '',
    term: '',
    grade: '',
    gender: '',
    section: '',
    status: 'draft',
    notes: '',
    weeklyTimetable: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    }
  });

  const [activeTab, setActiveTab] = useState(0);
  const [expandedDay, setExpandedDay] = useState('monday');

  // API calls - using same structure as AttendanceReportMenu
  const { data: academicYear, isFetching: academicLoading } = useGetAcademicYearQuery();
  const [triggerGrades, { data: grades, isFetching: gradeLoading }] = useLazyGetMyGradePermissionsQuery();
  const [triggerGenders, { data: genders, isFetching: genderLoading }] = useLazyGetMyGenderPermissionsQuery();
  const [triggerSections, { data: sections, isFetching: sectionLoading }] = useLazyGetMySectionPermissionsQuery();

  // Refs to track the last triggered values for cascading filters
  const lastAcademicYear = useRef(null);
  const lastGradeId = useRef(null);

  // Trigger grades when component loads
  useEffect(() => {
    triggerGrades({});
  }, [triggerGrades]);

  // Cascading filter effects - using same logic as AttendanceReportMenu
  useEffect(() => {
    if (formData.academicYear && formData.academicYear !== lastAcademicYear.current) {
      lastAcademicYear.current = formData.academicYear;
      // Trigger grades for the selected academic year
      triggerGrades({ academicYear: formData.academicYear });
      // Clear dependent fields
      setFormData(prev => ({
        ...prev,
        grade: '',
        gender: '',
        section: ''
      }));
    }
  }, [formData.academicYear, triggerGrades]);

  useEffect(() => {
    if (formData.grade && formData.grade !== lastGradeId.current) {
      lastGradeId.current = formData.grade;
      const data = { grade: formData.grade };
      if (formData.academicYear) data.academicYear = formData.academicYear;
      
      triggerGenders(data);
      triggerSections(data);
      
      // Clear dependent fields when grade changes
      setFormData(prev => ({
        ...prev,
        gender: '',
        section: ''
      }));
    }
  }, [formData.grade, formData.academicYear, triggerGenders, triggerSections]);

  // Initialize form data
  useEffect(() => {
    if (mode === 'edit' && item) {
      setFormData({
        name: item.name || '',
        academicYear: item.academicYear?._id || '',
        term: item.term || '',
        grade: item.grade?._id || '',
        gender: item.gender || '',
        section: item.section?._id || '',
        status: item.status || 'draft',
        notes: item.notes || '',
        weeklyTimetable: item.weeklyTimetable || {
          monday: [], tuesday: [], wednesday: [], thursday: [],
          friday: [], saturday: [], sunday: []
        }
      });
    } else {
      setFormData({
        name: '',
        academicYear: '',
        term: '',
        grade: '',
        gender: '',
        section: '',
        status: 'draft',
        notes: '',
        weeklyTimetable: {
          monday: [], tuesday: [], wednesday: [], thursday: [],
          friday: [], saturday: [], sunday: []
        }
      });
    }
  }, [mode, item, open]);

  // Handle success/error
  useEffect(() => {
    if (success) {
      showSnackbar(mode === 'create' ? t('timetable.create.messages.createSuccess') : t('timetable.edit.messages.updateSuccess'), 'success');
      dispatch(clearSuccess());
      onClose();
    }
    if (error) {
      showSnackbar(error.message || t('timetable.create.messages.genericError'), 'error');
      dispatch(clearError());
    }
  }, [success, error, dispatch, showSnackbar, mode, onClose, t]);

  // Fetch school timings when grade and gender are selected
  useEffect(() => {
    if (formData.grade && formData.gender && mode === 'create') {
      dispatch(getSchoolTimingsForTimetableAsync({
        gradeId: formData.grade,
        gender: formData.gender
      }));
    }
  }, [formData.grade, formData.gender, mode, dispatch]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenerateTemplate = () => {
    if (formData.academicYear && formData.grade && formData.gender && formData.section) {
      dispatch(generateTimetableTemplateAsync({
        academicYear: formData.academicYear,
        grade: formData.grade,
        gender: formData.gender,
        section: formData.section
      }));
    }
  };

  // Apply template to form data
  useEffect(() => {
    if (template && mode === 'create') {
      setFormData(prev => ({
        ...prev,
        weeklyTimetable: template.template
      }));
      showSnackbar(t('timetable.create.messages.templateSuccess'), 'success');
    }
  }, [template, mode, showSnackbar, t]);

  const handleSubmit = () => {
    console.log('Form data before validation:', formData);
    
    if (!formData.name || !formData.academicYear || !formData.term || !formData.grade || !formData.gender || !formData.section) {
      console.log('Validation failed - missing required fields:', {
        name: formData.name,
        academicYear: formData.academicYear,
        term: formData.term,
        grade: formData.grade,
        gender: formData.gender,
        section: formData.section
      });
      showSnackbar(t('timetable.create.messages.fillRequiredFields'), 'error');
      return;
    }

    if (mode === 'create') {
      // For create, don't include id field
      const { id, ...submitData } = formData;
      console.log('Creating timetable with data:', submitData);
      dispatch(createTimetableAsync(submitData));
    } else {
      // For edit, include id field
      const submitData = {
        ...formData,
        id: item._id
      };
      console.log('Updating timetable with data:', submitData);
      dispatch(updateTimetableAsync(submitData));
    }
  };

  const addPeriod = (day) => {
    const newPeriod = {
      period: formData.weeklyTimetable[day].length + 1,
      subject: '',
      startTime: '',
      endTime: '',
      duration: schoolTimings?.periodDuration || 45,
      room: '',
      isBreak: false,
      breakType: 'short'
    };

    setFormData(prev => ({
      ...prev,
      weeklyTimetable: {
        ...prev.weeklyTimetable,
        [day]: [...prev.weeklyTimetable[day], newPeriod]
      }
    }));
  };

  const removePeriod = (day, index) => {
    setFormData(prev => ({
      ...prev,
      weeklyTimetable: {
        ...prev.weeklyTimetable,
        [day]: prev.weeklyTimetable[day].filter((_, i) => i !== index)
      }
    }));
  };

  // Auto-generate periods based on school timings
  const generatePeriodsFromSchoolTimings = () => {
    if (!schoolTimings) {
      showSnackbar(t('timetable.create.messages.fetchTimingsFirst'), 'warning');
      return;
    }

    const { startTime, endTime, periodDuration, totalPeriods, breaks } = schoolTimings;
    
    // Helper function to add minutes to time
    const addMinutesToTime = (timeString, minutes) => {
      const [hours, mins] = timeString.split(':').map(Number);
      const totalMinutes = hours * 60 + mins + minutes;
      const newHours = Math.floor(totalMinutes / 60);
      const newMins = totalMinutes % 60;
      return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
    };

    // Generate periods for each day
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const newWeeklyTimetable = {};

    days.forEach(day => {
      const periods = [];
      let currentTime = startTime;
      let periodNumber = 1;

      // Generate periods
      for (let i = 0; i < totalPeriods; i++) {
        const periodStartTime = currentTime;
        const periodEndTime = addMinutesToTime(currentTime, periodDuration);

        periods.push({
          period: periodNumber,
          subject: '',
          startTime: periodStartTime,
          endTime: periodEndTime,
          duration: periodDuration,
          room: '',
          isBreak: false,
          breakType: 'short'
        });

        currentTime = periodEndTime;
        periodNumber++;

        // Add breaks if they exist
        if (breaks && breaks.length > 0) {
          breaks.forEach(breakItem => {
            const breakStartTime = breakItem.startTime;
            const breakEndTime = breakItem.endTime;
            
            // Check if break falls between periods
            if (breakStartTime >= periodEndTime && breakStartTime <= addMinutesToTime(periodEndTime, periodDuration)) {
              periods.push({
                period: periodNumber,
                subject: breakItem.name,
                startTime: breakStartTime,
                endTime: breakEndTime,
                duration: breakItem.duration,
                room: '',
                isBreak: true,
                breakType: breakItem.name.toLowerCase()
              });
              currentTime = breakEndTime;
              periodNumber++;
            }
          });
        }
      }

      newWeeklyTimetable[day] = periods;
    });

    setFormData(prev => ({
      ...prev,
      weeklyTimetable: newWeeklyTimetable
    }));

    showSnackbar(t('timetable.create.messages.periodsGenerated', { count: totalPeriods }), 'success');
  };

  const updatePeriod = (day, index, field, value) => {
    setFormData(prev => ({
      ...prev,
      weeklyTimetable: {
        ...prev.weeklyTimetable,
        [day]: prev.weeklyTimetable[day].map((period, i) => 
          i === index ? { ...period, [field]: value } : period
        )
      }
    }));
  };

  const days = [
    { key: 'monday', label: t('timetable.create.days.monday') },
    { key: 'tuesday', label: t('timetable.create.days.tuesday') },
    { key: 'wednesday', label: t('timetable.create.days.wednesday') },
    { key: 'thursday', label: t('timetable.create.days.thursday') },
    { key: 'friday', label: t('timetable.create.days.friday') },
    { key: 'saturday', label: t('timetable.create.days.saturday') },
    { key: 'sunday', label: t('timetable.create.days.sunday') }
  ];

  const renderPeriodForm = (day, period, index) => (
    <Card key={index} sx={{ mb: 2, border: `1px solid ${themeColors.border.primary}` }}>
      <CardContent sx={{ p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={1}>
            <TextField
              size="small"
              label={t('timetable.form.periodFields.period')}
              value={period.period}
              onChange={(e) => updatePeriod(day, index, 'period', parseInt(e.target.value))}
              type="number"
              inputProps={{ min: 1, max: 15 }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('timetable.form.periodFields.subject')}</InputLabel>
              <Select
                value={period.subject}
                onChange={(e) => updatePeriod(day, index, 'subject', e.target.value)}
                disabled={period.isBreak}
              >
                {availableSubjects.map((subject) => (
                  <MenuItem key={subject.subjectId} value={subject.subjectId}>
                    {subject.subjectName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={1.5}>
            <TextField
              size="small"
              label={t('timetable.form.periodFields.startTime')}
              value={period.startTime}
              onChange={(e) => updatePeriod(day, index, 'startTime', e.target.value)}
              type="time"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={1.5}>
            <TextField
              size="small"
              label={t('timetable.form.periodFields.endTime')}
              value={period.endTime}
              onChange={(e) => updatePeriod(day, index, 'endTime', e.target.value)}
              type="time"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={1}>
            <TextField
              size="small"
              label={t('timetable.form.periodFields.duration')}
              value={period.duration}
              onChange={(e) => updatePeriod(day, index, 'duration', parseInt(e.target.value))}
              type="number"
              inputProps={{ min: 15, max: 120 }}
            />
          </Grid>
          <Grid item xs={12} sm={1.5}>
            <TextField
              size="small"
              label={t('timetable.form.periodFields.room')}
              value={period.room}
              onChange={(e) => updatePeriod(day, index, 'room', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={1.5}>
            <Box display="flex" alignItems="center" gap={1}>
              <FormControl size="small">
                <Select
                  value={period.isBreak ? 'break' : 'class'}
                  onChange={(e) => updatePeriod(day, index, 'isBreak', e.target.value === 'break')}
                >
                  <MenuItem value="class">{t('timetable.form.periodFields.class')}</MenuItem>
                  <MenuItem value="break">{t('timetable.create.break')}</MenuItem>
                </Select>
              </FormControl>
              <Tooltip title={t('timetable.form.periodFields.removePeriod')}>
                <IconButton
                  size="small"
                  onClick={() => removePeriod(day, index)}
                  sx={{ color: themeColors.error }}
                >
                  <ICONS.Delete.component />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="xl" 
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: themeColors.background.primary,
          border: `1px solid ${themeColors.border.primary}`
        }
      }}
    >
      <DialogTitle sx={{ color: themeColors.text.primary, borderBottom: `1px solid ${themeColors.border.primary}` }}>
        {mode === 'create' ? t('timetable.create.title') : t('timetable.edit.title')}
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ mb: 3 }}
          >
            <Tab label={t('timetable.create.sections.basicInfo')} />
            <Tab label={t('timetable.create.sections.schedule')} />
          </Tabs>

          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('timetable.create.form.name')}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={t('timetable.create.form.namePlaceholder')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label={t('timetable.create.form.academicYear')}
                  value={formData.academicYear}
                  onChange={(e) => handleInputChange('academicYear', e.target.value)}
                  disabled={mode === 'edit' || academicLoading}
                >
                  {academicYear?.map((yearObj) => (
                    <MenuItem key={yearObj._id} value={yearObj._id}>
                      {yearObj.academicYear}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label={t('timetable.create.form.term')}
                  value={formData.term}
                  onChange={(e) => handleInputChange('term', e.target.value)}
                >
                  <MenuItem value="Term 1">{t('timetable.create.form.term1')}</MenuItem>
                  <MenuItem value="Term 2">{t('timetable.create.form.term2')}</MenuItem>
                  <MenuItem value="Term 3">{t('timetable.create.form.term3')}</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label={t('timetable.create.form.grade')}
                  value={formData.grade}
                  onChange={(e) => handleInputChange('grade', e.target.value)}
                  disabled={mode === 'edit' || gradeLoading}
                >
                  {grades?.data?.map((grade) => (
                    <MenuItem key={grade._id} value={grade._id}>
                      {grade.gradeName}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label={t('timetable.create.form.gender')}
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  disabled={mode === 'edit' || genderLoading}
                >
                  {genders?.data?.map((gender) => (
                    <MenuItem key={gender} value={gender}>
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label={t('timetable.create.form.section')}
                  value={formData.section}
                  onChange={(e) => handleInputChange('section', e.target.value)}
                  disabled={mode === 'edit' || sectionLoading}
                >
                  {sections?.data?.map((section) => (
                    <MenuItem key={section._id} value={section._id}>
                      {section.sectionName}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label={t('timetable.create.form.status')}
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  <MenuItem value="draft">{t('timetable.create.form.statusDraft')}</MenuItem>
                  <MenuItem value="published">{t('timetable.create.form.statusPublished')}</MenuItem>
                  <MenuItem value="archived">{t('timetable.create.form.statusArchived')}</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label={t('timetable.form.notes')}
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </Grid>

              {mode === 'create' && formData.academicYear && formData.grade && formData.gender && formData.section && (
                <Grid item xs={12}>
                  <Box display="flex" gap={2} alignItems="center">
                    <Button
                      variant="outlined"
                      onClick={generatePeriodsFromSchoolTimings}
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : <ICONS.Refresh.component />}
                    >
                      {t('timetable.form.generatePeriods')}
                    </Button>
                    {schoolTimings && (
                      <Typography variant="body2" color="text.secondary">
                        {t('timetable.form.schoolHours')}: {schoolTimings.timings?.startTime} - {schoolTimings.timings?.endTime} | 
                        {t('timetable.form.periodDuration')}: {t('timetable.create.table.duration', { minutes: schoolTimings.periodDuration })} | 
                        {t('timetable.form.totalPeriods')}: {schoolTimings.totalPeriods}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              )}
            </Grid>
          )}

          {activeTab === 1 && (
            <Box>
              {days.map((day) => (
                <Accordion
                  key={day.key}
                  expanded={expandedDay === day.key}
                  onChange={() => setExpandedDay(expandedDay === day.key ? false : day.key)}
                  sx={{ mb: 2 }}
                >
                  <AccordionSummary expandIcon={<ICONS.ExpandMore.component />}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" width="100%" mr={2}>
                      <Typography variant="h6" fontWeight="bold">
                        {day.label}
                      </Typography>
                      <Box display="flex" gap={1}>
                        <Chip
                          label={t('timetable.form.periodsCount', { count: formData.weeklyTimetable[day.key].length })}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Tooltip title={t('timetable.form.periodFields.addPeriod')}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              addPeriod(day.key);
                            }}
                            sx={{ color: themeColors.primary }}
                          >
                            <ICONS.Add.component />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {formData.weeklyTimetable[day.key].length === 0 ? (
                      <Alert severity="info">
                        {t('timetable.form.noPeriodsScheduled', { day: day.label })}
                      </Alert>
                    ) : (
                      formData.weeklyTimetable[day.key].map((period, index) => 
                        renderPeriodForm(day.key, period, index)
                      )
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: `1px solid ${themeColors.border.primary}` }}>
        <Button onClick={onClose} color="inherit">
          {t('timetable.create.actions.cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? t('timetable.create.actions.creating') : (mode === 'create' ? t('timetable.create.actions.create') : t('timetable.edit.actions.update'))}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TimetableForm;
