const Joi = require("joi");

const productValidationSchema = Joi.object({
	productName: Joi.string().required(),
	productCategory: Joi.string().required(),
	subCategory: Joi.string().required(),
	productStatus: Joi.string().valid("In Stock", "Low Stock", "Out of Stock").required(),
	productCode: Joi.string().required(),
	primaryImage: Joi.string().allow(null),
	otherImages: Joi.array().items(Joi.string()).allow(null),
	author: Joi.string().allow(null, ""), // Allow empty or null
	publisher: Joi.string().allow(null, ""), // Allow empty or null
    publishedYear: Joi.number()
        .min(1900)
        .max(new Date().getFullYear())
        .allow(null), // Allow null
    isbn: Joi.string().allow(null, ""), // Allow empty or null
});

module.exports = productValidationSchema;