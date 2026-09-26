import React, { useState } from 'react'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Controller } from "react-hook-form";
import { Avatar, Box, FormGroup, styled, Typography } from "@mui/material";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useTheme } from '../../contexts/ThemeContext';

dayjs.extend(customParseFormat);



const CustomDatePicker = ({
	fieldName,
	control,
	fieldLabel,
	error,
	values,
	disabled,
	changeValue,
	placeholder,
	Not,
	minDate,
	maxDate
}) => {
	const tomorrow = dayjs().add(1, 'day');
	const { themeColors } = useTheme();

	// Function to parse pasted date text
	const parsePastedDate = (text) => {
		if (!text) return null;
		
		// Remove whitespace and common separators
		const cleanedText = text.trim().replace(/\s+/g, '');
		
		// Try various date formats
		const dateFormats = [
			'DD/MM/YYYY',
			'DD-MM-YYYY',
			'DD.MM.YYYY',
			'YYYY-MM-DD',
			'YYYY/MM/DD',
			'YYYY.MM.DD',
			'DD/MM/YY',
			'DD-MM-YY',
			'DD.MM.YY',
			'MM/DD/YYYY',
			'MM-DD-YYYY',
			'MM.DD.YYYY',
		];

		for (const format of dateFormats) {
			const parsed = dayjs(cleanedText, format, true);
			if (parsed.isValid()) {
				return parsed;
			}
		}

		// Try ISO format
		const isoParsed = dayjs(cleanedText);
		if (isoParsed.isValid()) {
			return isoParsed;
		}

		return null;
	};

	return (
		<>
			<FormGroup>
				{!Not && <Typography fontFamily={'Raleway, sans-serif'} fontWeight={'700'} px={'3px'} mb={'2px'}
					sx={{
						fontSize: {
							lg: 14,
							md: 14,
							sm: 13,
							xs: 12,
						},
						color: themeColors.text.primary
					}}
				>{fieldLabel}

				</Typography>}

				<Controller
					name={fieldName}
					control={control}
					render={({ field: { value, onChange, onBlur } }) => (
						<LocalizationProvider dateAdapter={AdapterDayjs}>
							<DatePicker
								// disablePast
								label={Not ? placeholder : ""}
								slotProps={{
									actionBar: {
										actions: ['clear']
									},
									textField: {
										fullWidth: true,
										onPaste: (e) => {
											const pastedText = e.clipboardData.getData('text');
											const parsedDate = parsePastedDate(pastedText);
											
											if (parsedDate && parsedDate.isValid()) {
												e.preventDefault();
												// Check min/max date constraints
												let validDate = parsedDate;
												if (minDate && validDate.isBefore(minDate)) {
													validDate = minDate;
												}
												if (maxDate && validDate.isAfter(maxDate)) {
													validDate = maxDate;
												}
												
												onChange(validDate);
												if (changeValue) {
													changeValue(validDate);
												}
											}
											// If not a valid date, let default paste behavior happen
										},
										sx: {
											margin: '3px',
											borderRadius: '5px',
											opacity: "1",
											border: `0.4px solid ${themeColors.primary}`,
											'& .MuiInputBase-root': {
												backgroundColor: themeColors.background.primary,
												color: themeColors.text.primary,
												borderRadius: '5px',
												height: '38px',
												fontFamily: 'Raleway, sans-serif',
												fontWeight: '700',
												letterSpacing: '1px',
												opacity: '1',
												border: `1px solid ${themeColors.border.primary}`,
												'&:hover': {
													borderColor: themeColors.primary
												},
												'&.Mui-focused': {
													borderColor: themeColors.primary,
													boxShadow: `0 0 0 2px ${themeColors.primary}20`
												}
											},
											'& .MuiOutlinedInput-notchedOutline': {
												border: 'none'
											},
											'&:hover .MuiOutlinedInput-notchedOutline': {
												border: 'none'
											},
											'& .MuiInputBase-input': {
												height: 'auto',
												padding: '8px 12px',
												fontFamily: 'Raleway, sans-serif',
												fontWeight: '700',
												fontSize: '14px',
												letterSpacing: '1px',
												color: themeColors.text.primary
											},
											'& .MuiSvgIcon-root': {
												color: themeColors.text.secondary
											},
											'& .Mui-disabled': {
												backgroundColor: themeColors.background.tertiary,
												color: themeColors.text.disabled
											}
										}
									}
								}}
								format='DD/MM/YYYY'
								disabled={disabled}
								minDate={minDate}
								maxDate={maxDate}

								value={value}
								onChange={(newValue) => {
									onChange(newValue);
									if (changeValue) {
										changeValue(newValue);
									}
								}}
							/>


						</LocalizationProvider>
					)}
				/>
				{error && (
					<Typography
						role="alert"
						sx={{
							color: themeColors.error,
							display: "flex",
							flexDirection: "start",
							paddingLeft: "10px",
							fontSize: "12px",
							mt: 0.5
						}}
					>
						{error?.message}
					</Typography>
				)}
			</FormGroup>


		</>

	)
}

export default CustomDatePicker