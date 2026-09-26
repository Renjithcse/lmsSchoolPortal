import React, { useEffect, useMemo, useState } from 'react';
import { Avatar, Box, Typography, List, ListItemIcon, ListItemText, Collapse, useTheme, ListItemButton, Tooltip } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import person from '../../assets/images/person.jpeg';
import { SideBarMenu, StudentMenus } from '../../menus';
import { useLocation, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTheme as useThemeContext } from '../../contexts/ThemeContext';
import { useAbility } from '../../AbilityContext';
import { useTranslation } from 'react-i18next';

const normalizePath = (path = '') => {
    if (!path) return '';
    if (path === '/') return '/';
    return path.replace(/\/+$/, '');
};

const isPathActive = (currentPath, targetPath) => {
    if (!targetPath || targetPath === '#') return false;
    const current = normalizePath(currentPath);
    const target = normalizePath(targetPath);
    if (target === '/') {
        return current === '/';
    }
    return current === target || current.startsWith(`${target}/`);
};

const Sidebar = ({
    collapsed = false,
    expandedWidth = 280,
    collapsedWidth = 88,
    onHoverChange,
    isRtl = false,
}) => {
    const location = useLocation();
    const { role } = useSelector(state => state.auth);
    const theme = useTheme();
    const { themeColors } = useThemeContext();
    const ability = useAbility();
    const { t } = useTranslation();

    const hasAbility = ability && typeof ability.can === 'function';

    const [expandedMenu, setExpandedMenu] = useState(null);
    const [isHovered, setIsHovered] = useState(false);
    const isExpandedView = !collapsed || isHovered;
    const effectiveWidth = isExpandedView ? expandedWidth : collapsedWidth;

    const handleMouseEnter = () => {
        if (collapsed) {
            setIsHovered(true);
        }
    };

    const handleMouseLeave = () => {
        if (collapsed) {
            setIsHovered(false);
        }
    };

    useEffect(() => {
        if (!collapsed && isHovered) {
            setIsHovered(false);
        }
    }, [collapsed, isHovered]);

    useEffect(() => {
        onHoverChange?.(collapsed && isHovered);
    }, [collapsed, isHovered, onHoverChange]);

    const buildGroupedMenus = (menuConfig, enforceAbility = true, abilityInstance) => {
        const groups = new Map();

        menuConfig.forEach((menu) => {
            const hasChildren = Array.isArray(menu.subMenuItems) && menu.subMenuItems.length > 0;
            const canViewParent =
                !enforceAbility ||
                !menu.subject ||
                (abilityInstance && abilityInstance.can('Read', menu.subject));

            let children = [];
            if (hasChildren) {
                children = menu.subMenuItems
                    .map((child) => ({
                        ...child,
                        label: child.label || child.subMenu,
                        labelKey: child.labelKey, // Preserve labelKey for translation
                    }))
                    .filter(
                        (child) =>
                            !enforceAbility ||
                            !child.subject ||
                            (abilityInstance && abilityInstance.can('Read', child.subject))
                    );
            }

            const shouldInclude =
                (hasChildren && children.length > 0 && (canViewParent || menu.path === '#')) ||
                (!hasChildren && canViewParent);

            if (!shouldInclude) {
                return;
            }

            const normalizedMenu = {
                ...menu,
                label: menu.label || menu.text,
                labelKey: menu.labelKey, // Ensure labelKey is preserved
                subMenuItems: children.map(child => ({
                    ...child,
                    labelKey: child.labelKey, // Ensure child labelKey is preserved
                })),
            };

            const groupKey = menu.groupKey || menu.group || 'General';
            if (!groups.has(groupKey)) {
                groups.set(groupKey, {
                    key: groupKey,
                    title: menu.group || 'General',
                    titleKey: menu.groupKey, // Ensure titleKey is preserved
                    items: [],
                });
            }
            groups.get(groupKey).items.push(normalizedMenu);
        });

        return Array.from(groups.values()).filter((group) => group.items.length > 0);
    };

    const groupedMenus = useMemo(() => {
        if (role === 'student') {
            return buildGroupedMenus(StudentMenus, false, ability);
        }
        // Filter out "My Teaching" menu for admin users (only show for teachers)
        const filteredMenu = role === 'admin' 
            ? SideBarMenu.filter(menu => menu.subject !== 'TeacherSelfDashboard')
            : SideBarMenu;
        return buildGroupedMenus(filteredMenu, true, ability);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role, ability]);

    useEffect(() => {
        const activeKey = groupedMenus
            .flatMap((group, groupIndex) =>
                group.items.map((menu, menuIndex) => {
                    const menuKey = `${groupIndex}-${menuIndex}-${menu.label}`;
                    const hasChildren = menu.subMenuItems?.length > 0;
                    const parentActive = isPathActive(location.pathname, menu.path);
                    const childActive = hasChildren && menu.subMenuItems.some((child) => isPathActive(location.pathname, child.path));
                    if (childActive || (parentActive && hasChildren)) {
                        return menuKey;
                    }
                    return null;
                })
            )
            .find(Boolean);

        if (activeKey) {
            setExpandedMenu(activeKey);
        }
    }, [location.pathname, groupedMenus]);

    const handleMenuSelection = (menu, key, e) => {
        const hasChildren = menu.subMenuItems?.length > 0;
        if (hasChildren) {
            e?.preventDefault?.();
            setExpandedMenu((prev) => (prev === key ? null : key));
        }
    };

    if (!hasAbility) {
        return null;
    }

    return (
        <Box
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            sx={{
                width: `${effectiveWidth}px`,
                height: '100%',
                backgroundColor: themeColors.sidebar.background,
                borderInlineEnd: isRtl ? 'none' : `1px solid ${themeColors.sidebar.border}`,
                borderInlineStart: isRtl ? `1px solid ${themeColors.sidebar.border}` : 'none',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: isRtl ? '-2px 0 8px rgba(0, 0, 0, 0.1)' : '2px 0 8px rgba(0, 0, 0, 0.1)',
                transition: 'width 0.3s ease-in-out',
                overflow: 'hidden',
            }}
        >
            <Box sx={{
                padding: isExpandedView ? '24px 20px' : '16px 12px',
                borderBottom: `1px solid ${themeColors.sidebar.border}`,
                backgroundColor: themeColors.background.secondary,
            }}>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isExpandedView ? 'flex-start' : 'center',
                    flexDirection: isExpandedView ? 'row' : 'column',
                    gap: isExpandedView ? '12px' : '8px',
                }}>
                    <Avatar
                        src={person}
                        sx={{
                            width: isExpandedView ? 48 : 40,
                            height: isExpandedView ? 48 : 40,
                            border: `2px solid ${themeColors.border.primary}`,
                        }}
                    />
                    <Box sx={{
                        textAlign: isExpandedView ? (isRtl ? 'right' : 'left') : 'center',
                        display: isExpandedView ? 'block' : 'none',
                    }}>
                        <Typography sx={{
                            fontWeight: 600,
                            color: themeColors.text.primary,
                            fontSize: '0.95rem',
                        }}>
                            {role === 'student' ? t('sidebar.student') : t('sidebar.administrator')}
                        </Typography>
                        <Typography sx={{
                            color: themeColors.text.secondary,
                            fontSize: '0.8rem',
                        }}>
                            {role === 'student' ? t('sidebar.student') : role === 'admin' ? t('sidebar.administrator') : role === 'teacher' ? t('sidebar.teacher') : role?.charAt(0).toUpperCase() + role?.slice(1)}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Box sx={{
                flex: 1,
                overflowY: 'auto',
                padding: isExpandedView ? '16px 0' : '16px 4px',
                '&::-webkit-scrollbar': {
                    width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                    background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                    background: themeColors.border.secondary,
                    borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                    background: themeColors.text.disabled,
                },
            }}>
                <List sx={{
                    padding: isExpandedView ? '0 16px 24px' : '0 8px 24px',
                    '& .MuiListItemButton-root': {
                        borderRadius: '8px',
                        marginBottom: '4px',
                    },
                }}>
                    {groupedMenus.map((group, groupIndex) => (
                        <Box key={group.key || group.title || groupIndex} sx={{ mt: groupIndex === 0 ? 0 : 3 }}>
                            <Typography
                                variant="overline"
                                sx={{
                                    display: isExpandedView ? 'block' : 'none',
                                    color: themeColors.text.secondary,
                                    fontWeight: 600,
                                    letterSpacing: '0.08em',
                                    mb: 1,
                                    textAlign: isExpandedView ? (isRtl ? 'right' : 'left') : 'center',
                                }}
                            >
                                {(() => {
                                    if (!group.titleKey) return group.title;
                                    const translated = t(group.titleKey);
                                    return translated !== group.titleKey ? translated : group.title;
                                })()}
                            </Typography>
                            {group.items.map((menu, menuIndex) => {
                                const menuKey = `${groupIndex}-${menuIndex}-${menu.label}`;
                                const hasChildren = menu.subMenuItems?.length > 0;
                                const isExpanded = expandedMenu === menuKey;
                                const parentActive = isPathActive(location.pathname, menu.path);
                                const childActive = hasChildren && menu.subMenuItems.some((child) => isPathActive(location.pathname, child.path));
                                const isActive = parentActive || childActive;
                                const IconComponent = menu.icon;
                                const displayLabel = (() => {
                                    if (!menu.labelKey) return menu.label;
                                    const translated = t(menu.labelKey);
                                    return translated !== menu.labelKey ? translated : menu.label;
                                })();
                                const hasValidPath = menu.path && menu.path !== '#';
                                const renderMenuButton = () => {
                                    const buttonProps = {
                                        onClick: (e) => handleMenuSelection(menu, menuKey, e),
                                        sx: {
                                            height: 48,
                                            transition: 'all 0.2s ease-in-out',
                                            color: themeColors.text.primary,
                                            justifyContent: isExpandedView ? 'flex-start' : 'center',
                                            px: isExpandedView ? 2 : 0,
                                            '&:hover': {
                                                backgroundColor: themeColors.sidebar.hover,
                                                transform: isExpandedView ? `translateX(${isRtl ? '-' : ''}4px)` : 'none',
                                            },
                                            ...(isActive && {
                                                backgroundColor: themeColors.sidebar.active,
                                                color: themeColors.text.inverse,
                                                '&:hover': {
                                                    backgroundColor: themeColors.sidebar.active,
                                                    transform: isExpandedView ? `translateX(${isRtl ? '-' : ''}4px)` : 'none',
                                                },
                                            }),
                                        },
                                    };

                                    if (hasValidPath && !hasChildren) {
                                        buttonProps.component = Link;
                                        buttonProps.to = menu.path;
                                    }

                                    return (
                                        <ListItemButton {...buttonProps}>
                                            {IconComponent && (
                                                <ListItemIcon sx={{
                                                    minWidth: isExpandedView ? '40px' : 'auto',
                                                    color: 'inherit',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                }}>
                                                    <IconComponent sx={{ fontSize: '1.25rem' }} />
                                                </ListItemIcon>
                                            )}
                                            <ListItemText
                                                primary={displayLabel}
                                                sx={{
                                                    display: isExpandedView ? 'block' : 'none',
                                                    textAlign: isExpandedView ? (isRtl ? 'right' : 'left') : 'center',
                                                    '& .MuiTypography-root': {
                                                        fontSize: '0.875rem',
                                                        fontWeight: 500,
                                                    },
                                                }}
                                            />
                                        </ListItemButton>
                                    );
                                };

                                return (
                                    <React.Fragment key={menuKey}>
                                        {isExpandedView ? (
                                            renderMenuButton()
                                        ) : (
                                            <Tooltip title={displayLabel} placement={isRtl ? 'left' : 'right'} arrow>
                                                {renderMenuButton()}
                                            </Tooltip>
                                        )}
                                        {hasChildren && (
                                            <Collapse in={isExpandedView && (isExpanded || childActive)} timeout="auto" unmountOnExit>
                                                <List component="div" disablePadding>
                                                    {menu.subMenuItems.map((child) => {
                                                        const childActiveState = isPathActive(location.pathname, child.path);
                                                        const childLabel = (() => {
                                                            if (!child.labelKey) return child.label;
                                                            const translated = t(child.labelKey);
                                                            return translated !== child.labelKey ? translated : child.label;
                                                        })();
                                                        const hasValidChildPath = child.path && child.path !== '#';
                                                        return (
                                                            <ListItemButton
                                                                key={child.path}
                                                                component={hasValidChildPath ? Link : 'div'}
                                                                to={hasValidChildPath ? child.path : undefined}
                                                                sx={{
                                                                    height: 40,
                                                                    borderRadius: '6px',
                                                                    marginInlineStart: 0.5,
                                                                    paddingInlineStart: 5,
                                                                    transition: 'all 0.2s ease-in-out',
                                                                    color: themeColors.text.primary,
                                                                    '&:hover': {
                                                                        backgroundColor: themeColors.sidebar.hover,
                                                                        transform: `translateX(${isRtl ? '-' : ''}4px)`,
                                                                    },
                                                                    ...(childActiveState && {
                                                                        backgroundColor: themeColors.sidebar.active,
                                                                        color: themeColors.text.inverse,
                                                                        '&:hover': {
                                                                            backgroundColor: themeColors.sidebar.active,
                                                                        },
                                                                    }),
                                                                }}
                                                            >
                                                                <ListItemIcon sx={{
                                                                    minWidth: '28px',
                                                                    color: 'inherit',
                                                                    justifyContent: 'center',
                                                                }}>
                                                                    <FiberManualRecordIcon sx={{ fontSize: 8 }} />
                                                                </ListItemIcon>
                                                                <ListItemText
                                                                    primary={childLabel}
                                                                    sx={{
                                                                        '& .MuiTypography-root': {
                                                                            fontSize: '0.8rem',
                                                                            fontWeight: 400,
                                                                            textAlign: isRtl ? 'right' : 'left',
                                                                        },
                                                                    }}
                                                                />
                                                            </ListItemButton>
                                                        );
                                                    })}
                                                </List>
                                            </Collapse>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </Box>
                    ))}
                </List>
            </Box>
        </Box>
    );
};

export default Sidebar;
