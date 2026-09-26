const Sale = require("../../models/Inventory/sales");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const Stock = require("../../models/Inventory/stock");
const Product = require("../../models/Inventory/product");
const Purchase = require("../../models/Inventory/purchase");

exports.createSale = catchAsync(async (req, res, next) => {
    const { user, userRole, store, date, totalAmount, products } = req.body;

    // Check stock availability for all products before creating the sale
    for (const item of products) {
        const stock = await Stock.findById(item.stockId);
        if (!stock) {
            return next(new AppError(`Stock not found for product`, 400));
        }
        const batch = stock.batches.find(b => b.batchCode === item.batchCode);
        if (!batch) {
            return next(new AppError(`Batch not found for product`, 400));
        }
        if (batch.remainingQuantity < item.quantity) {
            return next(
                new AppError(
                    `Insufficient stock for ${item?.name} (${item.unitName}): Requested ${item.quantity}, Available ${batch.remainingQuantity}`,
                    400
                )
            );
        }
    }

    // All stock is available, proceed to create sale and update stock
    const newSale = await Sale.create({
        user,
        userRole,
        store,
        date,
        totalAmount,
        products,
    });

    for (const item of products) {
        const stock = await Stock.findById(item.stockId);
        if (!stock) continue;
        const batch = stock.batches.find(b => b.batchCode === item.batchCode);
        if (batch) {
            batch.remainingQuantity = Math.max(0, batch.remainingQuantity - item.quantity);
        }
        stock.totalQuantity = stock.batches.reduce((sum, b) => sum + b.remainingQuantity, 0);
        await stock.save();
    }

    res.status(201).json({
        status: "success",
        data: newSale,
    });
});

exports.getAllSales = catchAsync(async (req, res, next) => {
    let sales = await Sale.find()
        .populate("store")
        .populate("products.productId")
        .populate("products.unit");

    // Populate user based on role for each sale
    sales = await Promise.all(sales.map(async (sale) => {
        if (sale.userRole === "student") {
            sale = await sale.populate({ path: "user", model: "Student" });
        } else if (sale.userRole === "teacher") {
            sale = await sale.populate({ path: "user", model: "Teacher" });
        } else {
            sale = await sale.populate("user");
        }
        return sale;
    }));


    res.status(200).json({
        status: "success",
        data: sales,
    });
});

exports.getSaleById = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    let sale = await Sale.findById(id)
        .populate("store")
        .populate("products.productId")
        .populate("products.unit");
    if (!sale) {
        return next(new AppError("Sale not found.", 404));
    }

    // Populate user based on role
    if (sale.userRole === "student") {
        sale = await sale.populate({ path: "user", model: "Student" });
    } else if (sale.userRole === "teacher") {
        sale = await sale.populate({ path: "user", model: "Teacher" });
    } else {
        sale = await sale.populate("user");
    }

    res.status(200).json({
        status: "success",
        data: sale,
    });
});

exports.deleteSale = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const deletedSale = await Sale.findByIdAndDelete(id);
    if (!deletedSale) {
        return next(new AppError("Sale not found.", 404));
    }
    res.status(200).json({
        status: "success",
        message: "Sale deleted successfully.",
    });
});

exports.updateSale = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { saleCode, user, userRole, store, date, totalAmount, products } = req.body;

    const updatedSale = await Sale.findByIdAndUpdate(
        id,
        { saleCode, user, userRole, store, date, totalAmount, products },
        { new: true, runValidators: true }
    )
        .populate("user")
        .populate("store")
        .populate("products.productId")
        .populate("products.unit");

    if (!updatedSale) {
        return next(new AppError("Sale not found.", 404));
    }

    res.status(200).json({
        status: "success",
        data: updatedSale,
    });
});

// Get products by store, show up to first two batches per product/unit, skip remaining batches
exports.getProductsByStore = catchAsync(async (req, res, next) => {
    const { storeId } = req.params;

    // Find all stock entries for the store, populate product and unit
    const stocks = await Stock.find({ store: storeId })
        .populate("productId")
        .populate("unit");

    if (!stocks || stocks.length === 0) {
        return res.status(200).json({ success: true, data: [] });
    }

    const result = [];
    stocks.forEach((stock) => {
        if (!stock.productId || !stock.unit) return;
        // Filter batches with remainingQuantity > 0
        const availableBatches = (stock.batches || []).filter(b => b.remainingQuantity > 0);
        // Only take first two batches
        availableBatches.slice(0, 2).forEach((batch) => {
            result.push({
                stockId: stock._id,
                productId: stock.productId._id,
                name: `${stock.productId.productName} (${stock.unit.name})`,
                unitId: stock.unit._id,
                unitName: stock.unit.name,
                batchCode: batch.batchCode,
                remainingQuantity: batch.remainingQuantity,
                sellingPrice: batch.sellingPrice,
                purchasePrice: batch.purchasePrice,
            });
        });
        // Skip remaining batches
    });

    res.status(200).json({
        success: true,
        data: result,
    });
});

exports.dashboardStats = async (req, res, next) => {
    try {
        // Total products
        const totalProducts = await Product.countDocuments();

        // Sales count and total sales amount
        const sales = await Sale.aggregate([
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$totalAmount" }
                }
            }
        ]);
        const salesCount = sales[0]?.count || 0;
        const salesTotalAmount = sales[0]?.totalAmount || 0;

        // Purchases count and total purchase amount
        const purchases = await Purchase.aggregate([
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$totalAmount" }
                }
            }
        ]);
        const purchaseCount = purchases[0]?.count || 0;
        const purchaseTotalAmount = purchases[0]?.totalAmount || 0;

        // Inventory status counts
        const inStock = await Product.countDocuments({ productStatus: "In Stock" });
        const lowStock = await Product.countDocuments({ productStatus: "Low Stock" });
        const outOfStock = await Product.countDocuments({ productStatus: "Out of Stock" });

        res.status(200).json({
            status: "success",
            data: {
                totalProducts,
                salesCount,
                salesTotalAmount,
                purchaseCount,
                purchaseTotalAmount,
                inStock,
                lowStock,
                outOfStock
            }
        });
    } catch (err) {
        next(err);
    }
};

// Get sales report for a specific date
exports.getSalesReportByDate = catchAsync(async (req, res, next) => {
    const { date } = req.query; // Expecting date in 'YYYY-MM-DD' format

    if (!date) {
        return next(new AppError("Date is required in query params.", 400));
    }

    const start = new Date(date);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    let sales = await Sale.find({ date: { $gte: start, $lte: end } })
        .populate("store")
        .populate("products.productId")
        .populate("products.unit");

    // Populate user based on userRole
    sales = await Promise.all(sales.map(async (sale) => {
        if (sale.userRole === "student") {
            sale = await sale.populate({ path: "user", model: "Student" });
        } else if (sale.userRole === "teacher") {
            sale = await sale.populate({ path: "user", model: "Teacher" });
        } else {
            sale = await sale.populate("user");
        }
        return sale;
    }));

    res.status(200).json({
        status: "success",
        data: sales,
    });
});

// Get sales report between two dates
exports.getSalesReportBetweenDates = catchAsync(async (req, res, next) => {
    const { from, to } = req.query; // Expecting 'from' and 'to' in 'YYYY-MM-DD' format

    if (!from || !to) {
        return next(new AppError("Both 'from' and 'to' dates are required in query params.", 400));
    }

    const start = new Date(from);
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);

    let sales = await Sale.find({ date: { $gte: start, $lte: end } })
        .populate("store")
        .populate("products.productId")
        .populate("products.unit");

    // Populate user based on userRole
    sales = await Promise.all(sales.map(async (sale) => {
        if (sale.userRole === "student") {
            sale = await sale.populate({ path: "user", model: "Student" });
        } else if (sale.userRole === "teacher") {
            sale = await sale.populate({ path: "user", model: "Teacher" });
        } else {
            sale = await sale.populate("user");
        }
        return sale;
    }));

    res.status(200).json({
        status: "success",
        data: sales,
    });
});