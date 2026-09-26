import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import { ICONS } from '../../../assets/icons';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

const TimetableViewModal = ({ open, onClose, item }) => {
  const { t } = useTranslation();
  const { themeColors } = useThemeContext();
  const [activeTab, setActiveTab] = useState(0);
  const [expandedDay, setExpandedDay] = useState('monday');

  if (!item) return null;

  const days = [
    { key: 'monday', label: t('timetable.create.days.monday') },
    { key: 'tuesday', label: t('timetable.create.days.tuesday') },
    { key: 'wednesday', label: t('timetable.create.days.wednesday') },
    { key: 'thursday', label: t('timetable.create.days.thursday') },
    { key: 'friday', label: t('timetable.create.days.friday') },
    { key: 'saturday', label: t('timetable.create.days.saturday') },
    { key: 'sunday', label: t('timetable.create.days.sunday') }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'draft':
        return 'warning';
      case 'archived':
        return 'default';
      default:
        return 'default';
    }
  };

  const renderPeriodRow = (period, index) => (
    <TableRow key={index}>
      <TableCell>{period.period}</TableCell>
      <TableCell>
        {period.isBreak ? (
          <Chip 
            label={period.breakType || t('timetable.create.break')} 
            color="info" 
            size="small" 
            variant="outlined"
          />
        ) : (
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {period.subject?.subjectName || t('timetable.list.notAvailable')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {period.teacher?.employeeName || t('timetable.list.notAvailable')} ({period.teacher?.employeeId || t('timetable.list.notAvailable')})
            </Typography>
          </Box>
        )}
      </TableCell>
      <TableCell>{period.startTime}</TableCell>
      <TableCell>{period.endTime}</TableCell>
      <TableCell>{t('timetable.create.table.duration', { minutes: period.duration })}</TableCell>
      <TableCell>{period.room || t('timetable.viewModal.dash')}</TableCell>
    </TableRow>
  );

  const renderDaySchedule = (day) => {
    const dayData = item.weeklyTimetable?.[day.key] || [];
    
    return (
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
            <Chip
              label={t('timetable.viewModal.periodsCount', { count: dayData.length })}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {dayData.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" py={3}>
              {t('timetable.viewModal.noPeriodsScheduled', { day: day.label })}
            </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('timetable.viewModal.tableHeaders.period')}</TableCell>
                    <TableCell>{t('timetable.viewModal.tableHeaders.subjectTeacher')}</TableCell>
                    <TableCell>{t('timetable.viewModal.tableHeaders.startTime')}</TableCell>
                    <TableCell>{t('timetable.viewModal.tableHeaders.endTime')}</TableCell>
                    <TableCell>{t('timetable.viewModal.tableHeaders.duration')}</TableCell>
                    <TableCell>{t('timetable.viewModal.tableHeaders.room')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dayData.map((period, index) => renderPeriodRow(period, index))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </AccordionDetails>
      </Accordion>
    );
  };

  const renderWeeklyView = () => (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', position: 'sticky', left: 0, backgroundColor: themeColors.background.primary }}>
              {t('timetable.viewModal.tableHeaders.period')}
            </TableCell>
            {days.map((day) => (
              <TableCell key={day.key} sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                {day.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: Math.max(...days.map(day => item.weeklyTimetable?.[day.key]?.length || 0)) }, (_, periodIndex) => (
            <TableRow key={periodIndex}>
              <TableCell sx={{ fontWeight: 'medium', position: 'sticky', left: 0, backgroundColor: themeColors.background.primary }}>
                {periodIndex + 1}
              </TableCell>
              {days.map((day) => {
                const period = item.weeklyTimetable?.[day.key]?.[periodIndex];
                return (
                  <TableCell key={day.key} sx={{ textAlign: 'center' }}>
                    {period ? (
                      <Box>
                        {period.isBreak ? (
                          <Chip 
                            label={period.breakName || period.breakType || t('timetable.create.break')} 
                            color="info" 
                            size="small" 
                            variant="outlined"
                          />
                        ) : (
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {period.subject?.subjectName || t('timetable.list.notAvailable')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {period.teacher?.employeeName || t('timetable.list.notAvailable')}
                            </Typography>
                            <Typography variant="caption" display="block">
                              {period.startTime} - {period.endTime}
                            </Typography>
                            {period.room && (
                              <Typography variant="caption" color="text.secondary">
                                {period.room}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {t('timetable.viewModal.dash')}
                      </Typography>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
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
        {t('timetable.viewModal.title')}
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {/* Basic Information */}
          <Card sx={{ mb: 3, border: `1px solid ${themeColors.border.primary}` }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
                {t('timetable.viewModal.basicInformation')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">{t('timetable.viewModal.fields.grade')}</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {item.grade?.gradeName || t('timetable.list.notAvailable')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">{t('timetable.viewModal.fields.section')}</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {item.section?.sectionName || t('timetable.list.notAvailable')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">{t('timetable.viewModal.fields.gender')}</Typography>
                  <Typography variant="body1" fontWeight="medium" textTransform="capitalize">
                    {item.gender || t('timetable.list.notAvailable')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">{t('timetable.viewModal.fields.term')}</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {item.term || t('timetable.list.notAvailable')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">{t('timetable.viewModal.fields.academicYear')}</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {item.academicYear?.year || t('timetable.list.notAvailable')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">{t('timetable.viewModal.fields.status')}</Typography>
                  <Chip 
                    label={item.status} 
                    color={getStatusColor(item.status)}
                    size="small"
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">{t('timetable.viewModal.fields.created')}</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {moment(item.createdAt).format('MMM DD, YYYY')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">{t('timetable.viewModal.fields.lastUpdated')}</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {moment(item.updatedAt).format('MMM DD, YYYY')}
                  </Typography>
                </Grid>
              </Grid>
              {item.notes && (
                <Box mt={2}>
                  <Typography variant="body2" color="text.secondary">{t('timetable.viewModal.fields.notes')}</Typography>
                  <Typography variant="body1">
                    {item.notes}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Timetable View */}
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ mb: 3 }}
          >
            <Tab label={t('timetable.viewModal.tabs.weeklyView')} />
            <Tab label={t('timetable.viewModal.tabs.dayByDay')} />
          </Tabs>

          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
                {t('timetable.viewModal.sections.weeklyOverview')}
              </Typography>
              {renderWeeklyView()}
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
                {t('timetable.viewModal.sections.dailyDetails')}
              </Typography>
              {days.map((day) => renderDaySchedule(day))}
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: `1px solid ${themeColors.border.primary}` }}>
        <Button onClick={onClose} variant="contained">
          {t('timetable.viewModal.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TimetableViewModal;
