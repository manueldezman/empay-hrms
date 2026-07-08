import { useState, useEffect } from 'react';
import api from '../../api/axios';
import PageHeader from '../../components/shared/PageHeader';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';

function useDebounce(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'SALARY_UPDATED', label: 'Salary Updated' },
  { value: 'ROLE_CHANGED', label: 'Role Changed' },
  { value: 'LEAVE_APPROVED', label: 'Leave Approved' },
  { value: 'LEAVE_REJECTED', label: 'Leave Rejected' },
  { value: 'USER_ACTIVATED', label: 'User Activated' },
  { value: 'USER_DEACTIVATED', label: 'User Deactivated' },
  { value: 'USER_DELETED', label: 'User Deleted' },
];

const ACTION_COLORS = {
  SALARY_UPDATED: 'info',
  ROLE_CHANGED: 'warning',
  LEAVE_APPROVED: 'success',
  LEAVE_REJECTED: 'danger',
  USER_ACTIVATED: 'success',
  USER_DEACTIVATED: 'warning',
  USER_DELETED: 'danger',
};

function ActionBadge({ action }) {
  const variant = ACTION_COLORS[action] || 'info';
  const label =
    ACTION_OPTIONS.find((o) => o.value === action)?.label || action;
  return (
    <span
      className={`chip-${variant} inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap`}
    >
      {label}
    </span>
  );
}

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });

  // Filters
  const [userIdFilter, setUserIdFilter] = useState('');
  const debouncedUserId = useDebounce(userIdFilter, 500);
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const limit = 20;

  const fetchLogs = async (page = 1, userId = debouncedUserId) => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (userId) params.user_id = userId;
      if (actionFilter) params.action = actionFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await api.get('/admin/audit-logs', { params });
      const { data, total, page: pg, totalPages } = res.data;
      setLogs(data || []);
      setPagination({ total, page: pg, totalPages });
    } catch {
      setLogs([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs(1, debouncedUserId);
  }, [debouncedUserId, actionFilter, startDate, endDate]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchLogs(newPage);
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleString();
  };

  const renderMetadata = (row) => {
    if (!row.metadata) return '—';
    try {
      const meta =
        typeof row.metadata === 'string'
          ? JSON.parse(row.metadata)
          : row.metadata;
      // Show a brief summary based on action type
      if (row.action === 'SALARY_UPDATED' && meta.newSalary) {
        return `₹${parseFloat(meta.newSalary.basic_salary).toLocaleString()}`;
      }
      if (row.action === 'ROLE_CHANGED') {
        return `${meta.oldRole || '?'} → ${meta.newRole || '?'}`;
      }
      if (
        row.action === 'LEAVE_APPROVED' ||
        row.action === 'LEAVE_REJECTED'
      ) {
        return `Emp #${meta.employeeId || '?'}`;
      }
      return '—';
    } catch {
      return '—';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        subtitle="Track sensitive system actions for compliance and security auditing."
      />

      {/* Filters */}
      <div className="glass-card p-4 fade-in">
        <div className="flex items-center gap-4 flex-wrap">
          {/* User ID filter */}
          <div className="relative w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input
              type="text"
              placeholder="User ID..."
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
              className="input-glass w-full pl-10 pr-4 py-2 text-sm rounded-xl"
            />
          </div>

          {/* Action filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="input-glass px-3 py-2 text-sm rounded-xl min-w-[180px]"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-outline flex-shrink-0" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-glass px-3 py-2 text-sm rounded-xl"
              title="Start date"
            />
            <span className="text-on-surface-variant text-sm">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-glass px-3 py-2 text-sm rounded-xl"
              title="End date"
            />
          </div>

          <span className="text-xs text-on-surface-variant ml-auto">
            {pagination.total} records found
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden fade-in">
        <div className="overflow-x-auto">
          <table className="w-full glass-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Target Type</th>
                <th>Target ID</th>
                <th>Details</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j}>
                          <div className="skeleton h-4 w-24 rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                : logs.length === 0
                  ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-12 text-on-surface-variant"
                    >
                      No audit logs found
                    </td>
                  </tr>
                    )
                  : logs.map((log) => (
                  <tr key={log.id}>
                    <td className="text-xs text-on-surface-variant whitespace-nowrap">
                      {formatTimestamp(log.created_at)}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-on-surface text-sm">
                          {log.full_name || `User #${log.user_id}`}
                        </span>
                      </div>
                    </td>
                    <td>
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="text-sm text-on-surface-variant">
                      {log.target_type}
                    </td>
                    <td className="text-sm text-on-surface-variant">
                      #{log.target_id}
                    </td>
                    <td className="text-sm text-on-surface-variant max-w-[160px] truncate">
                      {renderMetadata(log)}
                    </td>
                    <td className="text-xs text-on-surface-variant font-mono">
                      {log.ip_address}
                    </td>
                  </tr>
                    ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: '1px solid var(--table-border)' }}
          >
            <span className="text-xs text-on-surface-variant">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-1.5 rounded-lg hover:bg-[var(--sidebar-hover)] text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-1.5 rounded-lg hover:bg-[var(--sidebar-hover)] text-on-surface-variant hover:text-on-surface transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
