const { pool } = require('../../config/db');

class AuditService {
  /**
   * Log an auditable event.
   * @param {Object} params
   * @param {number} params.userId   - The user who performed the action
   * @param {string} params.action   - e.g. 'SALARY_UPDATED', 'ROLE_CHANGED', 'LEAVE_APPROVED'
   * @param {number} params.targetId - ID of the entity affected
   * @param {string} params.targetType - e.g. 'EMPLOYEE', 'USER', 'LEAVE_REQUEST'
   * @param {Object} [params.metadata] - Arbitrary JSON payload (old/new values, etc.)
   * @param {string} params.ipAddress - Client IP
   * @returns {Promise<Object>} The created audit_log row
   */
  async log({ userId, action, targetId, targetType, metadata, ipAddress }) {
    const result = await pool.query(
      `INSERT INTO audit_logs (user_id, action, target_id, target_type, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userId,
        action,
        targetId,
        targetType,
        metadata ? JSON.stringify(metadata) : null,
        ipAddress || 'unknown',
      ]
    );
    return result.rows[0];
  }

  /**
   * Extract client IP from an Express request object.
   */
  extractIp(req) {
    return (
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Query audit logs with filters and pagination.
   * @param {Object} filters
   * @param {number} [filters.user_id]
   * @param {string} [filters.action]
   * @param {string} [filters.target_type]
   * @param {string} [filters.start_date]  ISO date string
   * @param {string} [filters.end_date]    ISO date string
   * @param {number} [filters.page]        default 1
   * @param {number} [filters.limit]       default 20, max 50
   * @returns {Promise<{data: Object[], total: number, page: number, totalPages: number}>}
   */
  async getAll(filters = {}) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (filters.user_id) {
      conditions.push(`al.user_id = $${paramIndex++}`);
      params.push(parseInt(filters.user_id, 10));
    }
    if (filters.action) {
      conditions.push(`al.action = $${paramIndex++}`);
      params.push(filters.action);
    }
    if (filters.target_type) {
      conditions.push(`al.target_type = $${paramIndex++}`);
      params.push(filters.target_type);
    }
    if (filters.start_date) {
      conditions.push(`al.created_at >= $${paramIndex++}`);
      params.push(filters.start_date);
    }
    if (filters.end_date) {
      conditions.push(`al.created_at <= $${paramIndex++}`);
      params.push(filters.end_date + 'T23:59:59Z');
    }

    const whereClause =
      conditions.length > 0 ? ' WHERE ' + conditions.join(' AND ') : '';

    // Total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM audit_logs al${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Pagination
    const page = Math.max(1, parseInt(filters.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(filters.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const dataResult = await pool.query(
      `SELECT al.*, u.full_name, u.email
       FROM audit_logs al
       LEFT JOIN users u ON al.user_id = u.id
       ${whereClause}
       ORDER BY al.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    return {
      data: dataResult.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}

module.exports = new AuditService();
