import React, { useMemo } from 'react'
import CustomOutletBox from '../../components/Common/CustomOutletBox'
import { Box, Breadcrumbs, Typography, Link as MuiLink } from '@mui/material'
import { Outlet, useLocation, Link, matchPath } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { useTranslation } from 'react-i18next'

const OnlineExamScreen = () => {
	const location = useLocation()
	const { themeColors } = useTheme()
	const { t } = useTranslation()

	const breadcrumbConfig = useMemo(() => ({
		'/online-exam': t('onlineExam.breadcrumbs.onlineExam'),
		'/online-exam/dashboard': t('onlineExam.breadcrumbs.dashboard'),
		'/online-exam/list': t('onlineExam.breadcrumbs.exams'),
		'/online-exam/question-bank': t('onlineExam.breadcrumbs.questionBank'),
		'/online-exam/question-bank/:id': t('onlineExam.breadcrumbs.questionBankDetails'),
		'/online-exam/report/:examId': t('onlineExam.breadcrumbs.examReport'),
		'/online-exam/:id': t('onlineExam.breadcrumbs.examDetails'),
		'/online-exam/:id/published': t('onlineExam.breadcrumbs.publishedExams'),
		'/online-exam/:id/published/:publishId': t('onlineExam.breadcrumbs.publishedExamDetails'),
		'/online-exam/:id/published/:publishId/retest': t('onlineExam.breadcrumbs.createRetest')
	}), [t])

	const pathnames = location.pathname.split('/').filter(Boolean)

	const breadcrumbs = useMemo(() => {
		const paths = []
		pathnames.forEach((_, index) => {
			const url = `/${pathnames.slice(0, index + 1).join('/')}`
			const matchEntry = Object.entries(breadcrumbConfig).find(([pattern]) =>
				matchPath({ path: pattern, end: true }, url)
			)

			if (matchEntry) {
				if (url !== '/online-exam') {
					paths.push({ label: matchEntry[1], href: url })
				}
			}
		})

		return paths
	}, [breadcrumbConfig, pathnames])

	const currentPageTitle = useMemo(() => 
		breadcrumbs[breadcrumbs.length - 1]?.label || t('onlineExam.breadcrumbs.onlineExam'),
		[breadcrumbs, t]
	)

	return (
		<CustomOutletBox>
			<Box sx={{ mb: 3 }}>
				<Typography variant="h4" fontWeight="bold" sx={{ color: themeColors.text.primary, mb: 1 }}>
					{currentPageTitle}
				</Typography>
				<Breadcrumbs
					aria-label="breadcrumb"
					sx={{
						'& .MuiBreadcrumbs-separator': {
							color: themeColors.text.secondary,
						},
					}}
				>
					<MuiLink
						component={Link}
						underline="hover"
						sx={{
							color: themeColors.text.secondary,
							'&:hover': {
								color: themeColors.primary,
							},
						}}
						to="/online-exam"
					>
						{t('onlineExam.breadcrumbs.onlineExam')}
					</MuiLink>
					{breadcrumbs.map((crumb, index) => {
						const isLast = index === breadcrumbs.length - 1
						return isLast ? (
							<Typography key={crumb.href} sx={{ color: themeColors.text.primary }}>
								{crumb.label}
							</Typography>
						) : (
							<MuiLink
								key={crumb.href}
								component={Link}
								underline="hover"
								sx={{
									color: themeColors.text.secondary,
									'&:hover': {
										color: themeColors.primary,
									},
								}}
								to={crumb.href}
							>
								{crumb.label}
							</MuiLink>
						)
					})}
				</Breadcrumbs>
			</Box>

			<Box>
				<Outlet />
			</Box>

		</CustomOutletBox>
	)
}

export default OnlineExamScreen