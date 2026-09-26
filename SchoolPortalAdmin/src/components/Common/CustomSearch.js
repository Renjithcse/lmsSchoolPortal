import React, { useTransition, memo, useCallback } from 'react';
import TextField from "@mui/material/TextField";
import { COLORS } from '../../assets/colors';
import { useTranslation } from 'react-i18next';

import './CustomSearch.css'; // Import CSS file for custom styles

const CustomSearch = ({ setState, value, onChange, onFocus, onBlur }) => {
	const { t } = useTranslation();



    return (
        <>
            <TextField
                value={ value }
                fullWidth
                onChange={ onChange }
                placeholder={ t('customSearch.placeholder') }
                id="outlined-basic"
                variant="standard"
                className="custom-search-field" // Add custom CSS class here
                InputProps={ {
                    style: {
                        fontFamily: 'Outfit-Regular',
                        height: 30,
                        borderRadius: 8,
                        color: COLORS.gray,
                        backgroundColor: COLORS.white,
                        paddingLeft: 8
                    },
                    disableUnderline: true,


                } } />
        </>
    )
}

export default CustomSearch;
