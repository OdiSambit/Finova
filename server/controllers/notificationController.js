const pool = require('../db/pool');

const createNotification = async (userId, title, message, type = 'info') => {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)`,
      [userId, title, message, type]
    );
  } catch (error) {
    console.error('CreateNotification error:', error);
  }
};

exports.createNotification = createNotification;

exports.getNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ notifications: result.rows });
  } catch (error) {
    console.error('GetNotifications error:', error);
    res.status(500).json({ error: 'Server error fetching notifications' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(
      'SELECT * FROM notifications WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );

    res.json({ notification: result.rows[0] });
  } catch (error) {
    console.error('MarkAsRead error:', error);
    res.status(500).json({ error: 'Server error marking notification as read' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );
    res.json({ unread_count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('GetUnreadCount error:', error);
    res.status(500).json({ error: 'Server error fetching unread count' });
  }
};
