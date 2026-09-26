import React from 'react'
import { Outlet } from 'react-router-dom'
import CustomOutletBox from '../../../../components/Common/CustomOutletBox'
import { useTheme as useThemeContext } from '../../../../contexts/ThemeContext'
import { Box } from '@mui/material'
import ClassSelector from '../../../../components/Common/ClassSelector'
import { useTranslation } from 'react-i18next'

const GroupSubjects = () => {
    const { t } = useTranslation();
    const { themeColors } = useThemeContext();
    return (
        <CustomOutletBox>
            <Box sx={{ p: 2, backgroundColor: themeColors.background.primary, borderRadius: 2 }}>
                <ClassSelector hide="term" redirectTo="/group-subject" />
            </Box>
            <Outlet />
        </CustomOutletBox>
    )
}

export default GroupSubjects