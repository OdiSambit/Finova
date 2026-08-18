const pool = require('../db/pool');

exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      category,
      type,
      account_id,
      start_date,
      end_date,
      search,
      sort_by = 'transaction_date',
      sort_order = 'DESC',
      limit = 20,
      offset = 0,
    } = req.query;

    let whereConditions = ['t.user_id = $1'];
    let params = [userId];
    let paramIndex = 2;

    if (category) {
      whereConditions.push(`t.category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    if (type) {
      whereConditions.push(`t.type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    if (account_id) {
      whereConditions.push(`t.account_id = $${paramIndex}`);
      params.push(account_id);
      paramIndex++;
    }

    if (start_date) {
      whereConditions.push(`t.transaction_date >= $${paramIndex}`);
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      whereConditions.push(`t.transaction_date <= $${paramIndex}`);
      params.push(end_date);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(`t.description ILIKE $${paramIndex}`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const allowedSorts = ['transaction_date', 'amount', 'created_at', 'category'];
    const safeSortBy = allowedSorts.includes(sort_by) ? sort_by : 'transaction_date';
    const safeSortOrder = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM transactions t WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await pool.query(
      `SELECT t.*, a.account_name
       FROM transactions t
       LEFT JOIN accounts a ON t.account_id = a.id
       WHERE ${whereClause}
       ORDER BY t.${safeSortBy} ${safeSortOrder}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    res.json({
      transactions: dataResult.rows,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('GetTransactions error:', error);
    res.status(500).json({ error: 'Server error fetching transactions' });
  }
};

exports.getTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT t.*, a.account_name
       FROM transactions t
       LEFT JOIN accounts a ON t.account_id = a.id
       WHERE t.id = $1 AND t.user_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ transaction: result.rows[0] });
  } catch (error) {
    console.error('GetTransaction error:', error);
    res.status(500).json({ error: 'Server error fetching transaction' });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { account_id, type, category, amount, description, transaction_date, status } = req.body;

    if (!account_id || !type || !category || !amount) {
      return res.status(400).json({ error: 'account_id, type, category, and amount are required' });
    }

    if (!['income', 'expense', 'transfer'].includes(type)) {
      return res.status(400).json({ error: 'type must be income, expense, or transfer' });
    }

    const accountResult = await pool.query(
      'SELECT * FROM accounts WHERE id = $1 AND user_id = $2',
      [account_id, userId]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const account = accountResult.rows[0];
    const amountNum = parseFloat(amount);

    let newBalance = parseFloat(account.balance);
    if (type === 'income') {
      newBalance += amountNum;
    } else if (type === 'expense') {
      newBalance -= amountNum;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const txResult = await client.query(
        `INSERT INTO transactions (account_id, user_id, type, category, amount, description, transaction_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          account_id,
          userId,
          type,
          category,
          amountNum,
          description || null,
          transaction_date || new Date().toISOString().split('T')[0],
          status || 'completed',
        ]
      );

      await client.query(
        'UPDATE accounts SET balance = $1, updated_at = NOW() WHERE id = $2',
        [newBalance, account_id]
      );

      await client.query('COMMIT');

      res.status(201).json({ transaction: txResult.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('CreateTransaction error:', error);
    res.status(500).json({ error: 'Server error creating transaction' });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await pool.query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const oldTx = existing.rows[0];
    const { type, category, amount, description, transaction_date, status } = req.body;

    const newType = type || oldTx.type;
    const newAmount = amount ? parseFloat(amount) : parseFloat(oldTx.amount);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const accountResult = await client.query(
        'SELECT * FROM accounts WHERE id = $1 AND user_id = $2',
        [oldTx.account_id, userId]
      );
      const account = accountResult.rows[0];
      let balance = parseFloat(account.balance);

      if (oldTx.type === 'income') {
        balance -= parseFloat(oldTx.amount);
      } else if (oldTx.type === 'expense') {
        balance += parseFloat(oldTx.amount);
      }

      if (newType === 'income') {
        balance += newAmount;
      } else if (newType === 'expense') {
        balance -= newAmount;
      }

      const txResult = await client.query(
        `UPDATE transactions SET
          type = $1, category = $2, amount = $3, description = $4,
          transaction_date = $5, status = $6, updated_at = NOW()
         WHERE id = $7 AND user_id = $8 RETURNING *`,
        [
          newType,
          category || oldTx.category,
          newAmount,
          description !== undefined ? description : oldTx.description,
          transaction_date || oldTx.transaction_date,
          status || oldTx.status,
          id,
          userId,
        ]
      );

      await client.query(
        'UPDATE accounts SET balance = $1, updated_at = NOW() WHERE id = $2',
        [balance, oldTx.account_id]
      );

      await client.query('COMMIT');

      res.json({ transaction: txResult.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('UpdateTransaction error:', error);
    res.status(500).json({ error: 'Server error updating transaction' });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await pool.query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const tx = existing.rows[0];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const accountResult = await client.query(
        'SELECT * FROM accounts WHERE id = $1 AND user_id = $2',
        [tx.account_id, userId]
      );
      const account = accountResult.rows[0];
      let balance = parseFloat(account.balance);

      if (tx.type === 'income') {
        balance -= parseFloat(tx.amount);
      } else if (tx.type === 'expense') {
        balance += parseFloat(tx.amount);
      }

      await client.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);

      await client.query(
        'UPDATE accounts SET balance = $1, updated_at = NOW() WHERE id = $2',
        [balance, tx.account_id]
      );

      await client.query('COMMIT');

      res.json({ message: 'Transaction deleted successfully' });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('DeleteTransaction error:', error);
    res.status(500).json({ error: 'Server error deleting transaction' });
  }
};
