import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useState } from "react";
import { useGetSalesQuery, useLazyGetSalesReportByDateQuery, useLazyGetSalesReportBetweenDatesQuery } from "../../Redux/features/Inventory/saleSlice";
import { useGetAllStocksQuery, useGetPurchasesQuery } from "../../Redux/features/Inventory/purchaseSlice";
// import { useGetAllStocksQuery } from "../../Redux/features/Inventory";
import { useGetProductsQuery } from "../../Redux/features/Inventory/productSlice";
import CustomOutletBox from "../../components/Common/CustomOutletBox";
import jsPDF from "jspdf";
import { useTheme as useThemeContext } from "../../contexts/ThemeContext";
import "jspdf-autotable";
import Chart from 'chart.js/auto';
import { Box, Card, CardContent, Typography, Grid, Button, MenuItem, Divider, Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";
import { useForm } from "react-hook-form";
import CustomInput from "../../components/Common/CustomInput";
import CustomSelect from "../../components/Common/CustomSelect";
import { useTranslation } from 'react-i18next';

const InventoryReport = () => {
    const [reportType, setReportType] = useState("sales");
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();
    const [date, setDate] = useState("");
    const [range, setRange] = useState({ startDate: "", endDate: "" });
    const printRef = useRef();
  const { control } = useForm();
    
    // Chart refs
    const salesChartRef = useRef(null);
    const stockChartRef = useRef(null);
    const productChartRef = useRef(null);
    const chartInstances = useRef({});

    // Fetch data for all reports
    const { data: salesData, isLoading: isSalesLoading } = useGetSalesQuery();
    const { data: purchasesData, isLoading: isPurchasesLoading } = useGetPurchasesQuery();
    const { data: stocksData, isLoading: isStocksLoading } = useGetAllStocksQuery();
    const { data: productsData, isLoading: isProductsLoading } = useGetProductsQuery();

    // Sales report by date/range (optional)
    const [triggerSalesByDate, { data: salesByDate }] = useLazyGetSalesReportByDateQuery(date, { skip: !date });
    const [triggerSalesByRange, { data: salesByRange }] = useLazyGetSalesReportBetweenDatesQuery(range, { skip: !range.startDate || !range.endDate });

    useEffect(() => {

        const getSalesByDate = async () => {
            await triggerSalesByDate(date);
        }


        if(date) {
            getSalesByDate()
            
        }
    }, [date])

    useEffect(() => {

        


        if(range.startDate && range.endDate) {
            triggerSalesByRange({ from: range.startDate, to: range.endDate })
            
        }
    }, [range])

    // Normalize API results to arrays
    const salesArray = useMemo(() => (salesData?.data || []), [salesData]);
    const stocksArray = useMemo(() => (stocksData?.data || []), [stocksData]);
    const productsArray = useMemo(() => (productsData?.data || []), [productsData]);

    // Create charts when data is available
    useEffect(() => {
        // Clean up existing charts
        Object.values(chartInstances.current).forEach(chart => {
            if (chart) chart.destroy();
        });
        chartInstances.current = {};

        // Sales Chart
        if (salesChartRef.current && salesArray.length > 0) {
            const salesDataForChart = salesArray.slice(0, 10); // Top 10
            const salesChartData = {
                labels: salesDataForChart.map(sale => sale.saleCode || t('inventoryReport.chartLabels.sale')),
                datasets: [{
                    label: t('inventoryReport.chartLabels.totalAmount'),
                    data: salesDataForChart.map(sale => Number(sale.totalAmount) || 0),
                    backgroundColor: '#4CAF50',
                    borderColor: '#45a049',
                    borderWidth: 1
                }]
            };

            chartInstances.current.sales = new Chart(salesChartRef.current, {
                type: 'bar',
                data: salesChartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                padding: 10
                            }
                        },
                        x: {
                            ticks: {
                                maxRotation: 45,
                                minRotation: 0
                            }
                        }
                    },
                    layout: {
                        padding: {
                            top: 10,
                            bottom: 10,
                            left: 10,
                            right: 10
                        }
                    }
                }
            });
        }

        // Stock Chart
        if (stockChartRef.current && stocksArray.length > 0) {
            const stockChartData = {
                labels: stocksArray.slice(0, 10).map(stock => stock.productId?.productName || stock.productName || t('inventoryReport.chartLabels.product')),
                datasets: [{
                    label: t('inventoryReport.chartLabels.currentStock'),
                    data: stocksArray.slice(0, 10).map(stock => Number(stock.totalQuantity ?? stock.quantity) || 0),
                    backgroundColor: '#2196F3',
                    borderColor: '#1976D2',
                    borderWidth: 1
                }]
            };

            chartInstances.current.stock = new Chart(stockChartRef.current, {
                type: 'bar',
                data: stockChartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                padding: 10
                            }
                        },
                        x: {
                            ticks: {
                                maxRotation: 45,
                                minRotation: 0
                            }
                        }
                    },
                    layout: {
                        padding: {
                            top: 10,
                            bottom: 10,
                            left: 10,
                            right: 10
                        }
                    }
                }
            });
        }

        // Product Chart
        if (productChartRef.current && productsArray.length > 0) {
            const productChartData = {
                labels: productsArray.slice(0, 10).map(product => product.productName || t('inventoryReport.chartLabels.product')),
                datasets: [{
                    label: t('inventoryReport.chartLabels.productPrice'),
                    data: productsArray.slice(0, 10).map(product => Number(product.price) || 0),
                    backgroundColor: '#FF9800',
                    borderColor: '#F57C00',
                    borderWidth: 1
                }]
            };

            chartInstances.current.product = new Chart(productChartRef.current, {
                type: 'bar',
                data: productChartData,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                padding: 10
                            }
                        },
                        x: {
                            ticks: {
                                maxRotation: 45,
                                minRotation: 0
                            }
                        }
                    },
                    layout: {
                        padding: {
                            top: 10,
                            bottom: 10,
                            left: 10,
                            right: 10
                        }
                    }
                }
            });
        }

        // Cleanup function
        return () => {
            Object.values(chartInstances.current).forEach(chart => {
                if (chart) chart.destroy();
            });
        };
    }, [salesArray, stocksArray, productsArray, t]);
    

    // Helper to download CSV
    const downloadCSV = (rows, filename) => {
        if (!rows || rows.length === 0) return;
        const replacer = (key, value) => (value === null ? "" : value);
        const header = Object.keys(rows[0]);
        const csv = [
            header.join(","),
            ...rows.map(row =>
                header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(",")
            ),
        ].join("\r\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Helper to download PDF
    const downloadPDF = (rows, filename) => {
        if (!rows || rows.length === 0) return;
        const doc = new jsPDF();
        let y = 20;
        const margin = 10;
        const lineHeight = 10;
    
        // Title
        doc.setFontSize(16);
        doc.text(t('inventoryReport.pdfTitle'), margin, y);
        y += lineHeight * 2;
    
        // Collect all unique columns from all rows
        const headerSet = new Set();
        rows.forEach(row => Object.keys(row).forEach(key => headerSet.add(key)));
        const header = Array.from(headerSet);
    
        // Header
        doc.setFontSize(10);
        let x = margin;
        header.forEach(col => {
            doc.text(String(col), x, y);
            x += 35; // Adjust column width as needed
        });
        y += lineHeight;
    
        // Rows
        rows.forEach(row => {
            x = margin;
            header.forEach(col => {
                doc.text(String(row[col] ?? ""), x, y);
                x += 35; // Adjust column width as needed
            });
            y += lineHeight;
            // Add new page if needed
            if (y > 270) {
                doc.addPage();
                y = margin + lineHeight;
            }
        });
    
        doc.save(filename);
    };

    // Prepare data for each report type
    const getReportRows = useCallback(() => {
        switch (reportType) {
            case "sales":
                return (salesData?.data || []).map(sale => ({
                    [t('inventoryReport.tableHeaders.saleCode')]: sale.saleCode,
                    [t('inventoryReport.tableHeaders.date')]: sale.date ? new Date(sale.date).toLocaleDateString() : "",
                    [t('inventoryReport.tableHeaders.store')]: sale.store?.storeName,
                    [t('inventoryReport.tableHeaders.user')]: sale.userRole === "student" ? sale.user?.studentName : sale?.user?.employeeName,
                    [t('inventoryReport.tableHeaders.userRole')]: sale.userRole,
                    [t('inventoryReport.tableHeaders.totalAmount')]: sale.totalAmount,
                }));
            case "salesByDate":
                return (salesByDate?.data || []).map(sale => ({
                    [t('inventoryReport.tableHeaders.saleCode')]: sale.saleCode,
                    [t('inventoryReport.tableHeaders.date')]: sale.date ? new Date(sale.date).toLocaleDateString() : "",
                    [t('inventoryReport.tableHeaders.store')]: sale.store?.storeName,
                    [t('inventoryReport.tableHeaders.user')]: sale.userRole === "student" ? sale.user?.studentName : sale?.user?.employeeName,
                    [t('inventoryReport.tableHeaders.userRole')]: sale.userRole,
                    [t('inventoryReport.tableHeaders.totalAmount')]: sale.totalAmount,
                }));
            case "salesByRange":
                return (salesByRange?.data || []).map(sale => ({
                    [t('inventoryReport.tableHeaders.saleCode')]: sale.saleCode,
                    [t('inventoryReport.tableHeaders.date')]: sale.date ? new Date(sale.date).toLocaleDateString() : "",
                    [t('inventoryReport.tableHeaders.store')]: sale.store?.storeName,
                    [t('inventoryReport.tableHeaders.user')]: sale.userRole === "student" ? sale.user?.studentName : sale?.user?.employeeName,
                    [t('inventoryReport.tableHeaders.userRole')]: sale.userRole,
                    [t('inventoryReport.tableHeaders.totalAmount')]: sale.totalAmount,
                }));
            case "purchases":
                return (purchasesData?.data || []).map(purchase => ({
                    [t('inventoryReport.tableHeaders.purchaseCode')]: purchase.purchaseCode,
                    [t('inventoryReport.tableHeaders.date')]: purchase.date ? new Date(purchase.date).toLocaleDateString() : "",
                    [t('inventoryReport.tableHeaders.store')]: purchase.store?.storeName,
                    [t('inventoryReport.tableHeaders.supplier')]: purchase.supplier,
                    [t('inventoryReport.tableHeaders.totalAmount')]: purchase.totalAmount,
                }));
            case "stock":
                return (stocksData?.data || []).map(stock => ({
                    [t('inventoryReport.tableHeaders.product')]: stock.productId?.productName,
                    [t('inventoryReport.tableHeaders.store')]: stock.store?.storeName,
                    [t('inventoryReport.tableHeaders.unit')]: stock.unit?.name,
                    [t('inventoryReport.tableHeaders.totalQuantity')]: stock.totalQuantity,
                }));
            case "products":
                return (productsData?.data || []).map(product => ({
                    [t('inventoryReport.tableHeaders.productCode')]: product.productCode,
                    [t('inventoryReport.tableHeaders.productName')]: product.productName,
                    [t('inventoryReport.tableHeaders.category')]: product?.productCategory?.name,
                    [t('inventoryReport.tableHeaders.status')]: product.productStatus
                }));
            default:
                return [];
        }
    }, [reportType, salesByDate, salesData, purchasesData, productsData, salesByRange, t]);

    const handleDownload = () => {
        const rows = getReportRows();
        downloadCSV(rows, `${reportType}_report.csv`);
    };

    const handleDownloadPDF = () => {
        const rows = getReportRows();
        downloadPDF(rows, `${reportType}_report.pdf`);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <CustomOutletBox>
            <Box sx={{ p: 4, backgroundColor: themeColors.background.primary, minHeight: '100vh' }}>
                <Box sx={{ mb: 3, p: 2, borderRadius: 2, backgroundColor: themeColors.background.secondary, border: `1px solid ${themeColors.border.primary}` }}>
                    <Typography variant="h5" sx={{ color: themeColors.text.primary, fontWeight: 800 }}>{t('inventoryReport.title')}</Typography>
                </Box>
                <Card sx={{ borderRadius: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}`, mb: 3 }}>
                    <CardContent>
                        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                            <Grid item xs={12} md={4}>
                                <CustomSelect fieldName="reportType" control={control} fieldLabel={t('inventoryReport.labels.reportType')} onChangeValue={(val) => setReportType(val)}>
                                    <MenuItem value="sales">{t('inventoryReport.reportTypes.sales')}</MenuItem>
                                    <MenuItem value="salesByDate">{t('inventoryReport.reportTypes.salesByDate')}</MenuItem>
                                    <MenuItem value="salesByRange">{t('inventoryReport.reportTypes.salesByRange')}</MenuItem>
                                    <MenuItem value="purchases">{t('inventoryReport.reportTypes.purchases')}</MenuItem>
                                    <MenuItem value="stock">{t('inventoryReport.reportTypes.stock')}</MenuItem>
                                    <MenuItem value="products">{t('inventoryReport.reportTypes.products')}</MenuItem>
                                </CustomSelect>
                            </Grid>
                            {reportType === 'salesByDate' && (
                                <Grid item xs={12} md={3}>
                                    <CustomInput fieldName="report_date" control={control} fieldLabel={t('inventoryReport.labels.date')} type="date" cust_value={date} changeValue={(v) => setDate(v)} />
                                </Grid>
                            )}
                            {reportType === 'salesByRange' && (
                                <>
                                    <Grid item xs={12} md={3}>
                                        <CustomInput fieldName="report_from" control={control} fieldLabel={t('inventoryReport.labels.from')} type="date" cust_value={range.startDate} changeValue={(v) => setRange(r => ({ ...r, startDate: v }))} />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <CustomInput fieldName="report_to" control={control} fieldLabel={t('inventoryReport.labels.to')} type="date" cust_value={range.endDate} changeValue={(v) => setRange(r => ({ ...r, endDate: v }))} />
                                    </Grid>
                                </>
                            )}
                            <Grid item xs={12} md={'auto'}>
                                <Button variant="contained" onClick={handleDownload} sx={{ backgroundColor: themeColors.primary, color: themeColors.text.inverse, '&:hover': { backgroundColor: themeColors.primary } }}>{t('inventoryReport.actions.downloadCSV')}</Button>
                            </Grid>
                            <Grid item xs={12} md={'auto'}>
                                <Button variant="contained" onClick={handleDownloadPDF} sx={{ backgroundColor: themeColors.success, color: themeColors.text.inverse, '&:hover': { backgroundColor: themeColors.success } }}>{t('inventoryReport.actions.downloadPDF')}</Button>
                            </Grid>
                            <Grid item xs={12} md={'auto'}>
                                <Button variant="outlined" onClick={handlePrint} sx={{ borderColor: themeColors.border.primary, color: themeColors.text.primary }}>{t('inventoryReport.actions.print')}</Button>
                            </Grid>
                        </Grid>

                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={12} md={4}>
                                <Card sx={{ borderRadius: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                                    <CardContent>
                                        <Typography variant="subtitle1" sx={{ color: themeColors.text.primary, mb: 2 }}>{t('inventoryReport.chartTitles.topSales')}</Typography>
                                        <Box sx={{ height: 256, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                                            <canvas ref={salesChartRef} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Card sx={{ borderRadius: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                                    <CardContent>
                                        <Typography variant="subtitle1" sx={{ color: themeColors.text.primary, mb: 2 }}>{t('inventoryReport.chartTitles.currentStock')}</Typography>
                                        <Box sx={{ height: 256, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                                            <canvas ref={stockChartRef} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={4}>
                                <Card sx={{ borderRadius: 2, backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                                    <CardContent>
                                        <Typography variant="subtitle1" sx={{ color: themeColors.text.primary, mb: 2 }}>{t('inventoryReport.chartTitles.productPrices')}</Typography>
                                        <Box sx={{ height: 256, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
                                            <canvas ref={productChartRef} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 2, borderColor: themeColors.border.primary }} />

                        <Box ref={printRef}>
                            <Table sx={{ mt: 2, border: `1px solid ${themeColors.border.primary}`, '& th': { backgroundColor: themeColors.background.secondary }, '& td, & th': { borderColor: themeColors.border.primary }, '& td': { color: themeColors.text.primary } }}>
                                <TableHead>
                                    <TableRow>
                                        {getReportRows()[0] && Object.keys(getReportRows()[0]).map((col) => (
                                            <TableCell key={col} sx={{ color: themeColors.text.primary }}>{col}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {getReportRows().map((row, idx) => (
                                        <TableRow key={idx}>
                                            {Object.values(row).map((val, i) => (
                                                <TableCell key={i}>{val}</TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                    {getReportRows().length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={10} align="center" sx={{ color: themeColors.text.secondary }}>
                                                {t('inventoryReport.messages.noData')}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </CustomOutletBox>
    );
};

export default InventoryReport;