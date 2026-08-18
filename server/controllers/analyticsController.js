const pool = require('../db/pool');

exports.getExpenseAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year = parseInt(req.query.year) || now.getFullYear();

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const totalResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_expenses
       FROM transactions
       WHERE user_id = $1 AND type = 'expense' AND transaction_date >= $2 AND transaction_date <= $3`,
      [userId, startDate, endDate]
    );

    const categoryResult = await pool.query(
      `SELECT category, SUM(amount) AS total
       FROM transactions
       WHERE user_id = $1 AND type = 'expense' AND transaction_date >= $2 AND transaction_date <= $3
       GROUP BY category
       ORDER BY total DESC`,
      [userId, startDate, endDate]
    );

    const daysInMonth = new Date(year, month, 0).getDate();
    const daysPassed = month === now.getMonth() + 1 && year === now.getFullYear()
      ? now.getDate()
      : daysInMonth;

    const avgDaily = daysPassed > 0
      ? Math.round((parseFloat(totalResult.rows[0].total_expenses) / daysPassed) * 100) / 100
      : 0;

    const highestCategory = categoryResult.rows.length > 0 ? categoryResult.rows[0].category : null;

    res.json({
      total_expenses: parseFloat(totalResult.rows[0].total_expenses),
      average_daily: avgDaily,
      highest_category: highestCategory,
      breakdown: categoryResult.rows.map((row) => ({
        category: row.category,
        total: parseFloat(row.total),
      })),
      month,
      year,
    });
  } catch (error) {
    console.error('GetExpenseAnalytics error:', error);
    res.status(500).json({ error: 'Server error fetching expense analytics' });
  }
};

exports.getIncomeAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const year = parseInt(req.query.year) || now.getFullYear();

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const totalResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_income
       FROM transactions
       WHERE user_id = $1 AND type = 'income' AND transaction_date >= $2 AND transaction_date <= $3`,
      [userId, startDate, endDate]
    );

    const categoryResult = await pool.query(
      `SELECT category, SUM(amount) AS total
       FROM transactions
       WHERE user_id = $1 AND type = 'income' AND transaction_date >= $2 AND transaction_date <= $3
       GROUP BY category
       ORDER BY total DESC`,
      [userId, startDate, endDate]
    );

    res.json({
      total_income: parseFloat(totalResult.rows[0].total_income),
      breakdown: categoryResult.rows.map((row) => ({
        category: row.category,
        total: parseFloat(row.total),
      })),
      month,
      year,
    });
  } catch (error) {
    console.error('GetIncomeAnalytics error:', error);
    res.status(500).json({ error: 'Server error fetching income analytics' });
  }
};

exports.getNetWorth = async (req, res) => {
  try {
    const userId = req.user.id;

    const accountsResult = await pool.query(
      'SELECT COALESCE(SUM(balance), 0) AS total_balance FROM accounts WHERE user_id = $1',
      [userId]
    );

    const investmentsResult = await pool.query(
      'SELECT COALESCE(SUM(quantity * current_price), 0) AS total_investment_value FROM investments WHERE user_id = $1',
      [userId]
    );

    const liabilitiesResult = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) AS total_liabilities FROM liabilities WHERE user_id = $1',
      [userId]
    );

    const totalBalance = parseFloat(accountsResult.rows[0].total_balance);
    const totalInvestments = parseFloat(investmentsResult.rows[0].total_investment_value);
    const totalLiabilities = parseFloat(liabilitiesResult.rows[0].total_liabilities);

    const netWorth = totalBalance + totalInvestments - totalLiabilities;

    res.json({
      net_worth: Math.round(netWorth * 100) / 100,
      assets: {
        accounts: totalBalance,
        investments: totalInvestments,
        total: totalBalance + totalInvestments,
      },
      liabilities: totalLiabilities,
    });
  } catch (error) {
    console.error('GetNetWorth error:', error);
    res.status(500).json({ error: 'Server error fetching net worth' });
  }
};

exports.getPortfolioAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT * FROM investments WHERE user_id = $1',
      [userId]
    );

    const investments = result.rows;

    const typeDistribution = {};
    let totalInvested = 0;
    let totalCurrentValue = 0;

    investments.forEach((inv) => {
      const invested = parseFloat(inv.quantity) * parseFloat(inv.buy_price);
      const current = parseFloat(inv.quantity) * parseFloat(inv.current_price);
      totalInvested += invested;
      totalCurrentValue += current;

      if (!typeDistribution[inv.asset_type]) {
        typeDistribution[inv.asset_type] = { count: 0, invested: 0, currentValue: 0 };
      }
      typeDistribution[inv.asset_type].count++;
      typeDistribution[inv.asset_type].invested += invested;
      typeDistribution[inv.asset_type].currentValue += current;
    });

    Object.keys(typeDistribution).forEach((key) => {
      typeDistribution[key].invested = Math.round(typeDistribution[key].invested * 100) / 100;
      typeDistribution[key].currentValue = Math.round(typeDistribution[key].currentValue * 100) / 100;
    });

    const sortedByPerformance = [...investments].sort((a, b) => {
      const aReturn = ((parseFloat(a.current_price) - parseFloat(a.buy_price)) / parseFloat(a.buy_price)) * 100;
      const bReturn = ((parseFloat(b.current_price) - parseFloat(b.buy_price)) / parseFloat(b.buy_price)) * 100;
      return bReturn - aReturn;
    });

    const topPerformers = sortedByPerformance.slice(0, 5).map((inv) => {
      const returnPct = ((parseFloat(inv.current_price) - parseFloat(inv.buy_price)) / parseFloat(inv.buy_price)) * 100;
      return {
        ...inv,
        return_percentage: Math.round(returnPct * 100) / 100,
      };
    });

    const overallReturn = totalInvested > 0
      ? Math.round(((totalCurrentValue - totalInvested) / totalInvested) * 10000) / 100
      : 0;

    res.json({
      type_distribution: typeDistribution,
      top_performers: topPerformers,
      overall_return: overallReturn,
      total_invested: Math.round(totalInvested * 100) / 100,
      current_value: Math.round(totalCurrentValue * 100) / 100,
    });
  } catch (error) {
    console.error('GetPortfolioAnalytics error:', error);
    res.status(500).json({ error: 'Server error fetching portfolio analytics' });
  }
};

exports.getMonthlyTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        label: d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      });
    }

    const trends = await Promise.all(
      months.map(async (m) => {
        const startDate = `${m.year}-${String(m.month).padStart(2, '0')}-01`;
        const endDate = new Date(m.year, m.month, 0).toISOString().split('T')[0];

        const incomeResult = await pool.query(
          `SELECT COALESCE(SUM(amount), 0) AS total
           FROM transactions
           WHERE user_id = $1 AND type = 'income' AND transaction_date >= $2 AND transaction_date <= $3`,
          [userId, startDate, endDate]
        );

        const expenseResult = await pool.query(
          `SELECT COALESCE(SUM(amount), 0) AS total
           FROM transactions
           WHERE user_id = $1 AND type = 'expense' AND transaction_date >= $2 AND transaction_date <= $3`,
          [userId, startDate, endDate]
        );

        return {
          month: m.month,
          year: m.year,
          label: m.label,
          income: parseFloat(incomeResult.rows[0].total),
          expense: parseFloat(expenseResult.rows[0].total),
          savings: parseFloat(incomeResult.rows[0].total) - parseFloat(expenseResult.rows[0].total),
        };
      })
    );

    res.json({ trends });
  } catch (error) {
    console.error('GetMonthlyTrends error:', error);
    res.status(500).json({ error: 'Server error fetching monthly trends' });
  }
};
