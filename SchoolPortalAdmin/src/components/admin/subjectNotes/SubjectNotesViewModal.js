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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
  CircularProgress
} from '@mui/material';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import { ICONS } from '../../../assets/icons';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

const SubjectNotesViewModal = ({ open, onClose, item, loading = false }) => {
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getFileIcon = (mimeType, isLink) => {
    // For links, show a link icon
    if (isLink) return <ICONS.Link.component color="primary" />;
    
    if (mimeType && mimeType.includes('pdf')) return <ICONS.PictureAsPdf.component color="error" />;
    if (mimeType && mimeType.includes('word')) return <ICONS.Description.component color="primary" />;
    if (mimeType && (mimeType.includes('powerpoint') || mimeType.includes('presentation'))) return <ICONS.Slideshow.component color="warning" />;
    if (mimeType && mimeType.includes('image')) return <ICONS.Image.component color="success" />;
    return <ICONS.AttachFile.component />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return `0 ${t('subjectNotes.viewModal.fileSize.bytes')}`;
    const k = 1024;
    const sizes = [
      t('subjectNotes.viewModal.fileSize.bytes'),
      t('subjectNotes.viewModal.fileSize.kb'),
      t('subjectNotes.viewModal.fileSize.mb'),
      t('subjectNotes.viewModal.fileSize.gb')
    ];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = (doc) => {
    // If document is a link, open it in a new tab
    if (doc.isLink || doc.linkUrl) {
      const linkUrl = doc.linkUrl || doc.filePath;
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // For uploaded files, use S3 pre-signed URL
    const fileUrl = doc.downloadUrl || doc.filePath;
    
    // Create a temporary link to download the file
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = doc.originalName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        {t('subjectNotes.viewModal.title')}
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
                    {item.title}
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
                    {item.priority && (
                      <Chip 
                        label={t('subjectNotes.viewModal.priority', { priority: item.priority })} 
                        color={getPriorityColor(item.priority)}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {item.tags && item.tags.map((tag, index) => (
                      <Chip 
                        key={index}
                        label={tag} 
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box display="flex" flexDirection="column" alignItems="flex-end">
                    <Typography variant="body2" color="text.secondary">
                      {t('subjectNotes.viewModal.views', { count: item.viewCount || 0 })}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t('subjectNotes.viewModal.documents', { count: item.documents?.length || 0 })}
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
                {t('subjectNotes.viewModal.classSubjectInformation')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="text.secondary">{t('subjectNotes.viewModal.academicYear')}</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {item.academicYear?.academicYear || t('subjectNotes.notAvailable')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="text.secondary">{t('subjectNotes.viewModal.grade')}</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {item.grade?.gradeName || t('subjectNotes.notAvailable')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Typography variant="body2" color="text.secondary">{t('subjectNotes.viewModal.subject')}</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {item.subject?.subjectName || t('subjectNotes.notAvailable')}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Documents */}
          {item.documents && item.documents.length > 0 && (
            <Card sx={{ mb: 3, border: `1px solid ${themeColors.border.primary}` }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
                  {t('subjectNotes.viewModal.documentsSection', { count: item.documents.length })}
                </Typography>
                <List>
                  {item.documents.map((doc, index) => (
                    <React.Fragment key={doc._id}>
                      <ListItem
                        sx={{
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: themeColors.background.secondary
                          }
                        }}
                        onClick={() => handleDownload(doc)}
                      >
                        <ListItemIcon>
                          {getFileIcon(doc.mimeType, doc.isLink)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="body2" fontWeight="medium">
                                {doc.originalName}
                              </Typography>
                              {doc.isLink ? (
                                <ICONS.Link.component fontSize="small" color="primary" />
                              ) : (
                                <ICONS.Download.component fontSize="small" color="action" />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" color="text.secondary">
                                {doc.isLink ? (
                                  t('subjectNotes.viewModal.link')
                                ) : (
                                  `${formatFileSize(doc.fileSize)} • ${t('subjectNotes.viewModal.uploaded', { date: moment(doc.uploadedAt).format('MMM DD, YYYY') })}`
                                )}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < item.documents.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}

          {/* Published Classes */}
            <Card sx={{ mb: 3, border: `1px solid ${themeColors.border.primary}` }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
                  {t('subjectNotes.viewModal.publishedClasses')}
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
                          {t('subjectNotes.viewModal.gender')}
                        </Typography>
                        <Typography variant="body1" fontWeight="medium" textTransform="capitalize" sx={{ mb: 1 }}>
                          {published.gender || t('subjectNotes.notAvailable')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {t('subjectNotes.viewModal.section')}
                        </Typography>
                        <Typography variant="body1" fontWeight="medium" sx={{ mb: 1 }}>
                          {published.section?.sectionName || t('subjectNotes.notAvailable')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {t('subjectNotes.viewModal.publishedDate')}
                        </Typography>
                        <Typography variant="body2" fontWeight="medium" sx={{ mb: 1 }}>
                          {published.publishedAt ? moment(published.publishedAt).format('MMMM DD, YYYY [at] h:mm A') : t('subjectNotes.notAvailable')}
                        </Typography>
                        {published.publishedBy && (
                          <>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              {t('subjectNotes.viewModal.publishedBy')}
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              {published.publishedBy?.name || t('subjectNotes.notAvailable')}
                            </Typography>
                          </>
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  {t('subjectNotes.viewModal.noPublishedClasses')}
                </Typography>
              )}
              </CardContent>
            </Card>

          {/* Metadata */}
          <Card sx={{ border: `1px solid ${themeColors.border.primary}` }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
                {t('subjectNotes.viewModal.metadata')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">{t('subjectNotes.viewModal.createdBy')}</Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                      {item.createdBy?.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" fontWeight="medium">
                      {item.createdBy?.name || t('subjectNotes.notAvailable')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">{t('subjectNotes.viewModal.createdDate')}</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {moment(item.createdAt).format('MMMM DD, YYYY [at] h:mm A')}
                  </Typography>
                </Grid>
                {item.updatedBy && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">{t('subjectNotes.viewModal.lastUpdatedBy')}</Typography>
                      <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                          {item.updatedBy?.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" fontWeight="medium">
                          {item.updatedBy?.name || t('subjectNotes.notAvailable')}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">{t('subjectNotes.viewModal.lastUpdated')}</Typography>
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
          {t('subjectNotes.viewModal.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubjectNotesViewModal;
