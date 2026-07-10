---
phase: "frontend"
plan: "leave-calendar"
subsystem: "hr"
tags: ["calendar", "leaves", "react-big-calendar", "hr-module"]
requires: ["hr-leaves-api"]
provides: ["visual-leave-calendar"]
affects: ["App.jsx", "Sidebar.jsx", "index.css"]
tech-stack:
  added: ["react-big-calendar@1.18"]
  patterns: ["react-big-calendar date-fns localizer", "eventPropGetter per-event styling", "CSS variable theming for calendar"]
key-files:
  created:
    - frontend/src/pages/hr/HRLeaveCalendar.jsx
  modified:
    - frontend/package.json
    - frontend/package-lock.json
    - frontend/src/index.css
    - frontend/src/App.jsx
    - frontend/src/components/layout/Sidebar.jsx
decisions:
  - "react-big-calendar chosen over @fullcalendar/react (lighter bundle, simpler event color API)"
  - "Month-only view (week/day omitted for MVP simplicity)"
metrics:
  duration: "~15 minutes"
  completed: "2026-07-10"
  commits: 5
---

# Phase Frontend Plan: Leave Calendar Summary

**Leave Calendar** — Month-view calendar showing all approved leave requests, color-coded by leave type, using react-big-calendar with date-fns localizer.

---

## What Was Built

A new HR page (`/hr/leave-calendar`) that provides a visual month-grid calendar of all approved leave requests. Each leave event is displayed as a colored bar styled by leave type (Sick Leave = red, Vacation = blue, Casual Leave = amber, etc.).

### Key Implementation Details

- **Library:** `react-big-calendar` (~25 KB gzipped) with built-in `date-fns` localizer (date-fns already a project dependency)
- **Localizer:** Uses `dateFnsLocalizer` with `format`, `parse`, `startOfWeek`, `getDay` from date-fns and `enUS` locale
- **Event Mapping:** `end_date` + 1 day to handle react-big-calendar's exclusive end-date convention
- **Color Mapping:** Static `LEAVE_TYPE_COLORS` map with palette cycling fallback for unknown types
- **Event Styling:** `eventPropGetter` callback applied per-event for leave-type-based background colors
- **Views:** Month-only (`Views.MONTH`) — bird's-eye view of who's on leave

### Component States

| State | Behavior |
|-------|----------|
| **Loading** | Skeleton placeholder (600px height) |
| **Error** | Glass card with `CalendarX` icon, error message, Retry button |
| **Empty** | Overlay on calendar grid with `CalendarCheck` icon, "No approved leaves in this period" |
| **Normal** | Month calendar with colored event bars, popup on days with multiple events |

### Route & Access

- **Path:** `/hr/leave-calendar`
- **Roles:** `admin` and `hr_officer` (via `ProtectedRoute`)
- **Sidebar:** Appears after "Leaves" in both `admin` and `hr_officer` menus

### CSS Theming

The calendar is fully themed with the project's CSS variable system:
- Month view uses `--glass-bg`, `--glass-border`, `--radius-xl`
- Headers use `--color-on-surface-variant`, `--table-border`
- Today highlight uses `--sidebar-active-bg`
- Toolbar buttons use `--glass-bg`, `--glass-border`, `--radius-md`
- Dark mode uses `.dark` overrides for off-range backgrounds

---

## Deviations from Plan

None — plan executed exactly as specified.

---

## Known Stubs

None.

---

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary changes.

---

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `frontend/src/pages/hr/HRLeaveCalendar.jsx` | ✓ Created |
| `frontend/src/App.jsx` route added | ✓ Verified |
| `frontend/src/components/layout/Sidebar.jsx` | ✓ Sidebar items for admin + hr_officer |
| `frontend/src/index.css` overrides | ✓ Appended |
| `react-big-calendar` in package.json | ✓ Installed |
| `npm run build` | ✓ **Build succeeds** (no errors) |
| Commits | ✓ 5 atomic commits |
