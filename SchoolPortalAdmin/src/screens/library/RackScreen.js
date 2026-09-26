import React, { useCallback, useEffect, useState } from 'react';
import CustomOutletBox from '../../components/Common/CustomOutletBox';
import CustomAddButton from '../../components/Common/CustomAddButton';
import { useNavigate } from 'react-router-dom';
import useModal from '../../hooks/modalHook';
import RackForm from '../../components/library/RackForm';
import { Box, Stack, Tooltip, Card, CardContent, Typography, IconButton, Chip } from '@mui/material';
import { ICONS } from '../../assets/icons';
import DataTable from '../../components/Common/CustomTable';
import { useListRacksQuery, useDeleteRackMutation } from '../../Redux/features/Library/rackSlice';
import moment from 'moment/moment';
import CustomDelete from '../../components/Common/CustomDelete';
import CustomBackDrop from '../../components/Common/CustomBackDrop';
import ErrorInfo from '../../components/Common/ErrorInfo';
import { useSnackbar } from '../../hooks/SnackBar';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import StorageIcon from '@mui/icons-material/Storage';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAbility } from '../../AbilityContext';
import { useTranslation } from 'react-i18next';

const RackScreen = () => {
	const showSnackbar = useSnackbar();
	const ability = useAbility();
	const { themeColors } = useThemeContext();
	const { t } = useTranslation();
	const { modal, openModal, closeModal } = useModal();
	const { data, isError, isLoading, isFetched, refetch, error } = useListRacksQuery();
	const [deleteRack] = useDeleteRackMutation();

	const [item, setItem] = useState(null);
	const [_id, set_id] = useState(null);

	// Transform data to add id field for DataTable
	const transformedData = data ? data.map(rack => ({
		...rack,
		id: rack._id
	})) : [];

	const columns = React.useMemo(() => [
		{
			field: 'SN',
			headerName: t('rackScreen.table.sn'),
			width: 80,
			headerAlign: 'center',
			align: 'center',
			renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1
		},
		{
			field: 'rackNumber',
			headerName: t('rackScreen.table.rackNumber'),
			width: 150,
			headerAlign: 'center',
			align: 'center',
		},
		{
			field: 'description',
			headerName: t('rackScreen.table.description'),
			width: 300,
			headerAlign: 'center',
			align: 'center',
		},
		{
			field: 'numberOfRows',
			headerName: t('rackScreen.table.numberOfRows'),
			width: 150,
			headerAlign: 'center',
			align: 'center',
		},
		{
			field: 'created',
			headerName: t('rackScreen.table.createdDate'),
			width: 180,
			headerAlign: 'center',
			align: 'center',
			valueGetter: (params) => moment(params?.row?.createdAt).format("DD-MM-YYYY hh:mm A")
		},
		{
			field: 'actions',
			headerName: t('rackScreen.table.actions'),
			width: 120,
			headerAlign: 'center',
			align: 'center',
			sortable: false,
			renderCell: ({ row }) => (
				<Stack direction="row" spacing={1}>
					{ability.can("Edit", "LibraryRacks") && <Tooltip title={t('rackScreen.actions.edit')}>
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
					{ability.can("Delete", "LibraryRacks") && <Tooltip title={t('rackScreen.actions.delete')}>
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

	// Safety check for themeColors - moved after all hooks
	if (!themeColors) {
		return <div>{t('rackScreen.messages.loading')}</div>;
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
						<StorageIcon sx={{ fontSize: 32, color: themeColors.primary }} />
						<Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary }}>
							{t('rackScreen.title')}
						</Typography>
					</Box>
					{ability.can("Create", "LibraryRacks") && <CustomAddButton
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
				<RackForm
					open={modal.addModal || modal.editModal}
					close={() => {
						if (modal.addModal) closeModal('add');
						if (modal.editModal) closeModal('edit');
					}}
					label={modal.editModal ? t('rackScreen.modal.editTitle') : t('rackScreen.modal.addTitle')}
					item={modal.editModal ? item : null}
					btnLabel={modal.editModal ? t('rackScreen.modal.update') : t('rackScreen.modal.add')}
				/>

				{/* Delete Confirmation Modal */}
				<CustomDelete
					open={modal.deleteModal}
					onClose={() => closeModal('delete')}
					heading={t('rackScreen.delete.heading')}
					paragraph={t('rackScreen.delete.paragraph')}
					fun={deleteRack}
					_id={_id}
					fetch="racks"
				/>

				<CustomBackDrop open={isLoading} />
			</Box>
		</CustomOutletBox>
	);
};

export default RackScreen;
