import React, { useState, useMemo } from "react";
import { Box, FormGroup, Typography, MenuItem, TextField, Chip } from "@mui/material";
import { Controller } from "react-hook-form";
import Autocomplete from '@mui/material/Autocomplete';
import KeyboardArrowDownSharpIcon from '@mui/icons-material/KeyboardArrowDownSharp';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';


const CustomMultiSelect = ({
	fieldName,
	control,
	fieldLabel,
	error,
	children,
	onChangeValue,
	size,
	value,
	view,
	disabled
}) => {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const { themeColors } = useTheme();

    // Helper function to extract text content from React elements
    const extractTextFromElement = (element) => {
        if (!element) return '';
        if (typeof element === 'string' || typeof element === 'number') {
            return String(element);
        }
        if (Array.isArray(element)) {
            return element.map(extractTextFromElement).join('');
        }
        if (React.isValidElement(element)) {
            if (element.props && element.props.children) {
                return extractTextFromElement(element.props.children);
            }
            return '';
        }
        return String(element);
    };

    // Convert children to options array for Autocomplete
    const options = useMemo(() => {
        return React.Children.toArray(children)
            .filter(child => child.props && child.props.value !== undefined)
            .map(child => {
                const labelText = child.props.children 
                    ? extractTextFromElement(child.props.children)
                    : (child.props.value ? String(child.props.value) : '');
                
                return {
                    value: child.props.value,
                    label: labelText || String(child.props.value || '')
                };
            });
    }, [children]);

    // Function to get option label - always returns a string
    const getOptionLabel = (option) => {
        if (!option) return '';
        if (typeof option === 'string') return option;
        if (typeof option === 'number') return String(option);
        if (typeof option === 'object' && option !== null) {
            // If it's an option object with a label property
            if (option.label && (typeof option.label === 'string' || typeof option.label === 'number')) {
                return String(option.label);
            }
            // Try to get label from value object
            if (option.value) {
                const value = option.value;
                if (typeof value === 'string' || typeof value === 'number') {
                    return String(value);
                }
                if (typeof value === 'object' && value !== null) {
                    if (value.academicYear) return String(value.academicYear);
                    if (value.gradeName) return String(value.gradeName);
                    if (value.subjectName) return String(value.subjectName);
                    if (value.name) return String(value.name);
                }
            }
            // Direct object properties
            if (option.academicYear) return String(option.academicYear);
            if (option.gradeName) return String(option.gradeName);
            if (option.subjectName) return String(option.subjectName);
            if (option.name) return String(option.name);
        }
        return String(option);
    };

    // Function to check if two options are equal
    const isOptionEqualToValue = (option, value) => {
        if (!option && !value) return true;
        if (!option || !value) return false;
        
        // Both are option objects
        if (option.value !== undefined && value.value !== undefined) {
            // Direct comparison
            if (option.value === value.value) return true;
            
            // Object comparison by _id
            if (typeof option.value === 'object' && option.value !== null && 
                typeof value.value === 'object' && value.value !== null) {
                return option.value._id === value.value._id;
            }
            
            // String comparison with object _id
            if (typeof option.value === 'string' && 
                typeof value.value === 'object' && value.value !== null) {
                return option.value === value.value._id;
            }
            
            // Object _id comparison with string
            if (typeof option.value === 'object' && option.value !== null && 
                typeof value.value === 'string') {
                return option.value._id === value.value;
            }
        }
        
        // Direct option comparison
        if (option === value) return true;
        
        return false;
    };

    // Find selected options from current values array
    const getSelectedOptions = (currentValues) => {
        if (!currentValues || !Array.isArray(currentValues) || currentValues.length === 0) {
            return [];
        }
        
        return currentValues
            .map(currentValue => {
                return options.find(option => {
                    // Direct comparison
                    if (option.value === currentValue) return true;
                    
                    // Object comparison by _id
                    if (typeof currentValue === 'object' && currentValue !== null && 
                        typeof option.value === 'object' && option.value !== null) {
                        return option.value._id === currentValue._id;
                    }
                    
                    // String comparison with object _id
                    if (typeof currentValue === 'string' && 
                        typeof option.value === 'object' && option.value !== null) {
                        return option.value._id === currentValue;
                    }
                    
                    // Object _id comparison with string
                    if (typeof currentValue === 'object' && currentValue !== null && 
                        typeof option.value === 'string') {
                        return currentValue._id === option.value;
                    }
                    
                    return false;
                });
            })
            .filter(option => option !== undefined);
    };

    // Custom filter function for better search
    const filterOptions = (options, { inputValue }) => {
        if (!inputValue) return options;
        
        const searchTerm = inputValue.toLowerCase().trim();
        
        return options.filter(option => {
            // Use stored label if available, otherwise extract from value
            const label = (option.label || getOptionLabel(option.value || option)).toLowerCase();
            return label.includes(searchTerm);
        });
    };

	return (
		<FormGroup>
			<Typography sx={{
				paddingLeft: '5px',
				fontSize: {
					lg: size,
					md: 14,
					sm: 13,
					xs: 12,
				},
				fontFamily: 'Raleway, sans-serif',
                fontWeight: "bold",
                color: themeColors.text.primary
			}}>{`${fieldLabel}`}

			</Typography>
			<Controller
				name={fieldName}
				control={control}
				render={({ field: { onBlur, onChange, value } }) => {
					const selectedOptions = getSelectedOptions(value || []);
					
					return (
						<Autocomplete
							multiple
							open={open}
							onOpen={() => setOpen(true)}
							onClose={() => {
								setOpen(false);
								onBlur();
							}}
							disabled={view || disabled}
							readOnly={view}
							options={options}
							value={selectedOptions}
							getOptionLabel={(option) => {
								if (!option) return '';
								if (typeof option === 'string') return option;
								// Use the stored label if available (from options array)
								if (option.label && typeof option.label === 'string') {
									return option.label;
								}
								// Otherwise, try to extract label from value
								return getOptionLabel(option.value || option);
							}}
							isOptionEqualToValue={isOptionEqualToValue}
							filterOptions={filterOptions}
							onChange={(event, newValue) => {
								// Extract values from option objects
								const selectedValues = newValue.map(option => option.value);
								onChange(selectedValues);
								
								if (onChangeValue) {
									try {
										onChangeValue(selectedValues);
									} catch (error) {
										console.error('Error in CustomMultiSelect onChange:', error);
										onChangeValue(selectedValues);
									}
								}
							}}
							onBlur={onBlur}
							renderInput={(params) => (
								<TextField
									{...params}
									placeholder={!selectedOptions || selectedOptions.length === 0 ? t('customMultiSelect.select') : ''}
									sx={{
										'& .MuiOutlinedInput-root': {
											background: themeColors.background.primary,
											border: `1.5px solid ${themeColors.border.primary}`,
											borderRadius: '8px',
											minHeight: '45px',
											color: themeColors.text.primary,
											transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
											fontFamily: 'Raleway, sans-serif',
											fontWeight: '500',
											width: '100%',
											whiteSpace: 'normal',
											overflowWrap: 'break-word',
											'&:hover': {
												borderColor: themeColors.primary
											},
											'&.Mui-focused': {
												borderColor: themeColors.primary,
												boxShadow: `0 0 0 2px ${themeColors.primary}20`
											},
											'&.Mui-disabled': {
												backgroundColor: themeColors.background.tertiary,
												color: themeColors.text.disabled
											},
											'& fieldset': {
												border: 'none'
											}
										},
										'& .MuiInputBase-input': {
											color: themeColors.text.primary,
											fontFamily: 'Raleway, sans-serif',
											fontWeight: '500',
											fontSize: '14px',
											padding: '8px 12px !important'
										},
										'& .MuiAutocomplete-endAdornment': {
											right: '8px'
										}
									}}
								/>
							)}
							renderTags={(tagValue, getTagProps) => {
								return tagValue.map((option, index) => {
									const { key, ...tagProps } = getTagProps({ index });
									return (
										<Chip
											key={key}
											{...tagProps}
											label={option.label || getOptionLabel(option.value || option)}
											sx={{
												backgroundColor: themeColors.primary,
												color: themeColors.text.inverse,
												fontFamily: 'Raleway, sans-serif',
												fontWeight: '500',
												'& .MuiChip-deleteIcon': {
													color: themeColors.text.inverse,
													'&:hover': {
														color: themeColors.text.inverse,
														opacity: 0.8
													}
												}
											}}
										/>
									);
								});
							}}
							renderOption={(props, option) => (
								<Box
									component="li"
									{...props}
									sx={{
										color: themeColors.text.primary,
										fontFamily: 'Raleway, sans-serif',
										fontWeight: '500',
										'&.Mui-selected, &.Mui-selected.Mui-focusVisible': {
											backgroundColor: themeColors.primary,
											color: themeColors.text.inverse,
										},
										'&.Mui-selected:hover': {
											backgroundColor: themeColors.primary,
											opacity: 0.9
										},
										'&:hover': {
											backgroundColor: themeColors.background.secondary,
										}
									}}
								>
									{option.label || getOptionLabel(option.value || option)}
								</Box>
							)}
							ListboxProps={{
								sx: {
									backgroundColor: themeColors.background.primary,
									color: themeColors.text.primary,
									border: `1px solid ${themeColors.border.primary}`,
									zIndex: 1400,
									'& .MuiAutocomplete-option': {
										color: themeColors.text.primary,
									}
								}
							}}
							popupIcon={
								<Box
									sx={{
										cursor: 'default',
										pointerEvents: 'none',
										width: 24,
										height: 24,
										display: 'flex',
										justifyContent: 'center',
										alignItems: 'center',
										bgcolor: themeColors.primary,
										color: themeColors.text.inverse,
										borderRadius: '12px'
									}}
								>
									<KeyboardArrowDownSharpIcon style={{ fontSize: 20, fontWeight: 'bold' }} />
								</Box>
							}
							sx={{
								'& .MuiAutocomplete-inputRoot': {
									borderRadius: "8px",
									minHeight: 45,
								}
							}}
							disableClearable={false}
							clearOnBlur={false}
							selectOnFocus
							handleHomeEndKeys
						/>
					);
				}}
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
	);
};

export default CustomMultiSelect;
