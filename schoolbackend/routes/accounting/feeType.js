const express = require("express");
const router = express.Router();
const feeTypeController = require("../../controllers/accounting/feeType");
const authMiddlewares = require("../../middlewares/authMiddlewares");
const checkPermission = require("../../middlewares/checkPermission");

router.use(authMiddlewares.protect);

router
  .route("/")
  .get(checkPermission("Read", "AccountingFeeTypes"), feeTypeController.getFeeTypes)
  .post(checkPermission("Create", "AccountingFeeTypes"), feeTypeController.createFeeType);

router
  .route("/:id")
  .get(checkPermission("Read", "AccountingFeeTypes"), feeTypeController.getFeeTypeById)
  .put(checkPermission("Edit", "AccountingFeeTypes"), feeTypeController.updateFeeType)
  .delete(checkPermission("Delete", "AccountingFeeTypes"), feeTypeController.deleteFeeType);

router.patch(
  "/:id/toggle",
  checkPermission("Edit", "AccountingFeeTypes"),
  feeTypeController.toggleFeeType
);

module.exports = router;

