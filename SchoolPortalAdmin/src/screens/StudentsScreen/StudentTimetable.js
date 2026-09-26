import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Avatar,
  Tabs,
  Tab
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  CalendarToday as CalendarIcon,
  Coffee as BreakIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import CustomOutletBox from '../../components/Common/CustomOutletBox';
import { useGetStudentTimetableQuery } from '../../Redux/features/Users/studentDashboardSlice';
import { useTranslation } from 'react-i18next';

const StudentTimetable = () => {
  const { themeColors } = useThemeContext();
  const { t } = useTranslation();
  const [selectedDay, setSelectedDay] = useState(0);

  // Fetch student's timetable
  const { data: timetableData, isLoading, error } = useGetStudentTimetableQuery();

  const days = [
    { key: 'monday', label: t('studentTimetable.days.monday') },
    { key: 'tuesday', label: t('studentTimetable.days.tuesday') },
    { key: 'wednesday', label: t('studentTimetable.days.wednesday') },
    { key: 'thursday', label: t('studentTimetable.days.thursday') },
    { key: 'friday', label: t('studentTimetable.days.friday') },
    { key: 'saturday', label: t('studentTimetable.days.saturday') },
    { key: 'sunday', label: t('studentTimetable.days.sunday') }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <CustomOutletBox>
      <Box 
          display="flex" 
          flexDirection="column"
          justifyContent="center" 
          alignItems="center" 
          minHeight="400px"
          sx={{
            background: `linear-gradient(135deg, ${themeColors.primary}05, ${themeColors.accent}05)`,
            borderRadius: 3,
            p: 4
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <CircularProgress 
              size={60}
              sx={{ 
                color: themeColors.primary,
                mb: 2
              }} 
            />
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                color: themeColors.text.secondary,
                textAlign: 'center'
              }}
            >
              {t('studentTimetable.messages.loading')}
            </Typography>
          </motion.div>
        </Box>
      </CustomOutletBox>
    );
  }

  // Error state
  if (error) {
    return (
      <CustomOutletBox>
        <Box p={3}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Alert 
              severity="error"
              sx={{
                background: `linear-gradient(135deg, ${themeColors.error}10, ${themeColors.error}05)`,
                border: `1px solid ${themeColors.error}20`,
                borderRadius: 2
              }}
            >
              {t('studentTimetable.messages.loadFailed')}
            </Alert>
          </motion.div>
        </Box>
      </CustomOutletBox>
    );
  }

  const student = timetableData?.data?.student;
  const timetable = timetableData?.data?.timetable;

  // No timetable state
  if (!timetable) {
    return (
      <CustomOutletBox>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{
                fontWeight: 700,
                color: themeColors.text.primary,
                mb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                <ScheduleIcon sx={{ color: themeColors.primary, fontSize: 32 }} />
                {t('studentTimetable.title')}
              </Typography>
              {student && (
                <Typography variant="body1" sx={{
                  color: themeColors.text.secondary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <SchoolIcon sx={{ fontSize: 16 }} />
                  {student.grade} • {student.section} • {student.academicYear} • {student.term}
                </Typography>
              )}
            </Box>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Alert 
              severity="info"
              sx={{
                background: `linear-gradient(135deg, ${themeColors.primary}10, ${themeColors.primary}05)`,
                border: `1px solid ${themeColors.primary}20`,
                borderRadius: 2
              }}
            >
              {t('studentTimetable.messages.noTimetable')}
            </Alert>
          </motion.div>
        </motion.div>
      </CustomOutletBox>
    );
  }

  const handleDayChange = (event, newValue) => {
    setSelectedDay(newValue);
  };

  const getCurrentDayPeriods = () => {
    const dayKey = days[selectedDay].key;
    return timetable.weeklyTimetable[dayKey] || [];
  };

  const renderPeriodCell = (period) => {
    if (period.isBreak) {
      return (
        <Box sx={{ textAlign: 'center', py: 1 }}>
          <Chip
            icon={<BreakIcon />}
            label={period.breakName || period.breakType || t('studentTimetable.labels.break')}
            color="warning"
            variant="outlined"
            size="small"
            sx={{
              fontWeight: 600,
              bgcolor: `${themeColors.warning}15`,
              borderColor: themeColors.warning,
              color: themeColors.warning
            }}
          />
          <Typography variant="caption" display="block" sx={{ mt: 0.5, color: themeColors.text.secondary }}>
            {period.startTime} - {period.endTime}
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ textAlign: 'center', py: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: themeColors.text.primary, mb: 0.5 }}>
          {period.subject?.subjectName || t('studentTimetable.labels.noSubject')}
        </Typography>
        <Typography variant="caption" sx={{ color: themeColors.text.secondary, display: 'block', mb: 0.5 }}>
          {period.teacher?.employeeName || t('studentTimetable.labels.noTeacher')}
        </Typography>
        <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
          {period.startTime} - {period.endTime}
        </Typography>
        {period.room && (
          <Typography variant="caption" sx={{ color: themeColors.text.secondary, display: 'block' }}>
            {t('studentTimetable.labels.room', { room: period.room })}
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <CustomOutletBox>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{
              fontWeight: 700,
              color: themeColors.text.primary,
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <ScheduleIcon sx={{ color: themeColors.primary, fontSize: 32 }} />
              {t('studentTimetable.title')}
            </Typography>
            {student && (
              <Typography variant="body1" sx={{
                color: themeColors.text.secondary,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <SchoolIcon sx={{ fontSize: 16 }} />
                {student.grade} • {student.section} • {student.academicYear} • {student.term}
              </Typography>
            )}
          </Box>
        </motion.div>

        {/* Timetable Info Card */}
        <motion.div variants={itemVariants}>
          <Card sx={{
            mb: 3,
            background: `linear-gradient(135deg, ${themeColors.primary}15, ${themeColors.primary}05)`,
            border: `1px solid ${themeColors.primary}20`
          }}>
            <CardContent>
              <Grid container spacing={3} alignItems="center">
                <Grid item>
                  <Avatar sx={{
                    width: 60,
                    height: 60,
                    bgcolor: themeColors.primary,
                    fontSize: 24
                  }}>
                    <ScheduleIcon />
                  </Avatar>
                </Grid>
                <Grid item xs>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: themeColors.text.primary, mb: 1 }}>
                    {timetable.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<CalendarIcon />}
                      label={`${student.academicYear} - ${student.term}`}
                      size="small"
                      sx={{
                        bgcolor: `${themeColors.accent}20`,
                        color: themeColors.accent
                      }}
                    />
                    <Chip
                      icon={<SchoolIcon />}
                      label={`${student.grade} - ${student.section}`}
                      size="small"
                      sx={{
                        bgcolor: `${themeColors.success}20`,
                        color: themeColors.success
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </motion.div>

        {/* Day Tabs */}
        <motion.div variants={itemVariants}>
          <Card sx={{
            mb: 3,
            background: themeColors.background.primary,
            border: `1px solid ${themeColors.border.primary}`
          }}>
            <Tabs
              value={selectedDay}
              onChange={handleDayChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  color: themeColors.text.secondary,
                  fontWeight: 600,
                  '&.Mui-selected': {
                    color: themeColors.primary
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: themeColors.primary
                }
              }}
            >
              {days.map((day, index) => (
                <Tab
                  key={day.key}
                  label={day.label}
                  sx={{
                    textTransform: 'capitalize',
                    minWidth: 100
                  }}
                />
              ))}
            </Tabs>
          </Card>
        </motion.div>

        {/* Timetable Table */}
        <motion.div variants={itemVariants}>
          <Card sx={{
            background: themeColors.background.primary,
            border: `1px solid ${themeColors.border.primary}`,
            boxShadow: `0 4px 12px ${themeColors.primary}10`
          }}>
            <CardContent>
              <Typography variant="h6" sx={{
                mb: 3,
                fontWeight: 600,
                color: themeColors.text.primary,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <TimeIcon sx={{ color: themeColors.primary }} />
                {t('studentTimetable.labels.schedule', { day: days[selectedDay].label })}
              </Typography>
              
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{
                  backgroundColor: themeColors.background.secondary,
                  borderColor: themeColors.border.primary,
                  '& .MuiTableCell-root': {
                    borderColor: themeColors.border.primary,
                  },
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: `${themeColors.primary}12` }}>
                      <TableCell sx={{ fontWeight: 'bold', color: themeColors.text.primary }}>
                        {t('studentTimetable.tableHeaders.period')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: themeColors.text.primary }}>
                        {t('studentTimetable.tableHeaders.time')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: themeColors.text.primary }}>
                        {t('studentTimetable.tableHeaders.subject')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: themeColors.text.primary }}>
                        {t('studentTimetable.tableHeaders.teacher')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getCurrentDayPeriods().length > 0 ? (
                      getCurrentDayPeriods().map((period, index) => (
                        <TableRow 
                          key={index}
                          sx={{
                            '&:nth-of-type(odd)': { 
                              bgcolor: `${themeColors.background.secondary}`
                            },
                            '&:hover': {
                              bgcolor: `${themeColors.primary}10`
                            }
                          }}
                        >
                          <TableCell sx={{ fontWeight: 'medium', color: themeColors.text.primary }}>
                            {period.isBreak ? (
                              <Chip
                                icon={<BreakIcon />}
                                label={t('studentTimetable.labels.break')}
                                size="small"
                                variant="outlined"
                                sx={{
                                  fontWeight: 600,
                                  bgcolor: `${themeColors.warning}15`,
                                  borderColor: themeColors.warning,
                                  color: themeColors.warning,
                                }}
                              />
                            ) : (
                              t('studentTimetable.labels.period', { period: period.period })
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'medium', color: themeColors.text.primary }}>
                              {period.startTime} - {period.endTime}
                            </Typography>
                            <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                              {t('studentTimetable.labels.min', { duration: period.duration })}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {period.isBreak ? (
                              <Chip
                                label={period.breakName || period.breakType || t('studentTimetable.labels.break')}
                                size="small"
                                sx={{
                                  bgcolor: `${themeColors.warning}15`,
                                  borderColor: themeColors.warning,
                                  color: themeColors.warning,
                                  borderWidth: 1,
                                }}
                              />
                            ) : (
                              <Typography variant="body2" sx={{ fontWeight: 'medium', color: themeColors.text.primary }}>
                                {period.subject?.subjectName || t('studentTimetable.labels.noSubject')}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {!period.isBreak && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{
                                  width: 24,
                                  height: 24,
                                  bgcolor: `${themeColors.accent}20`,
                                  color: themeColors.accent,
                                  fontSize: 12
                                }}>
                                  <PersonIcon sx={{ fontSize: 14 }} />
                                </Avatar>
                                <Typography variant="body2" sx={{ color: themeColors.text.primary }}>
                                  {period.teacher?.employeeName || t('studentTimetable.labels.noTeacher')}
                                </Typography>
                              </Box>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          sx={{ textAlign: 'center', py: 4, backgroundColor: themeColors.background.secondary }}
                        >
                          <Typography variant="body1" sx={{ color: themeColors.text.secondary }}>
                            {t('studentTimetable.messages.noPeriods', { day: days[selectedDay].label })}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </CustomOutletBox>
  );
};

export default StudentTimetable;
