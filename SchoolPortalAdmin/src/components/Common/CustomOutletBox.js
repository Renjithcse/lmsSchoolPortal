import React from 'react'
import { Box } from '@mui/material'

const CustomOutletBox = ({ children }) => {
	return (
		<Box sx={{
			width: '100%',
			height: '100%',
			position: 'relative',
			overflow: 'auto'
		}}>
			{children}
		</Box>
	)
}

export default CustomOutletBox
