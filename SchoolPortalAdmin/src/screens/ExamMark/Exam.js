import React, { useCallback, useEffect, useState } from 'react'
import CustomOutletBox from '../../components/Common/CustomOutletBox'
import CustomAddButton from '../../components/Common/CustomAddButton'
import useModal from '../../hooks/modalHook';
import { useQuery } from '@tanstack/react-query';
import { Box, Stack, Tooltip, Card, CardContent, Typography, IconButton } from '@mui/material';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { ICONS } from '../../assets/icons';
import moment from 'moment';
import DataTable from '../../components/Common/CustomTable';

import CustomDelete from '../../components/Common/CustomDelete';
import Header from '../../components/assignments/Header';
import ExamHeader from '../../components/ExamMark/ExamHeader';
import { useLocation } from 'react-router-dom';
import { useDeleteExamMutation, useLazyListExamsQuery } from '../../Redux/features/MarkEntry';
import NewExam from '../../components/ExamMark/NewExam';
import DeleteDialog from '../../components/Common/DeleteDialog';
import { useAbility } from '../../AbilityContext'
import { useTranslation } from 'react-i18next';

const Exam = () => {


    const { modal, openModal, closeModal } = useModal();
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();
    const [item, setItem] = useState(null);
    const [_id, set_id] = useState(null);

    const ability = useAbility()

    const [getExams, { data, isLoading }] = useLazyListExamsQuery();
    const [deleteExam] = useDeleteExamMutation()


    console.log({data})


    const location = useLocation()


    const OpenDelete = useCallback((id) => {
        set_id(id);
        openModal('deleteModal');
    }, [modal]);

    const OpenEdit = useCallback((exam) => {
        setItem(exam);
        openModal('editModal');
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


    const closeEdit = useCallback(() => {

        closeModal('editModal');
    }, [modal,]);


    useEffect(() => {
        if(location.state){
            getExams(location.state)
        }
    }, [location.state])
    


    const columns = React.useMemo(() => [

        {
            field: 'SN',
            headerName: t('exam.table.sn'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1

        },
        {
            field: 'created',
            headerName: t('exam.table.createdDate'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            valueGetter: (params) => params?.row?.createdAt ? moment(params.row.createdAt).format("DD-MM-YYYY hh:mm A") : '-'
        },

        {
            field: 'examName',
            headerName: t('exam.table.examName'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
        },
        {
            field: 'examDate',
            headerName: t('exam.table.examDate'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            valueGetter: (params) => params?.row?.examDate ? moment(params.row.examDate).format("DD-MM-YYYY") : '-'
        },
        {
            field: 'publishDate',
            headerName: t('exam.table.publishDate'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            valueGetter: (params) => params?.row?.publishDate ? moment(params.row.publishDate).format("DD-MM-YYYY") : '-'
        },
        {
            field: 'Action',
            headerName: t('exam.table.action'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            sortable: false,
            disableColumnMenu: true,
            renderCell: ({ row }) => (
                <Stack alignItems={'center'} gap={1} direction={'row'}>
                    {ability.can("Edit", "Exam") && <Tooltip title={t('exam.actions.edit')}>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); OpenEdit(row); }}
                            sx={{ color: themeColors.primary, '&:hover': { backgroundColor: themeColors.primary, color: '#fff' } }}>
                            <ICONS.Edit.component sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>}
                    {ability.can("Delete", "Exam") && <Tooltip title={t('exam.actions.delete')}>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); OpenDelete(row?._id); }}
                            sx={{ color: themeColors.error, '&:hover': { backgroundColor: themeColors.error, color: '#fff' } }}>
                            <ICONS.DeleteForeverIcon.component sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>}
                </Stack>
            ),
        }
    ], [t, themeColors, ability, OpenEdit, OpenDelete]);


    return (
        <CustomOutletBox>
            <Box sx={{ p: 3, backgroundColor: themeColors.background.primary, minHeight: '100%' }}>
                <ExamHeader resetRoute={'/exam'} successRoute={'/exam'} />
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}
                    sx={{ backgroundColor: themeColors.background.secondary, border: `1px solid ${themeColors.border.primary}`, borderRadius: 2, p: 2 }}
                >
                    <Typography variant="h6" sx={{ color: themeColors.text.primary, fontWeight: 600 }}>{t('exam.title')}</Typography>
                    {ability.can("Create", "Exam") && <CustomAddButton ClickEvent={openAdd} label={t('exam.actions.add')} justifyContent={'flex-end'} />}
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
            
            {modal.deleteModal && <DeleteDialog
                open={modal.deleteModal}
                onClose={() => closeModal('deleteModal')}
                heading={t('exam.delete.heading')}
                paragraph={t('exam.delete.paragraph')}
                fun={deleteExam}
                _id={_id}
                mode="redux"
            />}
            {modal.addModal && <NewExam open={modal.addModal} close={closeAdd} label={t('exam.form.createExam')} hide={false} id={false} />}
            {modal.editModal && <NewExam open={modal.editModal} close={closeEdit} label={t('exam.form.editExam')} hide={false} id={false} item={item} />}
        </CustomOutletBox>
    )
}

export default Exam
