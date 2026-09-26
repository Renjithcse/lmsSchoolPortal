const express = require('express');
const authMiddlewares = require('../../middlewares/authMiddlewares');
const { getAllCategories, createCategory, updateCategory, deleteCategory, confirmCategory } = require('../../controllers/Exam/CategoryController');

const router = express.Router();

router.use(authMiddlewares.protect);


router
	.route('/')
	.get(getAllCategories)
	.post(createCategory)
	.put(confirmCategory)

router
	.route('/:id')
	.delete(deleteCategory)
	.put(updateCategory);

module.exports = router;