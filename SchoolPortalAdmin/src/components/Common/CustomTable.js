import React from 'react'
import { Box, Typography, CircularProgress } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext'

const DataTable = ({ columns, rows, height, border, borderGrid, id, bg, rowheight, loading, sx, width, checkboxSelection, onSelectionModelChange, selectionModel, onRowSelectionModelChange, rowSelectionModel }) => {
    const { themeColors } = useThemeContext()

    const baseSx = {
        backgroundColor: bg ? bg : 'transparent',
        borderRadius: borderGrid ? borderGrid : '10px',
        '& .MuiDataGrid-columnHeaders': {
            backgroundColor: themeColors.background.secondary,
            color: themeColors.text.primary,
            borderBottom: `1px solid ${themeColors.border.primary}`,
            '& .MuiDataGrid-columnHeader:last-child': {
                borderRight: 'none',
            },
        },
        '& .MuiDataGrid-columnHeaderTitle': {
            fontFamily: 'Raleway, sans-serif',
            fontWeight: 700,
            letterSpacing: '.5px',
        },
        '& .MuiDataGrid-columnSeparator': {
            color: themeColors.border.primary,
            opacity: 1,
        },
        '& .MuiDataGrid-cell': {
            color: themeColors.text.primary,
            borderColor: themeColors.border.primary,
            fontFamily: 'Raleway, sans-serif',
        },
        '& .MuiDataGrid-row': {
            backgroundColor: themeColors.background.primary,
        },
        '& .MuiDataGrid-row:hover': {
            backgroundColor: themeColors.background.tertiary,
        },
        '& .MuiDataGrid-footerContainer': {
            backgroundColor: themeColors.background.secondary,
            color: themeColors.text.primary,
            borderTop: `1px solid ${themeColors.border.primary}`,
        },
        '& .MuiDataGrid-sortIcon, & .MuiSvgIcon-root': {
            color: themeColors.text.primary,
        },
        '& .MuiTablePagination-root, & .MuiTablePagination-toolbar, & .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
            color: themeColors.text.primary,
        },
        '& .MuiIconButton-root': {
            color: themeColors.text.primary,
        },
        '& .MuiDataGrid-overlay': {
            backgroundColor: themeColors.background.primary,
            color: themeColors.text.secondary,
        },
        // Horizontal scrollbar styling
        '& .MuiDataGrid-virtualScroller': {
            overflow: 'auto',
        },
        '& .MuiDataGrid-virtualScroller::-webkit-scrollbar': {
            height: '8px',
        },
        '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-track': {
            background: themeColors.background.secondary,
            borderRadius: '4px',
        },
        '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb': {
            background: themeColors.primary,
            borderRadius: '4px',
        },
        '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb:hover': {
            background: themeColors.accent,
        },
        // Horizontal scrolling fixes
        '& .MuiDataGrid-virtualScroller': {
            overflow: 'auto !important',
        },
        '& .MuiDataGrid-virtualScrollerContent': {
            minWidth: 'fit-content !important',
        },
        // Border fixes
        '& .MuiDataGrid-columnHeader:last-child': {
            borderRight: 'none',
        },
        '& .MuiDataGrid-cell:last-child': {
            borderRight: 'none',
        },
    }

    const ThemedNoRowsOverlay = () => (
        <Box sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: themeColors.background.primary,
        }}>
            <Typography sx={{ color: themeColors.text.secondary, fontFamily: 'Raleway, sans-serif' }}>
                No records found
            </Typography>
        </Box>
    )

    const ThemedLoadingOverlay = () => (
        <Box sx={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: themeColors.background.primary,
        }}>
            <CircularProgress size={28} sx={{ color: themeColors.primary }} />
        </Box>
    )

    return (
        <Box sx={{ 
            height: height ? height : 'calc(100vh - 250px)', 
            width: width ? width : '100%', 
            overflow: 'auto',
            '& .MuiDataGrid-root': {
                minWidth: 'fit-content',
            }
        }}>
            <DataGrid
                style={{
                    background: bg ? bg : 'transparent',
                    borderRadius: borderGrid ? borderGrid : '10px',
                    opacity: 1,
                    fontFamily: 'Raleway, sans-serif',
                    fontWeight: 'bold',
                    letterSpacing: '.5px',
                }}
                loading={loading}
                initialState={{
                    pagination: {
                        paginationModel: {
                            pageSize: 50,
                        },
                    },
                }}
                rows={rows}
                columns={columns}
                rowHeight={rowheight ? rowheight : 60}
                disableSelectionOnClick
                checkboxSelection={checkboxSelection}
                onSelectionModelChange={onSelectionModelChange}
                selectionModel={selectionModel}
                onRowSelectionModelChange={onRowSelectionModelChange}
                rowSelectionModel={rowSelectionModel}
                getRowId={row => row[id]}
                sx={[baseSx, sx]}
                // Horizontal scrolling configuration
                autoHeight={false}
                scrollbarSize={20}
                disableColumnResize={false}
                disableExtendRowFullWidth={true}
                // v6 API
                slots={{ noRowsOverlay: ThemedNoRowsOverlay, loadingOverlay: ThemedLoadingOverlay }}
                // v5 API (fallback)
                components={{ NoRowsOverlay: ThemedNoRowsOverlay, LoadingOverlay: ThemedLoadingOverlay }}
            />
        </Box>
    )
}

export default DataTable