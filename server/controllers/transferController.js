const pool = require('../db/pool');

exports.createTransfer = async (req, res) => {
  try {
    const userId = req.user.id;
    const { from_account_id, to_account_id, amount, description } = req.body;

    if (!from_account_id || !to_account_id || !amount) {
      return res.status(400).json({ error: 'from_account_id, to_account_id, and amount are required' });
    }

    if (from_account_id === to_account_id) {
      return res.status(400).json({ error: 'Cannot transfer to the same account' });
    }

    const amountNum = parseFloat(amount);
    if (amountNum <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const fromAccount = await pool.query(
      'SELECT * FROM accounts WHERE id = $1 AND user_id = $2',
      [from_account_id, userId]
    );

    if (fromAccount.rows.length === 0) {
      return res.status(404).json({ error: 'Source account not found' });
    }

    const toAccount = await pool.query(
      'SELECT * FROM accounts WHERE id = $1 AND user_id = $2',
      [to_account_id, userId]
    );

    if (toAccount.rows.length === 0) {
      return res.status(404).json({ error: 'Destination account not found' });
    }

    if (parseFloat(fromAccount.rows[0].balance) < amountNum) {
      return res.status(400).json({ error: 'Insufficient balance in source account' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const newFromBalance = parseFloat(fromAccount.rows[0].balance) - amountNum;
      const newToBalance = parseFloat(toAccount.rows[0].balance) + amountNum;

      await client.query(
        'UPDATE accounts SET balance = $1, updated_at = NOW() WHERE id = $2',
        [newFromBalance, from_account_id]
      );

      await client.query(
        'UPDATE accounts SET balance = $1, updated_at = NOW() WHERE id = $2',
        [newToBalance, to_account_id]
      );

      const transferResult = await client.query(
        `INSERT INTO transfers (user_id, from_account_id, to_account_id, amount, description)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [userId, from_account_id, to_account_id, amountNum, description || null]
      );

      await client.query(
        `INSERT INTO transactions (account_id, user_id, type, category, amount, description, transaction_date, status)
         VALUES ($1, $2, 'expense', 'transfer', $3, $4, CURRENT_DATE, 'completed')`,
        [from_account_id, userId, amountNum, `Transfer to ${toAccount.rows[0].account_name}`]
      );

      await client.query(
        `INSERT INTO transactions (account_id, user_id, type, category, amount, description, transaction_date, status)
         VALUES ($1, $2, 'income', 'transfer', $3, $4, CURRENT_DATE, 'completed')`,
        [to_account_id, userId, amountNum, `Transfer from ${fromAccount.rows[0].account_name}`]
      );

      await client.query('COMMIT');

      res.status(201).json({ transfer: transferResult.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('CreateTransfer error:', error);
    res.status(500).json({ error: 'Server error creating transfer' });
  }
};

exports.getTransfers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT tr.*,
        fa.account_name AS from_account_name,
        ta.account_name AS to_account_name
       FROM transfers tr
       LEFT JOIN accounts fa ON tr.from_account_id = fa.id
       LEFT JOIN accounts ta ON tr.to_account_id = ta.id
       WHERE tr.user_id = $1
       ORDER BY tr.created_at DESC`,
      [req.user.id]
    );

    res.json({ transfers: result.rows });
  } catch (error) {
    console.error('GetTransfers error:', error);
    res.status(500).json({ error: 'Server error fetching transfers' });
  }
};
