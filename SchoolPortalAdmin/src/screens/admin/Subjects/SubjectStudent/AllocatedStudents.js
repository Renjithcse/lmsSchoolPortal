import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAddStudentsMutation, useDeleteStudentMutation, useListSubjectStudentsQuery } from '../../../../Redux/features/Admin/SubjectStudent';
import { useTheme as useThemeContext } from '../../../../contexts/ThemeContext';
import SingleCheckbox from '../../../../components/Inputs/SingleCheckBox';
import CustomButton from '../../../../components/Common/CustomButton';
import UiBlocker from '../../../../components/Common/UiBlocker';
import { useSnackbar } from '../../../../hooks/SnackBar';
import ConfirmationDialog from '../../../../components/Inputs/ConfirmationDialog';
import { useAbility } from '../../../../AbilityContext'
import { useTranslation } from 'react-i18next'


const AllocatedStudents = () => {

    const [regiestered, setRegistered] = useState([])
    const { themeColors } = useThemeContext();
	const [unregiestered, setUnRegistered] = useState([])
	const showSnackbar = useSnackbar()
	const [showDeleteDialog, setShowDeleteDialog]= useState(false)
	const [id, setId]= useState('')
	const ability = useAbility()
	const { t } = useTranslation();

	const location = useLocation();

	const { data } = useListSubjectStudentsQuery(location.state)
	const [triggerAddStudent, { isLoading }] = useAddStudentsMutation()
	const [triggerDeleteStudent, { isLoading: isDeleteLoading }] = useDeleteStudentMutation()

	useEffect(() => {
		if (data?.data?.unregisteredStudents) {
			setUnRegistered(structuredClone(data.data.unregisteredStudents))
		}
		if (data?.data?.registeredStudents) {
			setRegistered(structuredClone(data.data.registeredStudents))
		}
	}, [data?.data])


	const saveRegisteredStudents = async () => {
		// console.log({unregiestered, state: location.state})
		const selected = unregiestered?.filter(stud => stud?.selected)

		const studentIds = selected?.map(student => student.studentId?._id)

		let datas = {
			...location.state,
			studentIds: studentIds
		}

		const students = await triggerAddStudent(datas);

		if (students?.error) {
			showSnackbar(students?.error?.data?.message, "error")
			return false
		}

		showSnackbar(t('subjectStudent.messages.allocatedSuccess'), "success")

	}

	const deleteStudent = (id) => {
		setId(id)
		setShowDeleteDialog(true)
	}


	const confirmRemove = async() => {
		setShowDeleteDialog(false)
        const deleted = await triggerDeleteStudent(id);

		if(deleted.error) {
			showSnackbar(deleted.error?.data?.message, 'error');
			return false
		}

		showSnackbar(t('subjectStudent.messages.removeSuccess'), "success")
	}

	// Handle individual checkbox change
	const handleCheckboxChange = (index) => {
		const updatedStudents = [...unregiestered];
		updatedStudents[index].selected = !updatedStudents[index].selected;
		setUnRegistered(updatedStudents);
	}

	// Handle select all/deselect all
	const handleSelectAll = (checked) => {
		const updatedStudents = unregiestered.map(student => ({
			...student,
			selected: checked
		}));
		setUnRegistered(updatedStudents);
	}

	// Check if all are selected
	const isAllSelected = unregiestered.length > 0 && unregiestered.every(student => student.selected);


	return (
        <div className='flex flex-col gap-4' style={{ background: themeColors.background.primary }}>
            <div className="overflow-x-auto shadow-md my-4 p-4 mx-2" style={{ background: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, borderRadius: 8 }}>
                <h2 className='title  font-bold my-2' style={{ color: themeColors.primary }}>{t('subjectStudent.registeredStudents')}</h2>
                <table className="min-w-full rounded-lg" style={{ background: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
					<thead>
						<tr>
                            <th className="px-4 py-2 text-left font-semibold cursor-pointer" style={{ color: themeColors.text.secondary }} >
								{t('subjectStudent.table.sno')}
							</th>
                            <th className="px-4 py-2 text-left font-semibold cursor-pointer" style={{ color: themeColors.text.secondary }} >
								{t('subjectStudent.table.studentId')}
							</th>
                            <th className="px-4 py-2 text-left font-semibold cursor-pointer" style={{ color: themeColors.text.secondary }} >
								{t('subjectStudent.table.studentName')}
							</th>
                            <th className="px-4 py-2 text-left font-semibold cursor-pointer" style={{ color: themeColors.text.secondary }} >
								{t('subjectStudent.table.action')}
							</th>
						</tr>
					</thead>
					<tbody>
						{regiestered.map((row, index) => (
							<tr
								key={index}
                                style={{ background: index % 2 === 0 ? themeColors.background.secondary : themeColors.background.primary, borderBottom: `1px solid ${themeColors.border.primary}` }}
							>
								<td
                                    className="px-4 py-2"
                                    style={{ color: themeColors.text.primary }}
								>
									{index + 1}
								</td>
								<td
                                    className="px-4 py-2"
                                    style={{ color: themeColors.text.primary }}
								>
									{row?.studentId?.studentID}
								</td>
								<td
                                    className="px-4 py-2"
                                    style={{ color: themeColors.text.primary }}
								>
									{row?.studentId?.studentName}
								</td>
								<td
                                    className="px-4 py-2"
                                    style={{ color: themeColors.text.primary }}
								>
									{ability.can("Delete", "SubjectStudent") && <svg xmlns="http://www.w3.org/2000/svg" 
									onClick={() => deleteStudent(row?._id)}
									fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 text-red-600 cursor-pointer">
										<path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
									</svg>}

								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
            {unregiestered?.length > 0 && <div className="overflow-x-auto shadow-md my-4 p-4 mx-2" style={{ background: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, borderRadius: 8 }}>
                <div className='flex flex-row items-center justify-between mb-2'>
                    <h2 className='title  font-bold my-2' style={{ color: themeColors.primary }}>{t('subjectStudent.unregisteredStudents')}</h2>
                    <div className='flex flex-row items-center gap-2'>
                        <SingleCheckbox
                            onChange={handleSelectAll}
                            checked={isAllSelected}
                        />
                        <span style={{ color: themeColors.text.primary, fontFamily: 'Raleway, sans-serif', fontWeight: '600' }}>
                            {t('subjectStudent.selectAll') || 'Select All'}
                        </span>
                    </div>
                </div>
                <table className="min-w-full rounded-lg" style={{ background: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
					<thead>
						<tr>
                            <th className="px-4 py-2 text-left font-semibold cursor-pointer" style={{ color: themeColors.text.secondary }} >
								{t('subjectStudent.table.sno')}
							</th>
                            <th className="px-4 py-2 text-left font-semibold cursor-pointer" style={{ color: themeColors.text.secondary }} >
								{t('subjectStudent.table.studentId')}
							</th>
                            <th className="px-4 py-2 text-left font-semibold cursor-pointer" style={{ color: themeColors.text.secondary }} >
								{t('subjectStudent.table.studentName')}
							</th>
                            <th className="px-4 py-2 text-left font-semibold cursor-pointer" style={{ color: themeColors.text.secondary }} >
								{t('subjectStudent.table.action')}
							</th>
						</tr>
					</thead>
					<tbody>
						{unregiestered.map((row, index) => (
							<tr
								key={index}
                                style={{ background: index % 2 === 0 ? themeColors.background.secondary : themeColors.background.primary, borderBottom: `1px solid ${themeColors.border.primary}` }}
							>
								<td
                                    className="px-4 py-2"
                                    style={{ color: themeColors.text.primary }}
								>
									{index + 1}
								</td>
								<td
                                    className="px-4 py-2"
                                    style={{ color: themeColors.text.primary }}
								>
									{row?.studentId?.studentID}
								</td>
								<td
                                    className="px-4 py-2"
                                    style={{ color: themeColors.text.primary }}
								>
									{row?.studentId?.studentName}
								</td>
								<td
                                    className="px-4 py-2"
                                    style={{ color: themeColors.text.primary }}
								>
									<SingleCheckbox
										onChange={() => handleCheckboxChange(index)}
										checked={row?.selected || false}
									/>
								</td>
							</tr>
						))}
					</tbody>
				</table>
				{(unregiestered?.length > 0 && ability.can("Create", "SubjectStudent")) && <div className='flex flex-row items-end justify-end py-4'>
					<CustomButton label={t('subjectStudent.actions.register')} onClick={saveRegisteredStudents} />
				</div>}
				
			</div>}
			<ConfirmationDialog 
			    title={t('subjectStudent.delete.title')}
				message={t('subjectStudent.delete.confirm')}
				isOpen={showDeleteDialog}
				onConfirm={confirmRemove}
				onClose={() => setShowDeleteDialog(false)}
			/>
			<UiBlocker open={isLoading || isDeleteLoading} />
		</div>
	)
}

export default AllocatedStudents