import React, { useState, useEffect, useRef } from 'react';
import {
	Box,
	Typography,
	Button,
	Card,
	CardContent,
	Grid,
	TextField,
	MenuItem,
	Alert,
	CircularProgress,
	List,
	ListItem,
	ListItemText,
	ListItemIcon,
	ListItemSecondaryAction,
	IconButton,
	Breadcrumbs,
	Link
} from '@mui/material';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import { useSnackbar } from '../../../hooks/SnackBar';
import { ICONS } from '../../../assets/icons';
import CustomSelect from '../../../components/Common/CustomSelect';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useGetAcademicYearQuery } from '../../../Redux/features/commonSlice';
import { useLazyGetMyGradePermissionsQuery, useLazyGetMyTeacherSubjectsQuery } from '../../../Redux/features/Admin/TeachersSlice';
import {
	useGetSubjectNoteQuery,
	useUpdateSubjectNoteMutation,
	useRemoveDocumentMutation
} from '../../../Redux/features/Admin/subjectNotesApiSlice';
import { useAbility } from '../../../AbilityContext';
import { useTranslation } from 'react-i18next';
import { skipToken } from '@reduxjs/toolkit/query/react';
import moment from 'moment';

const EditSubjectNotesScreen = () => {
	const { themeColors } = useThemeContext();
	const showSnackbar = useSnackbar();
	const navigate = useNavigate();
	const { id } = useParams();
	const ability = useAbility();
	const { t } = useTranslation();
	const { data: academicYears } = useGetAcademicYearQuery();
	const {
		data: noteResponse,
		isFetching: noteLoading,
		error: noteError
	} = useGetSubjectNoteQuery(id ?? skipToken);
	const currentSubjectNote = noteResponse?.data;

	const [updateSubjectNote, { isLoading: updating, isSuccess: updateSuccess, error: updateError }] =
		useUpdateSubjectNoteMutation();
	const [removeDocument] = useRemoveDocumentMutation();
	// Form state
	const [formData, setFormData] = useState({
		title: '',
		description: '',
		academicYear: '',
		grade: '',
		subject: '',
		tags: '',
		status: 'draft'
	});

	const [selectedFiles, setSelectedFiles] = useState([]);
	const [existingDocuments, setExistingDocuments] = useState([]);

	// Form control for CustomSelect components
	const { control, setValue } = useForm({
		defaultValues: {
			academicYear: '',
			grade: '',
			subject: '',
			status: 'draft'
		}
	});

	// Permission queries - only need grade and subject permissions now
	const [getGradePermissions, { data: grades }] = useLazyGetMyGradePermissionsQuery();
	const [getTeacherSubjects, { data: teacherSubjects }] = useLazyGetMyTeacherSubjectsQuery();

	// Refs to track the last triggered values for cascading filters
	const lastGradeId = useRef(null);

	// Load permissions - only grades initially
	useEffect(() => {
		getGradePermissions({});
	}, [getGradePermissions]);

	// Load subjects when grade is selected
	useEffect(() => {
		if (formData.grade && formData.grade !== lastGradeId.current) {
			lastGradeId.current = formData.grade;
			getTeacherSubjects({ grade: formData.grade });
		}
	}, [formData.grade, getTeacherSubjects]);

	// Initialize form data when note is loaded
	useEffect(() => {
		if (currentSubjectNote) {
			const noteData = {
				title: currentSubjectNote.title || '',
				description: currentSubjectNote.description || '',
				academicYear: currentSubjectNote.academicYear?._id || '',
				grade: currentSubjectNote.grade?._id || '',
				subject: currentSubjectNote.subject?._id || '',
				tags: currentSubjectNote.tags?.join(', ') || '',
				status: currentSubjectNote.status || 'draft'
			};

			setFormData(noteData);
			setExistingDocuments(currentSubjectNote.documents || []);

			// Set form values for CustomSelect components
			setValue('academicYear', noteData.academicYear);
			setValue('grade', noteData.grade);
			setValue('subject', noteData.subject);
			setValue('status', noteData.status);
		}
	}, [currentSubjectNote, setValue]);


	useEffect(() => {
		if (updateSuccess) {
			showSnackbar(t('subjectNotes.edit.messages.updateSuccess'), 'success');
			navigate('/subject-notes');
		}
	}, [updateSuccess, navigate, showSnackbar, t]);

	useEffect(() => {
		if (updateError) {
			const message = updateError?.data?.message || updateError?.message || t('subjectNotes.edit.messages.error');
			showSnackbar(message, 'error');
		}
	}, [updateError, showSnackbar, t]);

	useEffect(() => {
		if (noteError) {
			const message = noteError?.data?.message || noteError?.message || t('subjectNotes.edit.messages.error');
			showSnackbar(message, 'error');
		}
	}, [noteError, showSnackbar, t]);

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
		if (window.confirm(t('subjectNotes.edit.confirmRemoveDocument'))) {
			await removeDocument({ id: currentSubjectNote._id, documentId }).unwrap();
			setExistingDocuments(prev => prev.filter(doc => doc._id !== documentId));
		}
	};

	const handleSubmit = async () => {
		// Validation
		if (!formData.title || !formData.description || !formData.subject) {
			showSnackbar(t('subjectNotes.edit.validation.fillRequiredFields'), 'error');
			return;
		}

		// Documents are optional - no validation needed

		// Prepare form data
		const submitData = new FormData();
		submitData.append('title', formData.title);
		submitData.append('description', formData.description);
		submitData.append('tags', formData.tags);
		submitData.append('status', formData.status);

		// Add files
		selectedFiles.forEach(file => {
			submitData.append('documents', file);
		});

		await updateSubjectNote({ id: currentSubjectNote._id, formData: submitData }).unwrap();
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

	if (noteLoading && !currentSubjectNote) {
		return (
			<Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box sx={{
			p: 3,
			backgroundColor: themeColors.background.primary,
			minHeight: '100vh'
		}}>
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
					onClick={() => navigate('/subject-notes')}
				>
					{t('subjectNotes.title')}
				</Link>
				<Typography sx={{ color: themeColors.text.primary }}>
					{t('subjectNotes.edit.title')}
				</Typography>
			</Breadcrumbs>

			{/* Header */}
			<Box display="flex" justifyContent="flex-end" alignItems="center" mb={3}>
				{ability.can("Edit", "SubjectNotes") && <Button
					variant="contained"
					onClick={handleSubmit}
				disabled={updating}
				startIcon={updating ? <CircularProgress size={20} /> : <ICONS.Save.component />}
					sx={{
						backgroundColor: themeColors.primary,
						color: themeColors.text.inverse,
						'&:hover': {
							backgroundColor: themeColors.primary,
							opacity: 0.9
						}
					}}
				>
					{updating ? t('subjectNotes.edit.updating') : t('subjectNotes.edit.updateNote')}
				</Button>}
			</Box>

			{/* Error Alert */}
			{updateError && (
				<Alert severity="error" sx={{ mb: 3 }}>
					{updateError?.data?.message || updateError?.message || t('subjectNotes.edit.messages.error')}
				</Alert>
			)}

			{/* Class Information Display */}
			<Card sx={{
				mb: 3,
				border: `1px solid ${themeColors.border.primary}`,
				backgroundColor: themeColors.background.secondary
			}}>
				<CardContent>
					<Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
						{t('subjectNotes.edit.classInformation')}
					</Typography>
					<Grid container spacing={2}>
						<Grid item xs={12} sm={6} md={4}>
							<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>{t('subjectNotes.edit.academicYear')}</Typography>
							<Typography variant="body1" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
								{currentSubjectNote?.academicYear?.academicYear || t('subjectNotes.edit.notAvailable')}
							</Typography>
						</Grid>
						<Grid item xs={12} sm={6} md={4}>
							<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>{t('subjectNotes.edit.grade')}</Typography>
							<Typography variant="body1" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
								{currentSubjectNote?.grade?.gradeName || t('subjectNotes.edit.notAvailable')}
							</Typography>
						</Grid>
						<Grid item xs={12} sm={6} md={4}>
							<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>{t('subjectNotes.edit.form.subject')}</Typography>
							<Typography variant="body1" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
								{currentSubjectNote?.subject?.subjectName || t('subjectNotes.edit.notAvailable')}
							</Typography>
						</Grid>
					</Grid>
				</CardContent>
			</Card>

			{/* Published Classes */}
			{currentSubjectNote?.publishedClasses && currentSubjectNote.publishedClasses.length > 0 && (
				<Card sx={{
					mb: 3,
					border: `1px solid ${themeColors.border.primary}`,
					backgroundColor: themeColors.background.secondary
				}}>
					<CardContent>
						<Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
							{t('subjectNotes.edit.publishedClasses')}
						</Typography>
						<Grid container spacing={2}>
							{currentSubjectNote.publishedClasses.map((published, index) => (
								<Grid item xs={12} sm={6} md={4} key={index}>
									<Box sx={{
										p: 2,
										border: `1px solid ${themeColors.border.primary}`,
										borderRadius: 1,
										backgroundColor: themeColors.background.primary
									}}>
										<Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
											{t('subjectNotes.edit.gender')}
										</Typography>
										<Typography variant="body1" fontWeight="medium" textTransform="capitalize" sx={{ mb: 1, color: themeColors.text.primary }}>
											{published.gender || t('subjectNotes.edit.notAvailable')}
										</Typography>
										<Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
											{t('subjectNotes.edit.section')}
										</Typography>
										<Typography variant="body1" fontWeight="medium" sx={{ mb: 1, color: themeColors.text.primary }}>
											{published.section?.sectionName || t('subjectNotes.edit.notAvailable')}
										</Typography>
										<Typography variant="body2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
											{t('subjectNotes.edit.publishedDate')}
										</Typography>
										<Typography variant="body2" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
											{published.publishedAt ? moment(published.publishedAt).format('MMMM DD, YYYY [at] h:mm A') : t('subjectNotes.edit.notAvailable')}
										</Typography>
									</Box>
								</Grid>
							))}
						</Grid>
					</CardContent>
				</Card>
			)}

			{/* Note Form */}
			<Card sx={{
				mb: 3,
				border: `1px solid ${themeColors.border.primary}`,
				backgroundColor: themeColors.background.secondary
			}}>
				<CardContent>
					<Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: themeColors.text.primary }}>
						{t('subjectNotes.edit.noteInformation')}
					</Typography>

					<Grid container spacing={3}>
						<Grid item xs={12} md={6}>
							<TextField
								fullWidth
								label={t('subjectNotes.edit.form.title')}
								value={formData.title}
								onChange={(e) => handleInputChange('title', e.target.value)}
								error={!formData.title}
								helperText={!formData.title ? t('subjectNotes.edit.form.titleRequired') : ''}
								placeholder={t('subjectNotes.edit.form.enterNoteTitle')}
								sx={{
									'& .MuiOutlinedInput-root': {
										backgroundColor: themeColors.background.primary,
										'& fieldset': {
											borderColor: themeColors.border.primary,
										},
										'&:hover fieldset': {
											borderColor: themeColors.primary.main,
										},
										'&.Mui-focused fieldset': {
											borderColor: themeColors.primary.main,
										},
									},
									'& .MuiInputLabel-root': {
										color: themeColors.text.primary,
									},
									'& .MuiOutlinedInput-input': {
										color: themeColors.text.primary,
									}
								}}
							/>
						</Grid>

						<Grid item xs={12} md={6}>
							<Typography variant="body2" sx={{ mb: 1, color: themeColors.text.secondary }}>{t('subjectNotes.edit.form.subject')}</Typography>
							<Typography variant="body1" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
								{currentSubjectNote?.subject?.subjectName || t('subjectNotes.edit.notAvailable')}
							</Typography>
						</Grid>

						<Grid item xs={12}>
							<TextField
								fullWidth
								label={t('subjectNotes.edit.form.description')}
								multiline
								rows={4}
								value={formData.description}
								onChange={(e) => handleInputChange('description', e.target.value)}
								error={!formData.description}
								helperText={!formData.description ? t('subjectNotes.edit.form.descriptionRequired') : ''}
								placeholder={t('subjectNotes.edit.form.enterDetailedDescription')}
								sx={{
									'& .MuiOutlinedInput-root': {
										backgroundColor: themeColors.background.primary,
										'& fieldset': {
											borderColor: themeColors.border.primary,
										},
										'&:hover fieldset': {
											borderColor: themeColors.primary.main,
										},
										'&.Mui-focused fieldset': {
											borderColor: themeColors.primary.main,
										},
									},
									'& .MuiInputLabel-root': {
										color: themeColors.text.primary,
									},
									'& .MuiOutlinedInput-input': {
										color: themeColors.text.primary,
									}
								}}
							/>
						</Grid>

						<Grid item xs={12} md={6}>
							<CustomSelect
								fieldName="status"
								control={control}
								fieldLabel={t('subjectNotes.edit.form.status')}
								onChangeValue={(value) => handleInputChange('status', value)}
							>
								<MenuItem value="draft">{t('subjectNotes.edit.form.draft')}</MenuItem>
								<MenuItem value="published">{t('subjectNotes.edit.form.published')}</MenuItem>
								<MenuItem value="archived">{t('subjectNotes.edit.form.archived')}</MenuItem>
							</CustomSelect>
						</Grid>

						<Grid item xs={12} md={6}>
							<TextField
								fullWidth
								label={t('subjectNotes.edit.form.tags')}
								value={formData.tags}
								onChange={(e) => handleInputChange('tags', e.target.value)}
								placeholder={t('subjectNotes.edit.form.tagsPlaceholder')}
								sx={{
									'& .MuiOutlinedInput-root': {
										backgroundColor: themeColors.background.primary,
										'& fieldset': {
											borderColor: themeColors.border.primary,
										},
										'&:hover fieldset': {
											borderColor: themeColors.primary.main,
										},
										'&.Mui-focused fieldset': {
											borderColor: themeColors.primary.main,
										},
									},
									'& .MuiInputLabel-root': {
										color: themeColors.text.primary,
									},
									'& .MuiOutlinedInput-input': {
										color: themeColors.text.primary,
									}
								}}
							/>
						</Grid>
					</Grid>
				</CardContent>
			</Card>

			{/* Documents Section */}
			<Card sx={{
				mb: 3,
				border: `1px solid ${themeColors.border.primary}`,
				backgroundColor: themeColors.background.secondary
			}}>
				<CardContent>
					<Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
						{t('subjectNotes.edit.documents')}
					</Typography>
					<Typography variant="caption" sx={{ mb: 3, display: 'block', color: themeColors.text.secondary }}>
						{t('subjectNotes.edit.atLeastOneDocumentRequired')}
					</Typography>

					{/* Upload New Files */}
					<Box sx={{ mb: 3 }}>
						<Button
							variant="outlined"
							component="label"
							startIcon={<ICONS.CloudUpload.component />}
							sx={{
								mb: 2,
								borderColor: themeColors.border.primary,
								color: themeColors.text.primary,
								backgroundColor: themeColors.background.primary,
								'&:hover': {
									backgroundColor: themeColors.background.tertiary,
									borderColor: themeColors.primary
								}
							}}
						>
							{t('subjectNotes.edit.uploadAdditionalDocuments')}
							<input
								type="file"
								hidden
								multiple
								accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
								onChange={handleFileChange}
							/>
						</Button>
						<Typography variant="caption" display="block" sx={{ color: themeColors.text.secondary }}>
							{t('subjectNotes.edit.acceptedFormats')}
						</Typography>
					</Box>

					{/* New Files to Upload */}
					{selectedFiles.length > 0 && (
						<Box sx={{ mb: 3 }}>
							<Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: themeColors.text.primary }}>
								{t('subjectNotes.edit.newFilesToUpload')}
							</Typography>
							<List dense>
								{selectedFiles.map((file, index) => (
									<ListItem
										key={index}
										sx={{
											backgroundColor: themeColors.background.primary,
											border: `1px solid ${themeColors.border.primary}`,
											borderRadius: 1,
											mb: 1,
											'&:hover': {
												backgroundColor: themeColors.background.tertiary
											}
										}}
									>
										<ListItemIcon sx={{ color: themeColors.text.primary }}>
											{getFileIcon(file.type)}
										</ListItemIcon>
										<ListItemText
											primary={file.name}
											secondary={formatFileSize(file.size)}
											primaryTypographyProps={{ sx: { color: themeColors.text.primary } }}
											secondaryTypographyProps={{ sx: { color: themeColors.text.secondary } }}
										/>
										<ListItemSecondaryAction>
											<IconButton
												edge="end"
												size="small"
												onClick={() => handleRemoveFile(index)}
												sx={{
													color: themeColors.error,
													'&:hover': {
														backgroundColor: `${themeColors.error}20`
													}
												}}
											>
												<ICONS.Delete.component />
											</IconButton>
										</ListItemSecondaryAction>
									</ListItem>
								))}
							</List>
						</Box>
					)}

					{/* Existing Documents */}
					{existingDocuments.length > 0 && (
						<Box>
							<Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: themeColors.text.primary }}>
								{t('subjectNotes.edit.existingDocuments')}
							</Typography>
							<List dense>
								{existingDocuments.map((doc) => (
									<ListItem
										key={doc._id}
										sx={{
											backgroundColor: themeColors.background.primary,
											border: `1px solid ${themeColors.border.primary}`,
											borderRadius: 1,
											mb: 1,
											'&:hover': {
												backgroundColor: themeColors.background.tertiary
											}
										}}
									>
										<ListItemIcon sx={{ color: themeColors.text.primary }}>
											{getFileIcon(doc.mimeType)}
										</ListItemIcon>
										<ListItemText
											primary={doc.originalName}
											secondary={`${formatFileSize(doc.fileSize)} • ${t('subjectNotes.edit.uploaded')} ${new Date(doc.uploadedAt).toLocaleDateString()}`}
											primaryTypographyProps={{ sx: { color: themeColors.text.primary } }}
											secondaryTypographyProps={{ sx: { color: themeColors.text.secondary } }}
										/>
										<ListItemSecondaryAction>
											<IconButton
												edge="end"
												size="small"
												onClick={() => handleRemoveExistingDocument(doc._id)}
												sx={{
													color: themeColors.error,
													'&:hover': {
														backgroundColor: `${themeColors.error}20`
													}
												}}
											>
												<ICONS.Delete.component />
											</IconButton>
										</ListItemSecondaryAction>
									</ListItem>
								))}
							</List>
						</Box>
					)}

					{existingDocuments.length === 0 && selectedFiles.length === 0 && (
						<Box display="flex" flexDirection="column" alignItems="center" py={3} sx={{
							border: `2px dashed ${themeColors.error}`,
							borderRadius: 2,
							backgroundColor: `${themeColors.error}10`
						}}>
							<ICONS.AttachFile.component sx={{ fontSize: 48, color: themeColors.error, mb: 1 }} />
							<Typography variant="body1" sx={{ color: themeColors.error, fontWeight: 'bold' }}>
								{t('subjectNotes.edit.noDocumentsAttached')}
							</Typography>
						</Box>
					)}
				</CardContent>
			</Card>
		</Box>
	);
};

export default EditSubjectNotesScreen;
