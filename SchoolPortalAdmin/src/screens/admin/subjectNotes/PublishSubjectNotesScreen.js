import React, { useState, useEffect, useMemo } from 'react';
import {
	Box,
	Typography,
	Button,
	Card,
	CardContent,
	Grid,
	MenuItem,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	CircularProgress,
	Alert,
	Chip,
	Checkbox,
	FormControlLabel,
	FormGroup,
	Breadcrumbs,
	Link
} from '@mui/material';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import { useSnackbar } from '../../../hooks/SnackBar';
import { ICONS } from '../../../assets/icons';
import CustomSelect from '../../../components/Common/CustomSelect';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useAbility } from '../../../AbilityContext';
import { useTranslation } from 'react-i18next';
import moment from 'moment';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { useLazyGetMyGenderPermissionsQuery, useLazyGetMySectionPermissionsQuery } from '../../../Redux/features/Admin/TeachersSlice';
import {
	useGetSubjectNoteQuery,
	usePublishSubjectNoteMutation,
	useLazyGetAvailablePublishSectionsQuery
} from '../../../Redux/features/Admin/subjectNotesApiSlice';

const PublishSubjectNotesScreen = () => {
	const { themeColors } = useThemeContext();
	const showSnackbar = useSnackbar();
	const navigate = useNavigate();
	const ability = useAbility();
	const { t } = useTranslation();
	const { id } = useParams();
	const {
		data: noteResponse,
		error: noteError,
		isFetching: noteLoading,
		refetch: refetchNote
	} = useGetSubjectNoteQuery(id ?? skipToken);
	const subjectNote = noteResponse?.data;
	const [publishModalOpen, setPublishModalOpen] = useState(false);
	const [selectedGender, setSelectedGender] = useState('');
	const [selectedSections, setSelectedSections] = useState([]);
	const publishedClasses = useMemo(
		() =>
			subjectNote?.publishedClasses?.map((pc) => ({
				_id: pc._id,
				gender: pc.gender,
				section: pc.section,
				publishedAt: pc.publishedAt,
				publishedBy: pc.publishedBy
			})) || [],
		[subjectNote]
	);

	const [publishSubjectNote, { isLoading: publishing, error: publishError }] = usePublishSubjectNoteMutation();
	const [loadAvailablePublishSections, { data: availableSectionsResponse, error: availableSectionsError }] =
		useLazyGetAvailablePublishSectionsQuery();
	const availableSections = availableSectionsResponse?.data || [];
	// Form control
	const { control, setValue } = useForm({
		defaultValues: {
			gender: '',
			section: ''
		}
	});

	// Permission queries
	const [getGenderPermissions, { data: genders, isLoading: genderLoading }] = useLazyGetMyGenderPermissionsQuery();
	const [getSectionPermissions, { data: sections, isLoading: sectionLoading }] =
		useLazyGetMySectionPermissionsQuery();

	// Load subject note when the id changes
	useEffect(() => {
		if (id) {
			refetchNote();
		}
	}, [id, refetchNote]);

	// Load genders when note is loaded
	useEffect(() => {
		if (subjectNote?.grade) {
			getGenderPermissions({ grade: subjectNote.grade._id });
		}
	}, [subjectNote?.grade, getGenderPermissions]);

	// Load sections when gender is selected
	useEffect(() => {
		if (selectedGender && subjectNote?.grade) {
			getSectionPermissions({
				grade: subjectNote.grade._id,
				gender: selectedGender
			});
		}
	}, [selectedGender, subjectNote?.grade, getSectionPermissions]);

	// Fetch available publish sections when gender changes
	useEffect(() => {
		if (selectedGender && subjectNote?.grade?._id && subjectNote?.subject?._id && subjectNote?._id) {
			loadAvailablePublishSections({
				grade: subjectNote.grade._id,
				gender: selectedGender,
				subject: subjectNote.subject._id,
				noteId: subjectNote._id
			}).unwrap().catch(() => {});
		}
	}, [selectedGender, subjectNote, loadAvailablePublishSections]);

	useEffect(() => {
		if (noteError) {
			const message = noteError?.data?.message || noteError?.message || t('subjectNotes.publish.messages.error');
			showSnackbar(message, 'error');
		}
	}, [noteError, showSnackbar, t]);

	useEffect(() => {
		if (availableSectionsError) {
			const message = availableSectionsError?.data?.message || availableSectionsError?.message || t('subjectNotes.publish.messages.errorLoadingSections');
			showSnackbar(message, 'error');
		}
	}, [availableSectionsError, showSnackbar, t]);

	useEffect(() => {
		if (publishError) {
			const message = publishError?.data?.message || publishError?.message || t('subjectNotes.publish.messages.error');
			showSnackbar(message, 'error');
		}
	}, [publishError, showSnackbar, t]);

	const handleOpenPublishModal = () => {
		setPublishModalOpen(true);
		setSelectedGender('');
		setSelectedSections([]);
	};

	const handleClosePublishModal = () => {
		setPublishModalOpen(false);
		setSelectedGender('');
		setSelectedSections([]);
	};

	const handleGenderChange = (value) => {
		setSelectedGender(value);
		setSelectedSections([]);
		setValue('gender', value);
	};

	const handleSectionToggle = (sectionId) => {
		if (selectedSections.includes(sectionId)) {
			setSelectedSections(selectedSections.filter(id => id !== sectionId));
		} else {
			setSelectedSections([...selectedSections, sectionId]);
		}
	};

	const handleSelectAllSections = () => {
		if (selectedSections.length === availableSections.length) {
			setSelectedSections([]);
		} else {
			setSelectedSections(availableSections.map(s => s._id));
		}
	};

	const handlePublish = async () => {
		if (!selectedGender || selectedSections.length === 0) {
			showSnackbar(t('subjectNotes.publish.validation.selectGenderAndSections'), 'error');
			return;
		}

		try {
			await publishSubjectNote({
				noteId: id,
				data: {
					gender: selectedGender,
					sections: selectedSections
				}
			}).unwrap();
			showSnackbar(t('subjectNotes.publish.messages.success'), 'success');
			handleClosePublishModal();
			refetchNote();
		} catch (error) {
			// error handled by mutation effect
		}
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

	if (noteLoading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
				<CircularProgress />
			</Box>
		);
	}

	if (!subjectNote) {
		return (
			<Box sx={{ p: 3 }}>
				<Alert severity="error">{t('subjectNotes.publish.messages.noteNotFound')}</Alert>
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
					{t('subjectNotes.publish.title')}
				</Typography>
			</Breadcrumbs>

			{/* Header */}
			<Box display="flex" justifyContent="flex-end" alignItems="center" mb={3}>
				{ability.can("Edit", "SubjectNotes") && (
					<Button
						variant="contained"
						startIcon={<ICONS.Publish.component />}
						onClick={handleOpenPublishModal}
						sx={{
							backgroundColor: themeColors.primary,
							color: themeColors.text.inverse,
							'&:hover': {
								backgroundColor: themeColors.primary,
								opacity: 0.9
							}
						}}
					>
						{t('subjectNotes.publish.newPublish')}
					</Button>
				)}
			</Box>

			{/* Note Info Card */}
			<Card sx={{
				mb: 3,
				border: `1px solid ${themeColors.border.primary}`,
				backgroundColor: themeColors.background.secondary
			}}>
				<CardContent>
					<Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
						{t('subjectNotes.publish.noteInfo')}
					</Typography>
					<Grid container spacing={2}>
						<Grid item xs={12} sm={6} md={3}>
							<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
								{t('subjectNotes.publish.title')}
							</Typography>
							<Typography variant="body1" sx={{ color: themeColors.text.primary, fontWeight: 'medium' }}>
								{subjectNote.title}
							</Typography>
						</Grid>
						<Grid item xs={12} sm={6} md={3}>
							<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
								{t('subjectNotes.publish.grade')}
							</Typography>
							<Typography variant="body1" sx={{ color: themeColors.text.primary, fontWeight: 'medium' }}>
								{subjectNote.grade?.gradeName || t('subjectNotes.notAvailable')}
							</Typography>
						</Grid>
						<Grid item xs={12} sm={6} md={3}>
							<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
								{t('subjectNotes.publish.subject')}
							</Typography>
							<Typography variant="body1" sx={{ color: themeColors.text.primary, fontWeight: 'medium' }}>
								{subjectNote.subject?.subjectName || t('subjectNotes.notAvailable')}
							</Typography>
						</Grid>
						<Grid item xs={12} sm={6} md={3}>
							<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
								{t('subjectNotes.publish.status')}
							</Typography>
							<Chip
								label={t(`subjectNotes.status.${subjectNote.status}`) || subjectNote.status}
								color={subjectNote.status === 'published' ? 'success' : 'warning'}
								size="small"
								variant="outlined"
							/>
						</Grid>
					</Grid>
				</CardContent>
			</Card>

			{/* Published Classes Table */}
			<Card sx={{
				border: `1px solid ${themeColors.border.primary}`,
				backgroundColor: themeColors.background.secondary
			}}>
				<CardContent>
					<Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
						{t('subjectNotes.publish.publishedClasses')}
					</Typography>
					{publishedClasses.length === 0 ? (
						<Alert severity="info">{t('subjectNotes.publish.noPublishedClasses')}</Alert>
					) : (
						<TableContainer component={Paper} variant="outlined">
							<Table>
								<TableHead>
									<TableRow sx={{ backgroundColor: themeColors.background.tertiary }}>
										<TableCell sx={{
											fontWeight: 'bold',
											color: themeColors.text.primary,
											backgroundColor: themeColors.background.tertiary
										}}>{t('subjectNotes.publish.gender')}</TableCell>
										<TableCell sx={{
											fontWeight: 'bold',
											color: themeColors.text.primary,
											backgroundColor: themeColors.background.tertiary
										}}>{t('subjectNotes.publish.section')}</TableCell>
										<TableCell sx={{
											fontWeight: 'bold',
											color: themeColors.text.primary,
											backgroundColor: themeColors.background.tertiary
										}}>{t('subjectNotes.publish.publishedAt')}</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{publishedClasses.map((published, index) => (
										<TableRow
											key={index}
											sx={{
												backgroundColor: themeColors.background.secondary,
												'&:hover': {
													backgroundColor: themeColors.background.tertiary
												}
											}}
										>
											<TableCell sx={{ color: themeColors.text.primary }}>
												{published.gender?.charAt(0).toUpperCase() + published.gender?.slice(1) || t('subjectNotes.notAvailable')}
											</TableCell>
											<TableCell sx={{ color: themeColors.text.primary }}>
												{published.section?.sectionName || t('subjectNotes.notAvailable')}
											</TableCell>
											<TableCell sx={{ color: themeColors.text.primary }}>
												{moment(published.publishedAt).format('MMM DD, YYYY HH:mm')}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					)}
				</CardContent>
			</Card>

			{/* Publish Modal */}
			<Dialog
				open={publishModalOpen}
				onClose={handleClosePublishModal}
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
					{t('subjectNotes.publish.modalTitle')}
				</DialogTitle>
				<DialogContent>
					<Grid container spacing={3} sx={{ mt: 1 }}>
						<Grid item xs={12}>
							<CustomSelect
								fieldName="gender"
								control={control}
								fieldLabel={t('subjectNotes.publish.selectGender')}
								onChangeValue={handleGenderChange}
								disabled={genderLoading}
							>
								<MenuItem value="">{t('subjectNotes.publish.selectGender')}</MenuItem>
								{genders?.data?.map((gender) => (
									<MenuItem key={gender} value={gender}>
										{gender.charAt(0).toUpperCase() + gender.slice(1)}
									</MenuItem>
								))}
							</CustomSelect>
						</Grid>

						{selectedGender && availableSections.length > 0 && (
							<Grid item xs={12}>
								<Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
									<Typography variant="subtitle2" sx={{ color: themeColors.text.primary, fontWeight: 'bold' }}>
										{t('subjectNotes.publish.selectSections')}
									</Typography>
									<Button
										size="small"
										onClick={handleSelectAllSections}
										sx={{
											color: themeColors.primary,
											textTransform: 'none'
										}}
									>
										{selectedSections.length === availableSections.length 
											? t('subjectNotes.publish.deselectAll') 
											: t('subjectNotes.publish.selectAll')}
									</Button>
								</Box>
								<Paper 
									variant="outlined"
									sx={{
										p: 2,
										maxHeight: 300,
										overflow: 'auto',
										backgroundColor: themeColors.background.primary,
										borderColor: themeColors.border.primary
									}}
								>
									<FormGroup>
										{availableSections.map((section) => (
											<FormControlLabel
												key={section._id}
												control={
													<Checkbox
														checked={selectedSections.includes(section._id)}
														onChange={() => handleSectionToggle(section._id)}
														sx={{
															color: themeColors.primary,
															'&.Mui-checked': {
																color: themeColors.primary
															}
														}}
													/>
												}
												label={section.sectionName}
												sx={{
													color: themeColors.text.primary,
													'&:hover': {
														backgroundColor: themeColors.background.secondary,
														borderRadius: 1
													}
												}}
											/>
										))}
									</FormGroup>
								</Paper>
								{selectedSections.length > 0 && (
									<Typography variant="caption" sx={{ mt: 1, color: themeColors.text.secondary, display: 'block' }}>
										{t('subjectNotes.publish.selectedCount', { count: selectedSections.length })}
									</Typography>
								)}
							</Grid>
						)}
						{selectedGender && availableSections.length === 0 && (
							<Grid item xs={12}>
								<Alert severity="info">{t('subjectNotes.publish.noSectionsAvailable')}</Alert>
							</Grid>
						)}
					</Grid>
				</DialogContent>
				<DialogActions sx={{ p: 2 }}>
					<Button
						onClick={handleClosePublishModal}
						sx={{ color: themeColors.text.primary }}
					>
						{t('subjectNotes.publish.cancel')}
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
						{publishing ? t('subjectNotes.publish.publishing') : t('subjectNotes.publish.publish')}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default PublishSubjectNotesScreen;

