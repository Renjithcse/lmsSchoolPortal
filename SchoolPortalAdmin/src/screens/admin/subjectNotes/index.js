import React, { useState, useEffect, useRef } from 'react';
import {
	Box,
	Typography,
	Button,
	Card,
	CardContent,
	Grid,
	MenuItem,
	Chip,
	IconButton,
	Tooltip,
	Alert,
	CircularProgress,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	TablePagination,
	Breadcrumbs,
	Link
} from '@mui/material';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import { useSnackbar } from '../../../hooks/SnackBar';
import { ICONS } from '../../../assets/icons';
import CustomSelect from '../../../components/Common/CustomSelect';
import { useForm } from 'react-hook-form';
import { useLazyGetMyGradePermissionsQuery, useLazyGetMyTeacherSubjectsQuery } from '../../../Redux/features/Admin/TeachersSlice';
import SubjectNotesViewModal from '../../../components/admin/subjectNotes/SubjectNotesViewModal';
import DeleteDialog from '../../../components/Common/DeleteDialog';
import { useNavigate, useSearchParams } from 'react-router-dom';
import moment from 'moment';
import { useAbility } from '../../../AbilityContext';
import { useTranslation } from 'react-i18next';
import { skipToken } from '@reduxjs/toolkit/query/react';
import {
	useGetSubjectNotesQuery,
	useGetSubjectNoteQuery,
	useDeleteSubjectNoteMutation
} from '../../../Redux/features/Admin/subjectNotesApiSlice';

const SUBJECT_NOTES_FILTERS_KEY = 'subjectNotesFilters';

const getPersistedSubjectNotesFilters = () => {
	if (typeof window === 'undefined') return null;
	try {
		const stored = window.sessionStorage.getItem(SUBJECT_NOTES_FILTERS_KEY);
		return stored ? JSON.parse(stored) : null;
	} catch (err) {
		console.error('Failed to read persisted subject note filters', err);
		return null;
	}
};

const persistSubjectNotesFilters = (filters) => {
	if (typeof window === 'undefined') return;
	try {
		const payload = {
			grade: filters.grade || '',
			subject: filters.subject || '',
			page: filters.page || 1,
			limit: filters.limit || 10
		};
		window.sessionStorage.setItem(SUBJECT_NOTES_FILTERS_KEY, JSON.stringify(payload));
	} catch (err) {
		console.error('Failed to persist subject note filters', err);
	}
};

const SubjectNotesScreen = () => {
	const { themeColors } = useThemeContext();
	const showSnackbar = useSnackbar();
	const navigate = useNavigate();
	const ability = useAbility();
	const { t } = useTranslation();
	const [searchParams, setSearchParams] = useSearchParams();

	// Filters state
	const [filters, setFilters] = useState({
		grade: searchParams.get('grade') || '',
		subject: searchParams.get('subject') || '',
		page: parseInt(searchParams.get('page')) || 1,
		limit: parseInt(searchParams.get('limit')) || 10
	});

	// Form control for Selects
	const { control, setValue } = useForm({
		defaultValues: {
			grade: filters.grade,
			subject: filters.subject
		}
	});

	useEffect(() => {
		setValue('grade', filters.grade);
		setValue('subject', filters.subject);
	}, [filters.grade, filters.subject, setValue]);

	const [viewModalOpen, setViewModalOpen] = useState(false);
	const [viewingNote, setViewingNote] = useState(null);
	const [viewNoteId, setViewNoteId] = useState(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [noteToDelete, setNoteToDelete] = useState(null);

	const [getGradePermissions, { data: grades, isFetching: gradeLoading }] = useLazyGetMyGradePermissionsQuery();
	const [getTeacherSubjects, { data: teacherSubjects, isLoading: subjectsLoading }] = useLazyGetMyTeacherSubjectsQuery();
	const lastGradeId = useRef(null);

	useEffect(() => {
		getGradePermissions({});
	}, [getGradePermissions]);

	useEffect(() => {
		if (filters.grade && filters.grade !== lastGradeId.current) {
			lastGradeId.current = filters.grade;
			getTeacherSubjects({ grade: filters.grade });
		}
	}, [filters.grade, getTeacherSubjects]);

	const shouldFetchNotes = Boolean(filters.grade && filters.subject);
	const {
		data: notesResponse,
		error: notesError,
		isFetching: isFetchingNotes,
		refetch: refetchNotes
	} = useGetSubjectNotesQuery(shouldFetchNotes ? filters : skipToken);
	const subjectNotes = notesResponse?.data || [];
	const total = notesResponse?.total || 0;
	const currentPage = notesResponse?.currentPage || 1;

	useEffect(() => {
		if (notesError) {
			const message = notesError?.data?.message || notesError?.message || t('subjectNotes.messages.error');
			showSnackbar(message, 'error');
		}
	}, [notesError, showSnackbar, t]);

	const handleFilterChange = (field, value) => {
		const newFilters = {
			...filters,
			[field]: value,
			page: 1
		};
		setFilters(newFilters);

		const params = new URLSearchParams();
		if (newFilters.grade) params.set('grade', newFilters.grade);
		if (newFilters.subject) params.set('subject', newFilters.subject);
		if (newFilters.page > 1) params.set('page', newFilters.page.toString());
		if (newFilters.limit !== 10) params.set('limit', newFilters.limit.toString());
		setSearchParams(params);
	};

	const handleSubmit = () => {
		if (filters.grade && filters.subject) {
			const submitFilters = { ...filters, page: 1 };
			setFilters(submitFilters);

			const params = new URLSearchParams();
			params.set('grade', submitFilters.grade);
			params.set('subject', submitFilters.subject);
			setSearchParams(params);
		} else {
			showSnackbar(t('subjectNotes.validation.selectGradeAndSubject'), 'warning');
		}
	};

	useEffect(() => {
		if (searchParams.get('grade') || searchParams.get('subject')) {
			return;
		}

		const restoredFilters = getPersistedSubjectNotesFilters();
		if (restoredFilters?.grade && restoredFilters?.subject) {
			const preparedFilters = {
				grade: restoredFilters.grade,
				subject: restoredFilters.subject,
				page: restoredFilters.page || 1,
				limit: restoredFilters.limit || 10
			};

			setFilters(preparedFilters);
			setValue('grade', preparedFilters.grade);
			setValue('subject', preparedFilters.subject);

			const params = new URLSearchParams();
			params.set('grade', preparedFilters.grade);
			params.set('subject', preparedFilters.subject);
			if (preparedFilters.page && preparedFilters.page > 1) {
				params.set('page', preparedFilters.page.toString());
			}
			if (preparedFilters.limit && preparedFilters.limit !== 10) {
				params.set('limit', preparedFilters.limit.toString());
			}
			setSearchParams(params);
		}
	}, [searchParams, setSearchParams, setValue]);

	useEffect(() => {
		if (filters.grade && filters.subject) {
			persistSubjectNotesFilters(filters);
		}
	}, [filters.grade, filters.subject, filters.page, filters.limit]);

	const handlePageChange = (event, newPage) => {
		const updatedFilters = { ...filters, page: newPage + 1 };
		setFilters(updatedFilters);

		const params = new URLSearchParams();
		if (updatedFilters.grade) params.set('grade', updatedFilters.grade);
		if (updatedFilters.subject) params.set('subject', updatedFilters.subject);
		params.set('page', updatedFilters.page.toString());
		if (updatedFilters.limit !== 10) params.set('limit', updatedFilters.limit.toString());
		setSearchParams(params);
	};

	const handleRowsPerPageChange = (event) => {
		const newLimit = parseInt(event.target.value, 10);
		const updatedFilters = { ...filters, limit: newLimit, page: 1 };
		setFilters(updatedFilters);

		const params = new URLSearchParams();
		if (updatedFilters.grade) params.set('grade', updatedFilters.grade);
		if (updatedFilters.subject) params.set('subject', updatedFilters.subject);
		if (updatedFilters.limit !== 10) params.set('limit', updatedFilters.limit.toString());
		setSearchParams(params);
	};

	const handleCreateNote = () => {
		navigate('/subject-notes/create');
	};

	const handleEditNote = (note) => {
		navigate(`/subject-notes/edit/${note._id}`);
	};

	const handleViewNote = (note) => {
		setViewingNote(note);
		setViewNoteId(note._id);
		setViewModalOpen(true);
	};

	const {
		data: viewNoteResponse,
		error: viewNoteError,
		isFetching: isViewLoading
	} = useGetSubjectNoteQuery(viewNoteId ?? skipToken);
	const currentSubjectNote = viewNoteResponse?.data;

	useEffect(() => {
		if (viewNoteError) {
			const message = viewNoteError?.data?.message || viewNoteError?.message || t('subjectNotes.messages.error');
			showSnackbar(message, 'error');
		}
	}, [viewNoteError, showSnackbar, t]);

	const [deleteSubjectNote, { isLoading: isDeleting, isSuccess: deleteSuccess, error: deleteError }] =
		useDeleteSubjectNoteMutation();

	useEffect(() => {
		if (deleteSuccess) {
			showSnackbar(t('subjectNotes.messages.deleteSuccess'), 'success');
			setDeleteDialogOpen(false);
			setNoteToDelete(null);
			if (shouldFetchNotes) {
				refetchNotes();
			}
		}
	}, [deleteSuccess, refetchNotes, shouldFetchNotes, showSnackbar, t]);

	useEffect(() => {
		if (deleteError) {
			const message = deleteError?.data?.message || deleteError?.message || t('subjectNotes.messages.error');
			showSnackbar(message, 'error');
		}
	}, [deleteError, showSnackbar, t]);

	const handleDeleteConfirm = (id) => deleteSubjectNote(id);
	const handleDeleteNote = (note) => {
		setNoteToDelete(note);
		setDeleteDialogOpen(true);
	};

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
				<Typography sx={{ color: themeColors.text.primary }}>
					{t('subjectNotes.title')}
				</Typography>
			</Breadcrumbs>

			{/* Header */}
			<Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
				<Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
					{t('subjectNotes.title')}
				</Typography>
				{ability.can("Create", "SubjectNotes") && <Button
					variant="contained"
					startIcon={<ICONS.Add.component />}
					onClick={handleCreateNote}
					sx={{
						backgroundColor: themeColors.primary,
						color: themeColors.text.inverse,
						'&:hover': {
							backgroundColor: themeColors.primary,
							opacity: 0.9
						}
					}}
				>
					{t('subjectNotes.actions.add')}
				</Button>}
			</Box>

			{/* Filters */}
			<Card sx={{
				mb: 3,
				border: `1px solid ${themeColors.border.primary}`,
				backgroundColor: themeColors.background.secondary
			}}>
				<CardContent>
					<Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
						{t('subjectNotes.filters')}
					</Typography>
					<Grid container spacing={2} alignItems="flex-end">
						<Grid item xs={12} sm={6} md={4}>
							<CustomSelect
								fieldName="grade"
								control={control}
								fieldLabel={t('subjectNotes.form.grade')}
								disabled={gradeLoading}
								onChangeValue={(value) => handleFilterChange('grade', value)}
							>
								{grades?.data?.map((grade) => (
									<MenuItem key={grade._id} value={grade._id}>
										{grade.gradeName}
									</MenuItem>
								))}
							</CustomSelect>
						</Grid>
						<Grid item xs={12} sm={6} md={4}>
							<CustomSelect
								fieldName="subject"
								control={control}
								fieldLabel={t('subjectNotes.form.subject')}
								disabled={!filters.grade || subjectsLoading}
								onChangeValue={(value) => handleFilterChange('subject', value)}
							>
								{teacherSubjects?.data?.map((subject) => (
									<MenuItem key={subject._id} value={subject._id}>
										{subject.subjectName}
									</MenuItem>
								))}
							</CustomSelect>
						</Grid>
						<Grid item xs={12} sm={6} md={4}>
							<Button
								variant="contained"
								fullWidth
								onClick={handleSubmit}
								disabled={!filters.grade || !filters.subject || isFetchingNotes}
								sx={{
									backgroundColor: themeColors.primary,
									color: themeColors.text.inverse,
									'&:hover': {
										backgroundColor: themeColors.primary,
										opacity: 0.9
									}
								}}
							>
								{t('subjectNotes.actions.submit')}
							</Button>
						</Grid>
					</Grid>
				</CardContent>
			</Card>

			{/* Error Alert */}
			{notesError && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{notesError?.data?.message || notesError?.message || t('subjectNotes.messages.error')}
				</Alert>
			)}

			{/* Subject Notes Table */}
			<Card sx={{
				border: `1px solid ${themeColors.border.primary}`,
				backgroundColor: themeColors.background.secondary
			}}>
				<CardContent>
					{isFetchingNotes ? (
						<Box display="flex" justifyContent="center" p={3}>
							<CircularProgress />
						</Box>
					) : (
						<>
							<TableContainer component={Paper} variant="outlined">
								<Table>
									<TableHead>
										<TableRow sx={{ backgroundColor: themeColors.background.tertiary }}>
											<TableCell sx={{
												fontWeight: 'bold',
												color: themeColors.text.primary,
												backgroundColor: themeColors.background.tertiary
											}}>{t('subjectNotes.table.title')}</TableCell>
											<TableCell sx={{
												fontWeight: 'bold',
												color: themeColors.text.primary,
												backgroundColor: themeColors.background.tertiary
											}}>{t('subjectNotes.table.subject')}</TableCell>
											<TableCell sx={{
												fontWeight: 'bold',
												color: themeColors.text.primary,
												backgroundColor: themeColors.background.tertiary
											}}>{t('subjectNotes.table.grade')}</TableCell>
											<TableCell sx={{
												fontWeight: 'bold',
												color: themeColors.text.primary,
												backgroundColor: themeColors.background.tertiary
											}}>{t('subjectNotes.table.publishes')}</TableCell>
											<TableCell sx={{
												fontWeight: 'bold',
												color: themeColors.text.primary,
												backgroundColor: themeColors.background.tertiary
											}}>{t('subjectNotes.table.documents')}</TableCell>
											<TableCell sx={{
												fontWeight: 'bold',
												color: themeColors.text.primary,
												backgroundColor: themeColors.background.tertiary
											}}>{t('subjectNotes.table.created')}</TableCell>
											<TableCell sx={{
												fontWeight: 'bold',
												color: themeColors.text.primary,
												backgroundColor: themeColors.background.tertiary
											}}>{t('subjectNotes.table.actions')}</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{subjectNotes.map((note) => (
											<TableRow
												key={note._id}
												sx={{
													backgroundColor: themeColors.background.secondary,
													'&:hover': {
														backgroundColor: themeColors.background.tertiary
													}
												}}
											>
												<TableCell sx={{ color: themeColors.text.primary }}>
													<Typography variant="body2" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
														{note.title}
													</Typography>
													{note.description && (
														<Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
															{note.description.length > 50 ? `${note.description.substring(0, 50)}...` : note.description}
														</Typography>
													)}
												</TableCell>
												<TableCell sx={{ color: themeColors.text.primary }}>
													<Typography variant="body2" sx={{ color: themeColors.text.primary }}>
														{note.subject?.subjectName || t('subjectNotes.notAvailable')}
													</Typography>
												</TableCell>
												<TableCell sx={{ color: themeColors.text.primary }}>
													<Typography variant="body2" sx={{ color: themeColors.text.primary }}>
														{note.grade?.gradeName || t('subjectNotes.notAvailable')}
													</Typography>
												</TableCell>
												<TableCell sx={{ color: themeColors.text.primary }}>
													<Typography variant="body2" sx={{ color: themeColors.text.primary }}>
														{note.publishCount || 0}
													</Typography>
												</TableCell>
												<TableCell sx={{ color: themeColors.text.primary }}>
													<Typography variant="body2" sx={{ color: themeColors.text.primary }}>
														{t('subjectNotes.filesCount', { count: note.documents?.length || 0 })}
													</Typography>
												</TableCell>
												<TableCell sx={{ color: themeColors.text.primary }}>
													<Typography variant="body2" sx={{ color: themeColors.text.primary }}>
														{moment(note.createdAt).format('MMM DD, YYYY')}
													</Typography>
												</TableCell>
												<TableCell sx={{ color: themeColors.text.primary }}>
													<Box display="flex" gap={1}>
														{ability.can("Read", "SubjectNotes") && <Tooltip title={t('subjectNotes.actions.view')}>
															<IconButton
																size="small"
																onClick={() => handleViewNote(note)}
																sx={{
																	color: themeColors.text.primary,
																	'&:hover': {
																		backgroundColor: themeColors.background.tertiary
																	}
																}}
															>
																<ICONS.Visibility.component fontSize="small" />
															</IconButton>
														</Tooltip>}
														{ability.can("Edit", "SubjectNotes") && <Tooltip title={t('subjectNotes.actions.edit')}>
															<IconButton
																size="small"
																onClick={() => handleEditNote(note)}
																sx={{
																	color: themeColors.warning,
																	'&:hover': {
																		backgroundColor: `${themeColors.warning}20`
																	}
																}}
															>
																<ICONS.Edit.component fontSize="small" />
															</IconButton>
														</Tooltip>}
														{ability.can("Edit", "SubjectNotes") && <Tooltip title={t('subjectNotes.actions.publish')}>
															<IconButton
																size="small"
																onClick={() => navigate(`/subject-notes/publish/${note._id}`)}
																sx={{
																	color: themeColors.primary,
																	'&:hover': {
																		backgroundColor: `${themeColors.primary}20`
																	}
																}}
															>
																<ICONS.Publish.component fontSize="small" />
															</IconButton>
														</Tooltip>}
														{ability.can("Delete", "SubjectNotes") && (!note.publishCount || note.publishCount === 0) && <Tooltip title={t('subjectNotes.actions.delete')}>
															<IconButton
																size="small"
																onClick={() => handleDeleteNote(note)}
																sx={{
																	color: themeColors.error,
																	'&:hover': {
																		backgroundColor: `${themeColors.error}20`
																	}
																}}
															>
																<ICONS.Delete.component fontSize="small" />
															</IconButton>
														</Tooltip>}
													</Box>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</TableContainer>

							<TablePagination
								component="div"
								count={total}
								page={currentPage - 1}
								onPageChange={handlePageChange}
								rowsPerPage={filters.limit}
								onRowsPerPageChange={handleRowsPerPageChange}
								rowsPerPageOptions={[5, 10, 25, 50]}
								sx={{
									backgroundColor: themeColors.background.secondary,
									color: themeColors.text.primary,
									borderTop: `1px solid ${themeColors.border.primary}`,
									'& .MuiTablePagination-toolbar': {
										color: themeColors.text.primary,
										backgroundColor: themeColors.background.secondary
									},
									'& .MuiTablePagination-selectLabel': {
										color: themeColors.text.primary
									},
									'& .MuiTablePagination-displayedRows': {
										color: themeColors.text.primary
									},
									'& .MuiTablePagination-select': {
										color: themeColors.text.primary,
										backgroundColor: themeColors.background.primary,
										border: `1px solid ${themeColors.border.primary}`,
										'&:hover': {
											borderColor: themeColors.primary
										},
										'&.Mui-focused': {
											borderColor: themeColors.primary,
											boxShadow: `0 0 0 2px ${themeColors.primary}20`
										}
									},
									'& .MuiTablePagination-selectIcon': {
										color: themeColors.text.primary
									},
									'& .MuiIconButton-root': {
										color: themeColors.text.primary,
										'&:hover': {
											backgroundColor: themeColors.background.tertiary
										},
										'&.Mui-disabled': {
											color: themeColors.text.disabled
										}
									}
								}}
							/>
						</>
					)}
				</CardContent>
			</Card>

			{/* View Modal */}
			<SubjectNotesViewModal
				open={viewModalOpen}
				onClose={() => {
					setViewModalOpen(false);
					setViewingNote(null);
					setViewNoteId(null);
				}}
				item={currentSubjectNote || viewingNote}
				loading={isViewLoading}
			/>

			{/* Delete Dialog */}
			<DeleteDialog
				open={deleteDialogOpen}
				onClose={() => {
					setDeleteDialogOpen(false);
					setNoteToDelete(null);
				}}
				heading={t('subjectNotes.actions.delete')}
				paragraph={noteToDelete?.title || 'subject note'}
				fun={(id) => handleDeleteConfirm(id)}
				_id={noteToDelete?._id}
			/>
		</Box>
	);
};

export default SubjectNotesScreen;
