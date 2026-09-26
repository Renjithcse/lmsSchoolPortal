import { Box, Paper, Typography, Grid, Card, CardContent, IconButton, Tooltip } from "@mui/material";
import CustomOutletBox from "../../components/Common/CustomOutletBox";
import { useTheme as useThemeContext } from "../../contexts/ThemeContext";
import { BarChart, LineChart, PieChart } from "@mui/x-charts";
import React, { useEffect, useState, useMemo } from "react";
import ApexCharts from "react-apexcharts";
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import AssignmentIcon from '@mui/icons-material/Assignment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BookIcon from '@mui/icons-material/Book';
import EventIcon from '@mui/icons-material/Event';
import AssessmentIcon from '@mui/icons-material/Assessment';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useTranslation } from 'react-i18next';

const BarGraph = React.lazy(() => import('../../components/dashboard/BarGraph'));
const PieGraph = React.lazy(() => import('../../components/dashboard/PieGraph'));
const LineGraph = React.lazy(() => import('../../components/dashboard/LineGraph'));

export default function Dashboard() {
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();

    // Sample data for LMS dashboard
    const dashboardStats = {
        totalStudents: 1247,
        totalTeachers: 89,
        totalClasses: 45,
        totalSubjects: 12,
        activeExams: 8,
        upcomingEvents: 15,
        attendanceRate: 94.5,
        averageScore: 78.3
    };

    // Sample chart data
    const studentPerformanceData = useMemo(() => ({
        options: {
            chart: {
                type: 'area',
                background: 'transparent',
                foreColor: themeColors.text.primary,
                toolbar: { show: false },
            },
            colors: [themeColors.primary, themeColors.success],
            dataLabels: { enabled: false },
            stroke: { curve: 'smooth', width: 3 },
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.7,
                    opacityTo: 0.2,
                    stops: [0, 90, 100]
                }
            },
            xaxis: {
                categories: [
                    t('dashboard.charts.months.jan'),
                    t('dashboard.charts.months.feb'),
                    t('dashboard.charts.months.mar'),
                    t('dashboard.charts.months.apr'),
                    t('dashboard.charts.months.may'),
                    t('dashboard.charts.months.jun')
                ],
                axisBorder: { color: themeColors.border.primary },
                axisTicks: { color: themeColors.border.primary },
                labels: { style: { colors: themeColors.text.primary } }
            },
            yaxis: {
                labels: { style: { colors: themeColors.text.primary } }
            },
            grid: {
                borderColor: themeColors.border.primary,
                strokeDashArray: 3,
            },
            legend: {
                labels: { colors: themeColors.text.primary }
            }
        },
        series: [
            {
                name: t('dashboard.charts.studentPerformance.series.averageScore'),
                data: [75, 78, 82, 79, 85, 88]
            },
            {
                name: t('dashboard.charts.studentPerformance.series.attendanceRate'),
                data: [92, 94, 91, 95, 93, 96]
            }
        ]
    }), [themeColors.text.primary, themeColors.primary, themeColors.success, themeColors.border.primary, t]);

    const subjectDistributionData = useMemo(() => ({
        options: {
            chart: {
                type: 'donut',
                background: 'transparent',
                foreColor: themeColors.text.primary,
                height: 250,
                width: '100%'
            },
            colors: [themeColors.primary, themeColors.success, themeColors.accent, themeColors.warning, themeColors.error],
            labels: [
                t('dashboard.charts.subjectDistribution.labels.mathematics'),
                t('dashboard.charts.subjectDistribution.labels.science'),
                t('dashboard.charts.subjectDistribution.labels.english'),
                t('dashboard.charts.subjectDistribution.labels.history'),
                t('dashboard.charts.subjectDistribution.labels.others')
            ],
            legend: {
                position: 'bottom',
                labels: { colors: themeColors.text.primary },
                fontSize: '12px',
                fontFamily: 'Raleway, sans-serif'
            },
            dataLabels: {
                enabled: true,
                style: { 
                    colors: [themeColors.text.inverse],
                    fontSize: '12px',
                    fontFamily: 'Raleway, sans-serif'
                },
                formatter: function (val, opts) {
                    return opts.w.globals.seriesTotals[opts.seriesIndex] + '%'
                }
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '60%',
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                label: t('dashboard.charts.subjectDistribution.donutTotal'),
                                color: themeColors.text.primary,
                                fontSize: '16px',
                                fontFamily: 'Raleway, sans-serif',
                                fontWeight: 600
                            }
                        }
                    }
                }
            },
            responsive: [{
                breakpoint: 480,
                options: {
                    chart: {
                        width: 200
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }]
        },
        series: [30, 25, 20, 15, 10]
    }), [themeColors.text.primary, themeColors.text.inverse, themeColors.primary, themeColors.success, themeColors.accent, themeColors.warning, themeColors.error, t]);

    const attendanceData = useMemo(() => ({
        options: {
            chart: {
                type: 'bar',
                background: 'transparent',
                foreColor: themeColors.text.primary,
                toolbar: { show: false },
            },
            colors: [themeColors.primary],
            plotOptions: {
                bar: {
                    borderRadius: 8,
                    columnWidth: '60%',
                }
            },
            xaxis: {
                categories: [
                    t('dashboard.charts.days.mon'),
                    t('dashboard.charts.days.tue'),
                    t('dashboard.charts.days.wed'),
                    t('dashboard.charts.days.thu'),
                    t('dashboard.charts.days.fri')
                ],
                axisBorder: { color: themeColors.border.primary },
                axisTicks: { color: themeColors.border.primary },
                labels: { style: { colors: themeColors.text.primary } }
            },
            yaxis: {
                labels: { style: { colors: themeColors.text.primary } }
            },
            grid: {
                borderColor: themeColors.border.primary,
                strokeDashArray: 3,
            }
        },
        series: [{
            name: t('dashboard.charts.weeklyAttendance.series.attendance'),
            data: [95, 92, 88, 94, 96]
        }]
    }), [themeColors.text.primary, themeColors.primary, themeColors.border.primary, t]);

    const dashboardItems = useMemo(() => [
        {
            key: 'a',
            component: (
                <Box sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" sx={{ color: themeColors.text.primary, mb: 2, fontWeight: 600 }}>
                        {t('dashboard.charts.studentPerformance.subtitle')}
                    </Typography>
                    <ApexCharts 
                        options={studentPerformanceData.options} 
                        series={studentPerformanceData.series} 
                        type="area" 
                        height={250} 
                    />
                </Box>
            )
        },
        {
            key: 'b',
            component: (
                <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="h6" sx={{ color: themeColors.text.primary, mb: 2, fontWeight: 600 }}>
                        {t('dashboard.charts.subjectDistribution.title')}
                    </Typography>
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ApexCharts 
                            options={subjectDistributionData.options} 
                            series={subjectDistributionData.series} 
                            type="donut" 
                            height={250}
                            width="100%"
                        />
                    </Box>
                </Box>
            )
        },
        {
            key: 'c',
            component: (
                <Box sx={{ p: 2, height: '100%' }}>
                    <Typography variant="h6" sx={{ color: themeColors.text.primary, mb: 2, fontWeight: 600 }}>
                        {t('dashboard.charts.weeklyAttendance.title')}
                    </Typography>
                    <ApexCharts 
                        options={attendanceData.options} 
                        series={attendanceData.series} 
                        type="bar" 
                        height={250} 
                    />
                </Box>
            )
        }
    ], [themeColors.text.primary, studentPerformanceData, subjectDistributionData, attendanceData, t]);


    const StatCard = ({ title, value, icon, color, subtitle }) => (
        <Card sx={{ 
            background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
            border: `1px solid ${color}30`,
            borderRadius: 3,
            transition: 'all 0.3s ease',
            '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 8px 25px ${color}20`,
            }
        }}>
            <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                        <Typography variant="h4" sx={{ 
                            color: color, 
                            fontWeight: 'bold',
                            fontFamily: 'Raleway, sans-serif'
                        }}>
                            {value}
                        </Typography>
                        <Typography variant="body2" sx={{ 
                            color: themeColors.text.secondary,
                            mt: 0.5,
                            fontFamily: 'Raleway, sans-serif'
                        }}>
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" sx={{ 
                                color: themeColors.text.secondary,
                                fontFamily: 'Raleway, sans-serif'
                            }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ 
                        backgroundColor: `${color}20`, 
                        borderRadius: 2, 
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {icon}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );

    return (
        <CustomOutletBox>
            <Box sx={{ 
                p: { xs: 2, sm: 3 }, 
                backgroundColor: themeColors.background.primary,
                minHeight: '100vh',
                maxWidth: '100vw',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <Box sx={{ 
                    mb: 4, 
                    p: 3, 
                    background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.accent} 100%)`,
                    borderRadius: 3,
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                    }
                }}>
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                        <Typography variant="h3" sx={{ 
                            fontWeight: 'bold',
                            fontFamily: 'Raleway, sans-serif',
                            mb: 1
                        }}>
                            {t('dashboard.header.title')}
                        </Typography>
                        <Typography variant="body1" sx={{ opacity: 0.9 }}>
                            {t('dashboard.header.subtitle')}
                        </Typography>
                    </Box>
                </Box>

                {/* Statistics Cards */}
                <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={4}>
                        <StatCard
                            title={t('dashboard.stats.totalStudents.title')}
                            value={dashboardStats.totalStudents.toLocaleString()}
                            icon={<PeopleIcon sx={{ color: themeColors.primary, fontSize: 32 }} />}
                            color={themeColors.primary}
                            subtitle={t('dashboard.stats.totalStudents.subtitle')}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <StatCard
                            title={t('dashboard.stats.totalTeachers.title')}
                            value={dashboardStats.totalTeachers}
                            icon={<SchoolIcon sx={{ color: themeColors.success, fontSize: 32 }} />}
                            color={themeColors.success}
                            subtitle={t('dashboard.stats.totalTeachers.subtitle')}
                        />
                    </Grid>
                    {/* <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title={t('dashboard.stats.activeClasses.title')}
                            value={dashboardStats.totalClasses}
                            icon={<AssignmentIcon sx={{ color: themeColors.accent, fontSize: 32 }} />}
                            color={themeColors.accent}
                            subtitle={t('dashboard.stats.activeClasses.subtitle')}
                        />
                    </Grid> */}
                    <Grid item xs={12} sm={6} md={4}>
                        <StatCard
                            title={t('dashboard.stats.attendanceRate.title')}
                            value={`${dashboardStats.attendanceRate}%`}
                            icon={<TrendingUpIcon sx={{ color: themeColors.warning, fontSize: 32 }} />}
                            color={themeColors.warning}
                            subtitle={t('dashboard.stats.attendanceRate.subtitle')}
                        />
                    </Grid>
                </Grid>

                {/* Charts Grid */}
                <Paper sx={{ 
                    p: { xs: 2, sm: 3 }, 
                    backgroundColor: themeColors.background.secondary,
                    border: `1px solid ${themeColors.border.primary}`,
                    borderRadius: 3,
                    boxShadow: 2,
                    width: '100%',
                    overflow: 'hidden',
                    marginBottom: 5
                }}>
                    <Typography variant="h5" sx={{ 
                        color: themeColors.text.primary, 
                        mb: 3, 
                        fontWeight: 600,
                        fontFamily: 'Raleway, sans-serif'
                    }}>
                        {t('dashboard.charts.sectionTitle')}
                    </Typography>
                    
                    <Box sx={{ 
                        width: '100%', 
                        overflow: 'hidden',
                        minHeight: '500px',
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(3, 1fr)',
                            lg: 'repeat(3, 1fr)',
                            xl: 'repeat(4, 1fr)'
                        },
                        gap: { xs: 2, sm: 2, md: 3 },
                        '& > *': {
                            minHeight: '300px'
                        }
                    }}>
                        {dashboardItems?.map((item) => (
                            <Paper key={item?.key} sx={{ 
                                backgroundColor: themeColors.background.primary,
                                border: `1px solid ${themeColors.border.primary}`,
                                borderRadius: 2,
                                boxShadow: 1,
                                overflow: 'hidden',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: 3
                                }
                            }}>
                                {item?.component}
                            </Paper>
                        ))}
                    </Box>
                </Paper>

                {/* Additional Stats */}
                <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mt: 10 }}>
                    <Grid item xs={12} md={6}>
                        <Card sx={{ 
                            backgroundColor: themeColors.background.secondary,
                            border: `1px solid ${themeColors.border.primary}`,
                            borderRadius: 3
                        }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box display="flex" alignItems="center" gap={2} mb={2}>
                                    <BookIcon sx={{ color: themeColors.primary, fontSize: 28 }} />
                                    <Typography variant="h6" sx={{ 
                                        color: themeColors.text.primary,
                                        fontWeight: 600,
                                        fontFamily: 'Raleway, sans-serif'
                                    }}>
                                        {t('dashboard.cards.academicOverview.title')}
                                    </Typography>
                                </Box>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                            {t('dashboard.cards.academicOverview.totalSubjects')}
                                        </Typography>
                                        <Typography variant="h6" sx={{ color: themeColors.text.primary, fontWeight: 600 }}>
                                            {dashboardStats.totalSubjects}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                            {t('dashboard.cards.academicOverview.averageScore')}
                                        </Typography>
                                        <Typography variant="h6" sx={{ color: themeColors.success, fontWeight: 600 }}>
                                            {dashboardStats.averageScore}%
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card sx={{ 
                            backgroundColor: themeColors.background.secondary,
                            border: `1px solid ${themeColors.border.primary}`,
                            borderRadius: 3
                        }}>
                            <CardContent sx={{ p: 3 }}>
                                <Box display="flex" alignItems="center" gap={2} mb={2}>
                                    <EventIcon sx={{ color: themeColors.accent, fontSize: 28 }} />
                                    <Typography variant="h6" sx={{ 
                                        color: themeColors.text.primary,
                                        fontWeight: 600,
                                        fontFamily: 'Raleway, sans-serif'
                                    }}>
                                        {t('dashboard.cards.upcomingActivities.title')}
                                    </Typography>
                                </Box>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                            {t('dashboard.cards.upcomingActivities.activeExams')}
                                        </Typography>
                                        <Typography variant="h6" sx={{ color: themeColors.warning, fontWeight: 600 }}>
                                            {dashboardStats.activeExams}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="body2" sx={{ color: themeColors.text.secondary }}>
                                            {t('dashboard.cards.upcomingActivities.upcomingEvents')}
                                        </Typography>
                                        <Typography variant="h6" sx={{ color: themeColors.primary, fontWeight: 600 }}>
                                            {dashboardStats.upcomingEvents}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </CustomOutletBox>
    );
}