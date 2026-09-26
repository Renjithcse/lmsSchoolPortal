const express = require('express');
const authMiddlewares = require('../../middlewares/authMiddlewares');
const { 
    getAllSubCategories, 
    createSubCategory, 
    updateSubCategory, 
    deleteSubCategory 
} = require('../../controllers/Exam/SubCategory');

const router = express.Router();

router.use(authMiddlewares.protect);


router
	.route('/')
	.get(getAllSubCategories)
	.post(createSubCategory)
    .put(updateSubCategory)
    .delete(deleteSubCategory);

module.exports = router;
