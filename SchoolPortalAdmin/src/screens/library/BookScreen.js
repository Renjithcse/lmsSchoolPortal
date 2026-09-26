import React, { useCallback, useEffect, useState } from 'react';
import CustomOutletBox from '../../components/Common/CustomOutletBox';
import CustomAddButton from '../../components/Common/CustomAddButton';
import { useNavigate } from 'react-router-dom';
import useModal from '../../hooks/modalHook';
import BookForm from '../../components/library/BookForm';
import { Box, Stack, Tooltip, Card, CardContent, Typography, IconButton, Chip, TextField, Grid, FormControl, InputLabel, Select, MenuItem, Button, Avatar } from '@mui/material';
import { ICONS } from '../../assets/icons';
import DataTable from '../../components/Common/CustomTable';
import { useListBooksQuery, useDeleteBookMutation } from '../../Redux/features/Library/bookSlice';
import { useListRacksQuery } from '../../Redux/features/Library/rackSlice';
import { useListCategoriesQuery } from '../../Redux/features/Library/categorySlice';
import { useListBookCatalogsQuery } from '../../Redux/features/Library/bookCatalogSlice';
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

const BookScreen = () => {
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
		status: '',
		category: '',
		rack: '',
		author: ''
	});

	const [pagination, setPagination] = useState({
		page: 1,
		limit: 10
	});

	// Fetch books with filters
	const { data, isError, isLoading, isFetched, refetch, error } = useListBooksQuery({
		...filters,
		...pagination
	});

	// Fetch racks and categories for filter
	const { data: racksData } = useListRacksQuery();
	const { data: categoriesData } = useListCategoriesQuery();
	const { data: catalogsData } = useListBookCatalogsQuery({ limit: 1000 });

	const [deleteBook] = useDeleteBookMutation();

	// Transform book data to add id field for DataTable
	const transformedBookData = data?.books ? data.books.map(book => ({
		...book,
		id: book._id
	})) : [];

	const columns = React.useMemo(() => [
		{
			field: 'SN',
			headerName: t('bookScreen.table.sn'),
			width: 80,
			headerAlign: 'center',
			align: 'center',
			renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1
		},
		{
			field: 'coverImage',
			headerName: t('bookScreen.table.cover'),
			width: 80,
			headerAlign: 'center',
			align: 'center',
			sortable: false,
			renderCell: ({ row }) => (
				<Avatar
					variant="square"
					src={row.coverImage || row.bookCatalog?.coverImage}
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
			field: 'copyNumber',
			headerName: t('bookScreen.table.copyNumber'),
			width: 100,
			headerAlign: 'center',
			align: 'center',
		},
		{
			field: 'isbn',
			headerName: t('bookScreen.table.isbn'),
			width: 120,
			headerAlign: 'center',
			align: 'center',
			valueGetter: (params) => params.row.bookCatalog?.isbn || t('bookScreen.table.na')
		},
		{
			field: 'title',
			headerName: t('bookScreen.table.title'),
			width: 250,
			headerAlign: 'center',
			align: 'left',
			valueGetter: (params) => params.row.bookCatalog?.title || t('bookScreen.table.na')
		},
		{
			field: 'author',
			headerName: t('bookScreen.table.author'),
			width: 150,
			headerAlign: 'center',
			align: 'center',
			valueGetter: (params) => params.row.bookCatalog?.author || t('bookScreen.table.na')
		},
		{
			field: 'category',
			headerName: t('bookScreen.table.category'),
			width: 120,
			headerAlign: 'center',
			align: 'center',
			valueGetter: (params) => params.row.bookCatalog?.category?.name || t('bookScreen.table.na')
		},
		{
			field: 'rack',
			headerName: t('bookScreen.table.location'),
			width: 150,
			headerAlign: 'center',
			align: 'center',
			valueGetter: (params) => {
				const rack = params.row.rack;
				return rack ? `${rack.rackNumber} - R${params.row.row}P${params.row.position}` : t('bookScreen.table.na');
			}
		},
		{
			field: 'status',
			headerName: t('bookScreen.table.status'),
			width: 120,
			headerAlign: 'center',
			align: 'center',
			renderCell: ({ row }) => (
				<Chip
					label={t(`bookScreen.status.${row.status}`) || row.status}
					size="small"
					sx={{
						backgroundColor:
							row.status === 'available' ? '#4CAF50' :
								row.status === 'issued' ? '#FF9800' :
									row.status === 'lost' ? '#F44336' :
										row.status === 'damaged' ? '#9C27B0' :
											row.status === 'reserved' ? '#2196F3' : '#757575',
						color: 'white',
						fontWeight: 'bold',
						fontSize: '0.75rem'
					}}
				/>
			)
		},
		{
			field: 'condition',
			headerName: t('bookScreen.table.condition'),
			width: 120,
			headerAlign: 'center',
			align: 'center',
			renderCell: ({ row }) => (
				<Chip
					label={t(`bookScreen.condition.${row.condition}`) || row.condition}
					size="small"
					sx={{
						backgroundColor:
							row.condition === 'excellent' ? '#4CAF50' :
								row.condition === 'good' ? '#8BC34A' :
									row.condition === 'fair' ? '#FFC107' :
										row.condition === 'poor' ? '#F44336' : '#757575',
						color: 'white',
						fontWeight: 'bold',
						fontSize: '0.75rem'
					}}
				/>
			)
		},
		{
			field: 'created',
			headerName: t('bookScreen.table.addedDate'),
			width: 120,
			headerAlign: 'center',
			align: 'center',
			valueGetter: (params) => moment(params?.row?.createdAt).format("DD-MM-YYYY")
		},
		{
			field: 'actions',
			headerName: t('bookScreen.table.actions'),
			width: 150,
			headerAlign: 'center',
			align: 'center',
			sortable: false,
			renderCell: ({ row }) => (
				<Stack direction="row" spacing={1}>
					{ability.can("Read", "LibraryBooks") && <Tooltip title={t('bookScreen.actions.view')}>
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
					{ability.can("Edit", "LibraryBooks") && <Tooltip title={t('bookScreen.actions.edit')}>
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
					{ability.can("Delete", "LibraryBooks") && <Tooltip title={t('bookScreen.actions.delete')}>
						<IconButton
							size="small"
							onClick={() => {
								set_id(row._id);
								openModal('delete');
							}}
							disabled={row.status === 'issued'}
							sx={{
								color: row.status === 'issued' ? themeColors.text.disabled : themeColors.error,
								'&:hover': {
									backgroundColor: row.status === 'issued' ? 'transparent' : `${themeColors.error}22`,
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
							{t('bookScreen.title')}
						</Typography>
					</Box>
					{ability.can("Create", "LibraryBooks") && <CustomAddButton
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
							{t('bookScreen.filters.title')}
						</Typography>
						<Grid container spacing={2}>
							<Grid item xs={12} md={3}>
								<TextField
									fullWidth
									placeholder={t('bookScreen.filters.searchPlaceholder')}
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
							<Grid item xs={12} md={2}>
								<FormControl fullWidth>
									<InputLabel sx={{ color: themeColors.text.secondary }}>{t('bookScreen.filters.status')}</InputLabel>
									<Select
										value={filters.status}
										onChange={(e) => handleFilterChange('status', e.target.value)}
										label={t('bookScreen.filters.status')}
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
										<MenuItem value="">{t('bookScreen.filters.all')}</MenuItem>
										<MenuItem value="available">{t('bookScreen.status.available')}</MenuItem>
										<MenuItem value="issued">{t('bookScreen.status.issued')}</MenuItem>
										<MenuItem value="lost">{t('bookScreen.status.lost')}</MenuItem>
										<MenuItem value="damaged">{t('bookScreen.status.damaged')}</MenuItem>
										<MenuItem value="reserved">{t('bookScreen.status.reserved')}</MenuItem>
									</Select>
								</FormControl>
							</Grid>
							<Grid item xs={12} md={2}>
								<FormControl fullWidth>
									<InputLabel sx={{ color: themeColors.text.secondary }}>{t('bookScreen.filters.category')}</InputLabel>
									<Select
										value={filters.category}
										onChange={(e) => handleFilterChange('category', e.target.value)}
										label={t('bookScreen.filters.category')}
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
										<MenuItem value="">{t('bookScreen.filters.allCategories')}</MenuItem>
										{categoriesData?.map((category) => (
											<MenuItem key={category._id} value={category._id}>
												{category.name}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</Grid>
							<Grid item xs={12} md={2}>
								<FormControl fullWidth>
									<InputLabel sx={{ color: themeColors.text.secondary }}>{t('bookScreen.filters.rack')}</InputLabel>
									<Select
										value={filters.rack}
										onChange={(e) => handleFilterChange('rack', e.target.value)}
										label={t('bookScreen.filters.rack')}
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
										<MenuItem value="">{t('bookScreen.filters.allRacks')}</MenuItem>
										{racksData?.map((rack) => (
											<MenuItem key={rack._id} value={rack._id}>
												{rack.rackNumber}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</Grid>
							<Grid item xs={12} md={2}>
								<TextField
									fullWidth
									placeholder={t('bookScreen.filters.author')}
									value={filters.author}
									onChange={(e) => handleFilterChange('author', e.target.value)}
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
							<Grid item xs={12} md={1}>
								<Button
									variant="outlined"
									onClick={() => {
										setFilters({
											search: '',
											status: '',
											category: '',
											rack: '',
											author: ''
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
									{t('bookScreen.filters.clear')}
								</Button>
							</Grid>
						</Grid>
					</CardContent>
				</Card>

				{/* Books Table */}
				<Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, overflow: 'hidden' }}>
					<CardContent sx={{ padding: '16px', overflow: 'hidden' }}>
						<DataTable
							rows={transformedBookData}
							columns={columns}
							loading={isLoading}
							themeColors={themeColors}
							id="id"
							pagination={{
								currentPage: pagination.page,
								totalPages: data?.pagination?.totalPages || 1,
								totalItems: data?.pagination?.totalBooks || 0,
								onPageChange: handlePageChange
							}}
						/>
					</CardContent>
				</Card>

				{/* Add/Edit Modal */}
				<BookForm
					open={modal.addModal || modal.editModal}
					close={() => {
						closeModal('add');
						closeModal('edit');
					}}
					label={modal.editModal ? t('bookScreen.modal.editTitle') : t('bookScreen.modal.addTitle')}
					item={modal.editModal ? item : null}
					btnLabel={modal.editModal ? t('bookScreen.modal.update') : t('bookScreen.modal.add')}
				/>

				{/* Delete Confirmation Modal */}
				<CustomDelete
					open={modal.deleteModal}
					onClose={() => closeModal('delete')}
					heading={t('bookScreen.delete.heading')}
					paragraph={t('bookScreen.delete.paragraph')}
					fun={deleteBook}
					_id={_id}
					fetch="books"
				/>

				<CustomBackDrop open={isLoading} />
			</Box>
		</CustomOutletBox>
	);
};

export default BookScreen;
