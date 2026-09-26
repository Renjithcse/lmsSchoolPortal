import React, { useEffect, useMemo, useState } from 'react';
import {
	Box,
	Breadcrumbs,
	Card,
	CardContent,
	Grid,
	IconButton,
	Link,
	MenuItem,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import moment from 'moment';
import { capitalize } from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import CustomOutletBox from '../../components/Common/CustomOutletBox';
import DataTable from '../../components/Common/CustomTable';
import CustomButton from '../../components/Common/CustomButton';
import CustomModal from '../../components/Common/CustomModal';
import ConfirmationDialog from '../../components/Inputs/ConfirmationDialog';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { object } from 'yup';
import * as yup from 'yup';
import { useSnackbar } from '../../hooks/SnackBar';
import { useNavigate } from 'react-router-dom';
import { useAbility } from '../../AbilityContext';
import { useDispatch, useSelector } from 'react-redux';
import {
	setGender,
	setGradeId,
	setSectionId,
	setSubjectFeedbackType,
	setSubjectId,
} from '../../Redux/features/Feedback/subjectFeedbackFilterSlice';

import {
	useLazyGetMyGradePermissionsQuery,
	useLazyGetMyGenderPermissionsQuery,
	useLazyGetMySectionPermissionsQuery,
	useLazyGetMySubjectPermissionsQuery,
} from '../../Redux/features/Admin/TeachersSlice';

import {
	useDeleteSubjectFeedbackMutation,
	useGetSubjectFeedbackListQuery,
	useUpdateSubjectFeedbackMutation,
} from '../../Redux/features/Feedback/SubjectFeedbackSlice';

const SubjectFeedbackList = () => {
	const { t } = useTranslation();
	const { themeColors } = useThemeContext();
	const showSnackbar = useSnackbar();
	const navigate = useNavigate();
	const ability = useAbility();
	const dispatch = useDispatch();

	const { gradeId, gender, sectionId, subjectId, type } = useSelector((state) => state.subjectFeedbackFilters);

	const [editOpen, setEditOpen] = useState(false);
	const [editRow, setEditRow] = useState(null);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deleteRow, setDeleteRow] = useState(null);

	const [triggerGrades, { data: gradesRes, isFetching: gradeLoading }] = useLazyGetMyGradePermissionsQuery();
	const [triggerGender, { data: gendersRes, isFetching: genderLoading }] = useLazyGetMyGenderPermissionsQuery();
	const [triggerSections, { data: sectionsRes, isFetching: sectionLoading }] = useLazyGetMySectionPermissionsQuery();
	const [triggerSubjects, { data: subjectsRes, isFetching: subjectLoading }] = useLazyGetMySubjectPermissionsQuery();

	const grades = gradesRes?.data || [];
	const genders = gendersRes?.data || [];
	const sections = sectionsRes?.data || [];
	const subjects = subjectsRes?.data || [];

	useEffect(() => {
		triggerGrades();
	}, [triggerGrades]);

	useEffect(() => {
		if (gradeId) triggerGender({ grade: gradeId });
	}, [gradeId, triggerGender]);

	useEffect(() => {
		if (gradeId && gender) triggerSections({ grade: gradeId, gender });
	}, [gradeId, gender, triggerSections]);

	useEffect(() => {
		if (gradeId && gender && sectionId) triggerSubjects({ grade: gradeId, gender, section: sectionId });
	}, [gradeId, gender, sectionId, triggerSubjects]);

	const filtersReady = !!(gradeId && gender && sectionId && subjectId);

	const { data: listRes, isLoading: isListLoading } = useGetSubjectFeedbackListQuery(
		{ grade: gradeId, gender, section: sectionId, subject: subjectId, type },
		{ skip: !filtersReady, refetchOnMountOrArgChange: true }
	);
	const rows = listRes?.data || [];

	const schema = useMemo(
		() =>
			object().shape({
				feedback: yup.string().trim().required(t('feedback.subject.validation.feedbackRequired')),
				feedbackDate: yup.string().required(t('feedback.subject.validation.dateRequired')),
			}),
		[t]
	);

	const {
		handleSubmit,
		register,
		reset,
		formState: { errors },
	} = useForm({
		resolver: yupResolver(schema),
		defaultValues: { feedback: '', feedbackDate: moment().format('YYYY-MM-DD') },
	});

	const [triggerUpdate, { isLoading: isUpdating }] = useUpdateSubjectFeedbackMutation();
	const [triggerDelete, { isLoading: isDeleting }] = useDeleteSubjectFeedbackMutation();

	const openEdit = (row) => {
		setEditRow(row);
		reset({
			feedback: row?.feedback || '',
			feedbackDate: row?.feedbackDate ? moment(row.feedbackDate).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
		});
		setEditOpen(true);
	};

	const closeEdit = () => {
		setEditOpen(false);
		setEditRow(null);
		reset({ feedback: '', feedbackDate: moment().format('YYYY-MM-DD') });
	};

	const submitEdit = async (data) => {
		if (!editRow?._id) return;
		const res = await triggerUpdate({
			id: editRow._id,
			data: { feedback: data.feedback, feedbackDate: data.feedbackDate },
		});
		if (res?.error) {
			showSnackbar(res?.error?.data?.message || t('feedback.subject.list.messages.updateError'), 'error');
			return;
		}
		showSnackbar(t('feedback.subject.list.messages.updateSuccess'), 'success');
		closeEdit();
	};

	const openDelete = (row) => {
		setDeleteRow(row);
		setDeleteOpen(true);
	};

	const closeDelete = () => {
		setDeleteOpen(false);
		setDeleteRow(null);
	};

	const confirmDelete = async () => {
		if (!deleteRow?._id) return;
		const res = await triggerDelete(deleteRow._id);
		if (res?.error) {
			showSnackbar(res?.error?.data?.message || t('feedback.subject.list.messages.deleteError'), 'error');
			return;
		}
		showSnackbar(t('feedback.subject.list.messages.deleteSuccess'), 'success');
		closeDelete();
	};

	const columns = useMemo(
		() => [
			{
				field: 'SN',
				headerName: t('feedback.subject.list.table.sn'),
				flex: 0.5,
				headerAlign: 'center',
				align: 'center',
				renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1,
			},
			{
				field: 'student',
				headerName: t('feedback.subject.list.table.student'),
				flex: 1.2,
				valueGetter: (params) =>
					params?.row?.studentId
						? `${params.row.studentId.studentID || ''}${params.row.studentId.studentID ? ' - ' : ''}${params.row.studentId.studentName || ''}`
						: '',
			},
			{
				field: 'feedback',
				headerName: t('feedback.subject.list.table.feedback'),
				flex: 2,
				valueGetter: (params) => params?.row?.feedback || '',
			},
			{
				field: 'feedbackDate',
				headerName: t('feedback.subject.list.table.feedbackDate'),
				flex: 1,
				headerAlign: 'center',
				align: 'center',
				valueGetter: (params) => (params?.row?.feedbackDate ? moment(params.row.feedbackDate).format('DD-MM-YYYY') : ''),
			},
			{
				field: 'action',
				headerName: t('feedback.subject.list.table.action'),
				flex: 0.9,
				headerAlign: 'center',
				align: 'center',
				sortable: false,
				disableColumnMenu: true,
				renderCell: ({ row }) => (
					<Stack direction="row" spacing={1} justifyContent="center">
						{ability.can('Edit', 'SubjectFeedback') && (
							<Tooltip title={t('feedback.subject.list.actions.edit')}>
								<IconButton
									size="small"
									onClick={(e) => {
										e.stopPropagation();
										openEdit(row);
									}}
									sx={{
										color: themeColors.accent,
										'&:hover': { backgroundColor: themeColors.accent, color: themeColors.text.inverse },
									}}
								>
									<EditIcon fontSize="small" />
								</IconButton>
							</Tooltip>
						)}
						{(() => {
							const canDelete = ability.can('Delete', 'SubjectFeedback') || ability.can('Edit', 'SubjectFeedback');
							return (
								<Tooltip
									title={
										canDelete ? t('feedback.subject.list.actions.delete') : t('feedback.subject.list.messages.noDeletePermission')
									}
								>
									<span>
										<IconButton
											size="small"
											disabled={!canDelete}
											onClick={(e) => {
												e.stopPropagation();
												if (!canDelete) {
													showSnackbar(t('feedback.subject.list.messages.noDeletePermission'), 'error');
													return;
												}
												openDelete(row);
											}}
											sx={{
												color: canDelete ? themeColors.error : themeColors.text.secondary,
												'&:hover': canDelete
													? { backgroundColor: themeColors.error, color: themeColors.text.inverse }
													: undefined,
											}}
										>
											<DeleteIcon fontSize="small" />
										</IconButton>
									</span>
								</Tooltip>
							);
						})()}
					</Stack>
				),
			},
		],
		[t, ability, themeColors, showSnackbar]
	);

	return (
		<CustomOutletBox>
			<Box sx={{ p: 3, backgroundColor: themeColors.background.primary, minHeight: '100%' }}>
				<Breadcrumbs
					separator="›"
					sx={{ mb: 2, '& .MuiBreadcrumbs-separator': { color: themeColors.text.secondary } }}
				>
					<Link
						underline="hover"
						sx={{ color: themeColors.text.secondary, cursor: 'pointer' }}
						onClick={() => navigate('/feedback')}
					>
						{t('feedback.breadcrumbs.feedback')}
					</Link>
					<Typography sx={{ color: themeColors.text.primary }}>
						{t('feedback.breadcrumbs.subjectFeedback')} • {t('feedback.breadcrumbs.list')}
					</Typography>
				</Breadcrumbs>

				<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={2} gap={1}>
					<Box>
						<Typography variant="h6" sx={{ color: themeColors.text.primary, fontWeight: 700 }}>
							{t('feedback.subject.list.title')}
						</Typography>
						<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
							{t('feedback.subject.list.subtitle')}
						</Typography>
					</Box>
				</Stack>

				<Card sx={{ 
					borderRadius: 2, 
					boxShadow: 2, 
					border: `1px solid ${themeColors.border.primary}`, 
					mb: 2,
					backgroundColor: themeColors.background.secondary
				}}>
					<CardContent>
						<Grid container spacing={2}>
							<Grid item xs={12} md={3}>
								<TextField
									select
									fullWidth
									size="small"
									value={gradeId}
									onChange={(e) => dispatch(setGradeId(e.target.value))}
									label={t('feedback.subject.fields.grade')}
									disabled={gradeLoading}
									sx={{
										'& .MuiOutlinedInput-root': {
											backgroundColor: themeColors.background.primary,
											color: themeColors.text.primary,
											'&:hover': {
												borderColor: themeColors.primary
											},
											'&.Mui-focused': {
												borderColor: themeColors.primary
											}
										},
										'& .MuiInputLabel-root': {
											color: themeColors.text.secondary,
											'&.Mui-focused': {
												color: themeColors.primary
											}
										}
									}}
								>
									<MenuItem value="" disabled>
										<em>{t('feedback.subject.placeholders.selectGrade')}</em>
									</MenuItem>
									{grades.map((g) => (
										<MenuItem key={g._id} value={g._id}>
											{g.gradeName}
										</MenuItem>
									))}
								</TextField>
							</Grid>
							<Grid item xs={12} md={3}>
								<TextField
									select
									fullWidth
									size="small"
									value={gender}
									onChange={(e) => dispatch(setGender(e.target.value))}
									label={t('feedback.subject.fields.gender')}
									disabled={!gradeId || genderLoading}
									sx={{
										'& .MuiOutlinedInput-root': {
											backgroundColor: themeColors.background.primary,
											color: themeColors.text.primary,
											'&:hover': {
												borderColor: themeColors.primary
											},
											'&.Mui-focused': {
												borderColor: themeColors.primary
											}
										},
										'& .MuiInputLabel-root': {
											color: themeColors.text.secondary,
											'&.Mui-focused': {
												color: themeColors.primary
											}
										}
									}}
								>
									<MenuItem value="" disabled>
										<em>{t('feedback.subject.placeholders.selectGender')}</em>
									</MenuItem>
									{genders.map((g) => (
										<MenuItem key={g} value={g}>
											{capitalize(g)}
										</MenuItem>
									))}
								</TextField>
							</Grid>
							<Grid item xs={12} md={3}>
								<TextField
									select
									fullWidth
									size="small"
									value={sectionId}
									onChange={(e) => dispatch(setSectionId(e.target.value))}
									label={t('feedback.subject.fields.section')}
									disabled={!gradeId || !gender || sectionLoading}
									sx={{
										'& .MuiOutlinedInput-root': {
											backgroundColor: themeColors.background.primary,
											color: themeColors.text.primary,
											'&:hover': {
												borderColor: themeColors.primary
											},
											'&.Mui-focused': {
												borderColor: themeColors.primary
											}
										},
										'& .MuiInputLabel-root': {
											color: themeColors.text.secondary,
											'&.Mui-focused': {
												color: themeColors.primary
											}
										}
									}}
								>
									<MenuItem value="" disabled>
										<em>{t('feedback.subject.placeholders.selectSection')}</em>
									</MenuItem>
									{sections.map((s) => (
										<MenuItem key={s._id} value={s._id}>
											{s.sectionName}
										</MenuItem>
									))}
								</TextField>
							</Grid>
							<Grid item xs={12} md={3}>
								<TextField
									select
									fullWidth
									size="small"
									value={subjectId}
									onChange={(e) => dispatch(setSubjectId(e.target.value))}
									label={t('feedback.subject.fields.subject')}
									disabled={!gradeId || !gender || !sectionId || subjectLoading}
									sx={{
										'& .MuiOutlinedInput-root': {
											backgroundColor: themeColors.background.primary,
											color: themeColors.text.primary,
											'&:hover': {
												borderColor: themeColors.primary
											},
											'&.Mui-focused': {
												borderColor: themeColors.primary
											}
										},
										'& .MuiInputLabel-root': {
											color: themeColors.text.secondary,
											'&.Mui-focused': {
												color: themeColors.primary
											}
										}
									}}
								>
									<MenuItem value="" disabled>
										<em>{t('feedback.subject.placeholders.selectSubject')}</em>
									</MenuItem>
									{subjects.map((s) => (
										<MenuItem key={s._id} value={s._id}>
											{s.subjectName}
										</MenuItem>
									))}
								</TextField>
							</Grid>
							<Grid item xs={12} md={3}>
								<TextField
									select
									fullWidth
									size="small"
									value={type}
									onChange={(e) => dispatch(setSubjectFeedbackType(e.target.value))}
									label={t('feedback.subject.fields.type')}
									sx={{
										'& .MuiOutlinedInput-root': {
											backgroundColor: themeColors.background.primary,
											color: themeColors.text.primary,
											'&:hover': {
												borderColor: themeColors.primary
											},
											'&.Mui-focused': {
												borderColor: themeColors.primary
											}
										},
										'& .MuiInputLabel-root': {
											color: themeColors.text.secondary,
											'&.Mui-focused': {
												color: themeColors.primary
											}
										}
									}}
								>
									<MenuItem value="feedback">{t('feedback.types.feedback')}</MenuItem>
									<MenuItem value="discipline">{t('feedback.types.discipline')}</MenuItem>
								</TextField>
							</Grid>
						</Grid>
					</CardContent>
				</Card>

				<Card sx={{ 
					borderRadius: 2, 
					boxShadow: 2, 
					border: `1px solid ${themeColors.border.primary}`,
					backgroundColor: themeColors.background.secondary
				}}>
					<CardContent sx={{ 
						p: 0, 
						'&:last-child': { pb: 0 }, 
						overflow: 'hidden',
						backgroundColor: themeColors.background.secondary
					}}>
						<Box sx={{ p: 2, backgroundColor: themeColors.background.secondary }}>
							{filtersReady && ability.can('Create', 'SubjectFeedback') && (
								<Stack direction="row" justifyContent="flex-end" mb={2}>
									<CustomButton
										onClick={() => navigate('/feedback/subject/new')}
										label={t('feedback.subject.list.actions.add')}
										isIcon={true}
										ICON={AddIcon}
										width="190px"
									/>
								</Stack>
							)}
						</Box>
						<Box sx={{ width: '100%', overflowX: 'auto', backgroundColor: themeColors.background.secondary }}>
							<DataTable
								rows={rows}
								columns={columns}
								id="_id"
								loading={isListLoading}
								sx={{
									'& .MuiDataGrid-root': { 
										border: 'none', 
										backgroundColor: themeColors.background.secondary, 
										color: themeColors.text.primary,
										minWidth: 'fit-content',
									},
									'& .MuiDataGrid-cell': { 
										borderBottom: `1px solid ${themeColors.border.primary}`, 
										color: themeColors.text.primary,
										backgroundColor: themeColors.background.secondary,
									},
									'& .MuiDataGrid-row': {
										backgroundColor: themeColors.background.secondary,
										'&:hover': {
											backgroundColor: themeColors.background.tertiary || themeColors.background.primary,
										},
										'&.Mui-selected': {
											backgroundColor: `${themeColors.primary}20`,
											'&:hover': {
												backgroundColor: `${themeColors.primary}30`,
											},
										},
									},
									'& .MuiDataGrid-columnHeaders': { 
										backgroundColor: themeColors.background.tertiary || themeColors.background.primary, 
										borderBottom: `2px solid ${themeColors.border.primary}`,
										color: themeColors.text.primary,
									},
									'& .MuiDataGrid-columnHeader': {
										color: themeColors.text.primary,
										'&:hover': {
											backgroundColor: themeColors.background.secondary,
										},
									},
									'& .MuiDataGrid-footerContainer': {
										borderTop: `1px solid ${themeColors.border.primary}`,
										backgroundColor: themeColors.background.secondary,
									},
									'& .MuiDataGrid-virtualScroller': {
										overflowX: 'auto !important',
										overflowY: 'auto !important',
										backgroundColor: themeColors.background.secondary,
									},
									'& .MuiDataGrid-virtualScrollerContent': {
										minWidth: 'fit-content !important',
									},
									'& .MuiDataGrid-main': {
										overflowX: 'auto !important',
										backgroundColor: themeColors.background.secondary,
									},
								}}
							/>
						</Box>
					</CardContent>
				</Card>

				<CustomModal open={editOpen} close={closeEdit} label={t('feedback.subject.list.modal.editTitle')} width={'sm'} block={true}>
					<Box>
						<TextField
							fullWidth
							type="date"
							label={t('feedback.subject.fields.date')}
							InputLabelProps={{ shrink: true }}
							sx={{ mb: 2 }}
							{...register('feedbackDate')}
							error={!!errors.feedbackDate}
							helperText={errors.feedbackDate?.message}
						/>
						<TextField
							fullWidth
							multiline
							minRows={4}
							label={t('feedback.subject.fields.feedback')}
							{...register('feedback')}
							error={!!errors.feedback}
							helperText={errors.feedback?.message}
						/>
						<Stack direction="row" justifyContent="flex-end" mt={2}>
							{ability.can('Edit', 'SubjectFeedback') && (
								<CustomButton
									onClick={handleSubmit(submitEdit)}
									label={t('feedback.subject.list.actions.update')}
									isIcon={false}
									width="180px"
									loading={isUpdating}
								/>
							)}
						</Stack>
					</Box>
				</CustomModal>

				<ConfirmationDialog
					isOpen={deleteOpen}
					onClose={closeDelete}
					onConfirm={confirmDelete}
					title={t('feedback.subject.list.modal.deleteTitle')}
					message={t('feedback.subject.list.messages.deleteConfirm')}
				/>
			</Box>
		</CustomOutletBox>
	);
};

export default SubjectFeedbackList;

