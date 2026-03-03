import api from "./axios";

export const notificationAPI = {
  // Get all notifications
  getNotifications: (limit: number = 20, offset: number = 0, unreadOnly: boolean = false) =>
    api.get(`/notifications?limit=${limit}&offset=${offset}&unreadOnly=${unreadOnly}`),

  // Get unread count
  getUnreadCount: () =>
    api.get(`/notifications/count/unread`),

  // Mark notification as read
  markAsRead: (notificationId: string) =>
    api.post(`/notifications/${notificationId}/read`),

  // Mark all as read
  markAllAsRead: () =>
    api.post(`/notifications/read-all`),

  // Delete notification
  deleteNotification: (notificationId: string) =>
    api.delete(`/notifications/${notificationId}`),

  // Create test notification (development)
  createTestNotification: (data: { type: string; title: string; message: string }) =>
    api.post(`/notifications/test`, data),
};
