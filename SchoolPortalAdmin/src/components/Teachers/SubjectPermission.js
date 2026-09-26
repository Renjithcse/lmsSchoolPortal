import { useState } from 'react';
import { useDeleteSubjectPermissionMutation, useGetTeacherSubjectPermissionQuery, } from '../../Redux/features/Admin/TeachersSlice';
import { useLocation } from 'react-router-dom';
import { capitalize } from 'lodash-es';
import UiBlocker from '../Common/UiBlocker';
import CreateSubjectPermission from './CreateSubjectPermission';
import EditSubjectPermission from './EditSubjectPermission';
import ConfirmationDialog from '../Inputs/ConfirmationDialog';
import { useSnackbar } from '../../hooks/SnackBar';
import { Box, Card, CardContent, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';



const SubjectPermission = () => {

    const { t } = useTranslation();
    const [datas, setDatas] = useState(null)
    const [open, setOpen] = useState(false)
    const showSnackbar = useSnackbar()

    const location = useLocation()
    const [view, setView] = useState('list');
    const { data, isLoading } = useGetTeacherSubjectPermissionQuery(location?.state)

    const [triggerDelete, { isLoading: deleteLoading }] = useDeleteSubjectPermissionMutation()



    const enableEdit = async(data) => {
        setDatas(data)
        setView('edit')
    }

    

    const closeDelete = () => {
        setOpen(false)
    }

    const confirmDelete = async() => {
        const deleted = await triggerDelete(datas._id);
        if (deleted.error) {
            showSnackbar(deleted.error?.data?.message, 'error');
            return false
        }
        showSnackbar(t('subjectPermission.messages.deleteSuccess'), "success")
        closeDelete();
    };

    const enableDelete = async(data) => {
        setDatas(data)
        setOpen(true)
    }

    

    const { themeColors } = useThemeContext();
    return (
        <Box sx={{ p: 3, backgroundColor: themeColors.background.primary, minHeight: '60vh' }}>
            {view === 'list' ? (
                <Card sx={{ borderRadius: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" sx={{ color: themeColors.text.primary, fontWeight: 800 }}>{t('subjectPermission.title')}</Typography>
                            <Button onClick={() => setView('create')} variant="contained" sx={{ backgroundColor: themeColors.primary, color: themeColors.text.inverse, '&:hover': { backgroundColor: themeColors.primary } }}>{t('subjectPermission.actions.createNew')}</Button>
                        </Box>
                        <Table sx={{ '& th': { backgroundColor: themeColors.background.secondary, color: themeColors.text.primary }, '& td, & th': { borderColor: themeColors.border.primary }, '& td': { color: themeColors.text.primary } }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('subjectPermission.tableHeaders.academicYear')}</TableCell>
                                    <TableCell>{t('subjectPermission.tableHeaders.grade')}</TableCell>
                                    <TableCell>{t('subjectPermission.tableHeaders.gender')}</TableCell>
                                    <TableCell>{t('subjectPermission.tableHeaders.section')}</TableCell>
                                    <TableCell>{t('subjectPermission.tableHeaders.subjects')}</TableCell>
                                    <TableCell>{t('subjectPermission.tableHeaders.actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data?.data.map((perm) => (
                                    <TableRow key={perm.id}>
                                        <TableCell>{perm.academicYear?.academicYear}</TableCell>
                                        <TableCell>{capitalize(perm.grade?.gradeName)}</TableCell>
                                        <TableCell>{capitalize(perm.gender)}</TableCell>
                                        <TableCell>{perm.section?.sectionName}</TableCell>
                                        <TableCell>{perm.subjects?.map(s => s.subjectName).join(', ')}</TableCell>
                                        <TableCell>
                                            <Button size="small" variant="outlined" onClick={() => enableEdit(perm)} sx={{ mr: 1, borderColor: themeColors.primary, color: themeColors.primary }}>{t('subjectPermission.actions.edit')}</Button>
                                            <Button size="small" variant="outlined" onClick={() => enableDelete(perm)} sx={{ borderColor: themeColors.error, color: themeColors.error }}>{t('subjectPermission.actions.delete')}</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ) : view === "create" ? (
                <CreateSubjectPermission setView={setView} view={view} />
            ) : view === "edit" && <EditSubjectPermission setView={setView} view={view} datas={datas} /> }
            <UiBlocker open={isLoading || deleteLoading} />
            <ConfirmationDialog 
                isOpen={open} 
                onClose={closeDelete} 
                onConfirm={confirmDelete} 
                message={t('subjectPermission.deleteDialog.message')} 
                title={t('subjectPermission.deleteDialog.title')}
            />
        </Box>
    );
};

export default SubjectPermission;