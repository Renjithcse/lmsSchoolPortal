import React, { useState, useCallback, useEffect, useRef } from 'react';
import CustomOutletBox from '../../../components/Common/CustomOutletBox';
import CustomAddButton from '../../../components/Common/CustomAddButton';
import useModal from '../../../hooks/modalHook';
import { Box, Stack, Tooltip, Card, CardContent, Typography, IconButton, Chip, MenuItem, Grid, Button, Breadcrumbs, Link } from '@mui/material';
import { useForm } from 'react-hook-form';
import CustomSelect from '../../../components/Common/CustomSelect';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import { ICONS } from '../../../assets/icons';
import moment from 'moment';
import DataTable from '../../../components/Common/CustomTable';
import ConfirmationDialog from '../../../components/Inputs/ConfirmationDialog';
import CustomBackDrop from '../../../components/Common/CustomBackDrop';
import { useLazyGetMyGradePermissionsQuery, useLazyGetMyGenderPermissionsQuery, useLazyGetMySectionPermissionsQuery } from '../../../Redux/features/Admin/TeachersSlice';
import { useSnackbar } from '../../../hooks/SnackBar';
import TimetableViewModal from '../../../components/admin/timetable/TimetableViewModal';
import { useNavigate } from 'react-router-dom';
import { useAbility } from '../../../AbilityContext';
import { useTranslation } from 'react-i18next';
import { useDeleteTimetableMutation, useGetAllTimetablesQuery } from '../../../Redux/features/Admin/timetableApiSlice';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { useSelector, useDispatch } from 'react-redux';
import { setTimetableFilters, clearTimetableFilters } from '../../../Redux/features/Admin/timetableFiltersSlice';

const TimetableScreen = () => {
	const { themeColors } = useThemeContext();
	const { modal, openModal, closeModal } = useModal();
	const { user } = useSelector((state) => state.auth);
	const dispatch = useDispatch();
	const storedFilters = useSelector((state) => state.timetableFilters?.filters);

	console.log({user})

	const showSnackbar = useSnackbar();
	const navigate = useNavigate();
	const ability = useAbility();
	const { t } = useTranslation();

	// Local state
	const [item, setItem] = useState(null);
	const [_id, set_id] = useState(null);
	const [filters, setFilters] = useState({
		grade: '',
		gender: '',
		section: '',
		page: 1,
		limit: 10
	});
	const [queryParams, setQueryParams] = useState(null);

	// Form control for CustomSelect components - initialize with stored filters if available
	const { control, reset } = useForm({
		defaultValues: {
			grade: storedFilters?.grade || '',
			gender: storedFilters?.gender || '',
			section: storedFilters?.section || ''
		}
	});

	// API calls
	const [triggerGrades, { data: grades, isFetching: gradeLoading }] = useLazyGetMyGradePermissionsQuery();
	const [triggerGenders, { data: genders, isFetching: genderLoading }] = useLazyGetMyGenderPermissionsQuery();
	const [triggerSections, { data: sections, isFetching: sectionLoading }] = useLazyGetMySectionPermissionsQuery();

	// Refs to track the last triggered values for cascading filters
	const lastGradeId = useRef(null);

	// Trigger grades when component loads
	useEffect(() => {
		triggerGrades({});
	}, [triggerGrades]);

	// Track if filters have been initialized to prevent re-initialization
	const filtersInitialized = useRef(false);

	// Initialize filters from RTK store on mount (restore filter values and trigger fetch if filters exist)
	useEffect(() => {
		if (!filtersInitialized.current) {
			if (storedFilters && storedFilters.grade && storedFilters.gender && storedFilters.section) {
				filtersInitialized.current = true;
				// Restore filter values so user sees their previous selections
				const restoredFilters = {
					grade: storedFilters.grade,
					gender: storedFilters.gender,
					section: storedFilters.section,
					page: storedFilters.page || 1,
					limit: storedFilters.limit || 10
				};
				// Set lastGradeId to prevent cascading filter from clearing values on restore
				lastGradeId.current = restoredFilters.grade;
				
				setFilters(restoredFilters);
				// Update form control with restored values
				reset({
					grade: restoredFilters.grade,
					gender: restoredFilters.gender,
					section: restoredFilters.section
				});
				// Trigger cascading filters if needed (for dropdown options)
				triggerGenders({ grade: restoredFilters.grade });
				triggerSections({ grade: restoredFilters.grade, gender: restoredFilters.gender });
				// Set queryParams to trigger API fetch with restored filters
				setQueryParams({
					grade: restoredFilters.grade,
					gender: restoredFilters.gender,
					section: restoredFilters.section,
					page: restoredFilters.page || 1,
					limit: restoredFilters.limit || 10
				});
			} else {
				// No stored filters, mark as initialized to allow normal filter changes
				filtersInitialized.current = true;
			}
		}
	}, [storedFilters, reset, triggerGenders, triggerSections]);

	// Cascading filter effects
	useEffect(() => {
		// Skip if filters haven't been initialized yet (to avoid clearing on restore)
		if (!filtersInitialized.current) return;
		
		if (filters.grade && filters.grade !== lastGradeId.current) {
			lastGradeId.current = filters.grade;
			triggerGenders({ grade: filters.grade });
			// Clear section and gender when grade changes (user action)
			setFilters(prev => ({
				...prev,
				gender: '',
				section: ''
			}));
		}
	}, [filters.grade, triggerGenders]);

	// Trigger sections when gender changes (requires both grade and gender)
	useEffect(() => {
		// Skip if filters haven't been initialized yet (to avoid clearing on restore)
		if (!filtersInitialized.current) return;
		
		if (filters.gender && filters.grade) {
			triggerSections({ grade: filters.grade, gender: filters.gender });
			// Clear section when gender changes (user action)
			setFilters(prev => ({
				...prev,
				section: ''
			}));
		}
	}, [filters.gender, filters.grade, triggerSections]);

	const shouldFetchTimetables = Boolean(queryParams?.grade && queryParams?.gender && queryParams?.section);
	const {
		data: timetablesResponse,
		error: timetablesError,
		isFetching: isFetchingTimetables,
		refetch: refetchTimetables
	} = useGetAllTimetablesQuery(
		shouldFetchTimetables && queryParams ? queryParams : skipToken,
		{
			// Refetch when queryParams change
			refetchOnMountOrArgChange: true
		}
	);

	// Track if we've restored queryParams to trigger initial fetch
	const queryParamsRestored = useRef(false);
	
	// Ensure query refetches when queryParams are first restored from RTK
	useEffect(() => {
		if (queryParams && shouldFetchTimetables && filtersInitialized.current && !queryParamsRestored.current) {
			queryParamsRestored.current = true;
			// Query should automatically refetch when queryParams change from skipToken to actual params
			// But we explicitly trigger it once to ensure it happens on restore
			refetchTimetables();
		}
	}, [queryParams, shouldFetchTimetables, refetchTimetables]);

	const timetables = timetablesResponse?.data || [];
	const pagination = {
		currentPage: timetablesResponse?.currentPage || 1,
		totalPages: timetablesResponse?.totalPages || 1,
		total: timetablesResponse?.total || 0
	};

	const [deleteTimetable, { isLoading: isDeleting, isSuccess: deleteSuccess, error: deleteError }] =
		useDeleteTimetableMutation();

	useEffect(() => {
		if (timetablesError) {
			const message = timetablesError?.data?.message || timetablesError?.message || t('timetable.list.messages.genericError');
			showSnackbar(message, 'error');
		}
	}, [timetablesError, showSnackbar, t]);

	const handleFilterChange = useCallback((field, value) => {
		const updatedFilters = {
			...filters,
			[field]: value,
			page: 1
		};
		setFilters(updatedFilters);
		setQueryParams(null);
		// Update RTK store
		dispatch(setTimetableFilters(updatedFilters));
	}, [filters, dispatch]);

	const handleSubmit = useCallback(() => {
		if (filters.grade && filters.gender && filters.section) {
			const submittedFilters = {
				...filters,
				page: 1
			};
			setFilters(submittedFilters);
			setQueryParams({
				grade: submittedFilters.grade,
				gender: submittedFilters.gender,
				section: submittedFilters.section,
				page: 1,
				limit: submittedFilters.limit
			});
			// Update RTK store with submitted filters
			dispatch(setTimetableFilters(submittedFilters));
		} else {
			showSnackbar(t('timetable.list.messages.selectFilters'), 'warning');
		}
	}, [filters, dispatch, showSnackbar, t]);

	const handlePageChange = useCallback((newPage) => {
		const updatedFilters = {
			...filters,
			page: newPage
		};
		setFilters(updatedFilters);
		setQueryParams(prev => (prev ? { ...prev, page: newPage } : prev));
		// Update RTK store
		dispatch(setTimetableFilters(updatedFilters));
	}, [filters, dispatch]);

	const OpenDelete = useCallback((id) => {
		set_id(id);
		openModal('deleteModal');
	}, [modal]);

	const closeDelete = useCallback(() => {
		closeModal('deleteModal');
	}, [modal]);

	const openAdd = useCallback(() => {
		navigate('/timetable/create');
	}, [navigate]);


	const openEdit = useCallback((item) => {
		navigate(`/timetable/edit/${item._id}`);
	}, [navigate]);

	const openView = useCallback((item) => {
		setItem(item);
		openModal('viewModal');
	}, [modal]);

	const closeView = useCallback(() => {
		closeModal('viewModal');
	}, [modal]);

	const handleDelete = useCallback(() => {
		deleteTimetable(_id);
		closeDelete();
	}, [deleteTimetable, _id, closeDelete]);

	useEffect(() => {
		if (deleteSuccess) {
			showSnackbar(t('timetable.list.messages.deleteSuccess'), 'success');
			if (shouldFetchTimetables) {
				refetchTimetables();
			}
		}
	}, [deleteSuccess, refetchTimetables, shouldFetchTimetables, showSnackbar, t]);

	useEffect(() => {
		if (deleteError) {
			const message = deleteError?.data?.message || deleteError?.message || t('timetable.list.messages.genericError');
			showSnackbar(message, 'error');
		}
	}, [deleteError, showSnackbar, t]);


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

	const getStatusLabel = (status) => {
		switch (status) {
			case 'published':
				return t('timetable.list.status.published');
			case 'draft':
				return t('timetable.list.status.draft');
			case 'archived':
				return t('timetable.list.status.archived');
			default:
				return status;
		}
	};

	const columns = [
		{
			field: 'name',
			headerName: t('timetable.list.table.name'),
			width: 300,
			flex: 1,
			renderCell: (params) => (
				<Typography variant="body2" fontWeight="medium">
					{params.row.name || t('timetable.list.notAvailable')}
				</Typography>
			)
		},
		{
			field: 'status',
			headerName: t('timetable.list.table.status'),
			width: 150,
			renderCell: (params) => (
				<Chip
					label={getStatusLabel(params.row.status)}
					color={getStatusColor(params.row.status)}
					size="small"
					variant="outlined"
				/>
			)
		},
		{
			field: 'createdAt',
			headerName: t('timetable.list.table.createdDate'),
			width: 150,
			renderCell: (params) => (
				<Typography variant="body2">
					{params.row.createdAt ? moment(params.row.createdAt).format('MMM DD, YYYY') : t('timetable.list.notAvailable')}
				</Typography>
			)
		},
		{
			field: 'createdBy',
			headerName: t('timetable.list.table.createdBy'),
			width: 150,
			renderCell: (params) => (
				<Typography variant="body2">
					{params.row.createdBy?.name || params.row.createdBy?.email || t('timetable.list.notAvailable')}
				</Typography>
			)
		},
		{
			field: 'updatedAt',
			headerName: t('timetable.list.table.updatedDate'),
			width: 150,
			renderCell: (params) => (
				<Typography variant="body2">
					{params.row.updatedAt ? moment(params.row.updatedAt).format('MMM DD, YYYY') : t('timetable.list.notAvailable')}
				</Typography>
			)
		},
		{
			field: 'updatedBy',
			headerName: t('timetable.list.table.updatedBy'),
			width: 150,
			renderCell: (params) => (
				<Typography variant="body2">
					{params.row.updatedBy?.name || params.row.updatedBy?.email || t('timetable.list.notAvailable')}
				</Typography>
			)
		},
		{
			field: 'actions',
			headerName: t('timetable.list.table.actions'),
			width: 150,
			sortable: false,
			renderCell: (params) => (
				<Stack direction="row" spacing={1}>
					{ability.can("Read", "Timetable") && <Tooltip title={t('timetable.list.actions.view')}>
						<IconButton
							size="small"
							onClick={() => openView(params.row)}
							sx={{ color: themeColors.primary }}
						>
							<ICONS.Eye.component />
						</IconButton>
					</Tooltip>}
					{((ability.can("Edit", "Timetable") && user?._id === params?.row?.createdBy) || (user?.role === "admin" || user?.role?.roleName === "admin"))  && <Tooltip title={t('timetable.list.actions.edit')}>
						<IconButton
							size="small"
							onClick={() => openEdit(params.row)}
							sx={{ color: themeColors.secondary }}
						>
							<ICONS.Edit.component />
						</IconButton>
					</Tooltip>}
					{((ability.can("Delete", "Timetable") && user?._id === params?.row?.createdBy) || (user?.role === "admin" || user?.role?.roleName === "admin")) && <Tooltip title={t('timetable.list.actions.delete')}>
						<IconButton
							size="small"
							onClick={() => OpenDelete(params.row._id)}
							sx={{ color: themeColors.error }}
						>
							<ICONS.Delete.component />
						</IconButton>
					</Tooltip>}
				</Stack>
			)
		}
	];

	return (
		<CustomOutletBox>
			<Box sx={{ p: 3 }}>
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
						{t('timetable.breadcrumbs.timetable')} • {t('timetable.breadcrumbs.list')}
					</Typography>
				</Breadcrumbs>

				<Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
					<Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
						{t('timetable.list.title')}
					</Typography>
					{ability.can("Create", "Timetable") && <CustomAddButton ClickEvent={openAdd} label={t('timetable.list.actions.create')} />}
				</Box>

				{/* Filters */}
				<Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, mb: 3 }}>
					<CardContent>
						<Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
							{t('timetable.list.filters.title')}
						</Typography>
						<Grid container spacing={2} alignItems="flex-end">
							<Grid item xs={12} sm={6} md={3}>
								<CustomSelect
									fieldName="grade"
									control={control}
									fieldLabel={t('timetable.list.filters.grade')}
									size={14}
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
							<Grid item xs={12} sm={6} md={3}>
								<CustomSelect
									fieldName="gender"
									control={control}
									fieldLabel={t('timetable.list.filters.gender')}
									size={14}
									disabled={genderLoading || !filters.grade}
									onChangeValue={(value) => handleFilterChange('gender', value)}
								>
									{genders?.data?.map((gender) => (
										<MenuItem key={gender} value={gender}>
											{gender.charAt(0).toUpperCase() + gender.slice(1)}
										</MenuItem>
									))}
								</CustomSelect>
							</Grid>
							<Grid item xs={12} sm={6} md={3}>
								<CustomSelect
									fieldName="section"
									control={control}
									fieldLabel={t('timetable.list.filters.section')}
									size={14}
									disabled={sectionLoading || !filters.grade || !filters.gender}
									onChangeValue={(value) => handleFilterChange('section', value)}
								>
									{sections?.data?.map((section) => (
										<MenuItem key={section._id} value={section._id}>
											{section.sectionName}
										</MenuItem>
									))}
								</CustomSelect>
							</Grid>
							<Grid item xs={12} sm={6} md={3}>
								<Button
									variant="contained"
									fullWidth
									onClick={handleSubmit}
									disabled={!filters.grade || !filters.gender || !filters.section || isFetchingTimetables}
									sx={{
										backgroundColor: themeColors.primary,
										'&:hover': {
											backgroundColor: themeColors.primary,
											opacity: 0.9
										},
										height: '56px'
									}}
								>
									{t('timetable.list.filters.submit')}
								</Button>
							</Grid>
						</Grid>
					</CardContent>
				</Card>

				{/* Data Table */}
				<Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
					<CardContent sx={{ p: 0 }}>
						<DataTable
							rows={timetables}
							columns={columns}
							loading={isFetchingTimetables}
							pagination
							page={filters.page}
							pageSize={filters.limit}
							onPageChange={handlePageChange}
							id="_id"
						/>
					</CardContent>
				</Card>

				{/* Modals */}

				<TimetableViewModal
					open={modal.viewModal}
					onClose={closeView}
					item={item}
				/>

				<ConfirmationDialog
					isOpen={modal.deleteModal}
					onClose={closeDelete}
					onConfirm={handleDelete}
					title={t('timetable.list.delete.title')}
					message={t('timetable.list.delete.message')}
				/>

				<CustomBackDrop open={isFetchingTimetables || isDeleting} />
			</Box>
		</CustomOutletBox>
	);
};

export default TimetableScreen;
