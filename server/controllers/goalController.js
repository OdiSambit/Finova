const pool = require('../db/pool');

const calculateGoalStatus = (goal) => {
  if (parseFloat(goal.current_amount) >= parseFloat(goal.target_amount)) {
    return 'completed';
  }
  if (goal.deadline) {
    const deadline = new Date(goal.deadline);
    const now = new Date();
    const progressPercent = (parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100;
    const timeLeft = deadline - now;
    const totalDuration = deadline - new Date(goal.created_at);
    const timeProgress = (1 - timeLeft / totalDuration) * 100;

    if (timeProgress > progressPercent + 10) {
      return 'behind';
    }
  }
  return 'on_track';
};

exports.getGoals = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );

    const goals = result.rows.map((goal) => {
      const status = calculateGoalStatus(goal);
      return { ...goal, status };
    });

    res.json({ goals });
  } catch (error) {
    console.error('GetGoals error:', error);
    res.status(500).json({ error: 'Server error fetching goals' });
  }
};

exports.createGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, target_amount, current_amount, deadline, icon } = req.body;

    if (!name || !target_amount) {
      return res.status(400).json({ error: 'name and target_amount are required' });
    }

    const result = await pool.query(
      `INSERT INTO goals (user_id, name, target_amount, current_amount, deadline, icon)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, name, target_amount, current_amount || 0, deadline || null, icon || null]
    );

    res.status(201).json({ goal: result.rows[0] });
  } catch (error) {
    console.error('CreateGoal error:', error);
    res.status(500).json({ error: 'Server error creating goal' });
  }
};

exports.updateGoal = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await pool.query(
      'SELECT * FROM goals WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const current = existing.rows[0];
    const { name, target_amount, current_amount, deadline, icon } = req.body;

    const updatedGoal = {
      name: name || current.name,
      target_amount: target_amount || current.target_amount,
      current_amount: current_amount !== undefined ? current_amount : current.current_amount,
      deadline: deadline !== undefined ? deadline : current.deadline,
      icon: icon !== undefined ? icon : current.icon,
    };

    const result = await pool.query(
      `UPDATE goals SET
        name = $1, target_amount = $2, current_amount = $3,
        deadline = $4, icon = $5, updated_at = NOW()
       WHERE id = $6 AND user_id = $7 RETURNING *`,
      [updatedGoal.name, updatedGoal.target_amount, updatedGoal.current_amount, updatedGoal.deadline, updatedGoal.icon, id, userId]
    );

    res.json({ goal: result.rows[0] });
  } catch (error) {
    console.error('UpdateGoal error:', error);
    res.status(500).json({ error: 'Server error updating goal' });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await pool.query(
      'SELECT * FROM goals WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    await pool.query('DELETE FROM goals WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('DeleteGoal error:', error);
    res.status(500).json({ error: 'Server error deleting goal' });
  }
};
