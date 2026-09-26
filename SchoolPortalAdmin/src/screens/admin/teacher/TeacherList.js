import React, { useCallback } from 'react';
import { Box, Tooltip, Typography, Stack, Card, CardContent } from '@mui/material';
import { useTheme as useThemeContext } from '../../../contexts/ThemeContext';
import CustomAddButton from '../../../components/Common/CustomAddButton';
import { ICONS } from '../../../assets/icons';
import DataTable from '../../../components/Common/CustomTable';
import { useNavigate } from 'react-router-dom';
import { useListAllTeachersQuery } from '../../../Redux/features/Admin/TeachersSlice';
import { useTranslation } from 'react-i18next';

const TeacherList = () => {
    const navigate = useNavigate();
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();

    const { data: teachers, isLoading, isFetching } = useListAllTeachersQuery();

    const handleEdit = useCallback((id) => {
        navigate(`/teacher/edit/${id}`, { state: { mode: 'edit' } });
    }, [navigate]);

    const handleAdd = useCallback(() => {
        navigate('/teacher/add', { state: { mode: 'add' } });
    }, [navigate]);

    const handleView = useCallback((id) => {
        navigate('/teacher/view-teacher', { state: id });
    }, [navigate]);

    const columns = [
        {
            field: 'SN',
            headerName: t('teacher.list.table.sn'),
            flex: 0.5,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1,
        },
        {
            field: 'employeeName',
            headerName: t('teacher.list.table.employeeName'),
            flex: 1,
            align: 'center',
            headerAlign: 'center',
            valueGetter: (params) => `${params.row.employeeId}-${params.row.employeeName}`,
        },
        {
            field: 'email',
            headerName: t('teacher.list.table.email'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
        },
        {
            field: 'gender',
            headerName: t('teacher.list.table.gender'),
            flex: 0.8,
            headerAlign: 'center',
            align: 'center',
        },
        {
            field: 'contactNo',
            headerName: t('teacher.list.table.contact'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
        },
        {
            field: 'nationality',
            headerName: t('teacher.list.table.nationality'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            valueGetter: (params) => params.row.nationality?.nationality,
        },
        {
            field: 'Action',
            headerName: t('teacher.list.table.action'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            sortable: false,
            disableColumnMenu: true,
            renderCell: ({ row }) => (
                <Stack alignItems="center" gap={1} direction="row">
                    <Box onClick={() => handleView(row?._id)}>
                        <Tooltip title={t('teacher.list.actions.view')}>
                            <ICONS.RemoveRedEyeIcon.component sx={ICONS.RemoveRedEyeIcon.sx} />
                        </Tooltip>
                    </Box>
                    <Box onClick={() => handleEdit(row?._id)}>
                        <Tooltip title={t('teacher.list.actions.edit')}>
                            <ICONS.BorderColorIcon.component sx={ICONS.BorderColorIcon.sx} />
                        </Tooltip>
                    </Box>
                </Stack>
            ),
        },
    ];

    return (
        <Box sx={{ p: 3, backgroundColor: themeColors.background.primary, minHeight: '100%' }}>
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                    sx={{
                        backgroundColor: themeColors.background.secondary,
                        border: `1px solid ${themeColors.border.primary}`,
                        borderRadius: 2,
                        p: 2,
                    }}
                >
                    <Typography variant="h6" sx={{ color: themeColors.text.primary, fontWeight: 600 }}>
                        {t('teacher.list.title')}
                    </Typography>
                    <CustomAddButton ClickEvent={handleAdd} label={t('teacher.list.actions.add')} justifyContent="flex-end" />
                </Box>
                <Card
                    sx={{
                        borderRadius: 2,
                        boxShadow: 2,
                        backgroundColor: themeColors.background.primary,
                        border: `1px solid ${themeColors.border.primary}`,
                    }}
                >
                    <CardContent>
                        <DataTable
                            rows={isFetching ? [] : teachers?.data}
                            columns={columns}
                            id="_id"
                            loading={isLoading}
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
    );
};

export default TeacherList;
