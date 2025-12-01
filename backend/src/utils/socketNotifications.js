export const sendRealtimeNotification = (io, receiverId, notification) => {
  io.to(receiverId.toString()).emit("notification:new", notification);

  io.to(receiverId.toString()).emit("notification:count", {
    unread: notification.read ? 0 : 1,
  });
};
