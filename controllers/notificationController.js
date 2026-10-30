/*
  Jail Management System (JMS) - XianFire Framework
  Notification Center Controller
*/
import { Notification } from "../models/notificationModel.js";

/**
 * List Administrator Notifications
 */
export const listNotifications = async (req, res) => {
  try {
    const filter = req.query.type || "";
    const status = req.query.status || "";

    const where = {};
    if (filter) where.type = filter;
    if (status === "unread") where.is_read = false;
    if (status === "read") where.is_read = true;

    const notifications = await Notification.findAll({
      where,
      order: [["createdAt", "DESC"]]
    });

    const unreadCount = await Notification.count({ where: { is_read: false } });

    res.render("notifications/index", {
      title: "Notification Center | JMS Administrator",
      notifications,
      unreadCount,
      selectedType: filter,
      selectedStatus: status
    });
  } catch (error) {
    console.error("List notifications error:", error);
    req.flash("error_msg", "Error loading notifications.");
    res.redirect("/dashboard");
  }
};

/**
 * Mark Single Notification as Read
 */
export const markAsRead = async (req, res) => {
  const { id } = req.params;

  try {
    const notification = await Notification.findByPk(id);
    if (notification) {
      notification.is_read = true;
      notification.read_at = new Date();
      await notification.save();
    }

    if (req.xhr || req.headers.accept?.includes("json")) {
      return res.json({ success: true });
    }

    // If notification has link, redirect to it
    if (notification && notification.link) {
      return res.redirect(notification.link);
    }

    res.redirect("/notifications");
  } catch (error) {
    console.error("Mark read error:", error);
    res.redirect("/notifications");
  }
};

/**
 * Mark All Notifications as Read
 */
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.update(
      { is_read: true, read_at: new Date() },
      { where: { is_read: false } }
    );

    req.flash("success_msg", "All notifications marked as read.");
    res.redirect("/notifications");
  } catch (error) {
    console.error("Mark all read error:", error);
    req.flash("error_msg", "Failed to update notifications.");
    res.redirect("/notifications");
  }
};

/**
 * API for Header Live Unread Count
 */
export const getUnreadCountApi = async (req, res) => {
  try {
    const count = await Notification.count({ where: { is_read: false } });
    const recent = await Notification.findAll({
      where: { is_read: false },
      order: [["createdAt", "DESC"]],
      limit: 5
    });

    res.json({ unreadCount: count, recent });
  } catch (error) {
    res.status(500).json({ unreadCount: 0, recent: [] });
  }
};

export default {
  listNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCountApi
};

