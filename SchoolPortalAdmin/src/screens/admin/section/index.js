import React, { useCallback, useState } from 'react'
import CustomOutletBox from '../../../components/Common/CustomOutletBox'
import CustomAddButton from '../../../components/Common/CustomAddButton'
import useModal from '../../../hooks/modalHook';
import { useQuery } from '@tanstack/react-query';
import { Box, Stack, Tooltip, IconButton, Card, CardContent, Typography } from '@mui/material';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import { ICONS } from '../../../assets/icons';
import moment from 'moment';
import DataTable from '../../../components/Common/CustomTable';
import CustomDelete from '../../../components/Common/CustomDelete';
import SectionForm from '../../../components/admin/section/SectionForm';
import { deleteSection, getSection } from '../../../api/section';
import CustomBackDrop from '../../../components/Common/CustomBackDrop';
import { useAbility } from '../../../AbilityContext';
import { useTranslation } from 'react-i18next';

const SectionScreen = () => {

	const { themeColors } = useThemeContext();
	const { t } = useTranslation();
	const { modal, openModal, closeModal } = useModal();
	const { data, isError, isLoading, isFetched, refetch } = useQuery({ queryKey: ['sectionList'], queryFn: getSection });
	const [item, setItem] = useState(null);
	const [_id, set_id] = useState(null);
	const ability = useAbility();


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
			headerName: t('section.table.columns.sn'),
			flex: 1,
			headerAlign: 'center',
			align: 'center',
			renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1

		},
		{
			field: 'created',
			headerName: t('section.table.columns.createdDate'),
			flex: 1,
			headerAlign: 'center',
			align: 'center',
			valueGetter: (params) => moment(params?.row?.created_at).format("DD-MM-YYYY hh:mm A")
		},

		{
			field: 'sectionName',
			headerName: t('section.table.columns.sectionName'),
			flex: 1,
			headerAlign: 'center',
			align: 'center',
		},
		{
			field: 'Action',
			headerName: t('section.table.columns.action'),
			flex: 1,
			headerAlign: 'center',
			align: 'center',
			sortable: false,
			disableColumnMenu: true,
			renderCell: ({ row }) => (
				<Stack alignItems={'center'} gap={1} direction={'row'}>
					{ability.can("Read", "Section") && <Tooltip title={t('section.actions.view')}>
						<IconButton
							size="small"
							onClick={(e) => { e.stopPropagation(); setItem(null); openView(row); }}
							sx={{ color: themeColors.primary, '&:hover': { backgroundColor: themeColors.primary, color: '#fff' } }}
						>
							<ICONS.RemoveRedEyeIcon.component sx={{ fontSize: 18 }} />
						</IconButton>
					</Tooltip>}	
					{ability.can("Edit", "Section") && <Tooltip title={t('section.actions.edit')}>
						<IconButton
							size="small"
							onClick={(e) => { e.stopPropagation(); setItem(null); openEdit(row); }}
							sx={{ color: themeColors.accent, '&:hover': { backgroundColor: themeColors.accent, color: '#fff' } }}
						>
							<ICONS.BorderColorIcon.component sx={{ fontSize: 18 }} />
						</IconButton>
					</Tooltip>}
					{ability.can("Delete", "Section") && <Tooltip title={t('section.actions.delete')}>
						<IconButton
							size="small"
							onClick={(e) => { e.stopPropagation(); OpenDelete(row?._id); }}
							sx={{ color: themeColors.error, '&:hover': { backgroundColor: themeColors.error, color: '#fff' } }}
						>
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
					<Typography variant="h6" sx={{ color: themeColors.text.primary, fontWeight: 600 }}>{t('section.title')}</Typography>
					{ability.can("Create", "Section") && <CustomAddButton ClickEvent={openAdd} label={t('section.actions.add')} justifyContent={'flex-end'} />}
				</Box>
				<Card sx={{ borderRadius: 2, boxShadow: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
					<CardContent>
						<DataTable
							rows={data?.data?.data?.sections || []}
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
				heading={t('section.delete.heading')}
				paragraph={t('section.delete.paragraph')}
				fun={deleteSection}
				_id={_id}
				fetch={'sectionList'} />}

			{modal.addModal && <SectionForm open={modal.addModal} close={closeAdd} label={t('section.form.create')} hide={false} id={false} />}
			{modal.editModal && <SectionForm open={modal.editModal} close={closeEdit} label={t('section.form.edit')} hide={false} id={false} item={item} />}
			{modal.viewModal && <SectionForm open={modal.viewModal} close={closeView} label={t('section.form.view')} hide={true} id={false} item={item} />}
			{isLoading && < CustomBackDrop loading={isLoading} />}
		</CustomOutletBox>
	)
}

export default SectionScreen
