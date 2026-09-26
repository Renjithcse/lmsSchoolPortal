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
	Chip,
	IconButton,
	Alert,
	CircularProgress,
	List,
	ListItem,
	ListItemText,
	ListItemIcon,
	ListItemSecondaryAction,
	Divider,
	Paper,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Checkbox,
	FormControlLabel,
	FormGroup
} from '@mui/material';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import { useSnackbar } from '../../../hooks/SnackBar';
import { ICONS } from '../../../assets/icons';
import CustomSelect from '../../../components/Common/CustomSelect';
import CustomMultiSelect from '../../../components/Common/CustomMultiSelect';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { 
	useLazyGetMyGradePermissionsQuery,
	useLazyGetMyTeacherSubjectsQuery
} from '../../../Redux/features/Admin/TeachersSlice';
import {
	useCreateSubjectNoteMutation,
	usePublishSubjectNoteMutation,
	useLazyGetAvailablePublishSectionsQuery
} from '../../../Redux/features/Admin/subjectNotesApiSlice';
import { useAbility } from '../../../AbilityContext';
import { useTranslation } from 'react-i18next';

const CreateSubjectNotesScreen = () => {
	const { themeColors } = useThemeContext();
	const showSnackbar = useSnackbar();
	const navigate = useNavigate();
	const ability = useAbility();
	const { t } = useTranslation();

	const [createSubjectNote, { isLoading: creating, isSuccess: createSuccess, error: createError }] =
		useCreateSubjectNoteMutation();
	const [publishSubjectNote, { isLoading: publishing, error: publishError }] =
		usePublishSubjectNoteMutation();
	const [loadPublishSections] = useLazyGetAvailablePublishSectionsQuery();

	// Basic info state (Grade and Subject only)
	const [basicInfo, setBasicInfo] = useState({
		grade: '',
		subject: ''
	});

	// Note state
	const [note, setNote] = useState({
		title: '',
		description: '',
		tags: '',
		documents: [], // Array of { type: 'upload' | 'link', file: File | null, linkUrl: string, fileName: string }
		status: 'draft'
	});

	const [basicInfoLocked, setBasicInfoLocked] = useState(false);
	const [publishModalOpen, setPublishModalOpen] = useState(false);
	const [createdNoteId, setCreatedNoteId] = useState(null);
	const [selectedGender, setSelectedGender] = useState('');
	const [selectedSections, setSelectedSections] = useState([]);
	const [availablePublishSections, setAvailablePublishSections] = useState([]);
	const [linkDialogOpen, setLinkDialogOpen] = useState(false);
	const [linkUrl, setLinkUrl] = useState('');
	const [linkName, setLinkName] = useState('');

	// Form control
	const { control, setValue } = useForm({
		defaultValues: {
			grade: '',
			subject: ''
		}
	});

	// Permission queries
	const [getGradePermissions, { data: grades }] = useLazyGetMyGradePermissionsQuery();
	const [getTeacherSubjects, { data: teacherSubjects, isLoading: subjectsLoading }] = useLazyGetMyTeacherSubjectsQuery();

	// Load permissions - only grades initially
	useEffect(() => {
		getGradePermissions();
	}, [getGradePermissions]);

	// Load teacher's subjects when grade is selected
	useEffect(() => {
		if (basicInfo.grade) {
			getTeacherSubjects({ 
				grade: basicInfo.grade
			});
		}
	}, [basicInfo.grade, getTeacherSubjects]);

	useEffect(() => {
		if (createError) {
			const message = createError?.data?.message || createError?.message || t('subjectNotes.create.messages.error');
			showSnackbar(message, 'error');
		}
	}, [createError, showSnackbar, t]);

	useEffect(() => {
		if (publishError) {
			const message =
				publishError?.data?.message || publishError?.message || t('subjectNotes.create.messages.publishError');
			showSnackbar(message, 'error');
		}
	}, [publishError, showSnackbar, t]);

	const handleBasicInfoChange = (field, value) => {
		setBasicInfo(prev => ({
			...prev,
			[field]: value
		}));
		setValue(field, value);
		
		// Clear subject when grade changes
		if (field === 'grade') {
			setBasicInfo(prev => ({ ...prev, subject: '' }));
			setValue('subject', '');
		}
	};

	const lockBasicInfo = () => {
		if (!basicInfo.grade || !basicInfo.subject) {
			showSnackbar(t('subjectNotes.create.validation.fillAllBasicInfo'), 'error');
			return;
		}
		setBasicInfoLocked(true);
	};

	const unlockBasicInfo = () => {
		setBasicInfoLocked(false);
		setNote({
			title: '',
			description: '',
			tags: '',
			documents: [],
			status: 'draft'
		});
		setCreatedNoteId(null);
	};

	const updateNote = (field, value) => {
		setNote(prev => ({ ...prev, [field]: value }));
	};

	const handleFileUpload = (files) => {
		const fileArray = Array.from(files);
		
		// Validate file sizes (10MB limit)
		const oversizedFiles = fileArray.filter(file => file.size > 10 * 1024 * 1024);
		if (oversizedFiles.length > 0) {
			showSnackbar(t('subjectNotes.create.validation.filesTooLarge', { files: oversizedFiles.map(f => f.name).join(', ') }), 'error');
			return;
		}

		// Validate file types
		const allowedTypes = [
			'application/pdf',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'application/vnd.ms-powerpoint',
			'application/vnd.openxmlformats-officedocument.presentationml.presentation',
			'text/plain',
			'image/jpeg',
			'image/png',
			'image/gif'
		];

		const invalidFiles = fileArray.filter(file => !allowedTypes.includes(file.type));
		if (invalidFiles.length > 0) {
			showSnackbar(t('subjectNotes.create.validation.invalidFileTypes', { files: invalidFiles.map(f => f.name).join(', ') }), 'error');
			return;
		}

		const newDocuments = fileArray.map(file => ({
			type: 'upload',
			file: file,
			linkUrl: '',
			fileName: file.name
		}));

		setNote(prev => ({
			...prev,
			documents: [...prev.documents, ...newDocuments]
		}));
		showSnackbar(t('subjectNotes.create.messages.filesSelected', { count: fileArray.length }), 'success');
	};

	const handleOpenLinkDialog = () => {
		setLinkDialogOpen(true);
		setLinkUrl('');
		setLinkName('');
	};

	const handleCloseLinkDialog = () => {
		setLinkDialogOpen(false);
		setLinkUrl('');
		setLinkName('');
	};

	const handleAddLink = () => {
		if (!linkUrl) {
			showSnackbar(t('subjectNotes.create.validation.invalidUrl'), 'error');
			return;
		}

		// Basic URL validation
		try {
			new URL(linkUrl);
		} catch (e) {
			showSnackbar(t('subjectNotes.create.validation.invalidUrl'), 'error');
			return;
		}

		const fileName = linkName || linkUrl;

		setNote(prev => ({
			...prev,
			documents: [...prev.documents, {
				type: 'link',
				file: null,
				linkUrl: linkUrl,
				fileName: fileName
			}]
		}));
		showSnackbar(t('subjectNotes.create.messages.linkAdded'), 'success');
		handleCloseLinkDialog();
	};

	const removeDocument = (index) => {
		setNote(prev => ({
			...prev,
			documents: prev.documents.filter((_, i) => i !== index)
		}));
	};

	const validateNote = () => {
		if (!note.title || !note.description) {
			showSnackbar(t('subjectNotes.create.validation.fillRequiredFields'), 'error');
			return false;
		}
		// Documents are optional - no validation needed
		return true;
	};

	const handleSubmit = async () => {
		if (!validateNote()) return;

		try {
			const formData = new FormData();
			formData.append('title', note.title);
			formData.append('description', note.description);
			formData.append('grade', basicInfo.grade);
			formData.append('subject', basicInfo.subject);
			formData.append('tags', note.tags);
			formData.append('status', 'draft');

			const uploadedFiles = note.documents.filter(doc => doc.type === 'upload' && doc.file);
			uploadedFiles.forEach(doc => {
				formData.append('documents', doc.file);
			});

			const documentLinks = note.documents
				.filter(doc => doc.type === 'link')
				.map(doc => ({
					linkUrl: doc.linkUrl,
					fileName: doc.fileName
				}));

			if (documentLinks.length > 0) {
				formData.append('documentLinks', JSON.stringify(documentLinks));
			}

			const response = await createSubjectNote(formData).unwrap();
			setCreatedNoteId(response.data._id);
			showSnackbar(t('subjectNotes.create.messages.createSuccess'), 'success');
		} catch (error) {
			showSnackbar(t('subjectNotes.create.messages.error'), 'error');
		}
	};

	const handleOpenPublishModal = async () => {
		if (!createdNoteId) {
			showSnackbar(t('subjectNotes.create.messages.createNoteFirst'), 'warning');
			return;
		}

		setPublishModalOpen(true);
	};

	const handleGenderChange = async (gender) => {
		setSelectedGender(gender);
		setSelectedSections([]);

		if (basicInfo.grade && gender) {
			try {
				const response = await loadPublishSections({
					grade: basicInfo.grade,
					gender,
					subject: basicInfo.subject
				}).unwrap();
				setAvailablePublishSections(response.data || []);
			} catch (error) {
				showSnackbar(t('subjectNotes.create.messages.errorLoadingSections'), 'error');
			}
		}
	};

	const handlePublish = async () => {
		if (!selectedGender || selectedSections.length === 0) {
			showSnackbar(t('subjectNotes.create.validation.selectGenderAndSections'), 'error');
			return;
		}

		try {
			const response = await publishSubjectNote({
				noteId: createdNoteId,
				data: {
					gender: selectedGender,
					sections: selectedSections
				}
			}).unwrap();
			const publishedCount = response.data?.publishedCount || 0;
			showSnackbar(
				t('subjectNotes.create.messages.publishSuccess', { count: publishedCount }),
				'success'
			);
			setPublishModalOpen(false);
			navigate('/subject-notes');
		} catch (error) {
			showSnackbar(t('subjectNotes.create.messages.publishError'), 'error');
		}
	};

	const getFileIcon = (doc) => {
		if (doc.type === 'link') return <ICONS.Link.component />;
		if (doc.file) {
			const mimeType = doc.file.type;
			if (mimeType.includes('pdf')) return <ICONS.PictureAsPdf.component />;
			if (mimeType.includes('word')) return <ICONS.Description.component />;
			if (mimeType.includes('image')) return <ICONS.Image.component />;
		}
		return <ICONS.AttachFile.component />;
	};

	const formatFileSize = (bytes) => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	const getTextFieldStyles = () => ({
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
	});

	return (
		<Box sx={{
			p: 3,
			backgroundColor: themeColors.background.primary,
			minHeight: '100vh'
		}}>
			{/* Header */}
			<Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
				<Box display="flex" alignItems="center" gap={2}>
					<Button
						startIcon={<ICONS.ArrowBack.component />}
						onClick={() => navigate('/subject-notes')}
						sx={{
							color: themeColors.text.primary,
							'&:hover': {
								backgroundColor: themeColors.background.secondary
							}
						}}
					>
						{t('subjectNotes.create.backToSubjectNotes')}
					</Button>
					<Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
						{t('subjectNotes.create.title')}
					</Typography>
				</Box>
						{ability.can("Create", "SubjectNotes") && (
							<Box display="flex" gap={2}>
								{createdNoteId && (
									<Button
										variant="outlined"
										startIcon={<ICONS.Publish.component />}
										onClick={handleOpenPublishModal}
										sx={{
											borderColor: themeColors.primary,
											color: themeColors.primary,
											backgroundColor: themeColors.background.primary,
											'&:hover': {
												backgroundColor: themeColors.background.tertiary,
												borderColor: themeColors.primary
											}
										}}
									>
										{t('subjectNotes.create.publish')}
									</Button>
								)}
								<Button
									variant="contained"
									onClick={handleSubmit}
									disabled={creating || !basicInfoLocked}
									startIcon={creating ? <CircularProgress size={20} /> : <ICONS.Save.component />}
									sx={{
										backgroundColor: themeColors.primary,
										color: themeColors.text.inverse,
										'&:hover': {
											backgroundColor: themeColors.primary,
											opacity: 0.9
										}
									}}
								>
									{creating ? t('subjectNotes.create.creating') : t('subjectNotes.create.createNote')}
								</Button>
							</Box>
						)}
			</Box>

			{/* Error Alert */}
			{createError && (
				<Alert severity="error" sx={{ mb: 3 }}>
					{createError?.data?.message || createError?.message || t('subjectNotes.create.messages.error')}
				</Alert>
			)}

			{/* Basic Information Section */}
			<Card sx={{
				mb: 3,
				border: `1px solid ${themeColors.border.primary}`,
				backgroundColor: themeColors.background.secondary
			}}>
				<CardContent>
					<Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
						<Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
							{t('subjectNotes.create.basicInformation')}
						</Typography>
						{!basicInfoLocked ? (
							<Button
								variant="contained"
								size="small"
								onClick={lockBasicInfo}
								startIcon={<ICONS.Save.component />}
								sx={{
									backgroundColor: themeColors.primary,
									color: themeColors.text.inverse,
									'&:hover': {
										backgroundColor: themeColors.primary,
										opacity: 0.9
									}
								}}
							>
								{t('subjectNotes.create.lockAndContinue')}
							</Button>
						) : (
							<Button
								variant="outlined"
								size="small"
								onClick={unlockBasicInfo}
								startIcon={<ICONS.Edit.component />}
								sx={{
									borderColor: themeColors.border.primary,
									color: themeColors.text.primary,
									backgroundColor: themeColors.background.primary,
									'&:hover': {
										backgroundColor: themeColors.background.tertiary,
										borderColor: themeColors.primary
									}
								}}
							>
								{t('subjectNotes.create.editBasicInfo')}
							</Button>
						)}
					</Box>

					<Grid container spacing={3}>
						<Grid item xs={12} sm={6} md={6}>
							<CustomSelect
								fieldName="grade"
								control={control}
								fieldLabel={t('subjectNotes.create.form.grade')}
								onChangeValue={(value) => handleBasicInfoChange('grade', value)}
								disabled={basicInfoLocked}
							>
								{grades?.data?.map((grade) => (
									<MenuItem key={grade._id} value={grade._id}>
										{grade.gradeName}
									</MenuItem>
								))}
							</CustomSelect>
						</Grid>

						<Grid item xs={12} sm={6} md={6}>
							<CustomSelect
								fieldName="subject"
								control={control}
								fieldLabel={t('subjectNotes.create.form.subject')}
								onChangeValue={(value) => handleBasicInfoChange('subject', value)}
								disabled={basicInfoLocked || !basicInfo.grade || subjectsLoading}
							>
								{subjectsLoading ? (
									<MenuItem disabled>{t('subjectNotes.create.loading')}</MenuItem>
								) : teacherSubjects?.data?.map((subject) => (
									<MenuItem key={subject._id} value={subject._id}>
										{subject.subjectName}
									</MenuItem>
								))}
							</CustomSelect>
						</Grid>
					</Grid>

					{basicInfoLocked && (
						<Box mt={2} p={2} sx={{
							backgroundColor: themeColors.background.primary,
							borderRadius: 1,
							border: `1px solid ${themeColors.border.primary}`
						}}>
							<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
								<strong style={{ color: themeColors.text.primary }}>{t('subjectNotes.create.selectedInfo')}:</strong> {' '}
								<span style={{ color: themeColors.text.primary }}>
									{grades?.data?.find(g => g._id === basicInfo.grade)?.gradeName} - {' '}
									{teacherSubjects?.data?.find(s => s._id === basicInfo.subject)?.subjectName}
								</span>
							</Typography>
						</Box>
					)}
				</CardContent>
			</Card>

			{/* Note Details Section */}
			{basicInfoLocked && (
				<Card sx={{
					mb: 3,
					border: `1px solid ${themeColors.border.primary}`,
					backgroundColor: themeColors.background.secondary
				}}>
					<CardContent>
						<Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: themeColors.text.primary }}>
							{t('subjectNotes.create.noteDetails')}
						</Typography>

						<Grid container spacing={3}>
							<Grid item xs={12}>
								<TextField
									fullWidth
									label={t('subjectNotes.create.form.title')}
									value={note.title}
									onChange={(e) => updateNote('title', e.target.value)}
									error={!note.title}
									helperText={!note.title ? t('subjectNotes.create.form.titleRequired') : ''}
									placeholder={t('subjectNotes.create.form.enterNoteTitle')}
									sx={getTextFieldStyles()}
								/>
							</Grid>

							<Grid item xs={12}>
								<TextField
									fullWidth
									label={t('subjectNotes.create.form.description')}
									multiline
									rows={4}
									value={note.description}
									onChange={(e) => updateNote('description', e.target.value)}
									error={!note.description}
									helperText={!note.description ? t('subjectNotes.create.form.descriptionRequired') : ''}
									placeholder={t('subjectNotes.create.form.enterDetailedDescription')}
									sx={getTextFieldStyles()}
								/>
							</Grid>

							<Grid item xs={12} md={6}>
								<TextField
									fullWidth
									label={t('subjectNotes.create.form.tags')}
									value={note.tags}
									onChange={(e) => updateNote('tags', e.target.value)}
									placeholder={t('subjectNotes.create.form.tagsPlaceholder')}
									sx={getTextFieldStyles()}
								/>
							</Grid>

							{/* Documents Section */}
							<Grid item xs={12}>
								<Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
									{t('subjectNotes.create.documents')}
								</Typography>
								<Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
									{t('subjectNotes.create.atLeastOneDocumentForNote')}
								</Typography>

								<Box display="flex" gap={2} mb={2}>
									<Button
										variant="outlined"
										component="label"
										startIcon={<ICONS.CloudUpload.component />}
										sx={{
											borderColor: (!note.documents || note.documents.length === 0) ? themeColors.error : themeColors.border.primary,
											color: (!note.documents || note.documents.length === 0) ? themeColors.error : themeColors.text.primary,
											backgroundColor: themeColors.background.primary,
											'&:hover': {
												backgroundColor: themeColors.background.tertiary,
												borderColor: (!note.documents || note.documents.length === 0) ? themeColors.error : themeColors.primary,
											}
										}}
									>
										{t('subjectNotes.create.uploadDocuments')}
										<input
											type="file"
											hidden
											multiple
											accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
											onChange={(e) => {
												handleFileUpload(e.target.files);
												e.target.value = '';
											}}
										/>
									</Button>
									<Button
										variant="outlined"
										startIcon={<ICONS.Link.component />}
										onClick={handleOpenLinkDialog}
										sx={{
											borderColor: themeColors.border.primary,
											color: themeColors.text.primary,
											backgroundColor: themeColors.background.primary,
											'&:hover': {
												backgroundColor: themeColors.background.tertiary,
												borderColor: themeColors.primary,
											}
										}}
									>
										{t('subjectNotes.create.addLink')}
									</Button>
								</Box>

								<Typography variant="caption" display="block" sx={{ color: themeColors.text.secondary }}>
									{t('subjectNotes.create.acceptedFormats')}
								</Typography>
								{(!note.documents || note.documents.length === 0) && (
									<Typography variant="caption" display="block" sx={{ color: themeColors.error, mt: 1 }}>
										{t('subjectNotes.create.atLeastOneDocumentRequired')}
									</Typography>
								)}

								{/* Selected Documents */}
								{note.documents.length > 0 && (
									<Box mt={2}>
										<Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: themeColors.text.primary }}>
											{t('subjectNotes.create.selectedFiles', { count: note.documents.length })}
										</Typography>
										<List dense>
											{note.documents.map((doc, index) => (
												<ListItem
													key={index}
													sx={{
														backgroundColor: themeColors.background.secondary,
														border: `1px solid ${themeColors.border.primary}`,
														borderRadius: 1,
														mb: 1,
														'&:hover': {
															backgroundColor: themeColors.background.tertiary
														}
													}}
												>
													<ListItemIcon sx={{ color: themeColors.text.primary }}>
														{getFileIcon(doc)}
													</ListItemIcon>
													<ListItemText
														primary={doc.fileName}
														secondary={doc.type === 'upload' ? formatFileSize(doc.file?.size || 0) : doc.linkUrl}
														primaryTypographyProps={{ color: themeColors.text.primary }}
														secondaryTypographyProps={{ color: themeColors.text.secondary }}
													/>
													<ListItemSecondaryAction>
														<IconButton
															edge="end"
															size="small"
															onClick={() => removeDocument(index)}
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
							</Grid>
						</Grid>
					</CardContent>
				</Card>
			)}

			{/* Add Link Dialog */}
			<Dialog
				open={linkDialogOpen}
				onClose={handleCloseLinkDialog}
				maxWidth="sm"
				fullWidth
				PaperProps={{
					sx: {
						backgroundColor: themeColors.background.secondary,
						color: themeColors.text.primary
					}
				}}
			>
				<DialogTitle sx={{ color: themeColors.text.primary }}>
					{t('subjectNotes.create.addLink')}
				</DialogTitle>
				<DialogContent>
					<Grid container spacing={2} sx={{ mt: 1 }}>
						<Grid item xs={12}>
							<TextField
								fullWidth
								label={t('subjectNotes.create.enterLinkUrl')}
								value={linkUrl}
								onChange={(e) => setLinkUrl(e.target.value)}
								placeholder="https://example.com/document.pdf"
								sx={getTextFieldStyles()}
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField
								fullWidth
								label={t('subjectNotes.create.enterLinkName')}
								value={linkName}
								onChange={(e) => setLinkName(e.target.value)}
								placeholder={t('subjectNotes.create.enterLinkName')}
								sx={getTextFieldStyles()}
							/>
						</Grid>
					</Grid>
				</DialogContent>
				<DialogActions sx={{ p: 2 }}>
					<Button
						onClick={handleCloseLinkDialog}
						sx={{ color: themeColors.text.primary }}
					>
						{t('subjectNotes.create.cancel')}
					</Button>
					<Button
						onClick={handleAddLink}
						disabled={!linkUrl}
						variant="contained"
						sx={{
							backgroundColor: themeColors.primary,
							color: themeColors.text.inverse,
							'&:hover': {
								backgroundColor: themeColors.primary,
								opacity: 0.9
							}
						}}
					>
						{t('subjectNotes.create.addLink')}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Publish Modal */}
			<Dialog
				open={publishModalOpen}
				onClose={() => setPublishModalOpen(false)}
				maxWidth="md"
				fullWidth
				PaperProps={{
					sx: {
						backgroundColor: themeColors.background.secondary,
						color: themeColors.text.primary
					}
				}}
			>
				<DialogTitle sx={{ color: themeColors.text.primary }}>
					{t('subjectNotes.create.publishTitle')}
				</DialogTitle>
				<DialogContent>
					<Grid container spacing={3}>
						<Grid item xs={12}>
							<CustomSelect
								fieldName="publishGender"
								control={control}
								fieldLabel={t('subjectNotes.create.form.gender')}
								onChangeValue={handleGenderChange}
							>
								<MenuItem value="male">{t('subjectNotes.create.gender.male')}</MenuItem>
								<MenuItem value="female">{t('subjectNotes.create.gender.female')}</MenuItem>
							</CustomSelect>
						</Grid>

						{selectedGender && (
							<Grid item xs={12}>
								<Typography variant="subtitle2" sx={{ mb: 1, color: themeColors.text.primary }}>
									{t('subjectNotes.create.selectSections')}
								</Typography>
								<FormGroup>
									{availablePublishSections.map((section) => (
										<FormControlLabel
											key={section._id}
											control={
												<Checkbox
													checked={selectedSections.includes(section._id)}
													onChange={(e) => {
														if (e.target.checked) {
															setSelectedSections([...selectedSections, section._id]);
														} else {
															setSelectedSections(selectedSections.filter(id => id !== section._id));
														}
													}}
													sx={{
														color: themeColors.primary,
														'&.Mui-checked': {
															color: themeColors.primary
														}
													}}
												/>
											}
											label={section.sectionName}
											sx={{ color: themeColors.text.primary }}
										/>
									))}
								</FormGroup>
								{availablePublishSections.length === 0 && (
									<Typography variant="body2" sx={{ color: themeColors.text.secondary, mt: 1 }}>
										{t('subjectNotes.create.noSectionsAvailable')}
									</Typography>
								)}
							</Grid>
						)}
					</Grid>
				</DialogContent>
				<DialogActions sx={{ p: 2 }}>
					<Button
						onClick={() => setPublishModalOpen(false)}
						sx={{ color: themeColors.text.primary }}
					>
						{t('subjectNotes.create.cancel')}
					</Button>
					<Button
						onClick={handlePublish}
						disabled={!selectedGender || selectedSections.length === 0 || publishing}
						variant="contained"
						sx={{
							backgroundColor: themeColors.primary,
							color: themeColors.text.inverse,
							'&:hover': {
								backgroundColor: themeColors.primary,
								opacity: 0.9
							}
						}}
					>
						{publishing ? t('subjectNotes.create.publishing') : t('subjectNotes.create.publish')}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default CreateSubjectNotesScreen;
