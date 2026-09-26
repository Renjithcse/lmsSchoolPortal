import React from 'react'
import { Box, MenuItem, List, ListItem, Typography, IconButton } from '@mui/material'
import { Link } from 'react-router-dom'

const Sidebar = ({ menuItems, onClose }) => {
  return (
    <Box
      sx={ {
        width: 250,
        height: '100vh',
        backgroundColor: 'white',
        boxShadow: 3,
        position: 'fixed',
        top: 0,
        right: 0,
        zIndex: 200,
        padding: 2,
      } }
    >
      <IconButton onClick={ onClose } sx={ { position: 'absolute', top: 10, right: 10 } }>
        {/* Close Icon */ }
        <ICONS.CloseIcon.component sx={ { color: COLORS.gray } } />
      </IconButton>

      <List>
        { menuItems.map((menuItem, index) => (
          <React.Fragment key={ index }>
            <Typography variant="h6" sx={ { marginBottom: 1 } }>
              { menuItem.text }
            </Typography>
            { menuItem.subMenuItems.map((subItem, subIndex) => (
              <MenuItem key={ subIndex } component={ Link } to={ subItem.path }>
                { subItem.subMenu }
              </MenuItem>
            )) }
          </React.Fragment>
        )) }
      </List>
    </Box>
  )
}

export default Sidebar;
