import React, { useCallback, useState } from 'react'
import DataTable from '../../../components/Common/CustomTable'
import CustomAddButton from '../../../components/Common/CustomAddButton'
import { Box, Stack, Tooltip, Card, CardContent, Typography, IconButton } from '@mui/material';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import { ICONS } from '../../../assets/icons';
import moment from 'moment';
import useModal from '../../../hooks/modalHook';
import CustomOutletBox from '../../../components/Common/CustomOutletBox';
import CustomDelete from '../../../components/Common/CustomDelete';
import { deleteReligion, getReligion } from '../../../api/religion';
import ReligionForm from '../../../components/admin/religion/religionForm';
import { useQuery } from '@tanstack/react-query';
import CustomBackDrop from '../../../components/Common/CustomBackDrop';
import { useAbility } from '../../../AbilityContext';
import { useTranslation } from 'react-i18next';

const ReligionScreen = () => {

	const { themeColors } = useThemeContext();
	const { t } = useTranslation();
	const { modal, openModal, closeModal } = useModal();
	const { data, isError, isLoading, isFetched, refetch } = useQuery({ queryKey: ['religionlist'], queryFn: getReligion });
	const [item, setItem] = useState(null);
	const [_id, set_id] = useState(null);
	const ability  = useAbility();


	const OpenDelete = useCallback((id) => {
		set_id(id);
		openModal('deleteModal');
	}, [modal]);

	const closeDelete = useCallback(() => {
		closeModal('deleteModal');
	}, [modal]);

	const openAdd = useCallback(() => {
		openModal('addModal');
	}, [modal]);

	const closeAdd = useCallback(() => {
		closeModal('addModal');
	}, [modal]);

	const openEdit = useCallback((item) => {
		setItem(item)
		openModal('editModal');
	}, [modal]);

	const closeEdit = useCallback(() => {

		closeModal('editModal');
	}, [modal,]);

	const openView = useCallback((item) => {
		setItem(item)
		openModal('viewModal');
	}, [modal]);

	const closeView = useCallback(() => {

		closeModal('viewModal');
	}, [modal]);

	const columns = [

		{
			field: 'SN',
			headerName: t('religion.table.columns.sn'),
			flex: 1,
			headerAlign: 'center',
			align: 'center',
			renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1

		},
		{
			field: 'created',
			headerName: t('religion.table.columns.createdDate'),
			flex: 1,
			headerAlign: 'center',
			align: 'center',
			valueGetter: (params) => moment(params?.row?.created_at).format("DD-MM-YYYY hh:mm A")
		},

		{
			field: 'religionName',
			headerName: t('religion.table.columns.religionName'),
			flex: 1,
			headerAlign: 'center',
			align: 'center',
		},
		{
			field: 'Action',
			headerName: t('religion.table.columns.action'),
			flex: 1,
			headerAlign: 'center',
			align: 'center',
			sortable: false,
			disableColumnMenu: true,
			renderCell: ({ row }) => (
				<Stack alignItems={'center'} gap={1} direction={'row'}>
					{ability.can("Read", "Religion") && <Tooltip title={t('religion.actions.view')}>
						<IconButton size="small" onClick={(e) => { e.stopPropagation(); setItem(null); openView(row); }}
							sx={{ color: themeColors.primary, '&:hover': { backgroundColor: themeColors.primary, color: '#fff' } }}>
							<ICONS.RemoveRedEyeIcon.component sx={{ fontSize: 18 }} />
						</IconButton>
					</Tooltip>}

					{ability.can("Edit", "Religion") && <Tooltip title={t('religion.actions.edit')}>
						<IconButton size="small" onClick={(e) => { e.stopPropagation(); setItem(null); openEdit(row); }}
							sx={{ color: themeColors.accent, '&:hover': { backgroundColor: themeColors.accent, color: '#fff' } }}>
							<ICONS.BorderColorIcon.component sx={{ fontSize: 18 }} />
						</IconButton>
					</Tooltip>}
					{ability.can("Delete", "Religion") && <Tooltip title={t('religion.actions.delete')}>
						<IconButton size="small" onClick={(e) => { e.stopPropagation(); OpenDelete(row?._id); }}
							sx={{ color: themeColors.error, '&:hover': { backgroundColor: themeColors.error, color: '#fff' } }}>
							<ICONS.DeleteForeverIcon.component sx={{ fontSize: 18 }} />
						</IconButton>
					</Tooltip>}

				</Stack>
			),
		}
	];
	return (
		<CustomOutletBox>
			<Box sx={{ p: 3, backgroundColor: themeColors.background.primary, minHeight: '100%' }}>
				<Box display="flex" justifyContent="space-between" alignItems="center" mb={2}
					sx={{ backgroundColor: themeColors.background.secondary, border: `1px solid ${themeColors.border.primary}`, borderRadius: 2, p: 2 }}
				>
					<Typography variant="h6" sx={{ color: themeColors.text.primary, fontWeight: 600 }}>{t('religion.title')}</Typography>
					{ability.can("Create", "Religion") && <CustomAddButton ClickEvent={openAdd} label={t('religion.actions.add')} justifyContent={'flex-end'} />}
				</Box>
				<Card sx={{ borderRadius: 2, boxShadow: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
					<CardContent>
						<DataTable
							rows={data?.data || []}
							columns={columns}
							id={"_id"}
							sx={{
								'& .MuiDataGrid-root': { border: 'none', backgroundColor: 'transparent', color: themeColors.text.primary },
								'& .MuiDataGrid-cell': { borderBottom: `1px solid ${themeColors.border.primary}`, color: themeColors.text.primary, backgroundColor: themeColors.background.primary },
								'& .MuiDataGrid-columnHeaders': { backgroundColor: themeColors.background.secondary, borderBottom: `2px solid ${themeColors.border.primary}`, color: themeColors.text.primary, fontWeight: 'bold' },
								'& .MuiDataGrid-row': { backgroundColor: themeColors.background.primary, '&:hover': { backgroundColor: themeColors.background.secondary } },
								'& .MuiDataGrid-footerContainer': { backgroundColor: themeColors.background.secondary, borderTop: `1px solid ${themeColors.border.primary}`, color: themeColors.text.primary },
								'& .MuiTablePagination-root': { color: themeColors.text.primary },
								'& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { color: themeColors.text.secondary },
								'& .MuiIconButton-root': { color: themeColors.text.primary },
								'& .MuiButtonBase-root.Mui-disabled': { color: themeColors.text.secondary },
							}}
						/>
					</CardContent>
				</Card>
			</Box>
			{modal.deleteModal && <CustomDelete
				open={modal.deleteModal}
				onClose={closeDelete}
				heading={t('religion.delete.heading')}
				paragraph={t('religion.delete.paragraph')}
				fun={deleteReligion}
				_id={_id}
				fetch={'religionlist'} />}

			{modal.addModal && <ReligionForm open={modal.addModal} close={closeAdd} label={t('religion.form.create')} hide={false} id={false} />}
			{modal.editModal && <ReligionForm open={modal.editModal} close={closeEdit} label={t('religion.form.edit')} hide={false} id={false} item={item} />}
			{modal.viewModal && <ReligionForm open={modal.viewModal} close={closeView} label={t('religion.form.view')} hide={true} id={false} item={item} />}
			{isLoading && < CustomBackDrop loading={isLoading} />}
		</CustomOutletBox>
	)
}

export default ReligionScreen