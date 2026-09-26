import React, { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import CustomHeader from '../Common/CustomHeader';
import { Box, Hidden, useMediaQuery, useTheme } from '@mui/material';
import Sidebar from '../Common/Sidebar';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { alpha } from '@mui/material/styles';
import i18n from '../../i18n';

const SIDEBAR_EXPANDED_WIDTH = 280;
const SIDEBAR_COLLAPSED_WIDTH = 88;

const DashboardLayout = ({ children }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { themeColors } = useThemeContext();
    const isDarkMode = theme.palette.mode === 'dark';
    const [direction, setDirection] = useState(() => (typeof document !== 'undefined' ? document.documentElement.dir || 'ltr' : 'ltr'));

    useEffect(() => {
        const handleLanguageChange = (lng) => {
            const dir = lng === 'ar' ? 'rtl' : 'ltr';
            setDirection(dir);
            if (typeof document !== 'undefined') {
                document.documentElement.dir = dir;
            }
        };

        handleLanguageChange(i18n.resolvedLanguage || i18n.language);
        i18n.on('languageChanged', handleLanguageChange);
        return () => i18n.off('languageChanged', handleLanguageChange);
    }, []);

    useEffect(() => {
        if (isMobile) {
            setSidebarOpen(false);
            setSidebarCollapsed(false);
        } else {
            setSidebarOpen(true);
        }
    }, [isMobile]);

    useEffect(() => {
        setIsLoading(true);
        setProgress(0);
        const completeTimeout = setTimeout(() => {
            setProgress(100);
            setTimeout(() => {
                setIsLoading(false);
                setProgress(0);
            }, 300);
        }, 500);
        return () => clearTimeout(completeTimeout);
    }, [location.pathname]);

    const resolvedSidebarWidth = isMobile
        ? SIDEBAR_EXPANDED_WIDTH
        : sidebarCollapsed
            ? (isSidebarHovered ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH)
            : SIDEBAR_EXPANDED_WIDTH;

    const layoutBackground = useMemo(() => (
        isDarkMode
            ? `radial-gradient(circle at top inline-start, ${alpha(themeColors.primary, 0.25)} 0%, transparent 45%),
               radial-gradient(circle at bottom inline-end, ${alpha(themeColors.accent, 0.25)} 0%, transparent 50%),
               linear-gradient(135deg, ${alpha(themeColors.background.secondary, 0.88)} 0%, ${alpha(themeColors.background.primary, 0.92)} 100%)`
            : `radial-gradient(circle at top inline-start, ${alpha(themeColors.primary, 0.12)} 0%, transparent 45%),
               radial-gradient(circle at bottom inline-end, ${alpha(themeColors.accent, 0.12)} 0%, transparent 50%),
               linear-gradient(135deg, ${themeColors.background.secondary} 0%, ${themeColors.background.primary} 100%)`
    ), [isDarkMode, themeColors]);

    const contentSurface = useMemo(() => (
        isDarkMode
            ? alpha(themeColors.background.primary, 0.95)
            : themeColors.background.primary
    ), [isDarkMode, themeColors]);

    const mainPadding = useMemo(() => ({ xs: 2, md: 3 }), []);

    const contentBoxStyles = useMemo(() => ({
        flex: 1,
        minWidth: 0,
        padding: mainPadding,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        minHeight: 'calc(100vh - 80px)',
        height: 'calc(100vh - 80px)',
        overflow: 'hidden',
        order: direction === 'rtl' ? 0 : 2,
        ...(direction === 'rtl'
            ? { marginInlineEnd: { md: 2, xs: 0 }, marginInlineStart: 0 }
            : { marginInlineStart: { md: 2, xs: 0 }, marginInlineEnd: 0 })
    }), [direction, mainPadding]);

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            background: layoutBackground,
            overflowX: 'hidden',
            overflowY: 'auto'
        }}>
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 3 }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            insetInline: 0,
                            zIndex: 1300,
                            background: `linear-gradient(90deg, ${themeColors.primary}, ${themeColors.accent})`
                        }}
                    >
                        <motion.div
                            initial={{ width: '0%' }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            style={{
                                height: '100%',
                                background: `linear-gradient(90deg, ${themeColors.primary} 0%, ${themeColors.accent} 50%, ${themeColors.primary} 100%)`,
                                boxShadow: `0 0 10px ${themeColors.primary}40`
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <Box sx={{
                position: 'fixed',
                top: isLoading ? 3 : 0,
                insetInline: 0,
                zIndex: 1200,
                backgroundColor: themeColors.header.background,
                borderBottom: `1px solid ${themeColors.header.border}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'top 0.3s ease-in-out'
            }}>
                <CustomHeader
                    onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
                    isSidebarCollapsed={sidebarCollapsed}
                    onSidebarCollapseToggle={() => setSidebarCollapsed(prev => !prev)}
                />
            </Box>

            <Box sx={{
                display: 'flex',
                flex: 1,
                marginTop: isLoading ? '83px' : '80px',
                minHeight: 'calc(100vh - 80px)',
                width: '100%',
                position: 'relative',
                transition: 'margin-top 0.3s ease-in-out'
            }}>
                <Hidden mdDown>
                    <Box sx={{
                        position: 'sticky',
                        top: isLoading ? '83px' : '80px',
                        height: 'calc(100vh - 80px)',
                        flexShrink: 0,
                        width: `${resolvedSidebarWidth}px`,
                        insetInlineStart: direction === 'rtl' ? 'auto' : 0,
                        insetInlineEnd: direction === 'rtl' ? 0 : 'auto',
                    }}>
                        <Sidebar
                            collapsed={sidebarCollapsed}
                            expandedWidth={SIDEBAR_EXPANDED_WIDTH}
                            collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
                            onHoverChange={setIsSidebarHovered}
                            isRtl={direction === 'rtl'}
                        />
                    </Box>
                </Hidden>
                <Hidden mdUp>
                    <Box sx={{
                        position: 'fixed',
                        top: isLoading ? '83px' : '80px',
                        insetInlineStart: direction === 'rtl' ? 'auto' : 0,
                        insetInlineEnd: direction === 'rtl' ? 0 : 'auto',
                        height: 'calc(100vh - 80px)',
                        width: SIDEBAR_EXPANDED_WIDTH,
                        zIndex: 1100,
                        backgroundColor: themeColors.sidebar?.background || themeColors.background.secondary,
                        transition: 'transform 0.3s ease-in-out',
                        transform: sidebarOpen ? 'translateX(0)' : `translateX(${direction === 'rtl' ? '' : '-'}100%)`
                    }}>
                        <Sidebar
                            collapsed={false}
                            expandedWidth={SIDEBAR_EXPANDED_WIDTH}
                            collapsedWidth={SIDEBAR_COLLAPSED_WIDTH}
                            onHoverChange={setIsSidebarHovered}
                            isRtl={direction === 'rtl'}
                        />
                    </Box>
                </Hidden>

                <Box sx={contentBoxStyles}>
                    <Box sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        padding: mainPadding,
                        boxSizing: 'border-box',
                        height: '100%',
                        backgroundColor: contentSurface,
                        borderRadius: { xs: 2, md: 3 },
                        boxShadow: isDarkMode
                            ? `0 24px 60px -32px ${alpha('#000000', 0.9)}`
                            : `0 24px 60px -32px ${alpha(themeColors.primary, 0.25)}`,
                        border: `1px solid ${alpha(themeColors.border.primary, isDarkMode ? 0.3 : 0.6)}`
                    }}>
                        <Box sx={{
                            flex: 1,
                            minHeight: 0,
                            height: '100%',
                            position: 'relative',
                            overflowY: 'auto'
                        }}>
                            {children}
                        </Box>
                    </Box>
                </Box>
            </Box>

            {sidebarOpen && isMobile && (
                <Box
                    sx={{
                        position: 'fixed',
                        top: 0,
                        insetInline: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 1090
                    }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </Box>
    );
};

export default DashboardLayout;
