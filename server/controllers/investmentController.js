const pool = require('../db/pool');

exports.getInvestments = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM investments WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ investments: result.rows });
  } catch (error) {
    console.error('GetInvestments error:', error);
    res.status(500).json({ error: 'Server error fetching investments' });
  }
};

exports.getInvestment = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM investments WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    res.json({ investment: result.rows[0] });
  } catch (error) {
    console.error('GetInvestment error:', error);
    res.status(500).json({ error: 'Server error fetching investment' });
  }
};

exports.createInvestment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { asset_name, asset_type, symbol, quantity, buy_price, current_price } = req.body;

    if (!asset_name || !asset_type || !quantity || !buy_price || !current_price) {
      return res.status(400).json({ error: 'asset_name, asset_type, quantity, buy_price, and current_price are required' });
    }

    const result = await pool.query(
      `INSERT INTO investments (user_id, asset_name, asset_type, symbol, quantity, buy_price, current_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [userId, asset_name, asset_type, symbol || null, quantity, buy_price, current_price]
    );

    res.status(201).json({ investment: result.rows[0] });
  } catch (error) {
    console.error('CreateInvestment error:', error);
    res.status(500).json({ error: 'Server error creating investment' });
  }
};

exports.updateInvestment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await pool.query(
      'SELECT * FROM investments WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    const { asset_name, asset_type, symbol, quantity, buy_price, current_price } = req.body;
    const current = existing.rows[0];

    const result = await pool.query(
      `UPDATE investments SET
        asset_name = $1, asset_type = $2, symbol = $3,
        quantity = $4, buy_price = $5, current_price = $6,
        updated_at = NOW()
       WHERE id = $7 AND user_id = $8 RETURNING *`,
      [
        asset_name || current.asset_name,
        asset_type || current.asset_type,
        symbol !== undefined ? symbol : current.symbol,
        quantity || current.quantity,
        buy_price || current.buy_price,
        current_price || current.current_price,
        id,
        userId,
      ]
    );

    res.json({ investment: result.rows[0] });
  } catch (error) {
    console.error('UpdateInvestment error:', error);
    res.status(500).json({ error: 'Server error updating investment' });
  }
};

exports.deleteInvestment = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(
      'SELECT * FROM investments WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    await pool.query('DELETE FROM investments WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    res.json({ message: 'Investment deleted successfully' });
  } catch (error) {
    console.error('DeleteInvestment error:', error);
    res.status(500).json({ error: 'Server error deleting investment' });
  }
};

exports.getPortfolioSummary = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM investments WHERE user_id = $1',
      [req.user.id]
    );

    const investments = result.rows;
    let totalInvested = 0;
    let totalCurrentValue = 0;

    investments.forEach((inv) => {
      const invested = parseFloat(inv.quantity) * parseFloat(inv.buy_price);
      const current = parseFloat(inv.quantity) * parseFloat(inv.current_price);
      totalInvested += invested;
      totalCurrentValue += current;
    });

    const profitLoss = totalCurrentValue - totalInvested;
    const returnPercentage = totalInvested > 0
      ? Math.round((profitLoss / totalInvested) * 10000) / 100
      : 0;

    const byType = {};
    investments.forEach((inv) => {
      if (!byType[inv.asset_type]) {
        byType[inv.asset_type] = { invested: 0, currentValue: 0 };
      }
      byType[inv.asset_type].invested += parseFloat(inv.quantity) * parseFloat(inv.buy_price);
      byType[inv.asset_type].currentValue += parseFloat(inv.quantity) * parseFloat(inv.current_price);
    });

    res.json({
      summary: {
        total_invested: Math.round(totalInvested * 100) / 100,
        current_value: Math.round(totalCurrentValue * 100) / 100,
        profit_loss: Math.round(profitLoss * 100) / 100,
        return_percentage: returnPercentage,
        total_investments: investments.length,
        by_type: byType,
      },
    });
  } catch (error) {
    console.error('GetPortfolioSummary error:', error);
    res.status(500).json({ error: 'Server error fetching portfolio summary' });
  }
};
