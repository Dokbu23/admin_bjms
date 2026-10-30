/*
  Jail Management System (JMS) - XianFire Framework
  Notification Service
*/
import { Notification } from "../models/notificationModel.js";

/**
 * Create a system or security notification.
 * @param {Object} data
 * @param {string} data.title
 * @param {string} data.message
 * @param {string} [data.type] 'security' | 'system' | 'pdl' | 'personnel' | 'backup'
 * @param {string} [data.link]
 * @param {number} [data.user_id]
 */
export async function createNotification(data) {
  try {
    return await Notification.create({
      title: data.title,
      message: data.message,
      type: data.type || "system",
      link: data.link || null,
      userId: data.user_id || null,
      is_read: false
    });
  } catch (error) {
    console.error("❌ Failed to create notification:", error);
    return null;
  }
}

/**
 * Fetch unread notification count
 */
export async function getUnreadCount(userId = null) {
  try {
    return await Notification.count({
      where: { is_read: false }
    });
  } catch (error) {
    return 0;
  }
}

export default {
  createNotification,
  getUnreadCount
};

