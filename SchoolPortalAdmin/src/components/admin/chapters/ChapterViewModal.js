import React from 'react';
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
  Avatar,
  CircularProgress,
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

const ChapterViewModal = ({ open, onClose, item, loading = false }) => {
  const { t } = useTranslation();
  const { themeColors } = useThemeContext();

  if (!item && !loading) return null;

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


  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: themeColors.background.primary,
          border: `1px solid ${themeColors.border.primary}`
        }
      }}
    >
      <DialogTitle sx={{ color: themeColors.text.primary, borderBottom: `1px solid ${themeColors.border.primary}` }}>
        {t('lessonPlans.viewModal.title')}
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        {loading && !item ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 6 }}>
            <CircularProgress />
          </Box>
        ) : item ? (
        <Box sx={{ p: 3 }}>
          {/* Header Information */}
          <Card sx={{ mb: 3, border: `1px solid ${themeColors.border.primary}` }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 1, color: themeColors.text.primary }}>
                    {item.chapterName}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                    {item.description}
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip 
                      label={item.status} 
                      color={getStatusColor(item.status)}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box display="flex" flexDirection="column" alignItems="flex-end">
                    <Typography variant="body2" color="text.secondary">
                      {t('lessonPlans.viewModal.publishCount', { count: item.publishCount || 0 })}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('lessonPlans.viewModal.lessonPlanCount', { count: item.lessonPlans?.length || 0 })}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Class and Subject Information */}
          <Card sx={{ mb: 3, border: `1px solid ${themeColors.border.primary}` }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
                {t('lessonPlans.viewModal.classSubjectInformation')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="text.secondary">{t('lessonPlans.viewModal.academicYear')}</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {item.academicYear?.academicYear || t('lessonPlans.notAvailable')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="text.secondary">{t('lessonPlans.viewModal.grade')}</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {item.grade?.gradeName || t('lessonPlans.notAvailable')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="text.secondary">{t('lessonPlans.viewModal.subject')}</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {item.subject?.subjectName || t('lessonPlans.notAvailable')}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Lesson Plans */}
          {item.lessonPlans && item.lessonPlans.length > 0 && (
            <Card sx={{ mb: 3, border: `1px solid ${themeColors.border.primary}` }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
                  {t('lessonPlans.viewModal.lessonPlansSection', { count: item.lessonPlans.length })}
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: themeColors.background.tertiary }}>
                        <TableCell sx={{ fontWeight: 'bold', color: themeColors.text.primary }}>
                          {t('lessonPlans.viewModal.topic')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: themeColors.text.primary }}>
                          {t('lessonPlans.viewModal.status')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: themeColors.text.primary }}>
                          {t('lessonPlans.viewModal.progress')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: themeColors.text.primary }}>
                          {t('lessonPlans.viewModal.order')}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {item.lessonPlans.map((plan) => (
                        <TableRow key={plan._id}>
                          <TableCell sx={{ color: themeColors.text.primary }}>
                            {plan.topic}
                          </TableCell>
                          <TableCell sx={{ color: themeColors.text.primary }}>
                            <Chip 
                              label={plan.status} 
                              size="small"
                              sx={{
                                backgroundColor: plan.status === 'completed' ? `${themeColors.success}20` : 
                                                plan.status === 'in-progress' ? `${themeColors.warning}20` : 
                                                `${themeColors.text.secondary}20`,
                                color: plan.status === 'completed' ? themeColors.success : 
                                       plan.status === 'in-progress' ? themeColors.warning : 
                                       themeColors.text.secondary
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ color: themeColors.text.primary }}>
                            {plan.progress || 0}%
                          </TableCell>
                          <TableCell sx={{ color: themeColors.text.primary }}>
                            {plan.order || 0}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}

          {/* Published Classes */}
          <Card sx={{ mb: 3, border: `1px solid ${themeColors.border.primary}` }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
                {t('lessonPlans.viewModal.publishedClasses')}
              </Typography>
              {item.publishedClasses && item.publishedClasses.length > 0 ? (
                <Grid container spacing={2}>
                  {item.publishedClasses.map((published, index) => (
                    <Grid item xs={12} sm={6} md={4} key={published._id || index}>
                      <Box sx={{
                        p: 2,
                        border: `1px solid ${themeColors.border.primary}`,
                        borderRadius: 1,
                        backgroundColor: themeColors.background.primary
                      }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {t('lessonPlans.viewModal.gender')}
                        </Typography>
                        <Typography variant="body1" fontWeight="medium" textTransform="capitalize" sx={{ mb: 1 }}>
                          {published.gender || t('lessonPlans.notAvailable')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {t('lessonPlans.viewModal.section')}
                        </Typography>
                        <Typography variant="body1" fontWeight="medium" sx={{ mb: 1 }}>
                          {published.section?.sectionName || t('lessonPlans.notAvailable')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {t('lessonPlans.viewModal.publishedDate')}
                        </Typography>
                        <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                          {published.publishedAt ? moment(published.publishedAt).format('MMMM DD, YYYY [at] h:mm A') : t('lessonPlans.notAvailable')}
                        </Typography>
                        {published.publishedBy && (
                          <>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              {t('lessonPlans.viewModal.publishedBy')}
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {published.publishedBy?.name || t('lessonPlans.notAvailable')}
                            </Typography>
                          </>
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  {t('lessonPlans.viewModal.noPublishedClasses')}
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card sx={{ border: `1px solid ${themeColors.border.primary}` }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
                {t('lessonPlans.viewModal.metadata')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">{t('lessonPlans.viewModal.createdBy')}</Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                      {item.createdBy?.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" fontWeight="medium">
                      {item.createdBy?.name || t('lessonPlans.notAvailable')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">{t('lessonPlans.viewModal.createdDate')}</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {moment(item.createdAt).format('MMMM DD, YYYY [at] h:mm A')}
                  </Typography>
                </Grid>
                {item.updatedBy && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">{t('lessonPlans.viewModal.lastUpdatedBy')}</Typography>
                      <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                          {item.updatedBy?.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" fontWeight="medium">
                          {item.updatedBy?.name || t('lessonPlans.notAvailable')}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">{t('lessonPlans.viewModal.lastUpdated')}</Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {moment(item.updatedAt).format('MMMM DD, YYYY [at] h:mm A')}
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: `1px solid ${themeColors.border.primary}` }}>
        <Button onClick={onClose} variant="contained">
          {t('lessonPlans.viewModal.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChapterViewModal;
