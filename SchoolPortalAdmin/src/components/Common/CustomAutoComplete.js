import React, { useEffect, useState } from "react";
import { Box, FormGroup, Typography, TextField, Autocomplete } from "@mui/material";
import { Controller } from "react-hook-form";
import { useTheme as useThemeContext } from "../../contexts/ThemeContext";

const CustomAutocomplete = ({
	fieldName,
	control,
	fieldLabel,
	error,
	options,
	onChangeValue,
	label,
	placeholder,
	labelField,
	valueField,
	defaultValue
}) => {
    const [inputValue, setInputValue] = useState('');
    const { themeColors } = useThemeContext();


	// console.log({labelField})

	return (
		<FormGroup>
            <Typography
                sx={{
                    paddingLeft: '5px',
                    fontSize: { lg: 16, md: 14, sm: 13, xs: 12 },
                    fontFamily: 'Raleway, sans-serif',
                    fontWeight: 700,
                    color: themeColors.text.primary
                }}
            >
				{fieldLabel}
			</Typography>
			<Controller
				name={fieldName}
				control={control}

				render={({ field: { onBlur, onChange, value } }) => (
                    <Autocomplete
						defaultValue={defaultValue}
						style={{
							borderRadius: "5px",
							height: 40, // Set the height here
						}}
                        options={options || []}
                        getOptionLabel={(option) => (option && labelField && option[labelField]) ? option[labelField] : ''}
						onInputChange={(event, newInputValue) => {
							setInputValue(newInputValue);
						}}
						onBlur={onBlur}
                        onChange={(e, newValue) => onChange(newValue)}
						value={value}
						disableClearable
                        componentsProps={{
                            paper: {
                                sx: {
                                    backgroundColor: themeColors.background.primary,
                                    color: themeColors.text.primary,
                                    border: `1px solid ${themeColors.border.primary}`,
                                }
                            },
                            popper: {
                                sx: { zIndex: 1400 }
                            },
                        }}
						renderInput={(params) => (
							<TextField
								placeholder={placeholder}
								{...params}
								label={label}
								variant="outlined"
								sx={{
                                    backgroundColor: themeColors.background.primary,
                                    height: 40,
                                    '& .MuiOutlinedInput-root': {
                                        height: '100%',
                                        color: themeColors.text.primary,
                                        '& fieldset': {
                                            borderColor: themeColors.border.primary
                                        },
                                        '&:hover fieldset': {
                                            borderColor: themeColors.primary
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: themeColors.primary
                                        }
                                    },
                                    '& .MuiInputLabel-root': {
                                        color: themeColors.text.secondary
                                    }
								}}
								InputProps={{
									...params.InputProps,
									endAdornment: null, // Remove default end adornment
								}}
							/>
						)}
						renderOption={(props, option) => (
							<li {...props}>
                                {(option && labelField && option[labelField]) ? option[labelField] : ''}
							</li>
						)}
						inputValue={inputValue}
						ListboxProps={{
							style: {
                                maxHeight: 200,
                                backgroundColor: themeColors.background.primary,
                                color: themeColors.text.primary,
							}
						}}
					/>
				)}
			/>
			{error && (
				<p role="alert" style={{
                    color: themeColors.error,
					display: "flex",
					flexDirection: "start",
					paddingLeft: "10px",
					fontSize: "12px",
				}}>
					{error?.message}
				</p>
			)}
		</FormGroup>
	);
};

export default CustomAutocomplete;
