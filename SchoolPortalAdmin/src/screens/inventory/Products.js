import React, { useState } from "react";
import CustomOutletBox from "../../components/Common/CustomOutletBox";
import { useNavigate } from "react-router-dom";
import { useGetProductsQuery, useDeleteProductMutation } from "../../Redux/features/Inventory/productSlice";
import { useGetCategoriesQuery } from "../../Redux/features/Inventory/categorySlice";
import ConfirmationDialog from "../../components/Inputs/ConfirmationDialog";
import { useSnackbar } from "../../hooks/SnackBar";
import { useTheme as useThemeContext } from "../../contexts/ThemeContext";
import { useAbility } from "../../AbilityContext";
import { useTranslation } from 'react-i18next';

const Products = () => {
    const { themeColors } = useThemeContext();
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("All");
    const navigate = useNavigate();
    const [id, setId] = useState(null);
    const showSnackbar = useSnackbar();
    const ability = useAbility();
    // Fetch products from the API
    const { data: productsData = [], isLoading, isError, error } = useGetProductsQuery();
    const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();
    const { data: categoriesData } = useGetCategoriesQuery();

    const [isOpen, setIsOpen] = useState(false);

    // Ensure productsData is an array
    const products = Array.isArray(productsData?.data) ? productsData?.data : [];

    // Filter and search logic
    const filteredProducts = products?.filter((product) => {
        const matchesSearch = product.productName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === "All" || product.productCategory?._id === filterCategory;
        return matchesSearch && matchesCategory;
    });

    // Handle delete product
    const handleDelete = async (id) => {
        setId(id);
        setIsOpen(true);
    };


    const confirmDelete = async () => {
        setIsOpen(false);
        if (id) {
            try {
                await deleteProduct(id).unwrap();
                showSnackbar(t('products.messages.deleteSuccess'), "success");
            } catch (err) {
                showSnackbar(err?.data?.message || t('products.messages.deleteFailed'), "error");
            }
        }
    }
    const cancelDelete = () => {
        setIsOpen(false);
    }



    return (
        <CustomOutletBox>
            <div className="p-6 min-h-screen" style={{ backgroundColor: themeColors.background.primary }}>
                {/* Header */}
                <header className="mb-6" style={{ backgroundColor: themeColors.background.secondary, border: `1px solid ${themeColors.border.primary}`, borderRadius: 8, padding: 16 }}>
                    <h1 className="text-3xl font-bold" style={{ color: themeColors.text.primary }}>{t('products.title')}</h1>
                </header>

                {/* Search and Filter Section */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    {/* Search Bar */}
                    <input
                        type="text"
                        placeholder={t('products.placeholders.search')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-64 px-4 py-2 rounded-lg shadow-sm focus:outline-none"
                        style={{ background: themeColors.background.primary, color: themeColors.text.primary, border: `1px solid ${themeColors.border.primary}` }}
                    />

                    {/* Filter Dropdown */}
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full md:w-48 px-4 py-2 rounded-lg shadow-sm focus:outline-none"
                        style={{ background: themeColors.background.primary, color: themeColors.text.primary, border: `1px solid ${themeColors.border.primary}` }}
                    >
                        <option value="All">{t('products.filters.allCategories')}</option>
                        {/* Dynamically populate categories */}
                        {categoriesData?.data?.map((category) => (
                            <option key={category._id} value={category._id}>
                                {category.name}
                            </option>
                        ))}
                    </select>

                    {/* Add Button */}
                    {ability.can('Create', 'InventoryProducts') && (
                        <button
                        onClick={() => navigate("/inventory/products/add")}
                        className="w-full md:w-auto flex items-center px-4 py-2 rounded-lg shadow"
                        style={{ backgroundColor: themeColors.primary, color: themeColors.text.inverse }}
                    >
                        {t('products.actions.addProduct')}
                    </button>
                    )}
                </div>

                {/* Products Table */}
                <div className="shadow rounded-lg p-6" style={{ backgroundColor: themeColors.background.primary, border: `1px solid ${themeColors.border.primary}` }}>
                    {isLoading ? (
                        <table className="w-full table-auto border-collapse">
                            <thead>
                                <tr style={{ backgroundColor: themeColors.background.secondary }}>
                                    <th className="text-left p-3 text-sm font-medium" style={{ color: themeColors.text.primary }}>{t('products.table.productCode')}</th>
                                    <th className="text-left p-3 text-sm font-medium" style={{ color: themeColors.text.primary }}>{t('products.table.productName')}</th>
                                    <th className="text-left p-3 text-sm font-medium" style={{ color: themeColors.text.primary }}>{t('products.table.category')}</th>
                                    <th className="text-left p-3 text-sm font-medium" style={{ color: themeColors.text.primary }}>{t('products.table.subCategory')}</th>
                                    <th className="text-left p-3 text-sm font-medium" style={{ color: themeColors.text.primary }}>{t('products.table.author')}</th>
                                    <th className="text-left p-3 text-sm font-medium" style={{ color: themeColors.text.primary }}>{t('products.table.publisher')}</th>
                                    <th className="text-left p-3 text-sm font-medium" style={{ color: themeColors.text.primary }}>{t('products.table.publishedYear')}</th>
                                    <th className="text-left p-3 text-sm font-medium" style={{ color: themeColors.text.primary }}>{t('products.table.isbn')}</th>
                                    <th className="text-left p-3 text-sm font-medium" style={{ color: themeColors.text.primary }}>{t('products.table.actions')}</th>
                                </tr>
                            </thead>
                            <tbody style={{ color: themeColors.text.primary }}>
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <tr key={index} className="border-t">
                                        <td className="p-3 text-sm text-gray-800">
                                            <div className="h-4 bg-gray-300 rounded w-24 animate-pulse"></div>
                                        </td>
                                        <td className="p-3 text-sm text-gray-800">
                                            <div className="h-4 bg-gray-300 rounded w-28 animate-pulse"></div>
                                        </td>
                                        <td className="p-3 text-sm text-gray-800">
                                            <div className="h-4 bg-gray-300 rounded w-20 animate-pulse"></div>
                                        </td>
                                        <td className="p-3 text-sm text-gray-800">
                                            <div className="h-4 bg-gray-300 rounded w-20 animate-pulse"></div>
                                        </td>
                                        <td className="p-3 text-sm text-gray-800">
                                            <div className="h-4 bg-gray-300 rounded w-20 animate-pulse"></div>
                                        </td>
                                        <td className="p-3 text-sm text-gray-800">
                                            <div className="h-4 bg-gray-300 rounded w-16 animate-pulse"></div>
                                        </td>
                                        <td className="p-3 text-sm text-gray-800">
                                            <div className="h-4 bg-gray-300 rounded w-16 animate-pulse"></div>
                                        </td>
                                        <td className="p-3 text-sm text-gray-800">
                                            <div className="h-4 bg-gray-300 rounded w-16 animate-pulse"></div>
                                        </td>
                                        <td className="p-3 text-sm text-gray-800">
                                            <div className="h-4 bg-gray-300 rounded w-24 animate-pulse"></div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : isError ? (
                        <p style={{ color: themeColors.error }}>{t('products.messages.error', { error: error?.data?.message || t('products.messages.loadFailed') })}</p>
                    ) : (
                        <table className="w-full table-auto border-collapse">
                            <thead>
                                <tr style={{ backgroundColor: themeColors.background.secondary }}>
                                    <th className="text-left p-3 text-sm font-medium" style={{ color: themeColors.text.primary }}>{t('products.table.productCode')}</th>
                                    <th className="text-left p-3 text-sm font-medium" style={{ color: themeColors.text.primary }}>{t('products.table.productName')}</th>
                                    <th className="text-left p-3 text-sm font-medium" style={{ color: themeColors.text.primary }}>{t('products.table.category')}</th>
                                    <th className="text-left p-3 text-sm font-medium" style={{ color: themeColors.text.primary }}>{t('products.table.subCategory')}</th>
                                    <th className="text-left p-3 text-sm font-medium" style={{ color: themeColors.text.primary }}>{t('products.table.author')}</th>
                                    <th className="text-left p-3 text-sm font-medium" style={{ color: themeColors.text.primary }}>{t('products.table.publisher')}</th>
                                    <th className="text-left p-3 text-sm font-medium" style={{ color: themeColors.text.primary }}>{t('products.table.publishedYear')}</th>
                                    <th className="text-left p-3 text-sm font-medium" style={{ color: themeColors.text.primary }}>{t('products.table.isbn')}</th>
                                    <th className="text-left p-3 text-sm font-medium" style={{ color: themeColors.text.primary }}>{t('products.table.actions')}</th>

                                </tr>
                            </thead>
                            <tbody style={{ color: themeColors.text.primary }}>
                                {filteredProducts.map((product) => (
                                    <tr key={product._id} className="border-t" style={{ borderColor: themeColors.border.primary }}>
                                        <td className="p-3 text-sm">{product.productCode || t('products.table.notAvailable')}</td>
                                        <td className="p-3 text-sm">{product.productName}</td>
                                        <td className="p-3 text-sm">{product.productCategory?.name}</td>
                                        <td className="p-3 text-sm">{product.subCategory?.name || t('products.table.notAvailable')}</td>
                                        <td className="p-3 text-sm">{product.author || t('products.table.notAvailable')}</td>
                                        <td className="p-3 text-sm">{product.publisher || t('products.table.notAvailable')}</td>
                                        <td className="p-3 text-sm">{product.publishedYear || t('products.table.notAvailable')}</td>
                                        <td className="p-3 text-sm">{product.isbn || t('products.table.notAvailable')}</td>
                                        <td className="p-3 text-sm">
                                            {ability.can('Read', 'InventoryProducts') && (
                                                <button
                                                onClick={() => navigate(`/inventory/products/view/${product._id}`)}
                                                className="mr-2 px-2 py-1 rounded"
                                                style={{ backgroundColor: themeColors.primary, color: themeColors.text.inverse }}
                                            >
                                                {t('products.actions.view')}
                                            </button>
                                            )}
                                            {ability.can('Edit', 'InventoryProducts') && (
                                            <button
                                                onClick={() => navigate(`/inventory/products/edit/${product._id}`)}
                                                className="mr-2 px-2 py-1 rounded"
                                                style={{ backgroundColor: themeColors.accent, color: themeColors.text.inverse }}
                                            >
                                                {t('products.actions.edit')}
                                            </button>
                                            )}
                                            {ability.can('Delete', 'InventoryProducts') && (
                                            <button
                                                onClick={() => handleDelete(product._id)}
                                                className={`px-2 py-1 rounded ${isDeleting ? "opacity-50" : ""}`}
                                                style={{ backgroundColor: themeColors.error, color: themeColors.text.inverse }}
                                                disabled={isDeleting}
                                            >
                                                {t('products.actions.delete')}
                                            </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {filteredProducts.length === 0 && !isLoading && (
                        <p className="text-center text-gray-500 mt-4" style={{ color: themeColors.text.secondary }}>{t('products.messages.noProducts')}</p>
                    )}
                </div>
            </div>
            <ConfirmationDialog
                isOpen={isOpen}
                onClose={cancelDelete}
                onConfirm={confirmDelete}
                message={t('products.delete.message')}
                title={t('products.delete.title')}
            />
        </CustomOutletBox>
    );
};

export default Products;