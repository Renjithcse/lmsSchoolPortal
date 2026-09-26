import { FormGroup, Typography } from "@mui/material";
import { Autocomplete, Box, Chip, Grid, TextField } from '@mui/material'
import React from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { useTranslation } from 'react-i18next';

const CustomChip = ({ chips, setChips, Not, fieldLabel }) => {
  const { t } = useTranslation();
  const { themeColors } = useTheme()

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const value = event.target.value.trim();
      if (value && !chips.includes(value)) {
        setChips([...chips, value]);
        event.target.value = '';
      }
    }
  };

  const handleDelete = (chipToDelete) => () => {
    setChips(chips.filter(chip => chip !== chipToDelete));
  };

  return (
    <Box>
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
        >{fieldLabel}

        </Typography>}

        <Autocomplete
          multiple
          freeSolo
          options={[]}
          value={chips}
          onChange={(event, newValue) => setChips(newValue)}
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: themeColors.background.primary,
              borderRadius: 1,
              '& fieldset': { borderColor: themeColors.border.primary },
              '&:hover fieldset': { borderColor: themeColors.primary },
              '&.Mui-focused fieldset': { borderColor: themeColors.primary, boxShadow: `0 0 0 2px ${themeColors.primary}20` }
            },
            '& .MuiAutocomplete-tag': { m: 0.5 },
            '& .MuiChip-root': {
              backgroundColor: `${themeColors.primary}22`,
              color: themeColors.text.primary,
              borderColor: themeColors.primary
            },
            '& .MuiChip-deleteIcon': { color: themeColors.primary }
          }}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                variant="filled"
                label={option}
                {...getTagProps({ index })}
                onDelete={handleDelete(option)}
                sx={{
                  backgroundColor: `${themeColors.primary}22`,
                  borderColor: themeColors.primary,
                  color: themeColors.text.primary,
                  '&:hover': {
                    backgroundColor: themeColors.background.secondary
                  },
                  '& .MuiChip-deleteIcon': { color: themeColors.primary }
                }}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              label={t('customChip.placeholder')}
              onKeyDown={handleKeyDown}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: themeColors.background.primary,
                  '& fieldset': { borderColor: themeColors.border.primary },
                  '&:hover fieldset': { borderColor: themeColors.primary },
                  '&.Mui-focused fieldset': { borderColor: themeColors.primary, boxShadow: `0 0 0 2px ${themeColors.primary}20` }
                },
                '& .MuiInputLabel-root': {
                  color: themeColors.text.secondary
                },
                '& .MuiInputBase-input': {
                  color: themeColors.text.primary
                }
              }}
            />
          )}
        />
        {chips.length === 0 && (
          <Typography
            role="alert"
            sx={{
              color: themeColors.error,
              display: 'flex',
              flexDirection: 'start',
              pl: 1,
              fontSize: 12,
              mt: 0.5
            }}
          >
            {t('customChip.validation.required')}
          </Typography>
        )}
      </FormGroup>
    </Box>
  )
}

export default CustomChip