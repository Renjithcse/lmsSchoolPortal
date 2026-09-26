import { Box, Breadcrumbs, Typography } from '@mui/material'
import React, { memo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { COLORS } from '../../assets/colors';
import { TYPOGRAPHY_Style } from '../../assets/styles/typograpyStyle';
import { useTranslation } from 'react-i18next';

const CustomBreadcrub = () => {
  const { t } = useTranslation();
  
  function handleClick (event) {
    event.preventDefault();
    console.info('You clicked a breadcrumb.');
  }

  const location = useLocation();

  let firstLetter = location.pathname.replace('/', '')
  const capitalizedWord = firstLetter.charAt(0).toUpperCase() + location.pathname.replace('/', '').slice(1)

  console.log({ firstLetter })

  // Get translated page name based on pathname
  const getPageName = () => {
    if (location.pathname === '/') {
      return t('breadcrumb.dashboard');
    } else if (location.pathname === '/grade-subject') {
      return t('breadcrumb.gradeSubject');
    } else {
      // Try to get translation for the pathname, fallback to capitalized word
      const translationKey = `breadcrumb.${location.pathname.replace('/', '').replace(/-/g, '')}`;
      const translated = t(translationKey, { defaultValue: capitalizedWord });
      return translated !== translationKey ? translated : capitalizedWord;
    }
  };

  const style = TYPOGRAPHY_Style()
  return (
    <Box role="presentation" onClick={ handleClick } py={ 1 } ml={ { xs: 2, sm: 2, md: 'unset' } } >
      <Breadcrumbs aria-label="breadcrumb">
        <Typography color={ COLORS.white } sx={ style.small }>{t('breadcrumb.admin')}</Typography>
        <Typography color={ COLORS.white } sx={ style.extraSmall }>{t('breadcrumb.school')}</Typography>
        <Typography color={ COLORS.white } sx={ style.extraSmall }>{getPageName()}</Typography>
      </Breadcrumbs>
    </Box>
  )
}

export default memo(CustomBreadcrub)
