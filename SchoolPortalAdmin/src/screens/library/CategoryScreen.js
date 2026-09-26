import React, { useCallback, useState } from 'react';
import CustomOutletBox from '../../components/Common/CustomOutletBox';
import CustomAddButton from '../../components/Common/CustomAddButton';
import useModal from '../../hooks/modalHook';
import CategoryForm from '../../components/library/CategoryForm';
import { Box, Stack, Tooltip, Card, CardContent, Typography, IconButton } from '@mui/material';
import DataTable from '../../components/Common/CustomTable';
import { useListCategoriesQuery, useDeleteCategoryMutation } from '../../Redux/features/Library/categorySlice';
import moment from 'moment/moment';
import CustomDelete from '../../components/Common/CustomDelete';
import CustomBackDrop from '../../components/Common/CustomBackDrop';
import ErrorInfo from '../../components/Common/ErrorInfo';
import { useSnackbar } from '../../hooks/SnackBar';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import CategoryIcon from '@mui/icons-material/Category';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAbility } from '../../AbilityContext';
import { useTranslation } from 'react-i18next';

const CategoryScreen = () => {
	const showSnackbar = useSnackbar();
	const { themeColors } = useThemeContext();
	const { t } = useTranslation();
	const { modal, openModal, closeModal } = useModal();
	const { data, isError, isLoading, refetch, error } = useListCategoriesQuery();
	const [deleteCategory] = useDeleteCategoryMutation();
	const ability = useAbility();

	const [item, setItem] = useState(null);
	const [_id, set_id] = useState(null);

	// Transform data to add id field for DataTable
	const transformedData = data ? data.map(category => ({
		...category,
		id: category._id
	})) : [];

	const columns = React.useMemo(() => [
		{
			field: 'SN',
			headerName: t('categoryScreen.table.sn'),
			width: 80,
			headerAlign: 'center',
			align: 'center',
			renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1
		},
		{
			field: 'name',
			headerName: t('categoryScreen.table.categoryName'),
			width: 200,
			headerAlign: 'center',
			align: 'left',
		},
		{
			field: 'description',
			headerName: t('categoryScreen.table.description'),
			width: 400,
			headerAlign: 'center',
			align: 'left',
		},
		{
			field: 'created',
			headerName: t('categoryScreen.table.createdDate'),
			width: 150,
			headerAlign: 'center',
			align: 'center',
			valueGetter: (params) => moment(params?.row?.createdAt).format("DD-MM-YYYY")
		},
		{
			field: 'actions',
			headerName: t('categoryScreen.table.actions'),
			width: 120,
			headerAlign: 'center',
			align: 'center',
			sortable: false,
			renderCell: ({ row }) => (
				<Stack direction="row" spacing={1}>
					{ability.can("Edit", "LibraryCategories") && <Tooltip title={t('categoryScreen.actions.edit')}>
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
					{ability.can("Delete", "LibraryCategories") && <Tooltip title={t('categoryScreen.actions.delete')}>
						<IconButton
							size="small"
							onClick={() => {
								set_id(row._id);
								openModal('delete');
							}}
							sx={{
								color: themeColors.error,
								'&:hover': {
									backgroundColor: `${themeColors.error}22`,
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

	// Safety check for themeColors
	if (!themeColors) {
		return <div>{t('categoryScreen.messages.loading')}</div>;
	}

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
						<CategoryIcon sx={{ fontSize: 32, color: themeColors.primary }} />
						<Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
							{t('categoryScreen.title')}
						</Typography>
					</Box>
					{ability.can("Create", "LibraryCategories") && <CustomAddButton
						ClickEvent={() => {
							setItem(null);
							openModal('add');
						}}
						themeColors={themeColors}
					/>}
				</Box>

				<Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
					<CardContent>
						<DataTable
							rows={transformedData}
							columns={columns}
							loading={isLoading}
							themeColors={themeColors}
							id="id"
						/>
					</CardContent>
				</Card>

				{/* Add/Edit Modal */}
				<CategoryForm
					open={modal.addModal || modal.editModal}
					close={() => {
						if (modal.addModal) closeModal('add');
						if (modal.editModal) closeModal('edit');
					}}
					label={modal.editModal ? t('categoryScreen.modal.editTitle') : t('categoryScreen.modal.addTitle')}
					item={modal.editModal ? item : null}
					btnLabel={modal.editModal ? t('categoryScreen.modal.update') : t('categoryScreen.modal.add')}
				/>

				{/* Delete Confirmation Modal */}
				<CustomDelete
					open={modal.deleteModal}
					onClose={() => closeModal('delete')}
					heading={t('categoryScreen.delete.heading')}
					paragraph={t('categoryScreen.delete.paragraph')}
					fun={deleteCategory}
					_id={_id}
					fetch="categories"
				/>

				<CustomBackDrop open={isLoading} />
			</Box>
		</CustomOutletBox>
	);
};

export default CategoryScreen;
