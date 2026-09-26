import { Box, Grid, Skeleton, Stack, Tooltip, Typography, IconButton, ToggleButton, ToggleButtonGroup, useMediaQuery, useTheme, Paper, Alert, Divider, LinearProgress, MenuItem } from "@mui/material";
import DataTable from "../../components/Common/CustomTable";
import { Link, useNavigate } from "react-router-dom";
import ExamCard from "../../components/OnlineExam/ExamCard";
import useModal from "../../hooks/modalHook";
import NewExam from "../../components/OnlineExam/NewExam";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteExam, getAllExams, getExamReport } from "../../api/onlineExam";
import { useQuery } from "@tanstack/react-query";
import { useTheme as useThemeContext } from "../../contexts/ThemeContext";
import DeleteDialog from "../../components/Common/DeleteDialog";
import {
	ViewModule as CardViewIcon,
	ViewList as TableViewIcon,
	Visibility as VisibilityIcon,
	Edit as EditIcon,
	Assessment as AssessmentIcon,
	Delete as DeleteIcon
} from '@mui/icons-material';
import CustomSelect from "../../components/Common/CustomSelect";
import CustomButton from "../../components/Common/CustomButton";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useLazyGetMyGradePermissionsQuery, useLazyGetMySubjectPermissionsQuery } from "../../Redux/features/Admin/TeachersSlice";
import { setExamFilters, clearExamFilters } from "../../Redux/features/OnlineExam/examFiltersSlice";
import { useAbility } from "../../AbilityContext";
import { useTranslation } from 'react-i18next';

export default function Exams() {
	// const queryClient = useQueryClient()
	const theme = useTheme();
	const { themeColors } = useThemeContext();
	const { t } = useTranslation();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));
	const ability = useAbility();

	const { modal, openModal, closeModal } = useModal();
	const [exams, setExams] = useState([]);
	const [title, setTitle] = useState('');
	const [id, setId] = useState(null);
	const [viewMode, setViewMode] = useState(isMobile ? 'card' : 'table');
	const [datas, setDatas] = useState([]);
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const storedFilters = useSelector((state) => state.examFilters.filters);
	const filtersHydratedRef = useRef(false);

	// const { data: academicYears, isFetching: academicLoading } = useGetAcademicYearQuery();
	const [triggerGrades, { data: grades, isFetching: gradeLoading }] = useLazyGetMyGradePermissionsQuery();
	const [triggerSubjects, { data: subjects, isFetching: subjectLoading }] = useLazyGetMySubjectPermissionsQuery();

	// Validation schema - memoized with t dependency
	const filterSchema = useMemo(() => yup.object().shape({
		// academic_id: yup.object().required(t('exams.validation.academicYearRequired')),
		// term: yup.string().required(t('exams.validation.termRequired')),
		grade_id: yup.object().required(t('exams.validation.gradeRequired')),
		subject_id: yup.string().nullable(),
	}), [t]);

	const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
		resolver: yupResolver(filterSchema),
		defaultValues: {
			// academic_id: null,
			// term: '',
			grade_id: null,
			subject_id: '',
		},
	});

	console.log({ errors })

	// const watchAcademic = watch('academic_id');
	const watchGrade = watch('grade_id');
	const watchSubject = watch('subject_id');
	// const watchTerm = watch('term');

	// useEffect(() => {
	// 	if (academicYears?.length && !watchAcademic) {
	// 		setValue('academic_id', academicYears[0]);
	// 		setValue('term', academicYears[0]?.terms?.[0] || '');
	// 	}
	// }, [academicYears, setValue, watchAcademic]);

	useEffect(() => {
			triggerGrades({  });
	}, [triggerGrades]);

	useEffect(() => {
		if (watchGrade?._id) {
			triggerSubjects({ grade: watchGrade._id });
		}
	}, [triggerSubjects, watchGrade]);

	useEffect(() => {
		if (!storedFilters?.gradeId || filtersHydratedRef.current) return;
		const matchedGrade = grades?.data?.find((grade) => grade._id === storedFilters.gradeId);
		if (!matchedGrade) return;
		setValue('grade_id', matchedGrade);
		setValue('subject_id', storedFilters?.subjectId || '');
		filtersHydratedRef.current = true;
	}, [grades?.data, setValue, storedFilters?.gradeId, storedFilters?.subjectId]);

	useEffect(() => {
		filtersHydratedRef.current = false;
	}, [storedFilters?.gradeId, storedFilters?.subjectId]);

	const formattedFilters = useMemo(() => {
		if (!storedFilters?.gradeId) return null;
		return {
			grade: storedFilters.gradeId,
			subjectId: storedFilters.subjectId || undefined,
		};
	}, [storedFilters]);

	const { data, isLoading, isFetching, error } = useQuery({
		queryKey: ['onlineExam', formattedFilters],
		queryFn: () => getAllExams(formattedFilters),
		enabled: Boolean(formattedFilters?.grade),
	});

	const currentContext = useMemo(() => {
		if (!watchGrade?._id) return null;
		return {
			// academicYear: watchAcademic._id,
			grade: watchGrade._id,
			// term: watchTerm,
			subjectId: watchSubject || undefined,
		};
	}, [watchGrade, watchSubject]);

	const canCreateExam = Boolean(currentContext);
	const modalContext = formattedFilters ?? currentContext;

	// Update view mode when screen size changes
	useEffect(() => {
		setViewMode(isMobile ? 'card' : 'table');
	}, [isMobile]);

	useEffect(() => {
		if (data?.exams) {
			setExams(data.exams);
		}
	}, [data]);

	const openAdd = useCallback(() => {
		if (!canCreateExam) return;
		setDatas(null)
		setTitle(t('exams.titles.newExam'));
		openModal('addModal');
	}, [canCreateExam, openModal, t]);

	const closeAdd = useCallback(() => {
		closeModal('addModal');
	}, [modal]);

	const openEditForm = useCallback((data) => {
		setDatas(data)
		setTitle(t('exams.titles.editExam'));
		openModal('addModal');
	}, [openModal, t]);

	const deleteExamById = (data) => {
		setId(data?._id)
		openModal('deleteModal');
	}

	const handleReport = (exam) => {
		navigate(`/online-exam/report/${exam._id}`, { state: exam });
	}

	const handleViewModeChange = (event, newViewMode) => {
		if (newViewMode !== null) {
			setViewMode(newViewMode);
		}
	};

	const onSubmitFilters = (values) => {
		dispatch(setExamFilters({
			gradeId: values.grade_id._id,
			subjectId: values.subject_id || undefined,
		}));
	};

	const handleResetFilters = () => {
		dispatch(clearExamFilters());
		// if (academicYears?.length) {
		// 	setValue('academic_id', academicYears[0]);
		// 	setValue('term', academicYears[0]?.terms?.[0] || '');
		// }
		setValue('grade_id', null);
		setValue('subject_id', '');
		setExams([]);
	};

	// Table columns configuration - memoized with t dependency
	const columns = useMemo(() => [
		{
			field: 'examName',
			headerName: t('exams.table.examName'),
			flex: 1,
			minWidth: 200,
		},
		{
			field: 'term',
			headerName: t('exams.table.term'),
			width: 120,
		},
		{
			field: 'status',
			headerName: t('exams.table.status'),
			width: 100,
			renderCell: (params) => (
				<Box
					sx={{
						px: 1.5,
						py: 0.5,
						borderRadius: '12px',
						fontSize: '0.75rem',
						fontWeight: '600',
						backgroundColor: params.value === 'active' ? themeColors.success : themeColors.error,
						color: 'white',
					}}
				>
					{params.value === 'active' ? t('exams.table.active') : t('exams.table.inactive')}
				</Box>
			),
		},
		{
			field: 'createdAt',
			headerName: t('exams.table.created'),
			width: 120,
			renderCell: (params) => new Date(params.value).toLocaleDateString(),
		},
		{
			field: 'createdBy',
			headerName: t('exams.table.createdBy'),
			width: 150,
			renderCell: (params) => params.value?.name || t('exams.table.unknown'),
		},
		{
			field: 'publishCount',
			headerName: t('exams.table.published'),
			width: 100,
			renderCell: (params) => t('exams.table.publishCount', { count: params.value || 0 }),
		},
		{
			field: 'actions',
			headerName: t('exams.table.actions'),
			width: 200,
			sortable: false,
			renderCell: (params) => (
				<Box display="flex" gap={1}>
					{ability.can("Read", "PublishedExams") && <Tooltip title={t('exams.actions.viewPublished')}>
						<IconButton
							component={Link}
							to={`/online-exam/${params.row.slug}/published`}
							state={params.row}
							size="small"
							sx={{
								color: themeColors.primary,
								'&:hover': { backgroundColor: `${themeColors.primary}15` }
							}}
						>
							<VisibilityIcon />
						</IconButton>
					</Tooltip>}
					{ability.can("Edit", "Exams") && <Tooltip title={t('exams.actions.edit')}>
						<IconButton
							onClick={() => openEditForm(params.row)}
							size="small"
							sx={{
								color: themeColors.primary,
								'&:hover': { backgroundColor: `${themeColors.primary}15` }
							}}
						>
							<EditIcon />
						</IconButton>
					</Tooltip>}
					{ability.can("Read", "Exam") && <Tooltip title={t('exams.actions.viewReport')}>
						<IconButton
							onClick={() => handleReport(params.row)}
							size="small"
							sx={{
								color: themeColors.info,
								'&:hover': { backgroundColor: `${themeColors.info}15` }
							}}
						>
							<AssessmentIcon />
						</IconButton>
					</Tooltip>}
					{ability.can("Delete", "Exams") && <Tooltip title={t('exams.actions.delete')}>
						<IconButton
							onClick={() => deleteExamById(params.row)}
							size="small"
							sx={{
								color: themeColors.error,
								'&:hover': { backgroundColor: `${themeColors.error}15` }
							}}
						>
							<DeleteIcon />
						</IconButton>
					</Tooltip>}
				</Box>
			),
		},
	], [t, themeColors, ability, openEditForm]);

	return (
		<>
			<Paper
				sx={{
					p: 3,
					mb: 3,
					backgroundColor: themeColors.background.primary,
					border: `1px solid ${themeColors.border.primary}`,
					borderRadius: 3,
					position: 'relative'
				}}
				elevation={0}
			>
				<Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
					<Box>
						<Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
							{t('exams.filters.title')}
						</Typography>
						<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
							{t('exams.filters.description')}
						</Typography>
					</Box>
					<Box display="flex" gap={1}>
						<ToggleButtonGroup
							value={viewMode}
							exclusive
							onChange={handleViewModeChange}
							aria-label="view mode"
							sx={{
								'& .MuiToggleButtonGroup-grouped': {
									borderColor: themeColors.border.primary,
								},
								'& .MuiToggleButton-root': {
									color: themeColors.text.primary,
									'&.Mui-selected': {
										backgroundColor: `${themeColors.primary}22`,
										color: themeColors.primary,
										'&:hover': {
											backgroundColor: `${themeColors.primary}33`,
										},
									},
									'&:hover': {
										backgroundColor: `${themeColors.text.primary}14`,
									},
								},
								'& .MuiSvgIcon-root': {
									color: 'inherit',
								},
							}}
						>
							<ToggleButton value="table" aria-label="table view">
								<TableViewIcon fontSize="small" />
							</ToggleButton>
							<ToggleButton value="card" aria-label="card view">
								<CardViewIcon fontSize="small" />
							</ToggleButton>
						</ToggleButtonGroup>
						{ability.can("Create", "Exams") && <CustomButton
							variant="outlined"
							label={t('exams.actions.create')}
							onClick={openAdd}
							disable={!canCreateExam}
						/>}
					</Box>
				</Box>
				<Divider sx={{ mb: 3 }} />
				<Grid container spacing={2}>
					{/* <Grid item xs={12} sm={6} md={3}>
						<CustomSelect
							control={control}
							fieldName="academic_id"
							fieldLabel={t('exams.filters.academicYear')}
							error={null}
							disabled={academicLoading}
						>
							{academicYears?.map((year) => (
								<MenuItem key={year._id} value={year}>
									{year.academicYear}
								</MenuItem>
							))}
						</CustomSelect>
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<CustomSelect
							control={control}
							fieldName="term"
							fieldLabel={t('exams.filters.term')}
						>
							{(watchAcademic?.terms || []).map((termOption) => (
								<MenuItem key={termOption} value={termOption}>
									{termOption}
								</MenuItem>
							))}
						</CustomSelect>
					</Grid> */}
					<Grid item xs={12} sm={6} md={4}>
						<CustomSelect
							control={control}
							fieldName="grade_id"
							fieldLabel={t('exams.filters.grade')}
							disabled={gradeLoading}
						>
							{grades?.data?.map((grade) => (
								<MenuItem key={grade._id} value={grade}>
									{grade.gradeName}
								</MenuItem>
							))}
						</CustomSelect>
					</Grid>
					<Grid item xs={12} sm={6} md={4}>
						<CustomSelect
							control={control}
							fieldName="subject_id"
							fieldLabel={t('exams.filters.subject')}
							disabled={subjectLoading}
						>
							{subjects?.data?.map((subject) => (
								<MenuItem key={subject._id} value={subject._id}>
									{subject.subjectName}
								</MenuItem>
							))}
						</CustomSelect>
					</Grid>
				</Grid>
				<Box display="flex" justifyContent="flex-end" gap={1} mt={3}>
					<CustomButton variant="outlined" label={t('exams.filters.reset')} onClick={handleResetFilters} />
					<CustomButton label={t('exams.filters.apply')} onClick={handleSubmit(onSubmitFilters)} />
				</Box>
			</Paper>

			{(isLoading || isFetching) && (
				<Box sx={{ mb: 3 }}>
					<LinearProgress />
				</Box>
			)}

			{error && (
				<Alert severity="error" sx={{ mb: 3 }}>
					{t('exams.messages.loadFailed')}
				</Alert>
			)}

			{!formattedFilters && (
				<Alert severity="info">
					{t('exams.messages.selectFilters')}
				</Alert>
			)}

			{(isLoading || isFetching) ? (
				<Grid container spacing={2}>
					{Array.from({ length: 6 }).map((_, idx) => (
						<Grid item xs={12} md={4} key={idx}>
							<Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
						</Grid>
					))}
				</Grid>
			) : (
				<>
					{formattedFilters && exams.length === 0 && !isFetching && (
						<Alert severity="warning" sx={{ mb: 3 }}>
							{t('exams.messages.noExamsFound')}
						</Alert>
					)}

					{formattedFilters && exams.length > 0 && (
						<>
							{viewMode === 'table' ? (
								<DataTable
									sx={{ '& .MuiDataGrid-columnHeaders': { backgroundColor: `${themeColors.background.primary}` } }}
									rows={exams}
									columns={columns}
									id="_id"
								/>
							) : (
								<Grid container spacing={3}>
									{exams.map((exam) => (
										<Grid item xs={12} md={4} key={exam._id}>
											<ExamCard
												exam={exam}
												onEdit={() => openEditForm(exam)}
												onDelete={() => deleteExamById(exam)}
												onViewReport={() => handleReport(exam)}
											/>
										</Grid>
									))}
								</Grid>
							)}
						</>
					)}
				</>
			)}

			{modal.addModal && (
				<NewExam
					open={modal.addModal}
					close={closeAdd}
					label={title}
					hide={false}
					id={false}
					state={modalContext}
					data={datas}
				/>
			)}
			<DeleteDialog
				open={modal.deleteModal}
				onClose={() => closeModal('deleteModal')}
				heading={t('exams.delete.heading')}
				paragraph={t('exams.delete.paragraph')}
				fun={deleteExam}
				_id={id}
				queryKeytoRefetch={['onlineExam', formattedFilters ?? currentContext]}
			/>
		</>
	);
}