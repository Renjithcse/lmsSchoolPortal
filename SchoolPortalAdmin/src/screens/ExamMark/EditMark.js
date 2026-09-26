import { useState } from "react";
import { Box, Input, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Checkbox, FormControlLabel } from "@mui/material";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import Button from "../../components/Inputs/Button";
import { useSaveStudentMarkMutation } from "../../Redux/features/MarkEntry";
import { useSnackbar } from "../../hooks/SnackBar";
import { useTranslation } from 'react-i18next';

const EditMark = () => {

	const [markDetails, setMarkDetails] = useState([])
	const location = useLocation();
	const state = location.state;
	const showSnackbar = useSnackbar()
	const { themeColors } = useThemeContext();
	const { t } = useTranslation();

	const [triggerSaveMark, { isLoading }] = useSaveStudentMarkMutation()


    useEffect(() => {
        if(state?.students){
            setMarkDetails(structuredClone(state.students))
        }
    }, [state?.students])
    

	console.log({markDetails})

	//console.log({state})

	const saveMark = async() => {
        let error = false;
		// Save Marks
		let students = markDetails?.map(mark => {
			let marks = 0;
            let totalMarks = 0;
			let Category = mark?.categories?.map(cat => {
				let catMark = 0;
				let subs = cat.subCategories?.map(sub => {
                    if(sub.error){
						error = true
					}
                    if(mark?.status === "absent"){
                        sub.studentMark = null;
                    }
                    else if(sub?.studentMark && parseInt(sub?.studentMark)){
						catMark += parseInt(sub?.studentMark)
						marks += parseInt(sub?.studentMark)
					}
					
					return {
						subcategoryId: sub?._id,
						studentMark: mark?.status === "absent" ? null : sub?.studentMark,
                        mark: sub?.mark
					}
				})

                totalMarks += cat?.mark;

				return {
					categoryId:  cat?._id,
					studentMark: mark?.status === "absent" ? null : catMark,
                    mark: cat?.mark,
					subCategories: subs
				}
			})

			return {
				studentId: mark?._id,
				academicYear: state?.academicYear,
				term: state?.term,
				grade: state?.grade,
				subject: state?.subject,
				examName: state?.examName,
				categoryMark: Category,
				studentMark: mark?.status === "absent" ? null : marks,
                mark: totalMarks,
				status: mark.status
			}
		})

        if(error){
            showSnackbar(t('editMark.messages.clearErrors'), "error")
            return false;
        }
        else{
            let saved = await triggerSaveMark({marks: students})

            if(saved?.error){
                showSnackbar(saved?.error?.data?.message, "error")
            }
            else{
                showSnackbar(t('editMark.messages.saveSuccess'), "success")
            }
        }
		//console.log({students})
		
	}
	

	return (
		<Box sx={{ mt: 2, p: 3 }}>
			<TableContainer 
				component={Paper} 
				sx={{ 
					backgroundColor: themeColors.background.primary,
					border: `1px solid ${themeColors.border.primary}`,
					borderRadius: 2,
					boxShadow: 3
				}}
			>
				<Table sx={{ minWidth: 650 }} aria-label="simple table">
					<TableHead>
						<TableRow sx={{ backgroundColor: themeColors.primary }}>
							<TableCell 
								sx={{ 
									color: 'white', 
									fontWeight: 'bold', 
									border: `1px solid ${themeColors.border.primary}`,
									fontFamily: 'Raleway, sans-serif'
								}} 
								rowSpan={2}
							>
								{t('editMark.table.sno')}
							</TableCell>
							<TableCell 
								sx={{ 
									color: 'white', 
									fontWeight: 'bold', 
									border: `1px solid ${themeColors.border.primary}`,
									fontFamily: 'Raleway, sans-serif'
								}} 
								rowSpan={2} 
								align="center"
							>
								{t('editMark.table.studentDetails')}
							</TableCell>
							{state?.categories?.map(cat => (
								<TableCell 
									key={cat._id}
									sx={{ 
										color: 'white', 
										fontWeight: 'bold', 
										border: `1px solid ${themeColors.border.primary}`,
										fontFamily: 'Raleway, sans-serif'
									}} 
									colSpan={cat.subCategory.length} 
									align="center"
								>
									{`${cat.categoryName} (${cat.mark})`}
								</TableCell>
							))}
							<TableCell 
								sx={{ 
									color: 'white', 
									fontWeight: 'bold', 
									border: `1px solid ${themeColors.border.primary}`,
									fontFamily: 'Raleway, sans-serif'
								}} 
								rowSpan={2}
							>
								{t('editMark.table.total')}
							</TableCell>
						</TableRow>
						<TableRow sx={{ backgroundColor: themeColors.primary }}>
							{state?.categories?.map(cat => (
								cat.subCategory?.map(sub => (
									<TableCell 
										key={sub._id}
										sx={{ 
											color: 'white', 
											fontWeight: 'bold', 
											border: `1px solid ${themeColors.border.primary}`,
											fontFamily: 'Raleway, sans-serif'
										}} 
										align="center"
									>
										{`${sub.name} (${sub.mark})`}
									</TableCell>
								))
							))}
						</TableRow>
					</TableHead>
					<TableBody>
						{markDetails?.map((row, i) => (
							<TableRow
								key={row._id}
								sx={{ 
									backgroundColor: themeColors.background.primary,
									'&:hover': {
										backgroundColor: themeColors.background.hover
									},
									'&:last-child td, &:last-child th': { border: 0 } 
								}}
							>
								<TableCell 
									sx={{ 
										border: `1px solid ${themeColors.border.primary}`,
										color: themeColors.text.primary,
										fontFamily: 'Raleway, sans-serif',
										fontWeight: 500
									}} 
									component="th" 
									scope="row"
								>
									{i + 1}
								</TableCell>
								<TableCell 
									sx={{ 
										border: `1px solid ${themeColors.border.primary}`,
										color: themeColors.text.primary,
										fontFamily: 'Raleway, sans-serif',
										fontWeight: 500
									}} 
									align="center"
								>
									{`${row?.studentId} - ${row?.studentName}`}
								</TableCell>
								{row?.categories?.map((cat, index) => (
									cat.subCategories?.map((sub, subIndex) => (
										<TableCell
											sx={{ 
												border: `1px solid ${themeColors.border.primary}`,
												color: themeColors.text.primary,
												fontFamily: 'Raleway, sans-serif'
											}}
											key={`${row?._id}-${cat?.categoryId?._id}-${sub?.subcategoryId?._id}`}
											align="center"
										>
											{row?.status === "present" ? (
												<TextField
													type="number"
													InputProps={{ 
														inputProps: { 
															inputMode: 'numeric', 
															max: 10 
														},
														sx: {
															color: themeColors.text.primary,
															'& .MuiOutlinedInput-root': {
																'& fieldset': {
																	borderColor: themeColors.border.primary,
																},
																'&:hover fieldset': {
																	borderColor: themeColors.primary,
																},
																'&.Mui-focused fieldset': {
																	borderColor: themeColors.primary,
																},
															},
														}
													}}
													size="small"
													error={sub?.error}
													key={`${row?._id}-${cat?.categoryId?._id}-${sub?.subcategoryId?._id}`}
													defaultValue={sub.studentMark}
													placeholder={t('editMark.placeholder.mark')}
													fullWidth
													onBlur={(e) => {
														let mark = parseInt(e.target.value);
														if (mark <= parseInt(sub?.mark)) {
															sub['error'] = false
															//markDetails[i].category[index].subCategory[subIndex].mark = parseInt(e.target.value)
															sub.studentMark = parseInt(e.target.value)

															row.studentMark  = row?.categories?.map(cat => cat?.subCategories?.filter(ma => parseInt(ma?.studentMark) > 0)?.map(sub => sub?.studentMark)).flat().reduce((a, b) => parseInt(a) + parseInt(b))
															setMarkDetails([...markDetails])
														}
														else {

															if (e.target.value !== '') {
																sub['error'] = true
																e.target.focus()
															}

															setMarkDetails([...markDetails])
														}
													}}
												/>
											) : (
												<Typography 
													sx={{ 
														color: themeColors.error,
														fontWeight: 'bold',
														fontFamily: 'Raleway, sans-serif'
													}}
												>
													{t('editMark.absent')}
												</Typography>
											)}
											{sub?.error && (
												<Typography 
													sx={{ 
														color: themeColors.error, 
														display: 'block', 
														fontSize: 10, 
														textAlign: 'left',
														fontFamily: 'Raleway, sans-serif'
													}}
												>
													{sub?.error}
												</Typography>
											)}
										</TableCell>
									))
								))}
								<TableCell 
									sx={{ 
										border: `1px solid ${themeColors.border.primary}`,
										color: themeColors.text.primary,
										fontFamily: 'Raleway, sans-serif',
										fontWeight: 500
									}}
									component="th" 
									scope="row"
								>
									<Box display="flex" justifyContent="space-between" alignItems="center">
										{row?.status === "present" && row?.studentMark}
										<FormControlLabel
											control={
												<Checkbox
													checked={row?.status === 'absent'}
													onChange={(e) => {
														row['status'] = e.target.checked ? 'absent' : 'present'
														setMarkDetails([...markDetails])
													}}
													sx={{
														color: themeColors.primary,
														'&.Mui-checked': {
															color: themeColors.primary,
														},
													}}
												/>
											}
											label={
												<Typography 
													sx={{ 
														color: themeColors.text.primary,
														fontFamily: 'Raleway, sans-serif'
													}}
												>
													{t('editMark.absent')}
												</Typography>
											}
										/>
									</Box>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>
			<Box display="flex" justifyContent="flex-end" alignItems="center" sx={{ my: 3 }}>
				<Button label={t('editMark.actions.save')} onClick={saveMark} backgroundColor={'red'} />
			</Box>
		</Box>
	)
}

export default EditMark