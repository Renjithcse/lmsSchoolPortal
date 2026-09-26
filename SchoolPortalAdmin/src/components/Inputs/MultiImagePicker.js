import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Typography, Avatar, IconButton, Grid, Popover } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import { useController } from 'react-hook-form';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const MultiImagePicker = ({ fieldName, control, defaultValue = [], fieldLabel, onChangeFiles, accept, supportedFiles }) => {
  const { t } = useTranslation();
  const { themeColors } = useTheme();
  const { field: { value, onChange }, fieldState: { error } } = useController({
    name: fieldName,
    control,
    defaultValue,
  });

  const images = useMemo(() => Array.isArray(value) ? value : [], [value]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [localError, setLocalError] = useState(null);

  const allowedImageTypes = supportedFiles ? supportedFiles : ["image/jpeg", "image/png", "image/jpg"];

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    const invalid = files.find((f) => !allowedImageTypes.includes(f.type));
    if (invalid) {
      setLocalError(t('multiImagePicker.errors.onlyImageFilesAllowed'));
      return;
    }
    setLocalError(null);
    const toBase64 = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const base64List = await Promise.all(files.map(toBase64));
    const next = [...images, ...base64List];
    onChange(next);
    if (onChangeFiles) onChangeFiles(files);
  };

  const removeAt = (idx) => {
    const next = images.filter((_, i) => i !== idx);
    onChange(next);
  };

  const openPreview = (event, src) => {
    setPreviewSrc(src);
    setAnchorEl(event.currentTarget);
  };

  const closePreview = () => {
    setAnchorEl(null);
    setPreviewSrc(null);
  };

  return (
    <Box>
      {fieldLabel && (
        <Typography fontFamily={'Raleway, sans-serif'} fontWeight={'700'} sx={{ color: themeColors.text.primary, mb: 1 }}>
          {fieldLabel}
        </Typography>
      )}
      <input
        id={`${fieldName}-multi`}
        type="file"
        accept={accept ? accept : 'image/*'}
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Box sx={{
        border: `1px solid ${themeColors.border.primary}`,
        p: 1.5,
        borderRadius: 2,
        backgroundColor: themeColors.background.primary,
      }}>
        <Button
          variant="contained"
          component="label"
          htmlFor={`${fieldName}-multi`}
          startIcon={<CloudUploadIcon />}
          sx={{ background: themeColors.primary, color: themeColors.text.inverse, '&:hover': { background: themeColors.accent } }}
        >
          {t('multiImagePicker.uploadImages')}
        </Button>
        <Grid container spacing={1.5} sx={{ mt: 1 }}>
          {images.map((src, idx) => (
            <Grid item key={`${src}-${idx}`}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  variant="rounded"
                  src={src}
                  sx={{ width: 70, height: 50, border: `1px solid ${themeColors.border.primary}`, backgroundColor: themeColors.background.secondary }}
                />
                <IconButton size="small" onClick={() => removeAt(idx)} sx={{ position: 'absolute', top: -10, right: -10, bgcolor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                  <HighlightOffIcon sx={{ color: themeColors.error }} />
                </IconButton>
                <IconButton size="small" onClick={(e) => openPreview(e, src)} sx={{ position: 'absolute', bottom: -10, right: -10, bgcolor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                  <ZoomInIcon sx={{ color: themeColors.text.primary }} />
                </IconButton>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
      {(localError || error) && (
        <Typography sx={{ color: themeColors.error, fontSize: 12, mt: 0.5, pl: 1 }}>
          {localError || error?.message}
        </Typography>
      )}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={closePreview}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, borderRadius: 2 } }}
      >
        <Box sx={{ p: 2 }}>
          {previewSrc && (
            <img alt={t('multiImagePicker.preview')} src={previewSrc} style={{ maxWidth: 400, maxHeight: 400, borderRadius: 8 }} />
          )}
        </Box>
      </Popover>
    </Box>
  );
};

export default MultiImagePicker;


