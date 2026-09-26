import React from "react";
import ApexCharts from "react-apexcharts";
import CustomOutletBox from "../../components/Common/CustomOutletBox";
import { useDashboardDataQuery } from "../../Redux/features/Inventory/saleSlice";
import { useTheme as useThemeContext } from "../../contexts/ThemeContext";
import { useTranslation } from 'react-i18next';

const InventoryDashboard = () => {
    const { data, isLoading, isError } = useDashboardDataQuery();
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();

    // Fallback values if API is loading or fails
    const stats = data?.data || {
        totalProducts: 0,
        salesCount: 0,
        salesTotalAmount: 0,
        purchaseCount: 0,
        purchaseTotalAmount: 0,
        inStock: 0,
        lowStock: 0,
        outOfStock: 0,
    };

    const chartOptions = React.useMemo(() => ({
        chart: {
            type: "bar",
            background: "transparent",
            foreColor: themeColors.text.primary,
            toolbar: { show: false },
        },
        xaxis: {
            categories: [t('inventoryDashboard.chart.categories.inventory'), t('inventoryDashboard.chart.categories.sales'), t('inventoryDashboard.chart.categories.purchases')],
            axisBorder: { color: themeColors.border.primary },
            axisTicks: { color: themeColors.border.primary },
            labels: {
                style: {
                    colors: [themeColors.text.primary, themeColors.text.primary, themeColors.text.primary],
                    fontSize: "12px",
                },
            },
        },
        yaxis: {
            labels: {
                style: { colors: [themeColors.text.primary], fontSize: "12px" },
            },
        },
        grid: {
            borderColor: themeColors.border.primary,
            strokeDashArray: 3,
        },
        legend: {
            labels: { colors: themeColors.text.primary },
        },
        dataLabels: {
            enabled: false,
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                columnWidth: '55%',
            },
        },
        colors: [themeColors.primary, themeColors.success, themeColors.accent],
    }), [themeColors, t]);

    const chartSeries = React.useMemo(() => [
        {
            name: t('inventoryDashboard.chart.seriesName'),
            data: [stats.totalProducts, stats.salesCount, stats.purchaseCount],
        },
    ], [stats.totalProducts, stats.salesCount, stats.purchaseCount, t]);

    return (
        <CustomOutletBox>
            <div className="p-6 min-h-screen" style={{ backgroundColor: themeColors.background.primary }}>
                {/* Header */}
                <header className="mb-6" style={{ backgroundColor: themeColors.background.secondary, border: `1px solid ${themeColors.border.primary}`, borderRadius: 8, padding: 16 }}>
                    <h1 className="text-3xl font-bold" style={{ color: themeColors.text.primary }}>{t('inventoryDashboard.title')}</h1>
                </header>

                {/* Metrics Section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="shadow rounded-lg p-4" style={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                        <h2 className="text-sm font-medium" style={{ color: themeColors.text.secondary }}>{t('inventoryDashboard.metrics.totalItems')}</h2>
                        <p className="text-2xl font-bold" style={{ color: themeColors.text.primary }}>{isLoading ? "..." : stats.totalProducts}</p>
                    </div>
                    <div className="shadow rounded-lg p-4" style={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                        <h2 className="text-sm font-medium" style={{ color: themeColors.text.secondary }}>{t('inventoryDashboard.metrics.inStock')}</h2>
                        <p className="text-2xl font-bold" style={{ color: themeColors.text.primary }}>{isLoading ? "..." : stats.inStock}</p>
                    </div>
                    <div className="shadow rounded-lg p-4" style={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                        <h2 className="text-sm font-medium" style={{ color: themeColors.text.secondary }}>{t('inventoryDashboard.metrics.lowStock')}</h2>
                        <p className="text-2xl font-bold" style={{ color: themeColors.error }}>{isLoading ? "..." : stats.lowStock}</p>
                    </div>
                    <div className="shadow rounded-lg p-4" style={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                        <h2 className="text-sm font-medium" style={{ color: themeColors.text.secondary }}>{t('inventoryDashboard.metrics.outOfStock')}</h2>
                        <p className="text-2xl font-bold" style={{ color: themeColors.text.primary }}>{isLoading ? "..." : stats.outOfStock}</p>
                    </div>
                </div>

                {/* Graph Section */}
                <div className="shadow rounded-lg p-6" style={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                    <h2 className="text-lg font-medium mb-4" style={{ color: themeColors.text.primary }}>{t('inventoryDashboard.chart.title')}</h2>
                    {isLoading ? (
                        <div className="text-center" style={{ color: themeColors.text.secondary }}>{t('inventoryDashboard.chart.loading')}</div>
                    ) : isError ? (
                        <div className="text-center" style={{ color: themeColors.error }}>{t('inventoryDashboard.chart.error')}</div>
                    ) : (
                        <ApexCharts options={chartOptions} series={chartSeries} type="bar" height={300} />
                    )}
                </div>

                {/* Sales & Purchases Amount Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div className="shadow rounded-lg p-4" style={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                        <h2 className="text-sm font-medium" style={{ color: themeColors.text.secondary }}>{t('inventoryDashboard.metrics.totalSalesAmount')}</h2>
                        <p className="text-2xl font-bold" style={{ color: themeColors.success }}>
                            {isLoading ? "..." : `${t('inventoryDashboard.currency')} ${stats.salesTotalAmount?.toLocaleString()}`}
                        </p>
                    </div>
                    <div className="shadow rounded-lg p-4" style={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                        <h2 className="text-sm font-medium" style={{ color: themeColors.text.secondary }}>{t('inventoryDashboard.metrics.totalPurchasesAmount')}</h2>
                        <p className="text-2xl font-bold" style={{ color: themeColors.accent }}>
                            {isLoading ? "..." : `${t('inventoryDashboard.currency')} ${stats.purchaseTotalAmount?.toLocaleString()}`}
                        </p>
                    </div>
                </div>
            </div>
        </CustomOutletBox>
    );
};

export default InventoryDashboard;