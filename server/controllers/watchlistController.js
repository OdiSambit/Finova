const pool = require('../db/pool');

exports.getWatchlist = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM watchlist WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ watchlist: result.rows });
  } catch (error) {
    console.error('GetWatchlist error:', error);
    res.status(500).json({ error: 'Server error fetching watchlist' });
  }
};

exports.addToWatchlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { asset_name, symbol, current_price, price_change, price_change_percent } = req.body;

    if (!asset_name) {
      return res.status(400).json({ error: 'asset_name is required' });
    }

    const result = await pool.query(
      `INSERT INTO watchlist (user_id, asset_name, symbol, current_price, price_change, price_change_percent)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, asset_name, symbol || null, current_price || null, price_change || null, price_change_percent || null]
    );

    res.status(201).json({ watchlist_item: result.rows[0] });
  } catch (error) {
    console.error('AddToWatchlist error:', error);
    res.status(500).json({ error: 'Server error adding to watchlist' });
  }
};

exports.removeFromWatchlist = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(
      'SELECT * FROM watchlist WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Watchlist item not found' });
    }

    await pool.query('DELETE FROM watchlist WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    res.json({ message: 'Removed from watchlist' });
  } catch (error) {
    console.error('RemoveFromWatchlist error:', error);
    res.status(500).json({ error: 'Server error removing from watchlist' });
  }
};
