const express = require("express");
const router = express.Router();
const salaryTypeController = require("../../controllers/accounting/salaryType");
const authMiddlewares = require("../../middlewares/authMiddlewares");
const checkPermission = require("../../middlewares/checkPermission");

router.use(authMiddlewares.protect);

router
  .route("/")
  .get(checkPermission("Read", "AccountingSalaryTypes"), salaryTypeController.getSalaryTypes)
  .post(checkPermission("Create", "AccountingSalaryTypes"), salaryTypeController.createSalaryType);

router
  .route("/:id")
  .get(checkPermission("Read", "AccountingSalaryTypes"), salaryTypeController.getSalaryTypeById)
  .put(checkPermission("Edit", "AccountingSalaryTypes"), salaryTypeController.updateSalaryType)
  .delete(checkPermission("Delete", "AccountingSalaryTypes"), salaryTypeController.deleteSalaryType);

router.patch(
  "/:id/toggle",
  checkPermission("Edit", "AccountingSalaryTypes"),
  salaryTypeController.toggleSalaryType
);

module.exports = router;

