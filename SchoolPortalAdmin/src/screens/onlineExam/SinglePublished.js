
import React, { memo, useCallback } from 'react';
import { Card, CardContent, Typography, Box, Divider, IconButton, CardActions, Stack, Tooltip, CircularProgress } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';
import { DateRangeIcon } from '@mui/x-date-pickers';
import { useNavigate, useParams } from 'react-router-dom';
import { viewPublishedExam } from '../../api/onlineExam';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import DataTable from '../../components/Common/CustomTable';
import QuestionCard from '../../components/OnlineExam/QuestionCard';
import useModal from '../../hooks/modalHook';
import EditIcon from '@mui/icons-material/Edit';
import EditPublish from '../../components/OnlineExam/EditPublish';
import CustomButton from '../../components/Common/CustomButton';
import PublishedExamDetails from './PublishedExamDetails';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';



const SinglePublished = () => {
    const { themeColors } = useTheme();
    const { t } = useTranslation();
    const { id } = useParams();
    const { modal, openModal, closeModal } = useModal();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const closeAdd = useCallback(async () => {
        closeModal('addModal');
        await queryClient.invalidateQueries({ queryKey: ['singlePublished', id] })
    }, [closeModal]);

    

    const { data, isLoading } = useQuery({ queryKey: ['singlePublished', id], queryFn: () => viewPublishedExam(id) });

    console.log({ data })


    if(isLoading){
        return(
            <Box sx={{ backgroundColor: themeColors.background.primary, minHeight: '100vh' }}>
                <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
                    <CircularProgress sx={{ color: themeColors.primary }} />
                </Box>
            </Box>
        )
    }


    return (
        <Box position={"relative"} sx={{ backgroundColor: themeColors.background.primary, minHeight: '100vh' }}>
            <PublishedExamDetails data={data} enableRetest={true} />
            
            {modal.addModal && <EditPublish open={modal.addModal} close={closeAdd} label={t('singlePublished.updatePublishedDate')} hide={false} id={false} data={data?.publishedExam} />}
        </Box>
    )
}

export default SinglePublished