import React, { useCallback, useEffect, useState } from 'react'
import moment from 'moment'
import { Box, Stack, Tooltip, Card, CardContent, Typography, IconButton } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { useTheme as useThemeContext } from '../../../../contexts/ThemeContext'
import { ICONS } from '../../../../assets/icons'
import useModal from '../../../../hooks/modalHook'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDeleteGradeSubjectMutation, useListGradeSubjectsQuery } from '../../../../Redux/features/Admin/GradeSubject'
import DataTable from '../../../../components/Common/CustomTable'
import CustomAddButton from '../../../../components/Common/CustomAddButton'
import GradeSubjectForm from '../../../../components/admin/gradeSubject/GradeSubjectForm'
import ConfirmationDialog from '../../../../components/Inputs/ConfirmationDialog'
import { useDeleteGroupSubjectMutation, useListGroupSubjectsQuery } from '../../../../Redux/features/Admin/GroupSubjects'
import AddSubject from '../../../../components/admin/groupSubject/AddSubject'
import CopyGroupSubjectModal from '../../../../components/admin/groupSubject/CopyGroupSubjectModal'
import { useAbility } from '../../../../AbilityContext'
import { useTranslation } from 'react-i18next'



const GroupSubjectLists = () => {


	const { modal, openModal, closeModal } = useModal();
	const { themeColors } = useThemeContext();
	const navigate = useNavigate()
	const ability  = useAbility();
	const { t } = useTranslation();

	const [_id, set_id] = useState(null);
	const [data, setData] = useState(null);
	const [copyGroupSubjectId, setCopyGroupSubjectId] = useState(null);

    const location = useLocation();

    const state = location.state;

	useEffect(() => {
		if(!location.state){
			navigate('/grade-subject')
		}
	  
	}, [location])
	

	// console.log({store})

	const { isLoading, data: groupSubjects } = useListGroupSubjectsQuery(state ? state : {})
	const [triggerDelete, { isLoading: isDeleteLoading }] = useDeleteGroupSubjectMutation(state ? state : {})

	

	

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

    const openEdit = useCallback((data) => {
        setData(data)
        openModal('editModal');
	}, [modal]);

	const closeEdit = useCallback((data) => {
        setData(null)
        closeModal('editModal');
	}, [modal]);

	const closeAdd = useCallback(() => {
		closeModal('addModal');
	}, [modal]);

	const openCopy = useCallback((id) => {
		setCopyGroupSubjectId(id);
		openModal('copyModal');
	}, [modal]);

	const closeCopy = useCallback(() => {
		setCopyGroupSubjectId(null);
		closeModal('copyModal');
	}, [modal]);

	const confirmDelete = () => {
		triggerDelete(_id);
        closeDelete();
	}

	

	// console.log({subjects: groupSubjects?.data?.[0]?.subjects?.map((subject) => subject?.subject)})


	const columns = [

		{
			field: 'SN',
			headerName: t('groupSubject.table.sn'),
			flex: 1,
			headerAlign: 'center',
			align: 'center',
			renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1

		},
		{
			field: 'created',
			headerName: t('groupSubject.table.createdDate'),
			flex: 1,
			headerAlign: 'center',
			align: 'center',
			valueGetter: (params) => moment(params?.row?.created_at).format("DD-MM-YYYY hh:mm A")
		},
		{
			field: 'groupName',
			headerName: t('groupSubject.table.groupName'),
			flex: 1,
			headerAlign: 'center',
			align: 'center',
		},
		{
			field: 'subjects',
			headerName: t('groupSubject.table.subjects'),
			flex: 1,
			headerAlign: 'center',
			align: 'center',
			valueGetter: (params) => params?.row?.subjects?.map((subject) => subject?.subjectName).join(', ')
		},
        {
            field: 'Action',
            headerName: t('groupSubject.table.action'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            sortable: false,
            disableColumnMenu: true,
            renderCell: ({ row }) => (
                <Stack alignItems={ 'center' } gap={ 1 } direction={ 'row' }>
                    {ability.can("Read", "GroupSubject") && <Tooltip title={ t('groupSubject.actions.copy') }>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); openCopy(row?._id); }}
                          sx={{ color: themeColors.primary, '&:hover': { backgroundColor: themeColors.primary, color: '#fff' } }}>
                            <ContentCopyIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>}
                    {ability.can("Edit", "GroupSubject") && <Tooltip title={ t('groupSubject.actions.edit') }>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(row); }}
                          sx={{ color: themeColors.accent, '&:hover': { backgroundColor: themeColors.accent, color: '#fff' } }}>
                            <ICONS.BorderColorIcon.component sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>}
                    {ability.can("Delete", "GroupSubject") && <Tooltip title={ t('groupSubject.actions.delete') }>
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
		<Box sx={{ p: 3, backgroundColor: themeColors.background.primary, minHeight: '100%' }}>
			<Box display="flex" justifyContent="space-between" alignItems="center" mb={2}
				sx={{ backgroundColor: themeColors.background.secondary, border: `1px solid ${themeColors.border.primary}`, borderRadius: 2, p: 2 }}
			>
				<Typography variant="h6" sx={{ color: themeColors.text.primary, fontWeight: 600 }}>{t('groupSubject.title')}</Typography>
				{ability.can("Create", "GroupSubject") && <CustomAddButton ClickEvent={ openAdd } label={ t('groupSubject.actions.add') } justifyContent={ 'flex-end' } />}
			</Box>
			<Card sx={{ borderRadius: 2, boxShadow: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
				<CardContent>
					<DataTable
						rows={ groupSubjects?.data || [] }
						columns={ columns }
						id={ "_id" }
						loading={isLoading || isDeleteLoading}
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
			{ modal.addModal && <AddSubject open={ modal.addModal } close={ closeAdd } label={ t('groupSubject.form.newSubject') }   /> }
            { modal.editModal && <AddSubject open={ modal.editModal } close={ closeEdit } label={ t('groupSubject.form.editSubject') } data={ data } /> }
            { modal.copyModal && <CopyGroupSubjectModal open={ modal.copyModal } close={ closeCopy } groupSubjectId={ copyGroupSubjectId } /> }
			<ConfirmationDialog 
				isOpen={modal.deleteModal} 
				onClose={closeDelete} 
				onConfirm={confirmDelete}
				message={t('groupSubject.delete.confirm')} 
				title={t('groupSubject.delete.title')}
			/>
		</Box>
	)
}

export default GroupSubjectLists