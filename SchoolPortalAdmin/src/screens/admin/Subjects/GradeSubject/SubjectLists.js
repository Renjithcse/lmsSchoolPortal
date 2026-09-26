import React, { useCallback, useEffect, useMemo, useState } from 'react'
import moment from 'moment'
import { Box, Stack, Tooltip, Card, CardContent, Typography, IconButton, Button, Chip } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import EditIcon from '@mui/icons-material/Edit'
import { useTheme as useThemeContext } from '../../../../contexts/ThemeContext'
import { ICONS } from '../../../../assets/icons'
import useModal from '../../../../hooks/modalHook'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDeleteGradeSubjectMutation, useGetClassTeacherQuery, useListGradeSubjectsQuery } from '../../../../Redux/features/Admin/GradeSubject'
import DataTable from '../../../../components/Common/CustomTable'
import CustomAddButton from '../../../../components/Common/CustomAddButton'
import GradeSubjectForm from '../../../../components/admin/gradeSubject/GradeSubjectForm'
import CopyGradeSubjectModal from '../../../../components/admin/gradeSubject/CopyGradeSubjectModal'
import BulkAssignTeacherModal from '../../../../components/admin/gradeSubject/BulkAssignTeacherModal'
import ClassTeacherModal from '../../../../components/admin/gradeSubject/ClassTeacherModal'
import ConfirmationDialog from '../../../../components/Inputs/ConfirmationDialog'
import EditGradeSubject from '../../../../components/admin/gradeSubject/EditGradeSubject'
import { useSnackbar } from '../../../../hooks/SnackBar'
import { useAbility } from '../../../../AbilityContext'
import { useTranslation } from 'react-i18next'



const SubjectLists = () => {


	const { modal, openModal, closeModal } = useModal();
	const { themeColors } = useThemeContext();
	const navigate = useNavigate()
	const showSnackbar = useSnackbar();
	const ability  = useAbility();
	const { t } = useTranslation();
	const [_id, set_id] = useState(null);
	const [data, setData] = useState(null);
	const [selectedRows, setSelectedRows] = useState([]);

    const location = useLocation();

    const state = location.state;

	useEffect(() => {
		if(!location.state){
			navigate('/grade-subject')
		}
	}, [location])

	const { data: classTeacherRes, isLoading: isClassTeacherLoading } = useGetClassTeacherQuery(state ? state : {}, {
		skip: !state,
		refetchOnMountOrArgChange: true,
	});

	const classTeacher = classTeacherRes?.data?.classTeacher || null;
	

	const { isLoading, data: gradeSubjects } = useListGradeSubjectsQuery(state ? state : {})
	const [triggerDelete, { isLoading: isDeleteLoading }] = useDeleteGradeSubjectMutation(state ? state : {})

	

	

	const OpenDelete = useCallback((id) => {
		set_id(id);
		openModal('deleteModal');
	}, [openModal]);

	const closeDelete = useCallback(() => {
		closeModal('deleteModal');
	}, [closeModal]);

	const openAdd = useCallback(() => {
		openModal('addModal');
	}, [openModal]);

	const closeAdd = useCallback(() => {
		closeModal('addModal');
	}, [closeModal]);

	const openCopy = useCallback(() => {
		openModal('copyModal');
	}, [openModal]);

	const closeCopy = useCallback(() => {
		closeModal('copyModal');
	}, [closeModal]);

	const openBulkAssign = useCallback(() => {
		openModal('bulkAssignModal');
	}, [openModal]);

	const openClassTeacher = useCallback(() => {
		openModal('classTeacherModal');
	}, [openModal]);

	const closeClassTeacher = useCallback(() => {
		closeModal('classTeacherModal');
	}, [closeModal]);

	const closeBulkAssign = useCallback(() => {
		closeModal('bulkAssignModal');
		setSelectedRows([]);
	}, [closeModal]);

	const confirmDelete = async() => {
		closeDelete();
		const res = await triggerDelete(_id);
		if(res?.error){
			showSnackbar(res?.error?.data?.message ?? t('gradeSubject.messages.error'), 'error');
			
		}
		else{
			showSnackbar(t('gradeSubject.messages.deleteSuccess'), 'success');
		}

	}

	const openEdit = useCallback((data) => {
		setData(data)
		openModal('editModal');
	}, [openModal]);

	const closeEdit = useCallback(() => {
		setData(null)
		closeModal('editModal');
	}, [closeModal]);

	

	


	const columns = useMemo(() => [

		{
			field: 'SN',
			headerName: t('gradeSubject.table.sn'),
			flex: 1,
			headerAlign: 'center',
			align: 'center',
			renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1

		},
		{
			field: 'created',
			headerName: t('gradeSubject.table.createdDate'),
			flex: 1,
			headerAlign: 'center',
			align: 'center',
			valueGetter: (params) => moment(params?.row?.created_at).format("DD-MM-YYYY hh:mm A")
		},
		{
			field: 'subject',
			headerName: t('gradeSubject.table.subject'),
			flex: 1,
			headerAlign: 'center',
			align: 'center',
			valueGetter: (params) => params?.row?.subject?.subjectName
		},
		{
			field: 'teacher',
			headerName: t('gradeSubject.table.teacherName'),
			flex: 1,
			headerAlign: 'center',
			align: 'center',
			valueGetter: (params) => params?.row?.teacher ? `${params?.row?.teacher?.employeeId}-${params?.row?.teacher?.employeeName}` : ''
		},
		{
			field: 'type',
			headerName: t('gradeSubject.table.type'),
			flex: 1,
			headerAlign: 'center',
			align: 'center',
		},
        {
            field: 'Action',
            headerName: t('gradeSubject.table.action'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            sortable: false,
            disableColumnMenu: true,
            renderCell: ({ row }) => (
                <Stack alignItems={ 'center' } gap={ 1 } direction={ 'row' }>
                    {ability.can("Edit", "GradeSubject") && <Tooltip title={ t('gradeSubject.actions.edit') }>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(row); }}
                          sx={{ color: themeColors.accent, '&:hover': { backgroundColor: themeColors.accent, color: '#fff' } }}>
                            <ICONS.BorderColorIcon.component sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>}
                    {ability.can("Delete", "GradeSubject") && <Tooltip title={ t('gradeSubject.actions.delete') }>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); OpenDelete(row?._id); }}
                          sx={{ color: themeColors.error, '&:hover': { backgroundColor: themeColors.error, color: '#fff' } }}>
                            <ICONS.DeleteForeverIcon.component sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>}
                </Stack>
            ),
        }
	], [t, themeColors, ability, openEdit, OpenDelete]);

	return (
		<Box sx={{ p: 3, backgroundColor: themeColors.background.primary, minHeight: '100%' }}>
			<Card
				sx={{
					mb: 2,
					borderRadius: 2,
					boxShadow: 1,
					backgroundColor: themeColors.background.secondary,
					border: `1px solid ${themeColors.border.primary}`,
				}}
			>
				<CardContent sx={{ py: 1.5 }}>
					<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={1}>
						<Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
							<Typography variant="subtitle1" sx={{ fontWeight: 700, color: themeColors.text.primary }}>
								{t('gradeSubject.classTeacher.title')}
							</Typography>
							{isClassTeacherLoading ? (
								<Chip size="small" label={t('gradeSubject.classTeacher.loading.current')} />
							) : classTeacher?.teacher ? (
								<Chip
									size="small"
									color="primary"
									label={
										classTeacher.teacher.employeeId
											? `${classTeacher.teacher.employeeId} - ${classTeacher.teacher.employeeName}`
											: classTeacher.teacher.employeeName
									}
								/>
							) : (
								<Chip size="small" variant="outlined" label={t('gradeSubject.classTeacher.messages.notSet')} />
							)}
						</Stack>

						{ability.can('Edit', 'GradeSubject') && (
							<Button
								variant="outlined"
								size="small"
								startIcon={classTeacher?.teacher ? <EditIcon /> : <PersonAddIcon />}
								onClick={openClassTeacher}
								disabled={!state}
							>
								{classTeacher?.teacher ? t('gradeSubject.classTeacher.actions.change') : t('gradeSubject.classTeacher.actions.add')}
							</Button>
						)}
					</Stack>
				</CardContent>
			</Card>

			<Box display="flex" justifyContent="space-between" alignItems="center" mb={2}
				sx={{ backgroundColor: themeColors.background.secondary, border: `1px solid ${themeColors.border.primary}`, borderRadius: 2, p: 2 }}
			>
				<Typography variant="h6" sx={{ color: themeColors.text.primary, fontWeight: 600 }}>{t('gradeSubject.title')}</Typography>
				<Stack direction="row" spacing={2} alignItems="center">
					{ability.can("Edit", "GradeSubject") && (
						<Tooltip 
							title={selectedRows.length === 0 ? t('gradeSubject.bulkAssign.messages.noSubjectsSelected') : t('gradeSubject.actions.bulkAssign')}
						>
							<span>
								<IconButton
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										openBulkAssign();
									}}
									disabled={selectedRows.length === 0}
									sx={{
										backgroundColor: selectedRows.length > 0 ? themeColors.primary : themeColors.background.secondary,
										color: selectedRows.length > 0 ? themeColors.text.inverse : themeColors.text.secondary,
										'&:hover': {
											backgroundColor: selectedRows.length > 0 ? themeColors.accent : themeColors.background.secondary,
										},
										'&.Mui-disabled': {
											backgroundColor: themeColors.background.secondary,
											color: themeColors.text.secondary,
										}
									}}
								>
									<PersonAddIcon />
								</IconButton>
							</span>
						</Tooltip>
					)}
					{ability.can("Create", "GradeSubject") && (
						<Tooltip title={t('gradeSubject.actions.copy')}>
							<IconButton
								onClick={openCopy}
								sx={{
									backgroundColor: themeColors.primary,
									color: themeColors.text.inverse,
									'&:hover': {
										backgroundColor: themeColors.accent,
									}
								}}
							>
								<ContentCopyIcon />
							</IconButton>
						</Tooltip>
					)}
					{ability.can("Create", "GradeSubject") && <CustomAddButton ClickEvent={ openAdd } label={ t('gradeSubject.actions.add') } justifyContent={ 'flex-end' } />}
				</Stack>
			</Box>
			<Card sx={{ borderRadius: 2, boxShadow: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
				<CardContent>
					{selectedRows.length > 0 && (
						<Box sx={{ mb: 2, p: 1.5, backgroundColor: themeColors.background.secondary, borderRadius: 1, border: `1px solid ${themeColors.border.primary}` }}>
							<Typography variant="body2" sx={{ color: themeColors.text.primary }}>
								{t('gradeSubject.bulkAssign.selectedCount', { count: selectedRows.length })}
							</Typography>
						</Box>
					)}
					<DataTable
						rows={ gradeSubjects?.data || [] }
						columns={ columns }
						id={ "_id" }
						loading={isLoading || isDeleteLoading}
						checkboxSelection={ability.can("Edit", "GradeSubject")}
						onRowSelectionModelChange={(newSelection) => {
							const selectedData = (gradeSubjects?.data || []).filter(row => 
								newSelection.includes(row._id)
							);
							setSelectedRows(selectedData);
						}}
						rowSelectionModel={selectedRows.map(row => row._id).filter(id => id)}
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
							'& .MuiDataGrid-checkboxInput': { color: themeColors.text.primary },
						}}
					/>
				</CardContent>
			</Card>
			{ modal.addModal && <GradeSubjectForm open={ modal.addModal } close={ closeAdd } label={ t('gradeSubject.form.newSubject') }  /> }
			{ modal.copyModal && <CopyGradeSubjectModal open={ modal.copyModal } close={ closeCopy } label={ t('gradeSubject.copy.title') } /> }
			<BulkAssignTeacherModal 
				open={ modal.bulkAssignModal || false } 
				close={ closeBulkAssign } 
				label={ t('gradeSubject.bulkAssign.title') } 
				selectedSubjects={ selectedRows || [] } 
			/>
			<ClassTeacherModal
				open={modal.classTeacherModal || false}
				close={closeClassTeacher}
				label={t('gradeSubject.classTeacher.modalTitle')}
				filters={state}
				currentTeacherId={classTeacher?.teacher?._id}
			/>
			{ modal.editModal && <EditGradeSubject open={ modal.editModal } close={ closeEdit } label={ t('gradeSubject.form.editSubject') } data={ data } /> }
			<ConfirmationDialog 
				isOpen={modal.deleteModal} 
				onClose={closeDelete} 
				onConfirm={confirmDelete}
				message={t('gradeSubject.delete.confirm')} 
				title={t('gradeSubject.delete.title')}
			/>
		</Box>
	)
}

export default SubjectLists