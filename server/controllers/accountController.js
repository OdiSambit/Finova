const pool = require('../db/pool');

exports.getAccounts = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM accounts WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ accounts: result.rows });
  } catch (error) {
    console.error('GetAccounts error:', error);
    res.status(500).json({ error: 'Server error fetching accounts' });
  }
};

exports.getAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM accounts WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json({ account: result.rows[0] });
  } catch (error) {
    console.error('GetAccount error:', error);
    res.status(500).json({ error: 'Server error fetching account' });
  }
};

exports.createAccount = async (req, res) => {
  try {
    const { account_name, account_type, institution, account_number, balance, currency } = req.body;

    if (!account_name || !account_type) {
      return res.status(400).json({ error: 'account_name and account_type are required' });
    }

    const result = await pool.query(
      `INSERT INTO accounts (user_id, account_name, account_type, institution, account_number, balance, currency)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, account_name, account_type, institution || null, account_number || null, balance || 0, currency || 'INR']
    );

    res.status(201).json({ account: result.rows[0] });
  } catch (error) {
    console.error('CreateAccount error:', error);
    res.status(500).json({ error: 'Server error creating account' });
  }
};

exports.updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { account_name, account_type, institution, account_number, balance, currency } = req.body;

    const existing = await pool.query(
      'SELECT * FROM accounts WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const result = await pool.query(
      `UPDATE accounts SET
        account_name = COALESCE($1, account_name),
        account_type = COALESCE($2, account_type),
        institution = COALESCE($3, institution),
        account_number = COALESCE($4, account_number),
        balance = COALESCE($5, balance),
        currency = COALESCE($6, currency),
        updated_at = NOW()
       WHERE id = $7 AND user_id = $8 RETURNING *`,
      [
        account_name || existing.rows[0].account_name,
        account_type || existing.rows[0].account_type,
        institution !== undefined ? institution : existing.rows[0].institution,
        account_number !== undefined ? account_number : existing.rows[0].account_number,
        balance !== undefined ? balance : existing.rows[0].balance,
        currency || existing.rows[0].currency,
        id,
        req.user.id,
      ]
    );

    res.json({ account: result.rows[0] });
  } catch (error) {
    console.error('UpdateAccount error:', error);
    res.status(500).json({ error: 'Server error updating account' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(
      'SELECT * FROM accounts WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }

    await pool.query('DELETE FROM accounts WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('DeleteAccount error:', error);
    res.status(500).json({ error: 'Server error deleting account' });
  }
};
