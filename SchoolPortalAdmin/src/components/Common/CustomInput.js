import React from 'react'
import { Controller } from "react-hook-form";
import { FormGroup, Typography } from "@mui/material";
import TextField from "@mui/material/TextField";
import { useTheme } from '../../contexts/ThemeContext'

const CustomInput = ({
	name,
	fieldName,
	control,
	fieldLabel,
	label,
	placeholder,
	error,
	view,
	changeValue,
	disabled,
	defaultValue,
	type,
	readonly,
	w,
	Not,
	paddingRight,
	cust_value,
	max,
	multiline,
	rows,
	inputProps
}) => {
	const { themeColors } = useTheme()

	// Safety check for themeColors
	if (!themeColors) {
		return null; // or a loading spinner
	}

	return (
		<>
			<FormGroup>
				{!Not && <Typography fontFamily={'Raleway, sans-serif'} fontWeight={'700'} px={'3px'} mb={'2px'}
					sx={{
						fontSize: {
							lg: 16,
							md: 14,
							sm: 12,
							xs: 11,
						},
						color: themeColors.text.primary
					}}
				>{label || fieldLabel}

				</Typography>}
				<Controller
					name={name || fieldName}
					control={control}
					render={({ field: { value, onChange, onBlur } }) => (
						<TextField
							type={type}
							defaultValue={defaultValue}
							value={cust_value ? cust_value : value}
							multiline={multiline}
							rows={rows}
							onChange={(e) => {
								if (type === "number" && max) {
									if (e?.target?.value <= max) {
										onChange(e)
										if (changeValue) {
											changeValue(e.target.value)
										}
									}
									else {
										return false
									}
								}
								onChange(e)
								if (changeValue) {
									changeValue(e.target.value)
								}
							}}
							inputProps={{ max: max, ...inputProps }}
							onBlur={onBlur}
							aria-invalid={error ? "true" : "false"}
							className="form-control"
							placeholder={placeholder}
							id="exampleInputEmail1"
							InputProps={{
								disableUnderline: true,
								readOnly: readonly,
								sx: {
									width: w ? w : '100%',
									borderRadius: "5px",
									opacity: "1",
									background: view ? themeColors.background.tertiary : themeColors.background.primary,
									height: "40px",
									fontFamily: "Raleway, sans-serif",
									letterSpacing: "1px",
									fontWeight: '700px',
									border: `1px solid ${themeColors.border.primary}`,
									paddingRight: paddingRight,
									color: themeColors.text.primary,
									'&:focus': {
										borderColor: themeColors.primary,
										boxShadow: `0 0 0 2px ${themeColors.primary}20`
									}
								},
							}}
							sx={{
								"& input[type=number]": {
									MozAppearance: "textfield", // Firefox
								},
								"& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button": {
									WebkitAppearance: "none", // Chrome, Safari, Edge
								},
							}}
						/>
					)}
				/>
				{error && (
					<p
						role="alert"
						style={{
							color: themeColors.error,
							display: "flex",
							flexDirection: "start",
							paddingLeft: "10px",
							fontSize: "12px",
						}}
					>
						{error?.message || 'An error occurred'}
					</p>
				)}
			</FormGroup>
		</>
	)
}

export default CustomInput