export const PERMISSIONS = {
  // Academics
  MANAGE_DEPARTMENTS: 'MANAGE_DEPARTMENTS',
  MANAGE_COURSES: 'MANAGE_COURSES',
  VIEW_COURSES: 'VIEW_COURSES',

  // Students & Faculty
  MANAGE_STUDENTS: 'MANAGE_STUDENTS',
  VIEW_STUDENTS: 'VIEW_STUDENTS',
  MANAGE_FACULTY: 'MANAGE_FACULTY',
  VIEW_FACULTY: 'VIEW_FACULTY',

  // Attendance
  MARK_ATTENDANCE: 'MARK_ATTENDANCE',
  VIEW_ATTENDANCE: 'VIEW_ATTENDANCE',

  // Fees
  ISSUE_FEES: 'ISSUE_FEES',
  SETTLE_FEES: 'SETTLE_FEES',
  PAY_FEES: 'PAY_FEES',
  VIEW_FEES: 'VIEW_FEES',

  // Exams
  SCHEDULE_EXAMS: 'SCHEDULE_EXAMS',
  GRADE_EXAMS: 'GRADE_EXAMS',
  VIEW_GRADES: 'VIEW_GRADES',

  // Notices & Audit
  POST_NOTICES: 'POST_NOTICES',
  DELETE_NOTICES: 'DELETE_NOTICES',
  VIEW_NOTICES: 'VIEW_NOTICES',
  VIEW_AUDIT_LOGS: 'VIEW_AUDIT_LOGS',
};

// Role-to-Permissions Mapping
export const ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS),

  faculty: [
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.VIEW_FACULTY,
    PERMISSIONS.MARK_ATTENDANCE,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.SCHEDULE_EXAMS,
    PERMISSIONS.GRADE_EXAMS,
    PERMISSIONS.VIEW_GRADES,
    PERMISSIONS.POST_NOTICES,
    PERMISSIONS.VIEW_NOTICES,
  ],

  student: [
    PERMISSIONS.VIEW_COURSES,
    PERMISSIONS.VIEW_ATTENDANCE,
    PERMISSIONS.VIEW_FEES,
    PERMISSIONS.PAY_FEES,
    PERMISSIONS.VIEW_GRADES,
    PERMISSIONS.VIEW_NOTICES,
  ],

  accountant: [
    PERMISSIONS.VIEW_STUDENTS,
    PERMISSIONS.ISSUE_FEES,
    PERMISSIONS.SETTLE_FEES,
    PERMISSIONS.VIEW_FEES,
    PERMISSIONS.VIEW_NOTICES,
  ],
};

/**
 * Check if the authenticated user has required granular permission
 * @param  {...string} requiredPermissions
 */
export const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHENTICATED',
        message: 'Authentication required for this operation',
      });
    }

    const userPerms = ROLE_PERMISSIONS[req.user.role] || [];
    const hasAll = requiredPermissions.every((perm) => userPerms.includes(perm));

    if (!hasAll) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN_PERMISSION',
        message: `Your role (${req.user.role}) lacks required permission: ${requiredPermissions.join(', ')}`,
      });
    }

    next();
  };
};
