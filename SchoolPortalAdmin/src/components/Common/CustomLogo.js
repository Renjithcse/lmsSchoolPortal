import { Avatar, Box } from '@mui/material'
import React from 'react'
import logo from '../../assets/images/logo.jpeg'


const CustomLogo = () => {
  return (
    <>
      <Avatar src={ logo } variant='square' sx={ { width: 40, height: 40, } } />
    </>
  )
}

export default CustomLogo
