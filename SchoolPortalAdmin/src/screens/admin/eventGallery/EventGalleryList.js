import React, { useMemo, useState, useCallback } from 'react';
import {
	Box,
	Breadcrumbs,
	Card,
	CardContent,
	Grid,
	IconButton,
	Link,
	Stack,
	Tooltip,
	Typography,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Chip,
	Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PublishIcon from '@mui/icons-material/Publish';
import DraftIcon from '@mui/icons-material/Drafts';
import CheckIcon from '@mui/icons-material/Check';
import ClassIcon from '@mui/icons-material/Class';
import CloseIcon from '@mui/icons-material/Close';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import CustomOutletBox from '../../../components/Common/CustomOutletBox';
import DataTable from '../../../components/Common/CustomTable';
import CustomButton from '../../../components/Common/CustomButton';
import ConfirmationDialog from '../../../components/Inputs/ConfirmationDialog';
import { useSnackbar } from '../../../hooks/SnackBar';
import { useNavigate } from 'react-router-dom';
import { useAbility } from '../../../AbilityContext';
import {
	useGetAllEventGalleriesQuery,
	useDeleteEventGalleryMutation,
} from '../../../Redux/features/Admin/eventGallerySlice';

const EventGalleryList = () => {
	const { t } = useTranslation();
	const { themeColors } = useThemeContext();
	const showSnackbar = useSnackbar();
	const navigate = useNavigate();
	const ability = useAbility();

	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deleteRow, setDeleteRow] = useState(null);
	const [publishedClassesOpen, setPublishedClassesOpen] = useState(false);
	const [selectedEvent, setSelectedEvent] = useState(null);

	const { data: listRes, isLoading: isListLoading } = useGetAllEventGalleriesQuery();
	const rows = listRes?.data || [];

	const [triggerDelete, { isLoading: isDeleting }] = useDeleteEventGalleryMutation();

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
			showSnackbar(res?.error?.data?.message || t('eventGallery.list.messages.deleteError'), 'error');
			return;
		}
		showSnackbar(t('eventGallery.list.messages.deleteSuccess'), 'success');
		closeDelete();
	};

	const handlePublish = useCallback(
		(id) => {
			navigate(`/event-gallery/publish/${id}`);
		},
		[navigate]
	);


	const handleViewPublishedClasses = useCallback((event) => {
		setSelectedEvent(event);
		setPublishedClassesOpen(true);
	}, []);

	const handleClosePublishedClasses = useCallback(() => {
		setPublishedClassesOpen(false);
		setSelectedEvent(null);
	}, []);

		const columns = useMemo(
		() => [
			{
				field: 'SN',
				headerName: t('eventGallery.list.table.sn'),
				width: 80,
				headerAlign: 'center',
				align: 'center',
				renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1,
			},
			{
				field: 'eventName',
				headerName: t('eventGallery.list.table.eventName'),
				width: 200,
				minWidth: 150,
				valueGetter: (params) => params?.row?.eventName || '',
			},
			{
				field: 'eventDate',
				headerName: t('eventGallery.list.table.eventDate'),
				width: 150,
				headerAlign: 'center',
				align: 'center',
				valueGetter: (params) =>
					params?.row?.eventDate ? moment(params.row.eventDate).format('DD-MM-YYYY') : '',
			},
			{
				field: 'images',
				headerName: t('eventGallery.list.table.images'),
				width: 120,
				headerAlign: 'center',
				align: 'center',
				valueGetter: (params) => params?.row?.images?.length || 0,
				renderCell: (params) => (
					<Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
						<PhotoLibraryIcon sx={{ fontSize: 18, color: themeColors.primary }} />
						<Typography variant="body2">{params?.row?.images?.length || 0}</Typography>
					</Stack>
				),
			},
			{
				field: 'status',
				headerName: t('eventGallery.list.table.status'),
				width: 150,
				headerAlign: 'center',
				align: 'center',
				renderCell: (params) => {
					const status = params?.row?.status || 'Draft';
					const isPublished = status === 'Published';
					const scheduledDate = params?.row?.scheduledPublishDate;
					const publishOption = params?.row?.publishOption;

					return (
						<Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
							<Tooltip
								title={
									isPublished
										? t('eventGallery.list.status.published')
										: scheduledDate && publishOption === 'Publish Later'
											? t('eventGallery.list.status.scheduled', {
												date: moment(scheduledDate).format('DD MMM YYYY HH:mm'),
											})
											: t('eventGallery.list.status.draft')
								}
							>
								<Chip
									icon={isPublished ? <PublishIcon /> : <DraftIcon />}
									label={isPublished ? t('eventGallery.list.status.published') : t('eventGallery.list.status.draft')}
									size="small"
									color={isPublished ? 'success' : 'warning'}
									sx={{
										fontWeight: 600,
										fontSize: '0.75rem',
									}}
								/>
							</Tooltip>
						</Stack>
					);
				},
			},
			{
				field: 'createdAt',
				headerName: t('eventGallery.list.table.createdAt'),
				width: 180,
				headerAlign: 'center',
				align: 'center',
				valueGetter: (params) =>
					params?.row?.createdAt ? moment(params.row.createdAt).format('DD-MM-YYYY hh:mm A') : '',
			},
			{
				field: 'action',
				headerName: t('eventGallery.list.table.action'),
				width: 200,
				headerAlign: 'center',
				align: 'center',
				sortable: false,
				disableColumnMenu: true,
				renderCell: ({ row }) => {
					const isPublished = row?.status === 'Published';
					return (
						<Stack direction="row" spacing={1} justifyContent="center">
							<Tooltip title={t('eventGallery.list.actions.view')}>
								<IconButton
									size="small"
									onClick={(e) => {
										e.stopPropagation();
										navigate(`/event-gallery/view/${row._id}`);
									}}
									sx={{
										color: themeColors.primary,
										'&:hover': {
											backgroundColor: themeColors.primary,
											color: themeColors.text.inverse,
										},
									}}
								>
									<VisibilityIcon fontSize="small" />
								</IconButton>
							</Tooltip>
							{ability.can('Edit', 'EventGallery') && (
								<Tooltip title={t('eventGallery.list.actions.edit')}>
									<IconButton
										size="small"
										onClick={(e) => {
											e.stopPropagation();
											navigate(`/event-gallery/edit/${row._id}`);
										}}
										sx={{
											color: themeColors.accent,
											'&:hover': {
												backgroundColor: themeColors.accent,
												color: themeColors.text.inverse,
											},
										}}
									>
										<EditIcon fontSize="small" />
									</IconButton>
								</Tooltip>
							)}
							{ability.can('Edit', 'EventGallery') && (
								<Tooltip title={t('eventGallery.list.actions.publish')}>
									<IconButton
										size="small"
										onClick={(e) => {
											e.stopPropagation();
											handlePublish(row._id);
										}}
										sx={{
											color: themeColors.success || '#4caf50',
											'&:hover': {
												backgroundColor: `${themeColors.success || '#4caf50'}20`,
											},
										}}
									>
										<CheckIcon fontSize="small" />
									</IconButton>
								</Tooltip>
							)}
							{isPublished && (
								<Tooltip title={t('eventGallery.list.actions.viewPublishedClasses')}>
									<IconButton
										size="small"
										onClick={(e) => {
											e.stopPropagation();
											handleViewPublishedClasses(row);
										}}
										sx={{
											color: themeColors.info || '#2196f3',
											'&:hover': {
												backgroundColor: `${themeColors.info || '#2196f3'}20`,
											},
										}}
									>
										<ClassIcon fontSize="small" />
									</IconButton>
								</Tooltip>
							)}
							{(() => {
								const canDelete = ability.can('Delete', 'EventGallery') && !isPublished;

								if(!canDelete) {
									return null;
								}
								return (
									<Tooltip title={t('eventGallery.list.actions.delete')}>
										<span>
											<IconButton
												size="small"
												onClick={(e) => {
													e.stopPropagation();
													if (!canDelete) {
														showSnackbar(t('eventGallery.list.messages.noDeletePermission'), 'error');
														return;
													}
													openDelete(row);
												}}
												sx={{
													color: canDelete ? themeColors.error : themeColors.text.secondary,
													'&:hover': canDelete
														? {
															backgroundColor: themeColors.error,
															color: themeColors.text.inverse,
														}
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
					);
				}
			},
		],
		[t, ability, themeColors, showSnackbar, navigate, handlePublish, handleViewPublishedClasses]
	);

	return (
		<CustomOutletBox>
			<Box sx={{ p: 3, backgroundColor: themeColors.background.primary, minHeight: '100%' }}>
				<Breadcrumbs separator="›" sx={{ mb: 2, '& .MuiBreadcrumbs-separator': { color: themeColors.text.secondary } }}>
					<Link
						underline="hover"
						sx={{ color: themeColors.text.secondary, cursor: 'pointer' }}
						onClick={() => navigate('/')}
					>
						{t('eventGallery.breadcrumbs.admin')}
					</Link>
					<Typography sx={{ color: themeColors.text.primary }}>
						{t('eventGallery.breadcrumbs.eventGallery')} • {t('eventGallery.breadcrumbs.list')}
					</Typography>
				</Breadcrumbs>

				<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={2} gap={1}>
					<Box>
						<Typography variant="h6" sx={{ color: themeColors.text.primary, fontWeight: 700 }}>
							{t('eventGallery.list.title')}
						</Typography>
						<Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
							{t('eventGallery.list.subtitle')}
						</Typography>
					</Box>
					{ability.can('Create', 'EventGallery') && (
						<CustomButton
							onClick={() => navigate('/event-gallery/new')}
							label={t('eventGallery.list.actions.add')}
							isIcon={true}
							ICON={AddIcon}
							width="180px"
						/>
					)}
				</Stack>

				<Card sx={{ 
					borderRadius: 2, 
					boxShadow: 2, 
					border: `1px solid ${themeColors.border.primary}`, 
					overflow: 'hidden',
					backgroundColor: themeColors.background.secondary
				}}>
					<CardContent sx={{ 
						p: 0, 
						'&:last-child': { pb: 0 }, 
						overflow: 'hidden',
						backgroundColor: themeColors.background.secondary
					}}>
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

				<ConfirmationDialog
					isOpen={deleteOpen}
					onClose={closeDelete}
					onConfirm={confirmDelete}
					title={t('eventGallery.list.modal.deleteTitle')}
					message={t('eventGallery.list.messages.deleteConfirm')}
				/>

				{/* View Published Classes Dialog */}
				<Dialog
					open={publishedClassesOpen}
					onClose={handleClosePublishedClasses}
					maxWidth="md"
					fullWidth
					PaperProps={{
						sx: {
							backgroundColor: themeColors.background.secondary,
							border: `1px solid ${themeColors.border.primary}`,
						},
					}}
				>
					<DialogTitle
						sx={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							color: themeColors.text.primary,
							borderBottom: `1px solid ${themeColors.border.primary}`,
						}}
					>
						<Typography variant="h6" fontWeight="bold">
							{t('eventGallery.list.publishedClasses.title', { eventName: selectedEvent?.eventName || '' })}
						</Typography>
						<IconButton
							onClick={handleClosePublishedClasses}
							sx={{
								color: themeColors.text.secondary,
								'&:hover': {
									backgroundColor: themeColors.background.tertiary,
								},
							}}
						>
							<CloseIcon />
						</IconButton>
					</DialogTitle>
					<DialogContent sx={{ mt: 2 }}>
						{selectedEvent && (
							<Box>
								{/* Publish To */}
								<Box mb={3}>
									<Typography variant="subtitle2" sx={{ color: themeColors.text.secondary, mb: 1 }}>
										{t('eventGallery.list.publishedClasses.publishTo')}
									</Typography>
									<Typography variant="body1" sx={{ color: themeColors.text.primary, fontWeight: 600 }}>
										{selectedEvent.publishTo || t('eventGallery.list.publishedClasses.notSet')}
									</Typography>
								</Box>

								{/* Student Targeting */}
								{selectedEvent.studentTargeting && (
									<>
										<Divider sx={{ my: 2, borderColor: themeColors.border.primary }} />
										<Typography variant="subtitle1" sx={{ color: themeColors.text.primary, fontWeight: 600, mb: 2 }}>
											{t('eventGallery.list.publishedClasses.studentTargeting')}
										</Typography>

										{/* Academic Year */}
										{selectedEvent.studentTargeting.academicYear && (
											<Box mb={2}>
												<Typography variant="subtitle2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
													{t('eventGallery.list.publishedClasses.academicYear')}
												</Typography>
												<Typography variant="body2" sx={{ color: themeColors.text.primary }}>
													{selectedEvent.studentTargeting.academicYear}
												</Typography>
											</Box>
										)}

										{/* Target Type */}
										{selectedEvent.studentTargeting.targetType && (
											<Box mb={2}>
												<Typography variant="subtitle2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
													{t('eventGallery.list.publishedClasses.targetType')}
												</Typography>
												<Chip
													label={selectedEvent.studentTargeting.targetType}
													size="small"
													sx={{
														backgroundColor: themeColors.primary,
														color: themeColors.text.inverse,
													}}
												/>
											</Box>
										)}

										{/* Gender */}
										{selectedEvent.studentTargeting.gender && selectedEvent.studentTargeting.gender !== 'Both' && (
											<Box mb={2}>
												<Typography variant="subtitle2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
													{t('eventGallery.list.publishedClasses.gender')}
												</Typography>
												<Typography variant="body2" sx={{ color: themeColors.text.primary }}>
													{selectedEvent.studentTargeting.gender}
												</Typography>
											</Box>
										)}

										{/* Grades */}
										{selectedEvent.studentTargeting.grades && selectedEvent.studentTargeting.grades.length > 0 && (
											<Box mb={2}>
												<Typography variant="subtitle2" sx={{ color: themeColors.text.secondary, mb: 1 }}>
													{t('eventGallery.list.publishedClasses.grades')}
												</Typography>
												<Stack direction="row" spacing={1} flexWrap="wrap">
													{selectedEvent.studentTargeting.grades.map((grade, index) => (
														<Chip
															key={index}
															label={grade}
															size="small"
															sx={{
																backgroundColor: themeColors.accent,
																color: themeColors.text.inverse,
															}}
														/>
													))}
												</Stack>
											</Box>
										)}

										{/* Single Grade (for Section Wise) */}
										{selectedEvent.studentTargeting.grade && selectedEvent.studentTargeting.grade.gradeName && (
											<Box mb={2}>
												<Typography variant="subtitle2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
													{t('eventGallery.list.publishedClasses.grade')}
												</Typography>
												<Typography variant="body2" sx={{ color: themeColors.text.primary }}>
													{selectedEvent.studentTargeting.grade.gradeName}
												</Typography>
											</Box>
										)}

										{/* Section Gender */}
										{selectedEvent.studentTargeting.sectionGender && selectedEvent.studentTargeting.sectionGender !== 'Both' && (
											<Box mb={2}>
												<Typography variant="subtitle2" sx={{ color: themeColors.text.secondary, mb: 0.5 }}>
													{t('eventGallery.list.publishedClasses.sectionGender')}
												</Typography>
												<Typography variant="body2" sx={{ color: themeColors.text.primary }}>
													{selectedEvent.studentTargeting.sectionGender}
												</Typography>
											</Box>
										)}

										{/* Sections */}
										{selectedEvent.studentTargeting.sections && selectedEvent.studentTargeting.sections.length > 0 && (
											<Box mb={2}>
												<Typography variant="subtitle2" sx={{ color: themeColors.text.secondary, mb: 1 }}>
													{t('eventGallery.list.publishedClasses.sections')}
												</Typography>
												<Stack direction="row" spacing={1} flexWrap="wrap">
													{selectedEvent.studentTargeting.sections.map((section, index) => (
														<Chip
															key={index}
															label={`${section.sectionName}${section.gender && section.gender !== 'Both' ? ` (${section.gender})` : ''}`}
															size="small"
															sx={{
																backgroundColor: themeColors.success || '#4caf50',
																color: themeColors.text.inverse,
															}}
														/>
													))}
												</Stack>
											</Box>
										)}

										{/* No targeting info */}
										{!selectedEvent.studentTargeting.academicYear &&
											!selectedEvent.studentTargeting.targetType &&
											(!selectedEvent.studentTargeting.grades || selectedEvent.studentTargeting.grades.length === 0) &&
											(!selectedEvent.studentTargeting.sections || selectedEvent.studentTargeting.sections.length === 0) && (
												<Typography variant="body2" sx={{ color: themeColors.text.secondary, fontStyle: 'italic' }}>
													{t('eventGallery.list.publishedClasses.noTargeting')}
												</Typography>
											)}
									</>
								)}

								{!selectedEvent.studentTargeting && (
									<Typography variant="body2" sx={{ color: themeColors.text.secondary, fontStyle: 'italic' }}>
										{t('eventGallery.list.publishedClasses.noTargeting')}
									</Typography>
								)}
							</Box>
						)}
					</DialogContent>
					<DialogActions sx={{ p: 2, borderTop: `1px solid ${themeColors.border.primary}` }}>
						<Button
							onClick={handleClosePublishedClasses}
							sx={{
								color: themeColors.text.primary,
								'&:hover': {
									backgroundColor: themeColors.background.tertiary,
								},
							}}
						>
							{t('eventGallery.list.publishedClasses.close')}
						</Button>
					</DialogActions>
				</Dialog>
			</Box>
		</CustomOutletBox>
	);
};

export default EventGalleryList;
