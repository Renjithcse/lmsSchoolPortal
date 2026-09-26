import React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Controller } from "react-hook-form";
import { Avatar, Box, FormGroup, styled, Typography } from "@mui/material";
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useTheme } from '../../contexts/ThemeContext';

dayjs.extend(customParseFormat);

const CustomDateTimePicker = ({
	fieldName,
	control,
	fieldLabel,
	error,
	placeholder,
	minDateTime,
	maxDateTime,
	disabled
}) => {
	const { themeColors } = useTheme();

	return (
		<>
			<FormGroup>
				{fieldLabel && (
					<Typography fontFamily={'Raleway, sans-serif'} fontWeight={'700'} px={'3px'} mb={'2px'}
						sx={{
							fontSize: {
								lg: 14,
								md: 14,
								sm: 13,
								xs: 12,
							},
							color: themeColors.text.primary
						}}
					>
						{fieldLabel}

					</Typography>
				)}

				<Controller
					name={fieldName}
					control={control}
					render={({ field: { value, onChange } }) => (
						<LocalizationProvider dateAdapter={AdapterDayjs}>
							<DateTimePicker
								label=""
								slotProps={{
									actionBar: {
										actions: ['clear']
									},
									textField: {
										fullWidth: true,
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
												padding: '8px 12px',
												letterSpacing: '1px',
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
											'& .MuiSvgIcon-root': {
												color: themeColors.text.secondary
											}
										}
									}
								}}
								value={value}
								onChange={(newValue) => {
									onChange(newValue);
								}}
								disabled={disabled}
								minDateTime={minDateTime}
								maxDateTime={maxDateTime}
								format="DD/MM/YYYY HH:mm"
								ampm={false}
								slotPropsLabel={{ placeholder }}
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

export default CustomDateTimePicker;
