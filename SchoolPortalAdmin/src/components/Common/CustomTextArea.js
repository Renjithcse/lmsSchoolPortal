import React, { useState } from "react";
import { Controller } from "react-hook-form";
import { FormGroup, Typography, Stack, Button, Box } from "@mui/material";
import { TextareaAutosize } from '@mui/base';
import { useTheme } from '../../contexts/ThemeContext';
const CustomTextArea = ({
	fieldName,
	control,
	fieldLabel,
	placeholder,
	error,
	type,
	maxrow,
	rows,
	height,
	multiline,
	background,
	boxshadow,
	readOnly,
	buttonEnable,
	onClick,
	buttonText,
	changeValue,
	defaultValue,
	view
}) => {
	const { themeColors } = useTheme();
	const [show, setShow] = useState(false)

	return (
		<>
			<FormGroup>
				<Stack direction={'row'} justifyContent={'space-between'} alignItems={'center'}>
					<Typography 
						fontFamily={'Raleway, sans-serif'} 
						fontWeight={'700'} 
						px={'3px'} 
						mb={'2px'}
						sx={{
							fontSize: {
								lg: 16,
								md: 14,
								sm: 12,
								xs: 11,
							},
							color: themeColors.text.primary
						}}
					>
						{fieldLabel}
					</Typography>
					{/* {buttonEnable && <CustomButton onClick={onClick} label={buttonText ? buttonText : "Open"} />} */}

				</Stack>

				<Controller
					name={fieldName}
					control={control}
					render={({ field: { value, onChange, onBlur } }) => (
						<TextareaAutosize
							style={{ 
								borderRadius: "8px", 
								minHeight: 33, 
								color: themeColors.text.primary, 
								margin: '3px',
								borderRadius: '5px',
								opacity: "1",
								border: `0.4px solid ${themeColors.primary}`,
								padding: 12,
								backgroundColor: themeColors.background.primary,
								fontFamily: 'Raleway, sans-serif',
								fontSize: '14px',
								'&:focus': {
									outline: 'none',
									borderColor: themeColors.primary,
									boxShadow: `0 0 0 2px ${themeColors.primary}20`
								}
							}}
							minRows={rows}
							readOnly={readOnly || false}
							value={value || ''}
							onChange={(e) => {
								onChange(e);
								if (changeValue) {
									changeValue(e.target.value);
								}
							}}
							onBlur={onBlur}
							aria-invalid={error ? "true" : "false"}
							className="form-control"
							placeholder={placeholder}
							id="exampleInputEmail1"
							type={type ? show ? 'text' : type : "text"}
							maxLength={maxrow}
							maxRows={maxrow}
							multiline={multiline}
						/>
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
	);
};

export default CustomTextArea;