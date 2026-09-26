const express = require("express");
const router = express.Router();
const unitController = require("../../controllers/inventory/unitController");
const authMiddlewares = require("../../middlewares/authMiddlewares");
const checkPermission = require("../../middlewares/checkPermission");
// Apply `authMiddlewares.protect` to all routes in this router
router.use(authMiddlewares.protect);

router
  .route("/")
  .get(checkPermission("Read", "InventoryUnit"), unitController.getUnits)
  .post(checkPermission("Create", "InventoryUnit"), unitController.createUnit);

router
  .route("/:id")
  .delete(checkPermission("Delete", "InventoryUnit"), unitController.deleteUnit); // Delete a unit only if not used in products

module.exports = router;