import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
	TextField,
	Breadcrumbs,
	Link
} from '@mui/material';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import { useSnackbar } from '../../../hooks/SnackBar';
import { ICONS } from '../../../assets/icons';
import CustomSelect from '../../../components/Common/CustomSelect';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useLazyGetMyGradePermissionsQuery, useLazyGetMyTeacherSubjectsQuery } from '../../../Redux/features/Admin/TeachersSlice';
import {
	useCreateChapterMutation,
	useDeleteChapterMutation,
	useGetChapterQuery,
	useGetChaptersQuery
} from '../../../Redux/features/Admin/lessonPlansApiSlice';
import {
	setLessonPlanFilters,
	selectLessonPlanFilters
} from '../../../Redux/features/Admin/lessonPlanFiltersSlice';
import { skipToken } from '@reduxjs/toolkit/query/react';
import DeleteDialog from '../../../components/Common/DeleteDialog';
import ChapterViewModal from '../../../components/admin/chapters/ChapterViewModal';
import { useNavigate, useSearchParams } from 'react-router-dom';
import moment from 'moment';
import { useAbility } from '../../../AbilityContext';
import { useTranslation } from 'react-i18next';

const LessonPlansScreen = () => {
	const { themeColors } = useThemeContext();
	const showSnackbar = useSnackbar();
	const navigate = useNavigate();
	const ability = useAbility();
	const { t } = useTranslation();
	const [searchParams, setSearchParams] = useSearchParams();
	const dispatch = useDispatch();
	const storedFilters = useSelector(selectLessonPlanFilters);

	const parseNumericParam = (value) => {
		if (value == null) return undefined;
		const parsed = parseInt(value, 10);
		return Number.isNaN(parsed) ? undefined : parsed;
	};

	const computeInitialFilters = () => {
		const gradeParam = searchParams.get('grade');
		const subjectParam = searchParams.get('subject');
		const pageParam = parseNumericParam(searchParams.get('page'));
		const limitParam = parseNumericParam(searchParams.get('limit'));

		return {
			grade: gradeParam ?? storedFilters.grade ?? '',
			subject: subjectParam ?? storedFilters.subject ?? '',
			page: pageParam ?? storedFilters.page ?? 1,
			limit: limitParam ?? storedFilters.limit ?? 10,
		};
	};

	const initialFilters = computeInitialFilters();
	const [filters, setFilters] = useState(initialFilters);
	const [filtersSubmitted, setFiltersSubmitted] = useState(
		storedFilters.submitted ?? Boolean(initialFilters.grade && initialFilters.subject)
	);
	const [queryFilters, setQueryFilters] = useState(initialFilters);

	useEffect(() => {
		dispatch(setLessonPlanFilters({ ...filters, submitted: filtersSubmitted }));
	}, [dispatch, filters, filtersSubmitted]);


	// Form control for CustomSelect components
  const { control, setValue } = useForm({
    defaultValues: {
			grade: filters.grade,
			subject: filters.subject
		}
	});

	// Sync form control with filters
	useEffect(() => {
		setValue('grade', filters.grade);
		setValue('subject', filters.subject);
	}, [filters.grade, filters.subject, setValue]);

	// Modal states
	const [viewModalOpen, setViewModalOpen] = useState(false);
	const [viewingChapter, setViewingChapter] = useState(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [chapterToDelete, setChapterToDelete] = useState(null);
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [chapterForm, setChapterForm] = useState({
		chapterName: '',
		description: ''
	});
	const [selectedChapterId, setSelectedChapterId] = useState(null);

	const skipChapterQuery = !filtersSubmitted || !filters.grade || !filters.subject;
	const {
		data: chaptersResponse,
		error: chaptersError,
		isLoading: chaptersLoading,
		isFetching: chaptersFetching
	} = useGetChaptersQuery(skipChapterQuery ? skipToken : queryFilters);
	const chapters = chaptersResponse?.data || [];
	const total = chaptersResponse?.total || 0;
	const currentPage = chaptersResponse?.currentPage || 1;
	const isTableLoading = chaptersLoading || chaptersFetching;

	const [
		createChapter,
		{ isLoading: createChapterLoading, isSuccess: createChapterSuccess, isError: createChapterError, error: createChapterErrorData }
	] = useCreateChapterMutation();
	const [deleteChapter] = useDeleteChapterMutation();
	const chapterDetailQuery = useGetChapterQuery(selectedChapterId ?? skipToken);
	const selectedChapterDetails = chapterDetailQuery?.data?.data;
	const chapterLoading = chapterDetailQuery?.isFetching;

	// Permission queries
	const [getGradePermissions, { data: grades, isFetching: gradeLoading }] = useLazyGetMyGradePermissionsQuery();
	const [getTeacherSubjects, { data: teacherSubjects, isLoading: subjectsLoading }] = useLazyGetMyTeacherSubjectsQuery();

	// Refs to track the last triggered values for cascading filters
	const lastGradeId = useRef(null);

	// Trigger grades when component loads
	useEffect(() => {
		getGradePermissions({});
	}, [getGradePermissions]);

	// Cascading filter effects - Load subjects when grade is selected
  useEffect(() => {
		if (filters.grade && filters.grade !== lastGradeId.current) {
			lastGradeId.current = filters.grade;
			// For chapters, we need to get subjects by grade only (not gender/section specific)
			getTeacherSubjects({ grade: filters.grade });
		}
	}, [filters.grade, getTeacherSubjects]);

	// Notify about chapter list errors
	useEffect(() => {
		if (chaptersError) {
			const errorMessage = chaptersError?.data?.message || chaptersError?.message || t('lessonPlans.messages.errorOccurred');
			showSnackbar(errorMessage, 'error');
		}
	}, [chaptersError, showSnackbar, t]);

	// Notify about chapter creation results
	useEffect(() => {
		if (createChapterSuccess) {
			showSnackbar(t('lessonPlans.create.messages.createSuccess'), 'success');
			setCreateModalOpen(false);
			setChapterForm({
				chapterName: '',
				description: ''
			});
		}
		if (createChapterError) {
			const errorMessage = createChapterErrorData?.data?.message || createChapterErrorData?.message || t('lessonPlans.create.messages.error');
			showSnackbar(errorMessage, 'error');
		}
	}, [createChapterSuccess, createChapterError, createChapterErrorData, showSnackbar, t]);

	const handleFilterChange = (field, value) => {
		const newFilters = {
			...filters,
			[field]: value,
			page: 1
		};

		if (field === 'grade') {
			newFilters.subject = '';
		}

		setFilters(newFilters);
		setFiltersSubmitted(false);
		setQueryFilters(newFilters);

		const params = new URLSearchParams();
		if (newFilters.grade) params.set('grade', newFilters.grade);
		if (newFilters.subject) params.set('subject', newFilters.subject);
		if (newFilters.page > 1) params.set('page', newFilters.page.toString());
		if (newFilters.limit !== 10) params.set('limit', newFilters.limit.toString());
		setSearchParams(params);
	};

	const handleSubmit = () => {
		if (filters.grade && filters.subject) {
			const submitFilters = {
				...filters,
				page: 1
			};
			setFilters(submitFilters);
			setFiltersSubmitted(true);
			setQueryFilters(submitFilters);

			const params = new URLSearchParams();
			params.set('grade', submitFilters.grade);
			params.set('subject', submitFilters.subject);
			setSearchParams(params);
		} else {
			showSnackbar(t('lessonPlans.messages.selectFilters'), 'warning');
		}
	};

	const handlePageChange = (event, newPage) => {
		const updatedFilters = {
			...filters,
			page: newPage + 1
		};
		setFilters(updatedFilters);
		if (filtersSubmitted) {
			setQueryFilters(updatedFilters);
		}

		const params = new URLSearchParams();
		if (updatedFilters.grade) params.set('grade', updatedFilters.grade);
		if (updatedFilters.subject) params.set('subject', updatedFilters.subject);
		params.set('page', updatedFilters.page.toString());
		if (updatedFilters.limit !== 10) params.set('limit', updatedFilters.limit.toString());
		setSearchParams(params);
	};

	const handleRowsPerPageChange = (event) => {
		const newLimit = parseInt(event.target.value, 10);
		const updatedFilters = {
			...filters,
			limit: newLimit,
			page: 1
		};
		setFilters(updatedFilters);
		if (filtersSubmitted) {
			setQueryFilters(updatedFilters);
		}

		const params = new URLSearchParams();
		if (updatedFilters.grade) params.set('grade', updatedFilters.grade);
		if (updatedFilters.subject) params.set('subject', updatedFilters.subject);
		if (updatedFilters.limit !== 10) params.set('limit', updatedFilters.limit.toString());
		setSearchParams(params);
	};

	const handleCreateChapter = () => {
		setCreateModalOpen(true);
		setChapterForm({ chapterName: '', description: '' });
	};

	const handleCreateModalClose = () => {
		setCreateModalOpen(false);
		setChapterForm({ chapterName: '', description: '' });
	};

	const handleChapterFormChange = (field, value) => {
		setChapterForm(prev => ({ ...prev, [field]: value }));
	};

	const handleCreateChapterSubmit = async () => {
		if (!chapterForm.chapterName || !chapterForm.description) {
			showSnackbar(t('lessonPlans.create.validation.fillRequiredFields'), 'error');
			return;
		}

		try {
			await createChapter({
				chapterName: chapterForm.chapterName,
				description: chapterForm.description,
				grade: filters.grade,
				subject: filters.subject,
				status: 'active'
			}).unwrap();
		} catch {
			// Errors handled by useEffect watcher
		}
	};

	const handleEditChapter = (chapter) => {
		navigate(`/lesson-plans/edit/${chapter._id}`);
	};

	const handleViewChapter = (chapter) => {
		setViewingChapter(chapter); // Set initial chapter data while loading
		setSelectedChapterId(chapter._id);
		setViewModalOpen(true);
	};

	const handleDeleteChapter = (chapter) => {
		setChapterToDelete(chapter);
		setDeleteDialogOpen(true);
	};

	const handleManageLessonPlans = (chapter) => {
		navigate(`/lesson-plans/chapter/${chapter._id}/lesson-plans`);
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
					{t('lessonPlans.title')}
				</Typography>
			</Breadcrumbs>

			{/* Header */}
			<Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
				<Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
					{t('lessonPlans.title')}
            </Typography>
          </Box>

			{/* Filters */}
			<Card sx={{
				mb: 3,
				border: `1px solid ${themeColors.border.primary}`,
				backgroundColor: themeColors.background.secondary
			}}>
				<CardContent>
					<Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: themeColors.text.primary }}>
						{t('lessonPlans.filters.title')}
					</Typography>
					<Grid container spacing={2} alignItems="flex-end">
						<Grid item xs={12} sm={6} md={4}>
							<CustomSelect
								fieldName="grade"
								control={control}
								fieldLabel={t('lessonPlans.form.grade')}
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
								fieldLabel={t('lessonPlans.form.subject')}
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
								disabled={!filters.grade || !filters.subject || isTableLoading}
								sx={{
									backgroundColor: themeColors.primary,
									color: themeColors.text.inverse,
									'&:hover': {
										backgroundColor: themeColors.primary,
										opacity: 0.9
									}
								}}
							>
								{t('lessonPlans.actions.submit')}
							</Button>
						</Grid>
					</Grid>
      </CardContent>
    </Card>

			{/* Error Alert */}
			{chaptersError && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{chaptersError?.data?.message || chaptersError?.message || t('lessonPlans.messages.errorOccurred')}
				</Alert>
			)}

			{/* Create Chapter Button - Only show when filters are submitted */}
			{filtersSubmitted && filters.grade && filters.subject && (
				<Box display="flex" justifyContent="flex-end" mb={2}>
					{ability.can("Create", "Chapters") && (
						<Button
							variant="contained"
							startIcon={<ICONS.Add.component />}
							onClick={handleCreateChapter}
							sx={{
								backgroundColor: themeColors.primary,
								color: themeColors.text.inverse,
								'&:hover': {
									backgroundColor: themeColors.primary,
									opacity: 0.9
								}
							}}
						>
							{t('lessonPlans.actions.addChapter')}
						</Button>
					)}
				</Box>
			)}

			{/* Chapters Table */}
			<Card sx={{
          border: `1px solid ${themeColors.border.primary}`,
				backgroundColor: themeColors.background.secondary
			}}>
				<CardContent>
					{isTableLoading ? (
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
											}}>{t('lessonPlans.table.chapterName')}</TableCell>
											<TableCell sx={{
												fontWeight: 'bold',
												color: themeColors.text.primary,
												backgroundColor: themeColors.background.tertiary
											}}>{t('lessonPlans.table.subject')}</TableCell>
											<TableCell sx={{
												fontWeight: 'bold',
												color: themeColors.text.primary,
												backgroundColor: themeColors.background.tertiary
											}}>{t('lessonPlans.table.grade')}</TableCell>
											<TableCell sx={{
												fontWeight: 'bold',
												color: themeColors.text.primary,
												backgroundColor: themeColors.background.tertiary
											}}>{t('lessonPlans.table.publishes')}</TableCell>
											<TableCell sx={{
												fontWeight: 'bold',
												color: themeColors.text.primary,
												backgroundColor: themeColors.background.tertiary
											}}>{t('lessonPlans.table.lessonPlans')}</TableCell>
											<TableCell sx={{
												fontWeight: 'bold',
												color: themeColors.text.primary,
												backgroundColor: themeColors.background.tertiary
											}}>{t('lessonPlans.table.created')}</TableCell>
											<TableCell sx={{
												fontWeight: 'bold',
												color: themeColors.text.primary,
												backgroundColor: themeColors.background.tertiary
											}}>{t('lessonPlans.table.actions')}</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{chapters.map((chapter) => (
											<TableRow
												key={chapter._id}
												sx={{
          backgroundColor: themeColors.background.secondary,
													'&:hover': {
														backgroundColor: themeColors.background.tertiary
													}
												}}
											>
												<TableCell sx={{ color: themeColors.text.primary }}>
													<Typography variant="body2" fontWeight="medium" sx={{ color: themeColors.text.primary }}>
														{chapter.chapterName}
													</Typography>
													{chapter.description && (
														<Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
															{chapter.description.length > 50 ? `${chapter.description.substring(0, 50)}...` : chapter.description}
														</Typography>
													)}
												</TableCell>
												<TableCell sx={{ color: themeColors.text.primary }}>
													<Typography variant="body2" sx={{ color: themeColors.text.primary }}>
														{chapter.subject?.subjectName || t('lessonPlans.notAvailable')}
													</Typography>
												</TableCell>
												<TableCell sx={{ color: themeColors.text.primary }}>
													<Typography variant="body2" sx={{ color: themeColors.text.primary }}>
														{chapter.grade?.gradeName || t('lessonPlans.notAvailable')}
													</Typography>
												</TableCell>
												<TableCell sx={{ color: themeColors.text.primary }}>
													<Typography variant="body2" sx={{ color: themeColors.text.primary }}>
														{chapter.publishCount || 0}
													</Typography>
												</TableCell>
												<TableCell sx={{ color: themeColors.text.primary }}>
													<Typography variant="body2" sx={{ color: themeColors.text.primary }}>
														{chapter.lessonPlanCount || 0}
              </Typography>
												</TableCell>
												<TableCell sx={{ color: themeColors.text.primary }}>
													<Typography variant="body2" sx={{ color: themeColors.text.primary }}>
														{moment(chapter.createdAt).format('MMM DD, YYYY')}
              </Typography>
												</TableCell>
												<TableCell sx={{ color: themeColors.text.primary }}>
													<Box display="flex" gap={1}>
														{ability.can("Read", "Chapters") && <Tooltip title={t('lessonPlans.actions.view')}>
															<IconButton
                size="small"
																onClick={() => handleViewChapter(chapter)}
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
														{ability.can("Read", "LessonPlans") && <Tooltip title={t('lessonPlans.actions.manageLessonPlans')}>
															<IconButton
                size="small"
																onClick={() => handleManageLessonPlans(chapter)}
                sx={{
																	color: themeColors.primary,
																	'&:hover': {
																		backgroundColor: `${themeColors.primary}20`
																	}
																}}
															>
																<ICONS.ViewList.component fontSize="small" />
															</IconButton>
														</Tooltip>}
														{ability.can("Edit", "Chapters") && <Tooltip title={t('lessonPlans.actions.edit')}>
                  <IconButton
                    size="small"
																onClick={() => handleEditChapter(chapter)}
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
														{ability.can("Edit", "Chapters") && <Tooltip title={t('lessonPlans.actions.publish')}>
                  <IconButton
                    size="small"
																onClick={() => navigate(`/lesson-plans/publish/${chapter._id}`)}
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
														{ability.can("Delete", "Chapters") && (!chapter.publishCount || chapter.publishCount === 0) && <Tooltip title={t('lessonPlans.actions.delete')}>
															<IconButton
																size="small"
																onClick={() => handleDeleteChapter(chapter)}
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
			<ChapterViewModal
				open={viewModalOpen}
				onClose={() => {
					setViewModalOpen(false);
					setViewingChapter(null);
					setSelectedChapterId(null);
				}}
				item={selectedChapterDetails || viewingChapter}
				loading={chapterLoading}
			/>

			{/* Delete Dialog */}
			<DeleteDialog
				open={deleteDialogOpen}
				onClose={() => {
					setDeleteDialogOpen(false);
					setChapterToDelete(null);
				}}
				heading={t('lessonPlans.actions.delete')}
				paragraph={chapterToDelete?.chapterName || 'chapter'}
				fun={(id) => deleteChapter(id)}
				_id={chapterToDelete?._id}
				mode="redux"
			/>

			{/* Create Chapter Modal */}
			<Dialog
				open={createModalOpen}
				onClose={handleCreateModalClose}
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
					{t('lessonPlans.create.title')}
				</DialogTitle>
				<DialogContent>
					<Grid container spacing={2} sx={{ mt: 1 }}>
						<Grid item xs={12}>
							<TextField
								fullWidth
								label={t('lessonPlans.create.form.chapterName')}
								value={chapterForm.chapterName}
								onChange={(e) => handleChapterFormChange('chapterName', e.target.value)}
								error={!chapterForm.chapterName}
								helperText={!chapterForm.chapterName ? t('lessonPlans.create.form.chapterNameRequired') : ''}
								placeholder={t('lessonPlans.create.form.enterChapterName')}
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
						<Grid item xs={12}>
							<TextField
								fullWidth
								label={t('lessonPlans.create.form.description')}
								multiline
								rows={4}
								value={chapterForm.description}
								onChange={(e) => handleChapterFormChange('description', e.target.value)}
								error={!chapterForm.description}
								helperText={!chapterForm.description ? t('lessonPlans.create.form.descriptionRequired') : ''}
								placeholder={t('lessonPlans.create.form.enterDetailedDescription')}
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
				</DialogContent>
				<DialogActions sx={{ p: 2 }}>
					<Button
						onClick={handleCreateModalClose}
						sx={{ color: themeColors.text.primary }}
					>
						{t('lessonPlans.create.cancel')}
          </Button>
            <Button
						onClick={handleCreateChapterSubmit}
						disabled={!chapterForm.chapterName || !chapterForm.description || createChapterLoading}
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
						{createChapterLoading ? t('lessonPlans.create.creating') : t('lessonPlans.create.createChapter')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LessonPlansScreen;
