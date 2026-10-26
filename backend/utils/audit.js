import AuditLog from '../models/AuditLog.js';
import logger from '../config/logger.js';

export const recordAudit = async ({ user, action, resource, resourceId, ip, status = 'SUCCESS', details = {} }) => {
  try {
    await AuditLog.create({
      user: user?._id || null,
      action,
      resource,
      resourceId: resourceId?.toString() || '',
      ip: ip || '',
      status,
      details,
    });
  } catch (err) {
    logger.error(`[Audit Log Failed]: ${err.message}`, { action, resource });
  }
};

export default recordAudit;
