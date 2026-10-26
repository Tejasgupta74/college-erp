import Notification from '../models/Notification.js';
import User from '../models/User.js';
import logger from '../config/logger.js';

export const sendNotification = async ({ recipient, title, message, category = 'ANNOUNCEMENT', link = '' }) => {
  try {
    const notification = await Notification.create({
      recipient,
      title,
      message,
      category,
      link,
    });
    return notification;
  } catch (err) {
    logger.error(`[Notification Dispatch Failed]: ${err.message}`, { recipient, title });
    return null;
  }
};

export const broadcastNotification = async ({ role = 'all', title, message, category = 'ANNOUNCEMENT', link = '' }) => {
  try {
    const query = role === 'all' ? { isActive: true } : { role, isActive: true };
    const users = await User.find(query).select('_id');

    const documents = users.map((u) => ({
      recipient: u._id,
      title,
      message,
      category,
      link,
    }));

    if (documents.length > 0) {
      await Notification.insertMany(documents);
    }

    logger.info(`[Notification Broadcast]: Sent to ${documents.length} users with role '${role}'`);
    return documents.length;
  } catch (err) {
    logger.error(`[Broadcast Failed]: ${err.message}`);
    return 0;
  }
};

export default {
  sendNotification,
  broadcastNotification,
};
