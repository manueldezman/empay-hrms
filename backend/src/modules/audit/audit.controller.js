const auditService = require('./audit.service');

const getAuditLogs = async (req, res) => {
  try {
    const result = await auditService.getAll(req.query);
    res.json({ success: true, message: 'Audit logs fetched', ...result });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ success: false, message: error.message || 'Failed to fetch audit logs' });
  }
};

module.exports = { getAuditLogs };
