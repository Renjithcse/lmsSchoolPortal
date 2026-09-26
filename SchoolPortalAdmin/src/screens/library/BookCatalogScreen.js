import React, { useState } from 'react';
import CustomOutletBox from '../../components/Common/CustomOutletBox';
import CustomAddButton from '../../components/Common/CustomAddButton';
import useModal from '../../hooks/modalHook';
import BookCatalogForm from '../../components/library/BookCatalogForm';
import { Box, Stack, Tooltip, Card, CardContent, Typography, IconButton, Chip, TextField, Grid, FormControl, InputLabel, Select, MenuItem, Button, Avatar } from '@mui/material';
import DataTable from '../../components/Common/CustomTable';
import { useListBookCatalogsQuery, useDeleteBookCatalogMutation } from '../../Redux/features/Library/bookCatalogSlice';
import { useListCategoriesQuery } from '../../Redux/features/Library/categorySlice';
import moment from 'moment/moment';
import CustomDelete from '../../components/Common/CustomDelete';
import CustomBackDrop from '../../components/Common/CustomBackDrop';
import ErrorInfo from '../../components/Common/ErrorInfo';
import { useSnackbar } from '../../hooks/SnackBar';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import BookIcon from '@mui/icons-material/Book';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAbility } from '../../AbilityContext';
import { useTranslation } from 'react-i18next';

const BookCatalogScreen = () => {
	const showSnackbar = useSnackbar();
	const { themeColors } = useThemeContext();
	const ability = useAbility();
	const { t } = useTranslation();

	const { modal, openModal, closeModal } = useModal();
	const [item, setItem] = useState(null);
	const [_id, set_id] = useState(null);

	// Filters state
	const [filters, setFilters] = useState({
		search: '',
		category: ''
	});

	const [pagination, setPagination] = useState({
		page: 1,
		limit: 10
	});

	// Fetch book catalogs with filters
	const { data, isError, isLoading, refetch, error } = useListBookCatalogsQuery({
		...filters,
		...pagination
	});

	// Fetch categories for filter
	const { data: categoriesData } = useListCategoriesQuery();

	const [deleteBookCatalog] = useDeleteBookCatalogMutation();

	// Transform catalog data to add id field for DataTable
	const transformedCatalogData = data?.data?.catalogs ? data.data.catalogs.map(catalog => ({
		...catalog,
		id: catalog._id
	})) : [];

	const columns = React.useMemo(() => [
		{
			field: 'SN',
			headerName: t('bookCatalogScreen.table.sn'),
			width: 80,
			headerAlign: 'center',
			align: 'center',
			renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1
		},
		{
			field: 'coverImage',
			headerName: t('bookCatalogScreen.table.cover'),
			width: 80,
			headerAlign: 'center',
			align: 'center',
			sortable: false,
			renderCell: ({ row }) => (
				<Avatar
					variant="square"
					src={row.coverImage}
					sx={{
						width: 50,
						height: 50,
						border: `1px solid ${themeColors.border.primary}`,
						backgroundColor: themeColors.background.secondary
					}}
				>
					<BookIcon />
				</Avatar>
			)
		},
		{
			field: 'isbn',
			headerName: t('bookCatalogScreen.table.isbn'),
			width: 150,
			headerAlign: 'center',
			align: 'center',
		},
		{
			field: 'title',
			headerName: t('bookCatalogScreen.table.title'),
			width: 300,
			headerAlign: 'center',
			align: 'left',
		},
		{
			field: 'author',
			headerName: t('bookCatalogScreen.table.author'),
			width: 200,
			headerAlign: 'center',
			align: 'center',
		},
		{
			field: 'category',
			headerName: t('bookCatalogScreen.table.category'),
			width: 150,
			headerAlign: 'center',
			align: 'center',
			valueGetter: (params) => params.row.category?.name || t('bookCatalogScreen.table.na')
		},
		{
			field: 'copies',
			headerName: t('bookCatalogScreen.table.copies'),
			width: 120,
			headerAlign: 'center',
			align: 'center',
			renderCell: ({ row }) => (
				<Box display="flex" flexDirection="column" alignItems="center">
					<Typography variant="body2" sx={{ fontWeight: 'bold' }}>
						{row.totalCopies || 0}
					</Typography>
					<Typography variant="caption" sx={{ color: themeColors.text.secondary }}>
						{row.availableCopies || 0} {t('bookCatalogScreen.table.available')}
					</Typography>
				</Box>
			)
		},
		{
			field: 'publicationYear',
			headerName: t('bookCatalogScreen.table.year'),
			width: 100,
			headerAlign: 'center',
			align: 'center',
		},
		{
			field: 'created',
			headerName: t('bookCatalogScreen.table.addedDate'),
			width: 150,
			headerAlign: 'center',
			align: 'center',
			valueGetter: (params) => moment(params?.row?.createdAt).format("DD-MM-YYYY")
		},
		{
			field: 'actions',
			headerName: t('bookCatalogScreen.table.actions'),
			width: 150,
			headerAlign: 'center',
			align: 'center',
			sortable: false,
			renderCell: ({ row }) => (
				<Stack direction="row" spacing={1}>
					{ability.can("Read", "LibraryBookCatalog") && <Tooltip title={t('bookCatalogScreen.actions.viewDetails')}>
						<IconButton
							size="small"
							onClick={() => {
								setItem(row);
								openModal('view');
							}}
							sx={{
								color: themeColors.primary,
								'&:hover': {
									backgroundColor: `${themeColors.primary}22`,
								},
							}}
						>
							<VisibilityIcon />
						</IconButton>
					</Tooltip>}
					{ability.can("Edit", "LibraryBookCatalog") && <Tooltip title={t('bookCatalogScreen.actions.edit')}>
						<IconButton
							size="small"
							onClick={() => {
								setItem(row);
								openModal('edit');
							}}
							sx={{
								color: themeColors.primary,
								'&:hover': {
									backgroundColor: `${themeColors.primary}22`,
								},
							}}
						>
							<EditIcon />
						</IconButton>
					</Tooltip>}
					{ability.can("Delete", "LibraryBookCatalog") && <Tooltip title={t('bookCatalogScreen.actions.delete')}>
						<IconButton
							size="small"
							onClick={() => {
								set_id(row._id);
								openModal('delete');
							}}
							disabled={row.totalCopies > 0}
							sx={{
								color: row.totalCopies > 0 ? themeColors.text.disabled : themeColors.error,
								'&:hover': {
									backgroundColor: row.totalCopies > 0 ? 'transparent' : `${themeColors.error}22`,
								},
							}}
						>
							<DeleteIcon />
						</IconButton>
					</Tooltip>}
				</Stack>
			),
		},
	], [t, themeColors, ability, openModal]);

	const handleFilterChange = (field, value) => {
		setFilters(prev => ({ ...prev, [field]: value }));
		setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when filtering
	};

	const handlePageChange = (newPage) => {
		setPagination(prev => ({ ...prev, page: newPage }));
	};

	if (isError) {
		return (
			<CustomOutletBox>
				<ErrorInfo error={error} />
			</CustomOutletBox>
		);
	}

	return (
		<CustomOutletBox>
			<Box sx={{ p: 3 }}>
				<Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
					<Box display="flex" alignItems="center" gap={2}>
						<BookIcon sx={{ fontSize: 32, color: themeColors.primary }} />
						<Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
							{t('bookCatalogScreen.title')}
						</Typography>
					</Box>
					{ability.can("Create", "LibraryBookCatalog") && <CustomAddButton
						ClickEvent={() => {
							setItem(null);
							openModal('add');
						}}
						themeColors={themeColors}
					/>}
				</Box>

				{/* Filters */}
				<Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, mb: 3 }}>
					<CardContent>
						<Typography variant="h6" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 2 }}>
							{t('bookCatalogScreen.filters.title')}
						</Typography>
						<Grid container spacing={2}>
							<Grid item xs={12} md={4}>
								<TextField
									fullWidth
									placeholder={t('bookCatalogScreen.filters.searchPlaceholder')}
									value={filters.search}
									onChange={(e) => handleFilterChange('search', e.target.value)}
									InputProps={{
										startAdornment: <SearchIcon sx={{ color: themeColors.text.secondary, mr: 1 }} />,
									}}
									sx={{
										'& .MuiOutlinedInput-root': {
											'& fieldset': {
												borderColor: themeColors.border.primary,
											},
											'&:hover fieldset': {
												borderColor: themeColors.primary,
											},
											'&.Mui-focused fieldset': {
												borderColor: themeColors.primary,
											},
										},
										'& .MuiInputBase-input': {
											color: themeColors.text.primary,
										},
									}}
								/>
							</Grid>
							<Grid item xs={12} md={3}>
								<FormControl fullWidth>
									<InputLabel sx={{ color: themeColors.text.secondary }}>{t('bookCatalogScreen.filters.category')}</InputLabel>
									<Select
										value={filters.category}
										onChange={(e) => handleFilterChange('category', e.target.value)}
										label={t('bookCatalogScreen.filters.category')}
										sx={{
											'& .MuiOutlinedInput-notchedOutline': {
												borderColor: themeColors.border.primary,
											},
											'&:hover .MuiOutlinedInput-notchedOutline': {
												borderColor: themeColors.primary,
											},
											'&.Mui-focused .MuiOutlinedInput-notchedOutline': {
												borderColor: themeColors.primary,
											},
											'& .MuiSelect-icon': {
												color: themeColors.text.secondary,
											},
										}}
									>
										<MenuItem value="">{t('bookCatalogScreen.filters.allCategories')}</MenuItem>
										{categoriesData?.map((category) => (
											<MenuItem key={category._id} value={category._id}>
												{category.name}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</Grid>
							<Grid item xs={12} md={2}>
								<Button
									variant="outlined"
									onClick={() => {
										setFilters({
											search: '',
											category: ''
										});
										setPagination({ page: 1, limit: 10 });
									}}
									sx={{
										borderColor: themeColors.border.primary,
										color: themeColors.text.primary,
										'&:hover': {
											borderColor: themeColors.primary,
											backgroundColor: `${themeColors.primary}22`,
										},
									}}
								>
									{t('bookCatalogScreen.filters.clear')}
								</Button>
							</Grid>
						</Grid>
					</CardContent>
				</Card>

				{/* Book Catalogs Table */}
				<Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, overflow: 'hidden' }}>
					<CardContent sx={{ padding: '16px', overflow: 'hidden' }}>
						<DataTable
							rows={transformedCatalogData}
							columns={columns}
							loading={isLoading}
							themeColors={themeColors}
							id="id"
							pagination={{
								currentPage: pagination.page,
								totalPages: data?.data?.pagination?.totalPages || 1,
								totalItems: data?.data?.pagination?.totalCatalogs || 0,
								onPageChange: handlePageChange
							}}
						/>
					</CardContent>
				</Card>

				{/* Add/Edit Modal */}
				<BookCatalogForm
					open={modal.addModal || modal.editModal}
					close={() => {
						closeModal('add');
						closeModal('edit');
					}}
					label={modal.editModal ? t('bookCatalogScreen.modal.editTitle') : t('bookCatalogScreen.modal.addTitle')}
					item={modal.editModal ? item : null}
					btnLabel={modal.editModal ? t('bookCatalogScreen.modal.update') : t('bookCatalogScreen.modal.add')}
				/>

				{/* Delete Confirmation Modal */}
				<CustomDelete
					open={modal.deleteModal}
					onClose={() => closeModal('delete')}
					heading={t('bookCatalogScreen.delete.heading')}
					paragraph={t('bookCatalogScreen.delete.paragraph')}
					fun={deleteBookCatalog}
					_id={_id}
					fetch="bookCatalogs"
				/>

				<CustomBackDrop open={isLoading} />
			</Box>
		</CustomOutletBox>
	);
};

export default BookCatalogScreen;
