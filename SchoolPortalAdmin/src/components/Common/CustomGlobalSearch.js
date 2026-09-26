import React, { useState } from 'react';
import { Dialog, Box, TextField, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const CustomGlobalSearch = ({ onClose, onSearch, open }) => {
  const [searchValue, setSearchValue] = useState('');

  const handleClose = (event) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };

  const handleSearchChange = (event) => {
    setSearchValue(event.target.value);
    // You can perform search operations here
  };

  const handleSearchKeyPress = (event) => {
    if (event.key === 'Enter') {
      onSearch(searchValue);
    }
  };

  const handleItemClick = (item) => {
    // Handle item click action, like navigation
  };

  return (
    <Dialog
      disableEscapeKeyDown
      fullWidth
      maxWidth="md"
      open={ open }
      onClose={ onClose }
      onKeyDown={ handleClose }
      aria-describedby="global-search-dialog"
    >
      <Box padding={ 2 }>
        <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={ 2 }>
          <TextField
            autoFocus
            fullWidth
            variant="outlined"
            label="Search"
            value={ searchValue }
            onChange={ handleSearchChange }
            onKeyDown={ handleSearchKeyPress }
          />
          <IconButton onClick={ onClose }>
            <CloseIcon />
          </IconButton>
        </Box>
        {/* Here you would list the search results */ }
        {/* Example of showing search results */ }
        {/* {searchResults.map((item) => (
          <div key={item.id} onClick={() => handleItemClick(item)}>
            {item.name}
          </div>
        ))} */}
      </Box>
    </Dialog>
  );
};

export default CustomGlobalSearch;
