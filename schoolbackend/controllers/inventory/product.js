const Product = require("../../models/Inventory/product");
const productValidationSchema = require("../../validation/productValidation");
const catchAsync = require("../../utils/catchAsync");
const AppError = require("../../utils/appError");
const { uploadInventoryImageToS3, deleteInventoryS3File, extractS3KeyFromUrl } = require("../../utils/inventoryS3Helper");
const Purchase = require("../../models/Inventory/purchase");
const Sale = require("../../models/Inventory/sales");
const Stock = require("../../models/Inventory/stock");

// Create a new product
exports.createProduct = catchAsync(async (req, res, next) => {
    const { error } = productValidationSchema.validate(req.body);
    if (error) {
        return next(new AppError(error.details[0].message, 400));
    }

    const { primaryImage, otherImages, ...productData } = req.body;

    // Upload primary image to S3
    let primaryImageData = null;
    if (primaryImage && primaryImage.includes('data:image')) {
        try {
            primaryImageData = await uploadInventoryImageToS3(primaryImage, 'inventory');
        } catch (error) {
            return next(new AppError(`Failed to upload primary image: ${error.message}`, 400));
        }
    }

    // Upload other images to S3
    let otherImagesData = [];
    let otherImagesS3Keys = [];
    if (otherImages && Array.isArray(otherImages)) {
        for (const image of otherImages) {
            if (image && image.includes('data:image')) {
                try {
                    const imageData = await uploadInventoryImageToS3(image, 'inventory');
                    otherImagesData.push(imageData.url);
                    otherImagesS3Keys.push(imageData.key);
                } catch (error) {
                    return next(new AppError(`Failed to upload image: ${error.message}`, 400));
                }
            }
        }
    }

    // Create the product with S3 URLs and keys
    const newProduct = await Product.create({
        ...productData,
        primaryImage: primaryImageData ? primaryImageData.url : null,
        primaryImageS3Key: primaryImageData ? primaryImageData.key : null,
        otherImages: otherImagesData,
        otherImagesS3Keys: otherImagesS3Keys,
    });

    res.status(201).json({
        success: true,
        data: newProduct,
    });
});

// Get all products
exports.getProducts = catchAsync(async (req, res, next) => {
    const products = await Product.find()
        .populate("productCategory subCategory")
        .exec();
    res.status(200).json({
        success: true,
        data: products,
    });
});

// Get a single product by ID
exports.getProductById = catchAsync(async (req, res, next) => {
    const product = await Product.findById(req.params.id)
        .populate("productCategory subCategory")
        .exec();
    if (!product) {
        return next(new AppError("No product found with that ID", 404));
    }
    res.status(200).json({
        success: true,
        data: product,
    });
});

// Update a product
exports.updateProduct = catchAsync(async (req, res, next) => {
    const { error } = productValidationSchema.validate(req.body);
    if (error) {
        return next(new AppError(error.details[0].message, 400));
    }

    const { primaryImage, otherImages, ...productData } = req.body;

    // Get existing product to access old S3 keys
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
        return next(new AppError("No product found with that ID", 404));
    }

    // Handle primary image update
    if (primaryImage && primaryImage.includes('data:image')) {
        try {
            // Upload new primary image to S3
            const primaryImageData = await uploadInventoryImageToS3(primaryImage, 'inventory');
            
            // Delete old primary image from S3 if it exists
            if (existingProduct.primaryImageS3Key) {
                try {
                    await deleteInventoryS3File(existingProduct.primaryImageS3Key);
                } catch (error) {
                    console.error('Error deleting old primary image:', error);
                }
            }
            
            productData.primaryImage = primaryImageData.url;
            productData.primaryImageS3Key = primaryImageData.key;
        } catch (error) {
            return next(new AppError(`Failed to upload primary image: ${error.message}`, 400));
        }
    }

    // Handle other images update
    if (otherImages && Array.isArray(otherImages)) {
        try {
            const newOtherImagesData = [];
            const newOtherImagesS3Keys = [];
            
            // Upload new images to S3
            for (const image of otherImages) {
                if (image && image.includes('data:image')) {
                    const imageData = await uploadInventoryImageToS3(image, 'inventory');
                    newOtherImagesData.push(imageData.url);
                    newOtherImagesS3Keys.push(imageData.key);
                }
            }
            
            // Delete old other images from S3
            if (existingProduct.otherImagesS3Keys && existingProduct.otherImagesS3Keys.length > 0) {
                for (const s3Key of existingProduct.otherImagesS3Keys) {
                    try {
                        await deleteInventoryS3File(s3Key);
                    } catch (error) {
                        console.error('Error deleting old image:', error);
                    }
                }
            }
            
            productData.otherImages = newOtherImagesData;
            productData.otherImagesS3Keys = newOtherImagesS3Keys;
        } catch (error) {
            return next(new AppError(`Failed to upload images: ${error.message}`, 400));
        }
    }

    // Update the product in the database
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, productData, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        success: true,
        data: updatedProduct,
    });
});

// Delete a product only if it's not used in any inventory models
exports.deleteProduct = catchAsync(async (req, res, next) => {
    const productId = req.params.id;

    // First, check if the product exists
    const product = await Product.findById(productId);
    if (!product) {
        return next(new AppError("No product found with that ID", 404));
    }

    // Check if the product is being used in Purchase model
    const purchases = await Purchase.find({ 
        "products.productId": productId 
    });
    if (purchases.length > 0) {
        return next(new AppError(
            `Cannot delete product. This product is being used by ${purchases.length} purchase record(s). Please delete the purchases first.`, 
            400
        ));
    }

    // Check if the product is being used in Sale model
    const sales = await Sale.find({ 
        "products.productId": productId 
    });
    if (sales.length > 0) {
        return next(new AppError(
            `Cannot delete product. This product is being used by ${sales.length} sale record(s). Please delete the sales first.`, 
            400
        ));
    }

    // Check if the product is being used in Stock model
    const stocks = await Stock.find({ 
        productId: productId 
    });
    if (stocks.length > 0) {
        return next(new AppError(
            `Cannot delete product. This product is being used by ${stocks.length} stock record(s). Please delete the stock records first.`, 
            400
        ));
    }

    // Delete S3 files before deleting the product
    try {
        // Delete primary image from S3
        if (product.primaryImageS3Key) {
            await deleteInventoryS3File(product.primaryImageS3Key);
        }
        
        // Delete other images from S3
        if (product.otherImagesS3Keys && product.otherImagesS3Keys.length > 0) {
            for (const s3Key of product.otherImagesS3Keys) {
                await deleteInventoryS3File(s3Key);
            }
        }
    } catch (error) {
        console.error('Error deleting S3 files:', error);
        // Continue with product deletion even if S3 deletion fails
    }

    // If no dependencies exist, proceed with deletion
    await Product.findByIdAndDelete(productId);

    res.status(200).json({
        success: true,
        message: "Product deleted successfully",
    });
});