import {
	Avatar, Box, Typography, Menu,
	MenuItem,
	Hidden,
	Tooltip,
	IconButton,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Chip,
} from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'
import { COLORS } from '../../assets/colors'
import CustomLogo from './CustomLogo'
import CustomSearch from './CustomSearch'
import { ICONS } from '../../assets/icons'
import person from '../../assets/images/person.jpeg'
import { TYPOGRAPHY_Style } from '../../assets/styles/typograpyStyle'
import { useNavigate, useLocation } from 'react-router-dom'
import { userStore } from '../../store/userStore'
import CustomGlobalSearch from './CustomGlobalSearch'
import SearchIcon from '@mui/icons-material/Search';
import MenuIcon from '@mui/icons-material/Menu';
import FilterListIcon from '@mui/icons-material/FilterList';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useLogoutUserMutation } from '../../Redux/features/auth/userSlice'
import ThemeSwitcher from './ThemeSwitcher'
import { useTheme } from '../../contexts/ThemeContext'
import CreateExamTab from '../admin/onlineExam/createExamTab'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'

const CustomHeader = ({ onMenuToggle, isSidebarCollapsed, onSidebarCollapseToggle }) => {
	const styles = TYPOGRAPHY_Style();
	const navigate = useNavigate();
	const location = useLocation();
	const updateUser = userStore((state) => state.updateuser);
	const { themeColors } = useTheme();
	const { t } = useTranslation();

	const [triggerLogout] = useLogoutUserMutation()

	const [anchorEl, setAnchorEl] = useState(null);
	const [header, setHeader] = useState("header");
	const [search, setSearch] = useState(null);
	const [open, setOpen] = useState(false)
	const [filterDialogOpen, setFilterDialogOpen] = useState(false)
	const [filterValues, setFilterValues] = useState({
		academic_id: null,
		term: '',
		grade_id: null,
		subject_id: ''
	})

	// Check if we're in the online exam section
	const isOnlineExamSection = location.pathname.startsWith('/online-exam')
	const isAssignmentsSection = location.pathname.startsWith('/assignments')
	const showFilterIcon = isOnlineExamSection || isAssignmentsSection

	const handleFilterOpen = () => {
		setFilterDialogOpen(true)
	}

	const handleFilterClose = () => {
		setFilterDialogOpen(false)
	}

	const handleFilterChange = (newValues) => {
		setFilterValues(newValues)
		setFilterDialogOpen(false)
	}

	// Get display text for selected values
	const getSelectedValuesText = () => {
		const values = []
		if (filterValues.academic_id) values.push(filterValues.academic_id.label)
		if (filterValues.term) values.push(filterValues.term)
		if (filterValues.grade_id) values.push(filterValues.grade_id.label)
		if (filterValues.subject_id) values.push(filterValues.subject_id)
		return values
	}


	const handleIconButton = (event) => {
		event.stopPropagation();
		setAnchorEl(event.currentTarget);
	};

	const handleCloseMenu = () => {
		setAnchorEl(null);
	};


	const listenScrollEvent = (event) => {
		setHeader(window.scrollY)
	}

	useEffect(() => {
		const handleKeyPress = (event) => {
			if (event.ctrlKey && event.key === 'z') {
				onChangesearch()
			}
		};
		window.addEventListener('keydown', handleKeyPress);
		return () => {
			window.removeEventListener('keydown', handleKeyPress);
		};
	}, []);

	useEffect(() => {
		window.addEventListener('scroll', listenScrollEvent);
		return () =>
			window.removeEventListener('scroll', listenScrollEvent);
	}, [header]);



	const toggleFullScreen = () => {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen().then(() => {

			});
		} else {
			document.exitFullscreen().then(() => {

			});
		}
	};


	const onChangesearch = useCallback((e) => {

		setOpen(true)

	}, [open])


	const onCloseChange = useCallback(() => {
		setSearch('')
		setOpen(false);

	}, [open])

	const NavigateToLogot = useCallback(async () => {
		await triggerLogout();
		await localStorage.clear();
		updateUser(null);
		navigate('/login')
	}, [navigate, updateUser])

	return (
		<Box sx={{
			height: 80,
			backgroundColor: themeColors.header.background,
			borderBottom: `1px solid ${themeColors.header.border}`,
			display: 'flex',
			alignItems: 'center',
			zIndex: 1200,
			boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
		}}>
			<Box sx={{
				px: { xs: 2, sm: 3, md: 4 },
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				width: '100%',
				height: '100%'
			}}>
				{/* Logo Section */}
				<Box sx={{
					display: 'flex',
					alignItems: 'center',
					gap: 2
				}}>
					{/* Mobile Menu Button */}
					<Hidden mdUp>
						<IconButton
							onClick={onMenuToggle}
							sx={{
								color: themeColors.text.primary,
								'&:hover': {
									backgroundColor: themeColors.background.tertiary
								}
							}}
						>
							<MenuIcon />
						</IconButton>
					</Hidden>

					<Hidden mdDown>
						<Tooltip title={isSidebarCollapsed ? t('header.sidebar.expand') : t('header.sidebar.collapse')}>
							<IconButton
								onClick={onSidebarCollapseToggle}
								sx={{
									color: themeColors.text.primary,
									'&:hover': {
										backgroundColor: themeColors.background.tertiary
									}
								}}
							>
								{isSidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
							</IconButton>
						</Tooltip>
					</Hidden>

					<CustomLogo />
					<Typography sx={{
						fontSize: { xs: '1.1rem', sm: '1.25rem' },
						fontWeight: 600,
						color: themeColors.primary,
						display: { xs: 'none', sm: 'block' }
					}}>
						{t('app.name')}
					</Typography>
				</Box>

				{/* Right Section */}
				<Box sx={{
					display: 'flex',
					alignItems: 'center',
					gap: { xs: 1, sm: 2 }
				}}>
					{/* Search Bar */}
					<Hidden mdDown>
						<Box
							onClick={onChangesearch}
							sx={{
								display: 'flex',
								alignItems: 'center',
								padding: '8px 16px',
								backgroundColor: themeColors.background.secondary,
								borderRadius: '8px',
								border: `1px solid ${themeColors.border.primary}`,
								cursor: 'pointer',
								transition: 'all 0.2s ease-in-out',
								minWidth: '200px',
								'&:hover': {
									backgroundColor: themeColors.background.tertiary,
									borderColor: themeColors.border.secondary
								}
							}}
						>
							<SearchIcon sx={{
								color: themeColors.text.secondary,
								fontSize: '1.1rem',
								marginRight: '8px'
							}} />
							<Typography sx={{
								fontSize: '0.875rem',
								color: themeColors.text.secondary,
								flex: 1
							}}>
								{t('header.search.placeholder')}
							</Typography>
							<Box sx={{
								padding: '2px 6px',
								border: `1px solid ${themeColors.border.secondary}`,
								borderRadius: '4px',
								backgroundColor: themeColors.background.tertiary
							}}>
								<Typography sx={{
									fontSize: '0.7rem',
									color: themeColors.text.secondary,
									fontWeight: 500
								}}>
									CTRL+Z
								</Typography>
							</Box>
						</Box>
					</Hidden>

					{/* Theme Switcher */}
					<ThemeSwitcher />

					{/* Language Switcher */}
					<Hidden mdDown>
						<LanguageSwitcher size="small" />
					</Hidden>

					{/* Filter Icon - Only show in online exam section */}
					{showFilterIcon && (
						<Hidden mdDown>
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								{/* Selected Values Display */}
								{getSelectedValuesText().length > 0 && (
									<Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 200 }}>
										{getSelectedValuesText().map((value, index) => (
											<Chip
												key={index}
												label={value}
												size="small"
												sx={{
													backgroundColor: themeColors.primary,
													color: 'white',
													fontSize: '0.7rem',
													height: '20px'
												}}
											/>
										))}
									</Box>
								)}

								<Tooltip title={t('header.filterExams')}>
									<IconButton
										onClick={handleFilterOpen}
										sx={{
											color: themeColors.text.secondary,
											'&:hover': {
												backgroundColor: themeColors.background.tertiary
											}
										}}
									>
										<FilterListIcon />
									</IconButton>
								</Tooltip>
							</Box>
						</Hidden>
					)}

					{/* Fullscreen Button */}
					<Hidden mdDown>
						<Tooltip title={t('header.fullscreen')}>
							<Box
								onClick={toggleFullScreen}
								sx={{
									display: 'flex',
									justifyContent: 'center',
									alignItems: 'center',
									width: '40px',
									height: '40px',
									borderRadius: '8px',
									cursor: 'pointer',
									transition: 'all 0.2s ease-in-out',
									'&:hover': {
										backgroundColor: themeColors.background.tertiary
									}
								}}
							>
								<ICONS.FullscreenIcon.component sx={{
									...ICONS.FullscreenIcon.sx,
									color: themeColors.text.secondary
								}} />
							</Box>
						</Tooltip>
					</Hidden>

					{/* Notifications */}
					<Hidden mdDown>
						<Tooltip title={t('header.notifications')}>
							<Box sx={{
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								width: '40px',
								height: '40px',
								borderRadius: '8px',
								cursor: 'pointer',
								transition: 'all 0.2s ease-in-out',
								'&:hover': {
									backgroundColor: themeColors.background.tertiary
								}
							}}>
								<ICONS.NotificationsActiveIcon.component sx={{
									...ICONS.NotificationsActiveIcon.sx,
									color: themeColors.text.secondary
								}} />
							</Box>
						</Tooltip>
					</Hidden>

					{/* Language switcher on mobile */}
					<Hidden mdUp>
						<LanguageSwitcher size="small" />
					</Hidden>

					{/* Profile Avatar */}
					<Tooltip title={t('header.profileSettings')}>
						<Avatar
							src={person}
							variant='circular'
							sx={{
								width: 40,
								height: 40,
								cursor: 'pointer',
								border: `2px solid ${themeColors.border.primary}`,
								transition: 'all 0.2s ease-in-out',
								'&:hover': {
									borderColor: themeColors.primary,
									transform: 'scale(1.05)'
								}
							}}
							onClick={handleIconButton}
						/>
					</Tooltip>
				</Box>
			</Box>

			{/* Profile Menu */}
			<Menu
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={handleCloseMenu}
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'right',
				}}
				transformOrigin={{
					vertical: 'top',
					horizontal: 'right',
				}}
				sx={{
					'& .MuiPaper-root': {
						borderRadius: '8px',
						boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
						border: `1px solid ${themeColors.border.primary}`,
						backgroundColor: themeColors.background.secondary,
						marginTop: '8px'
					}
				}}
			>
				<MenuItem sx={{
					fontSize: '0.875rem',
					fontWeight: 500,
					color: themeColors.text.primary,
					padding: '12px 16px',
					'&:hover': {
						backgroundColor: themeColors.background.secondary
					}
				}}>
					{t('header.profile')}
				</MenuItem>
				<MenuItem
					sx={{
						fontSize: '0.875rem',
						fontWeight: 500,
						color: themeColors.error,
						padding: '12px 16px',
						'&:hover': {
							backgroundColor: `${themeColors.error}20`
						}
					}}
					onClick={NavigateToLogot}
				>
					{t('header.logout')}
				</MenuItem>
			</Menu>

			{/* Global Search Modal */}
			{open && <CustomGlobalSearch open={open} onClose={onCloseChange} />}

			{/* Filter Dialog */}
			<Dialog
				open={filterDialogOpen}
				onClose={handleFilterClose}
				maxWidth="md"
				fullWidth
				sx={{
					'& .MuiDialog-paper': {
						borderRadius: '12px',
						backgroundColor: themeColors.background.primary
					}
				}}
			>
				<DialogTitle sx={{
					color: themeColors.text.primary,
					borderBottom: `1px solid ${themeColors.border.primary}`,
					pb: 2
				}}>
					{t('header.filterExams')}
				</DialogTitle>
				<DialogContent sx={{ pt: 2 }}>
					<CreateExamTab
						resetRoute={"/online-exam"}
						hide={true}
						onFilterChange={handleFilterChange}
						initialValues={filterValues}
					/>
				</DialogContent>
				<DialogActions sx={{
					borderTop: `1px solid ${themeColors.border.primary}`,
					pt: 2,
					backgroundColor: themeColors.background.secondary
				}}>
					<Button
						onClick={handleFilterClose}
						sx={{
							color: themeColors.text.secondary,
							'&:hover': {
								backgroundColor: themeColors.background.tertiary
							}
						}}
					>
						{t('header.cancel')}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	)
}

export default CustomHeader
