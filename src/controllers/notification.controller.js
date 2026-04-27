export const getMyNotifications = async (req, res) => {
  res.json({
    success: true,
    message: "Notifications fetched",
    data: []
  });
};

export const markAsRead = async (req, res) => {
  res.json({
    success: true,
    message: "Notification marked as read",
    id: req.params.id
  });
};

export const markAllAsRead = async (req, res) => {
  res.json({
    success: true,
    message: "All notifications marked as read"
  });
};

export const sendNotification = async (req, res) => {
  res.json({
    success: true,
    message: "Notification sent",
    data: req.body
  });
};