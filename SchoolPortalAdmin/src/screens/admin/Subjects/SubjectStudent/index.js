import React from 'react'
import CustomOutletBox from '../../../../components/Common/CustomOutletBox'
import SubjectSelector from '../../../../components/admin/SubjectStudent/SubjectSelector'
import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const SubjectStudent = () => {
    const { t } = useTranslation();
    return (
        <CustomOutletBox>
			<SubjectSelector route="/subject-student" params={{type: JSON.stringify(['group', 'optional'])}} />
            <Outlet />
		</CustomOutletBox>
    )
}

export default SubjectStudent