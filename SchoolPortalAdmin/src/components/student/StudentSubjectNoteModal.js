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
  ListItemSecondaryAction,
  Divider,
  Avatar,
  IconButton,
  Paper,
  Fade,
  Zoom,
  Slide
} from '@mui/material';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { ICONS } from '../../assets/icons';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

const StudentSubjectNoteModal = ({ open, onClose, note, onDownload }) => {
  const { t } = useTranslation();
  const { themeColors } = useThemeContext();

  if (!note) return null;

  const getFileIcon = (mimeType, isLink) => {
    // For links, show a link icon
    if (isLink) return <ICONS.Link.component color="primary" />;
    
    if (mimeType && mimeType.includes('pdf')) return <ICONS.PictureAsPdf.component color="error" />;
    if (mimeType && mimeType.includes('word')) return <ICONS.Description.component color="primary" />;
    if (mimeType && (mimeType.includes('powerpoint') || mimeType.includes('presentation'))) return <ICONS.Slideshow.component color="warning" />;
    if (mimeType && mimeType.includes('image')) return <ICONS.Image.component color="success" />;
    return <ICONS.AttachFile.component />;
  };

  const handleDocumentClick = (doc, noteId) => {
    // If document is a link, open it in a new tab
    if (doc.isLink || doc.linkUrl) {
      const linkUrl = doc.linkUrl || doc.filePath;
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    
    // For uploaded files, use the download function
    onDownload(noteId, doc._id, doc.originalName);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return t('studentSubjectNoteModal.fileSize.zeroBytes');
    const k = 1024;
    const sizes = [
      t('studentSubjectNoteModal.fileSize.bytes'),
      t('studentSubjectNoteModal.fileSize.kb'),
      t('studentSubjectNoteModal.fileSize.mb'),
      t('studentSubjectNoteModal.fileSize.gb')
    ];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        <Box display="flex" alignItems="center" gap={2}>
          <ICONS.Note.component />
          {t('studentSubjectNoteModal.title')}
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {/* Header Information */}
          <Card sx={{ mb: 3, border: `1px solid ${themeColors.border.primary}` }}>
            <CardContent>
              <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
                {note.title}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                {note.description}
              </Typography>
              
              <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
                <Chip 
                  label={t('studentSubjectNoteModal.priority', { priority: note.priority })} 
                  color={getPriorityColor(note.priority)}
                  size="small"
                  variant="outlined"
                />
                {note.tags && note.tags.map((tag, index) => (
                  <Chip 
                    key={index}
                    label={tag} 
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">{t('studentSubjectNoteModal.fieldLabel.subject')}</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {note.subject?.subjectName || t('studentSubjectNoteModal.notAvailable')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">{t('studentSubjectNoteModal.fieldLabel.class')}</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {note.grade?.gradeName} - {note.publishedSection?.sectionName} ({note.publishedGender})
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Documents Section */}
          {note.documents && note.documents.length > 0 && (
            <Card sx={{ mb: 3, border: `1px solid ${themeColors.border.primary}` }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <ICONS.AttachFile.component />
                    {t('studentSubjectNoteModal.documents.title', { count: note.documents.length })}
                  </Box>
                </Typography>
                <List>
                  {note.documents.map((doc, index) => (
                    <React.Fragment key={doc._id}>
                      <ListItem
                        sx={{
                          cursor: 'pointer',
                          borderRadius: 1,
                          '&:hover': {
                            backgroundColor: themeColors.background.secondary
                          }
                        }}
                        onClick={() => handleDocumentClick(doc, note._id)}
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
                                  t('studentSubjectNoteModal.documents.link')
                                ) : (
                                  `${formatFileSize(doc.fileSize)} • ${t('studentSubjectNoteModal.documents.uploaded', { date: moment(doc.uploadedAt).format('MMM DD, YYYY') })}`
                                )}
                              </Typography>
                            </Box>
                          }
                        />
                        {!doc.isLink && (
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDownload(note._id, doc._id, doc.originalName, doc);
                            }}
                              sx={{ 
                                backgroundColor: themeColors.primary.main,
                                color: 'white',
                                '&:hover': {
                                  backgroundColor: themeColors.primary.dark
                                }
                              }}
                            >
                              <ICONS.Download.component />
                            </IconButton>
                          </ListItemSecondaryAction>
                        )}
                      </ListItem>
                      {index < note.documents.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}

          {/* No Documents Message */}
          {(!note.documents || note.documents.length === 0) && (
            <Card sx={{ mb: 3, border: `1px solid ${themeColors.border.primary}` }}>
              <CardContent>
                <Box display="flex" flexDirection="column" alignItems="center" py={3}>
                  <ICONS.AttachFile.component sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body1" color="text.secondary">
                    {t('studentSubjectNoteModal.documents.noDocuments')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Metadata */}
          <Card sx={{ border: `1px solid ${themeColors.border.primary}` }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <ICONS.Info.component />
                  {t('studentSubjectNoteModal.information.title')}
                </Box>
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">{t('studentSubjectNoteModal.information.createdBy')}</Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                      {note.createdBy?.name?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" fontWeight="medium">
                      {note.createdBy?.name || t('studentSubjectNoteModal.notAvailable')}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">{t('studentSubjectNoteModal.information.publishedDate')}</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {moment(note.publishedAt || note.createdAt).format('MMMM DD, YYYY [at] h:mm A')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">{t('studentSubjectNoteModal.information.academicYear')}</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {note.academicYear?.academicYear || t('studentSubjectNoteModal.notAvailable')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">{t('studentSubjectNoteModal.information.views')}</Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <ICONS.Visibility.component fontSize="small" color="action" />
                    <Typography variant="body2" fontWeight="medium">
                      {t('studentSubjectNoteModal.information.viewsCount', { count: note.viewCount || 0 })}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: `1px solid ${themeColors.border.primary}` }}>
        <Button onClick={onClose} variant="contained">
          {t('studentSubjectNoteModal.actions.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StudentSubjectNoteModal;
