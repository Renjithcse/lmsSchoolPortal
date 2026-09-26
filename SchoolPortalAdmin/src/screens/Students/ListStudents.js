import React, { useCallback, useMemo } from 'react'
import DataTable from '../../components/Common/CustomTable'
import { Box, Stack, Tooltip, Card, CardContent, Typography, IconButton } from '@mui/material';
import { ICONS } from '../../assets/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import CustomAddButton from '../../components/Common/CustomAddButton';
import { useGetAllStudentsQuery } from '../../Redux/features/Users/StudentSlice';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext'
import { useTranslation } from 'react-i18next'


const ListStudents = () => {

    const location = useLocation()
    const navigate = useNavigate()
    const { themeColors } = useThemeContext()
    const { t } = useTranslation()

    const { data, isFetching } = useGetAllStudentsQuery(location?.state)

    const openView = useCallback((id) => {
        navigate(`/student/view/${id}`, { state: location?.state })
    }, [navigate, location?.state])

    const openEdit = useCallback((id) => {
        navigate(`/student/edit/${id}`, { state: location?.state })
    }, [navigate, location?.state])

    const columns = useMemo(() => [
        {
            field: 'SN',
            headerName: t('listStudents.columns.sn'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            renderCell: (params) => params.api.getAllRowIds().indexOf(params.id) + 1

        },
        {
            field: 'name',
            headerName: t('listStudents.columns.name'),
            flex: 1,
            align: 'center',
            headerAlign: 'center',
            valueGetter: (params) => `${params.row.studentId?.studentID} - ${params.row.studentId?.studentName}`
        },
        {
            field: 'email',
            headerName: t('listStudents.columns.email'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            valueGetter: (params) => params.row.studentId?.Email
        },
        {
            field: 'contact_no',
            headerName: t('listStudents.columns.contact'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            valueGetter: (params) => params.row.studentId?.contactNo
        },
        {
            field: 'father',
            headerName: t('listStudents.columns.fatherName'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            valueGetter: (params) => params.row.studentId?.Father_name
        },
        {
            field: 'nationality',
            headerName: t('listStudents.columns.nationality'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            valueGetter: (params) => params.row.studentId?.Nationality?.name
        },
        {
            field: 'Action',
            headerName: t('listStudents.columns.action'),
            flex: 1,
            headerAlign: 'center',
            align: 'center',
            sortable: false,
            disableColumnMenu: true,
            renderCell: ({ row }) => (
                <Stack alignItems={'center'} gap={1} direction={'row'}>
                    <Tooltip title={t('listStudents.actions.view')}>
                        <IconButton
                            size="small"
                            onClick={() => openView(row?.studentId?._id)}
                            sx={{
                                color: themeColors.text.primary,
                                border: `1px solid ${themeColors.border.primary}`,
                                backgroundColor: themeColors.background.secondary,
                                '&:hover': { backgroundColor: themeColors.background.tertiary }
                            }}
                        >
                            <ICONS.RemoveRedEyeIcon.component sx={ICONS.RemoveRedEyeIcon.sx} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={t('listStudents.actions.edit')}>
                        <IconButton
                            size="small"
                            onClick={() => openEdit(row?.studentId?._id)}
                            sx={{
                                color: themeColors.text.primary,
                                border: `1px solid ${themeColors.border.primary}`,
                                backgroundColor: themeColors.background.secondary,
                                '&:hover': { backgroundColor: themeColors.background.tertiary }
                            }}
                        >
                            <ICONS.BorderColorIcon.component sx={ICONS.BorderColorIcon.sx} />
                        </IconButton>
                    </Tooltip>
                </Stack>
            ),
        }
    ], [t, themeColors, openView, openEdit]);

    const openAdd = useCallback(() => {
        navigate(`/student/add`, { state: location?.state });
    }, [navigate, location?.state]);


    return (
        <Box sx={{ p: 2 }}>
            <Card sx={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                        <Typography variant="h6" sx={{ color: themeColors.text.primary, fontWeight: 700 }}>
                            {t('listStudents.title')}
                        </Typography>
                        <CustomAddButton ClickEvent={openAdd} label={t('listStudents.actions.add')} />
                    </Stack>
                    <DataTable
                        columns={columns}
                        rows={data?.data ? data.data : []}
                        title={''}
                        loading={isFetching}
                        id={"_id"}
                    />
                </CardContent>
            </Card>
        </Box>

    )
}

export default ListStudents