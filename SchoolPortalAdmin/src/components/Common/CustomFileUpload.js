import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Input from '@mui/material/Input';
import { Avatar, Box, Popover, TextField, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import { COLORS } from '../../assets/colors';
import { Controller } from "react-hook-form";
import { useTranslation } from 'react-i18next';

const CustonImageUpload = ({ imageFile, onChangeImage, previewUrl, Not, fieldName,
  control, error,
  fieldLabel, }) => {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);

  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);


  return (
    <Box>

      { !Not && <Typography fontFamily={ 'Raleway, sans-serif' } fontWeight={ '700' } px={ '3px' } mb={ '2px' }
        sx={ {
          fontSize: {
            lg: 16,
            md: 14,
            sm: 12,
            xs: 11,
          },

        } }
      >{ fieldLabel }

      </Typography> }
      <Box sx={ { border: '1px solid rgb(196 196 196)', width: '98%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: .5, borderRadius: 1 } }>
        <Controller
          name={ fieldName }
          control={ control }
          render={ ({ field: { value, onChange, onBlur } }) => (
            <TextField
              sx={ { display: 'none' } }
              accept="image/*"
              id="contained-button-file"
              multiple
              type="file"
              onChange={ onChangeImage }
            />
          ) }
        />
        <label htmlFor="contained-button-file">
          <Button variant="contained" component="span" startIcon={ <CloudUploadIcon /> } sx={ { background: COLORS.secondary, '&:hover': { background: COLORS.secondary }, height: 30 } }>
            {t('customFileUpload.upload')}
          </Button>
        </label>

        { imageFile && (
          <Box onMouseEnter={ handlePopoverOpen } onMouseLeave={ handlePopoverClose }>
            <Avatar variant='square' sx={ { width: 45, height: 30, objectFit: 'fill', cursor: 'pointer' } } src={ previewUrl } alt={t('customFileUpload.preview')} />
            <Popover
              onMouseLeave={ false }
              open={ open }
              anchorEl={ anchorEl }
              anchorOrigin={ {
                vertical: 'center',
                horizontal: 'center',
              } }
              transformOrigin={ {
                vertical: 'center',
                horizontal: 'center',
              } }
            >
              <Box p={ 2 }>
                <Avatar variant="square" sx={ { width: 200, height: 200 } } src={ previewUrl } alt={t('customFileUpload.preview')} />
                <Button

                  onClick={ handlePopoverClose }
                  startIcon={ <HighlightOffIcon /> }
                  sx={ { marginTop: 2, color: COLORS.secondary } }
                >
                  {t('customFileUpload.close')}
                </Button>
              </Box>
            </Popover>
          </Box>
        ) }
      </Box>
      { error && (
        <p
          role="alert"
          style={ {
            color: "red",
            display: "flex",
            flexDirection: "start",
            paddingLeft: "10px",
            fontSize: "12px",
          } }
        >
          { error?.message }
        </p>
      ) }
    </Box>
  );
};

export default CustonImageUpload;
