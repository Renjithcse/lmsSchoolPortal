import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  Card,
  CardContent,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from '../../../hooks/SnackBar';
import { ICONS } from '../../../assets/icons';
import CustomSelect from '../../../components/Common/CustomSelect';
import CustomInput from '../../../components/Common/CustomInput';
import CustomTextArea from '../../../components/Common/CustomTextArea';
import { useForm } from 'react-hook-form';
import { useGetAcademicYearQuery } from '../../../Redux/features/commonSlice';
import { useLazyGetMyGradePermissionsQuery, useLazyGetMyGenderPermissionsQuery, useLazyGetMySectionPermissionsQuery } from '../../../Redux/features/Admin/TeachersSlice';
import {
  createSubjectNoteAsync,
  updateSubjectNoteAsync,
  getAvailableSubjectsAsync,
  removeDocumentAsync,
  clearError,
  clearSuccess
} from '../../../Redux/features/Admin/subjectNotesSlice';
import { useTranslation } from 'react-i18next';

const SubjectNotesForm = ({ open, onClose, item, mode }) => {
  const { t } = useTranslation();
  const { themeColors } = useThemeContext();
  const dispatch = useDispatch();
  const showSnackbar = useSnackbar();
  
  const { loading, error, success, availableSubjects } = useSelector(state => state.subjectNotes);
  const { data: academicYears } = useGetAcademicYearQuery();
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    academicYear: '',
    grade: '',
    gender: '',
    section: '',
    subject: '',
    tags: '',
    status: 'draft'
  });

  // Form control for CustomSelect components
  const { control } = useForm({
    defaultValues: {
      academicYear: '',
      grade: '',
      gender: '',
      section: '',
      subject: '',
      status: 'draft'
    }
  });
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingDocuments, setExistingDocuments] = useState([]);
  
  // Permission queries
  const [getGradePermissions, { data: grades }] = useLazyGetMyGradePermissionsQuery();
  const [getGenderPermissions, { data: genders }] = useLazyGetMyGenderPermissionsQuery();
  const [getSectionPermissions, { data: sections }] = useLazyGetMySectionPermissionsQuery();
  
  // Load permissions
  useEffect(() => {
    if (open) {
      getGradePermissions();
      getGenderPermissions();
      getSectionPermissions();
    }
  }, [open, getGradePermissions, getGenderPermissions, getSectionPermissions]);
  
  // Initialize form data when editing
  useEffect(() => {
    if (item && mode === 'edit') {
      setFormData({
        title: item.title || '',
        description: item.description || '',
        academicYear: item.academicYear?._id || '',
        grade: item.grade?._id || '',
        gender: item.gender || '',
        section: item.section?._id || '',
        subject: item.subject?._id || '',
        tags: item.tags?.join(', ') || '',
        status: item.status || 'draft'
      });
      setExistingDocuments(item.documents || []);
    } else {
      setFormData({
        title: '',
        description: '',
        academicYear: '',
        grade: '',
        gender: '',
        section: '',
        subject: '',
        tags: '',
        status: 'draft'
      });
      setExistingDocuments([]);
    }
    setSelectedFiles([]);
  }, [item, mode, open]);
  
  // Load available subjects when class filters change
  useEffect(() => {
    if (formData.academicYear && formData.grade && formData.gender && formData.section) {
      dispatch(getAvailableSubjectsAsync({
        academicYear: formData.academicYear,
        grade: formData.grade,
        gender: formData.gender,
        section: formData.section
      }));
    }
  }, [dispatch, formData.academicYear, formData.grade, formData.gender, formData.section]);
  
  // Handle success/error messages
  useEffect(() => {
    if (success) {
      showSnackbar(mode === 'edit' ? t('subjectNotes.form.messages.updateSuccess') : t('subjectNotes.form.messages.createSuccess'), 'success');
      dispatch(clearSuccess());
      onClose();
    }
    if (error) {
      showSnackbar(error.message || t('subjectNotes.form.messages.error'), 'error');
      dispatch(clearError());
    }
  }, [success, error, showSnackbar, dispatch, onClose, mode, t]);
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };
  
  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleRemoveExistingDocument = async (documentId) => {
    if (window.confirm(t('subjectNotes.form.confirmRemoveDocument'))) {
      await dispatch(removeDocumentAsync({ id: item._id, documentId }));
      setExistingDocuments(prev => prev.filter(doc => doc._id !== documentId));
    }
  };
  
  const handleSubmit = async () => {
    // Validation
    if (!formData.title || !formData.description || !formData.academicYear || 
        !formData.grade || !formData.gender || !formData.section || !formData.subject) {
      showSnackbar(t('subjectNotes.form.validation.fillRequiredFields'), 'error');
      return;
    }
    
    // Check documents requirement
    const totalDocuments = (existingDocuments?.length || 0) + (selectedFiles?.length || 0);
    if (totalDocuments === 0) {
      showSnackbar(t('subjectNotes.form.validation.atLeastOneDocument'), 'error');
      return;
    }
    
    // Prepare form data
    const submitData = new FormData();
    submitData.append('title', formData.title);
    submitData.append('description', formData.description);
    submitData.append('academicYear', formData.academicYear);
    submitData.append('grade', formData.grade);
    submitData.append('gender', formData.gender);
    submitData.append('section', formData.section);
    submitData.append('subject', formData.subject);
    submitData.append('tags', formData.tags);
    submitData.append('status', formData.status);
    
    // Add files
    selectedFiles.forEach(file => {
      submitData.append('documents', file);
    });
    
    if (mode === 'edit') {
      dispatch(updateSubjectNoteAsync({ id: item._id, formData: submitData }));
    } else {
      dispatch(createSubjectNoteAsync(submitData));
    }
  };
  
  const getFileIcon = (mimeType) => {
    if (mimeType.includes('pdf')) return <ICONS.PictureAsPdf.component />;
    if (mimeType.includes('word')) return <ICONS.Description.component />;
    if (mimeType.includes('image')) return <ICONS.Image.component />;
    return <ICONS.AttachFile.component />;
  };
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: themeColors.background.primary,
          border: `1px solid ${themeColors.border.primary}`
        }
      }}
    >
      <DialogTitle sx={{ color: themeColors.text.primary, borderBottom: `1px solid ${themeColors.border.primary}` }}>
        {mode === 'edit' ? t('subjectNotes.edit.title') : t('subjectNotes.create.title')}
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.message || t('subjectNotes.form.messages.error')}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
              {t('subjectNotes.form.basicInformation')}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <CustomInput
              fieldName="title"
              control={control}
              fieldLabel={t('subjectNotes.form.title')}
              placeholder={t('subjectNotes.form.enterNoteTitle')}
              changeValue={(value) => handleInputChange('title', value)}
              error={!formData.title ? { message: t('subjectNotes.form.titleRequired') } : null}
              cust_value={formData.title}
            />
          </Grid>
          
          <Grid item xs={12}>
            <CustomTextArea
              fieldName="description"
              control={control}
              fieldLabel={t('subjectNotes.form.description')}
              placeholder={t('subjectNotes.form.enterDetailedDescription')}
              rows={4}
              changeValue={(value) => handleInputChange('description', value)}
              error={!formData.description ? { message: t('subjectNotes.form.descriptionRequired') } : null}
              defaultValue={formData.description}
            />
          </Grid>
          
          {/* Class Information */}
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
              {t('subjectNotes.form.classInformation')}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <CustomSelect
              fieldName="academicYear"
              control={control}
              fieldLabel={t('subjectNotes.form.academicYear')}
              onChangeValue={(value) => handleInputChange('academicYear', value)}
              error={!formData.academicYear}
            >
              {academicYears?.map((year) => (
                <MenuItem key={year._id} value={year._id}>
                  {year.academicYear}
                </MenuItem>
              ))}
            </CustomSelect>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <CustomSelect
              fieldName="grade"
              control={control}
              fieldLabel={t('subjectNotes.form.grade')}
              onChangeValue={(value) => handleInputChange('grade', value)}
              error={!formData.grade}
            >
              {grades?.data?.map((grade) => (
                <MenuItem key={grade._id} value={grade._id}>
                  {grade.gradeName}
                </MenuItem>
              ))}
            </CustomSelect>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <CustomSelect
              fieldName="gender"
              control={control}
              fieldLabel={t('subjectNotes.form.gender')}
              onChangeValue={(value) => handleInputChange('gender', value)}
              error={!formData.gender}
            >
              {genders?.data?.map((gender) => (
                <MenuItem key={gender} value={gender}>
                  {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </MenuItem>
              ))}
            </CustomSelect>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <CustomSelect
              fieldName="section"
              control={control}
              fieldLabel={t('subjectNotes.form.section')}
              onChangeValue={(value) => handleInputChange('section', value)}
              error={!formData.section}
            >
              {sections?.data?.map((section) => (
                <MenuItem key={section._id} value={section._id}>
                  {section.sectionName}
                </MenuItem>
              ))}
            </CustomSelect>
          </Grid>
          
          <Grid item xs={12}>
            <CustomSelect
              fieldName="subject"
              control={control}
              fieldLabel={t('subjectNotes.form.subject')}
              onChangeValue={(value) => handleInputChange('subject', value)}
              error={!formData.subject}
            >
              {availableSubjects?.map((subject) => (
                <MenuItem key={subject.subjectId} value={subject.subjectId}>
                  {subject.subjectName} {subject.teacherName && `(${subject.teacherName})`}
                </MenuItem>
              ))}
            </CustomSelect>
          </Grid>
          
          {/* Additional Settings */}
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
              {t('subjectNotes.form.settings')}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <CustomSelect
              fieldName="status"
              control={control}
              fieldLabel={t('subjectNotes.form.status')}
              onChangeValue={(value) => handleInputChange('status', value)}
            >
              <MenuItem value="draft">{t('subjectNotes.form.draft')}</MenuItem>
              <MenuItem value="published">{t('subjectNotes.form.published')}</MenuItem>
              <MenuItem value="archived">{t('subjectNotes.form.archived')}</MenuItem>
            </CustomSelect>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <CustomInput
              fieldName="tags"
              control={control}
              fieldLabel={t('subjectNotes.form.tags')}
              placeholder={t('subjectNotes.form.tagsPlaceholder')}
              changeValue={(value) => handleInputChange('tags', value)}
              cust_value={formData.tags}
            />
          </Grid>
          
          {/* File Upload */}
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
              {t('subjectNotes.form.documents')}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<ICONS.CloudUpload.component />}
              sx={{ mb: 2 }}
            >
              {t('subjectNotes.form.uploadDocuments')}
              <input
                type="file"
                hidden
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                onChange={handleFileChange}
              />
            </Button>
            <Typography variant="caption" display="block" color="text.secondary">
              {t('subjectNotes.form.acceptedFormats')}
            </Typography>
          </Grid>
          
          {/* New Files */}
          {selectedFiles.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                {t('subjectNotes.form.newFilesToUpload')}
              </Typography>
              <List dense>
                {selectedFiles.map((file, index) => (
                  <ListItem key={index}>
                    <Box sx={{ mr: 1 }}>
                      {getFileIcon(file.type)}
                    </Box>
                    <ListItemText
                      primary={file.name}
                      secondary={formatFileSize(file.size)}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleRemoveFile(index)}
                      >
                        <ICONS.Delete.component />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Grid>
          )}
          
          {/* Existing Documents */}
          {existingDocuments.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                {t('subjectNotes.form.existingDocuments')}
              </Typography>
              <List dense>
                {existingDocuments.map((doc) => (
                  <ListItem key={doc._id}>
                    <Box sx={{ mr: 1 }}>
                      {getFileIcon(doc.mimeType)}
                    </Box>
                    <ListItemText
                      primary={doc.originalName}
                      secondary={formatFileSize(doc.fileSize)}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleRemoveExistingDocument(doc._id)}
                      >
                        <ICONS.Delete.component />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: `1px solid ${themeColors.border.primary}` }}>
        <Button onClick={onClose} disabled={loading}>
          {t('subjectNotes.form.actions.cancel')}
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? t('subjectNotes.form.actions.saving') : (mode === 'edit' ? t('subjectNotes.form.actions.update') : t('subjectNotes.form.actions.create'))}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubjectNotesForm;
