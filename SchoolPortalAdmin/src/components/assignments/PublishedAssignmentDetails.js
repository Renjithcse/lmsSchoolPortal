import { Box, Card, CardContent, Divider,  Typography } from '@mui/material'
import React, { memo, useCallback } from 'react'
import SchoolIcon from '@mui/icons-material/School';
import CustomButton from '../../components/Common/CustomButton';
import PeopleIcon from '@mui/icons-material/People';
import { DateRangeIcon } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';




const PublishedAssignmentDetails = ({data}) => {
    const { t } = useTranslation();
    const { themeColors } = useThemeContext();

    const navigate = useNavigate()

    console.log({data})



    return (
        <Card sx={{ marginTop: 4, borderRadius: 2, boxShadow: 2, margin: 1, width: '100%', backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
            <CardContent>
                <Box display="flex" mb={2} flexDirection={"column"}>
                    <Box display="flex" alignItems="center" flexDirection={"row"}>
                        <SchoolIcon sx={{ color: themeColors.primary }} fontSize="large" />
                        <Typography variant="h6" component="div" ml={1} sx={{ color: themeColors.text.primary }}>
                            {`${data?.data?.publishedAssignment?.gender === "male" ? t('assignments.view.gender.boys') : t('assignments.view.gender.girls')} - ${data?.data?.publishedAssignment?.section?.sectionName}`}
                        </Typography>
                    </Box>

                </Box>




                <Divider sx={{ mb: 2, borderColor: themeColors.border.primary }} />

                <Box display="flex" alignItems="center">
                    <PeopleIcon sx={{ color: themeColors.text.secondary }} />
                    <Typography variant="body1" ml={1} sx={{ color: themeColors.text.secondary }}>
                        {t('assignments.publishedDetails.totalParticipants', { 
                            attended: data?.data?.publishedAssignment?.attendedUsers || 0, 
                            total: data?.data?.publishedAssignment?.totalUsersSelected || 0 
                        })}
                    </Typography>
                </Box>
                <Divider sx={{ mb: 2, borderColor: themeColors.border.primary }} />

                <Box display="flex" alignItems="center">
                    <DateRangeIcon sx={{ color: themeColors.text.secondary }} />
                    <Typography variant="body1" fontSize={12} ml={1} sx={{ color: themeColors.text.secondary }}>
                        {t('assignments.publishedDetails.dateRange', {
                            startDate: dayjs(data?.data?.publishedAssignment?.startDate).format("DD-MM-YYYY"),
                            endDate: dayjs(data?.data?.publishedAssignment?.endDate).format("DD-MM-YYYY")
                        })}
                    </Typography>
                </Box>
            </CardContent>
            <Divider sx={{ mb: 2, borderColor: themeColors.border.primary }} />
        </Card>
    )
}

export default memo(PublishedAssignmentDetails) 