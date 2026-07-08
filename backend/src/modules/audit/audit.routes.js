const express = require('express');
const router = express.Router();
const auditController = require('./audit.controller');
const authMiddleware = require('../../middleware/auth');
const roleGuard = require('../../middleware/roleGuard');

router.use(authMiddleware);

// Admin-only: view audit logs with filtering & pagination
router.get('/', roleGuard(['admin']), auditController.getAuditLogs);

module.exports = router;
