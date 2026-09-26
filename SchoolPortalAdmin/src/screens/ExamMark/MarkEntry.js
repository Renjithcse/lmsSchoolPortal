import { useState } from "react";
import { Box, Input, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, Checkbox, FormControlLabel } from "@mui/material";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import Button from "../../components/Inputs/Button";
import { useSaveStudentMarkMutation } from "../../Redux/features/MarkEntry";
import { useSnackbar } from "../../hooks/SnackBar";
import { useTranslation } from 'react-i18next';

const MarkEntry = () => {

	const [markDetails, setMarkDetails] = useState([])
	const location = useLocation();
	const state = location.state;
	const showSnackbar = useSnackbar()
	const { themeColors } = useThemeContext();
	const { t } = useTranslation();

	const [triggerSaveMark, { isLoading }] = useSaveStudentMarkMutation()

	useEffect(() => {
		if(state?.categories?.length > 0 && state?.students?.length > 0){
			let studentscategory = state?.students?.map(stud => {
				return {
					...stud,
					category: structuredClone(state?.categories)
				}
			})
	
			setMarkDetails(studentscategory)
		}
	}, [state])

	//console.log({state})

	const saveMark = async() => {

		let error = false;

		//let error = false;
		// Save Marks
		let students = markDetails?.map(mark => {
			let totalMarks = 0;
			let marks = 0;
			let Category = mark?.category?.map(cat => {
				let catMark = 0;
				let subs = cat.subCategory?.map(sub => {
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
						mark: sub?.mark,
						studentMark: mark?.status === "absent" ? null : sub?.studentMark
					}
				})

				totalMarks += cat?.mark;

				return {
					categoryId:  cat?._id,
					mark: cat?.mark,
					subCategories: subs,
					studentMark: mark?.status === "absent" ? null : catMark
				}
			})

			return {
				studentId: mark?.studentId?._id,
				academicYear: state?.academicYear,
				term: state?.term,
				grade: state?.grade,
				subject: state?.subject,
				examName: state?.examName,
				categoryMark: Category,
				mark: totalMarks,
				studentMark: mark?.status === "absent" ? null : marks,
				status: 'present'
			}
		})

		if(error){
            showSnackbar(t('markEntry.messages.clearErrors'), "error")
            return false;
        }
        else{
			let saved = await triggerSaveMark({marks: students})

			if(saved?.error){
				showSnackbar(saved?.error?.data?.message, "error")
			}
			else{
				showSnackbar(t('markEntry.messages.saveSuccess'), "success")
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
								{t('markEntry.table.sno')}
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
								{t('markEntry.table.studentDetails')}
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
								{t('markEntry.table.total')}
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
									{`${row.studentId?.studentID} - ${row.studentId?.studentName}`}
								</TableCell>
								{row?.category?.map((cat, index) => (
									cat.subCategory?.map((sub, subIndex) => (
										<TableCell
											sx={{ 
												border: `1px solid ${themeColors.border.primary}`,
												color: themeColors.text.primary,
												fontFamily: 'Raleway, sans-serif'
											}}
											key={`${row?.studentId?._id}-${cat?._id}-${sub?._id}`}
											align="center"
										>
											{row?.status === "absent" ? (
												<Typography 
													sx={{ 
														color: themeColors.error,
														fontWeight: 'bold',
														fontFamily: 'Raleway, sans-serif'
													}}
												>
													{t('markEntry.absent')}
												</Typography>
											) : (
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
													key={`${row?.studentId?._id}-${cat?._id}-${sub?._id}`}
													//value={sub.mark}
													placeholder={t('markEntry.placeholder.mark')}
													fullWidth
													onBlur={(e) => {
														let mark = parseInt(e.target.value);
														console.log({mark, sub: parseInt(sub.mark)})
														if (mark <= parseInt(sub.mark)) {
															sub['error'] = false
															//markDetails[i].category[index].subCategory[subIndex].mark = parseInt(e.target.value)
															sub.studentMark = parseInt(e.target.value)

															row.mark = row?.category?.map(cat => cat.subCategory?.filter(ma => parseInt(ma.studentMark) > 0)?.map(sub => sub.studentMark)).flat().reduce((a, b) => parseInt(a) + parseInt(b))

															console.log({ markDetails })
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
										{row?.status === "present" && row?.mark}
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
													{t('markEntry.absent')}
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
				<Button label={t('markEntry.actions.save')} onClick={saveMark} backgroundColor={'red'} />
			</Box>
		</Box>
	)
}

export default MarkEntry