import React, { useMemo } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import CustomOutletBox from '../../components/Common/CustomOutletBox';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import { alpha } from '@mui/material/styles';

import { useGetMyClassFeedbackQuery } from '../../Redux/features/Feedback/ClassFeedbackSlice';
import { useGetMySubjectFeedbackQuery } from '../../Redux/features/Feedback/SubjectFeedbackSlice';

const StudentDiscipline = () => {
  const { t } = useTranslation();
  const { themeColors } = useThemeContext();

  const { data: classRes, isLoading: classLoading } = useGetMyClassFeedbackQuery({ type: 'discipline' });
  const { data: subjectRes, isLoading: subjectLoading } = useGetMySubjectFeedbackQuery({ type: 'discipline' });

  const classFeedbacks = classRes?.data || [];
  const subjectFeedbacks = subjectRes?.data || [];

  const subjectGroups = useMemo(() => {
    const map = new Map();
    for (const fb of subjectFeedbacks) {
      const subjectName = fb?.subject?.subjectName || t('studentDiscipline.subject.unknownSubject');
      if (!map.has(subjectName)) map.set(subjectName, []);
      map.get(subjectName).push(fb);
    }
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => new Date(b.feedbackDate || b.createdAt) - new Date(a.feedbackDate || a.createdAt));
      map.set(k, arr);
    }
    return Array.from(map.entries()).map(([subjectName, items]) => ({ subjectName, items }));
  }, [subjectFeedbacks, t]);

  return (
    <CustomOutletBox>
      <Box sx={{ p: 3, backgroundColor: themeColors.background.primary, minHeight: '100%' }}>
        <Paper
          elevation={2}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${themeColors.error} 0%, ${themeColors.accent} 100%)`,
            color: themeColors.text.inverse,
          }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.inverse }}>
            {t('studentDiscipline.title')}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, color: themeColors.text.inverse }}>
            {t('studentDiscipline.subtitle')}
          </Typography>
        </Paper>

        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: themeColors.text.primary }}>
          {t('studentDiscipline.common.title')}
        </Typography>

        {classLoading ? (
          <Typography sx={{ color: themeColors.text.secondary }}>{t('studentDiscipline.loading')}</Typography>
        ) : classFeedbacks.length === 0 ? (
          <Typography sx={{ color: themeColors.text.secondary, mb: 3 }}>{t('studentDiscipline.common.none')}</Typography>
        ) : (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {classFeedbacks.map((fb) => (
              <Grid item xs={12} md={6} key={fb._id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    border: `1px solid ${themeColors.border.primary}`,
                    background: `linear-gradient(145deg, ${themeColors.background.primary} 0%, ${themeColors.background.secondary} 100%)`,
                  }}
                >
                  <CardContent>
                    <Typography sx={{ fontWeight: 700, color: themeColors.text.primary }}>
                      {fb?.teacherId?.employeeName || t('studentDiscipline.common.unknownTeacher')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                      {moment(fb.feedbackDate || fb.createdAt).format('MMM DD, YYYY')}
                    </Typography>
                    <Box
                      sx={{
                        mt: 1.5,
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: alpha(themeColors.error, 0.06),
                        border: `1px solid ${alpha(themeColors.error, 0.15)}`,
                      }}
                    >
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: themeColors.text.primary }}>
                        {fb.feedback}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: themeColors.text.primary }}>
          {t('studentDiscipline.subject.title')}
        </Typography>

        {subjectLoading ? (
          <Typography sx={{ color: themeColors.text.secondary }}>{t('studentDiscipline.loading')}</Typography>
        ) : subjectGroups.length === 0 ? (
          <Typography sx={{ color: themeColors.text.secondary }}>{t('studentDiscipline.subject.none')}</Typography>
        ) : (
          subjectGroups.map((group) => (
            <Accordion
              key={group.subjectName}
              sx={{
                mb: 2,
                borderRadius: 2,
                border: `1px solid ${themeColors.border.primary}`,
                backgroundColor: themeColors.background.primary,
                '&:before': { display: 'none' },
              }}
              defaultExpanded={false}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2 }}>
                <Typography sx={{ fontWeight: 700, color: themeColors.text.primary }}>{group.subjectName}</Typography>
                <Typography sx={{ ml: 1, color: themeColors.text.secondary }}>({group.items.length})</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                <Grid container spacing={2}>
                  {group.items.map((fb) => (
                    <Grid item xs={12} md={6} key={fb._id}>
                      <Card
                        sx={{
                          borderRadius: 3,
                          border: `1px solid ${themeColors.border.primary}`,
                          background: `linear-gradient(145deg, ${themeColors.background.primary} 0%, ${themeColors.background.secondary} 100%)`,
                        }}
                      >
                        <CardContent>
                          <Typography sx={{ fontWeight: 700, color: themeColors.text.primary }}>
                            {fb?.teacherId?.employeeName || t('studentDiscipline.common.unknownTeacher')}
                          </Typography>
                          <Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
                            {moment(fb.feedbackDate || fb.createdAt).format('MMM DD, YYYY')}
                          </Typography>
                          <Box
                            sx={{
                              mt: 1.5,
                              p: 1.5,
                              borderRadius: 2,
                              backgroundColor: alpha(themeColors.error, 0.06),
                              border: `1px solid ${alpha(themeColors.error, 0.15)}`,
                            }}
                          >
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: themeColors.text.primary }}>
                              {fb.feedback}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Box>
    </CustomOutletBox>
  );
};

export default StudentDiscipline;

