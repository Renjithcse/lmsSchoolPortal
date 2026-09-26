import React, { useState } from 'react';
import { Box, Avatar, Popover } from '@mui/material';

const ImageViewer = ({ url }) => {
    const [anchorEl, setAnchorEl] = useState(null);

    const handlePopoverOpen = (event) => {
            setAnchorEl(event.currentTarget);
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);



    return (
        <>
            <Avatar
                src={url}
                alt="Preview"
                variant='square'
                sx={{ width: 45, height: 30, cursor: 'pointer' }}
                onMouseEnter={handlePopoverOpen}
            />
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handlePopoverClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                PaperProps={{
                    onMouseLeave: handlePopoverClose, // Close on mouse leave
                }}
            >
                <Box
                    sx={{
                        p: 1,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <img
                        src={url}
                        alt="Full Preview"
                        style={{ maxWidth: '400px', maxHeight: '400px' }}
                    />
                </Box>
            </Popover>
        </>
        // <Box>
        //     {fieldLabel && (
        //         <Typography fontFamily={'Raleway, sans-serif'} fontWeight={'700'} mb={1}>
        //             {fieldLabel}
        //         </Typography>
        //     )}
        //     <Box
        //         sx={{
        //             border: '1px solid #C4C4C4',
        //             display: 'flex',
        //             alignItems: 'center',
        //             justifyContent: 'space-between',
        //             p: 1,
        //             borderRadius: 1,
        //         }}
        //     >
        //         <TextField
        //             sx={{ display: 'none' }}
        //             accept="image/*"
        //             id={fieldName}
        //             type="file"
        //             onChange={onChangeImage}
        //         />
        //         <label htmlFor={fieldName} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        //             <Button
        //                 variant="contained"
        //                 sx={{ background: COLORS.secondary, '&:hover': { background: COLORS.secondary }, height: 30 }}
        //                 component="span"
        //                 startIcon={<CloudUploadIcon />}
        //             >
        //                 Upload
        //             </Button>
        //             {preview && (
        //                 <Avatar
        //                     src={preview}
        //                     alt="Preview"
        //                     variant='square'
        //                     sx={{ width: 45, height: 30, cursor: 'pointer' }}
        //                     onMouseEnter={handlePopoverOpen}
        //                 />
        //             )}
        //         </label>
        //         {preview && (
        //             <HighlightOffIcon
        //                 onClick={() => {
        //                     setPreview(null);
        //                     onChange(null);
        //                 }}
        //                 sx={{
        //                     cursor: 'pointer',
        //                     color: '#FF4D4F',
        //                     ml: 1,
        //                 }}
        //             />
        //         )}
        //     </Box>
        //     {errors && (
        //         <p
        //             role="alert"
        //             style={{
        //                 color: "red",
        //                 display: "flex",
        //                 flexDirection: "start",
        //                 paddingLeft: "10px",
        //                 fontSize: "12px",
        //             }}
        //         >
        //             {errors}
        //         </p>
        //     )}
        //     {/* Popover to view the full image */}
        //     <Popover
        //         open={open}
        //         anchorEl={anchorEl}
        //         onClose={handlePopoverClose}
        //         anchorOrigin={{
        //             vertical: 'bottom',
        //             horizontal: 'left',
        //         }}
        //         transformOrigin={{
        //             vertical: 'top',
        //             horizontal: 'left',
        //         }}
        //         PaperProps={{
        //             onMouseLeave: handlePopoverClose, // Close on mouse leave
        //         }}
        //     >
        //         <Box
        //             sx={{
        //                 p: 1,
        //                 display: 'flex',
        //                 justifyContent: 'center',
        //                 alignItems: 'center',
        //             }}
        //         >
        //             <img
        //                 src={preview}
        //                 alt="Full Preview"
        //                 style={{ maxWidth: '300px', maxHeight: '300px' }}
        //             />
        //         </Box>
        //     </Popover>
        // </Box>
    );
};

export default ImageViewer;
