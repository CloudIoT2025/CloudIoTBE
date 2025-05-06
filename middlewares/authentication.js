const pool = require('../utils/db');

const authenticate = async (req, res, next) => {
  const userId = req.headers['x-user-id'];
  try {
    if (userId) {
      const [rows] = await pool.query('SELECT id FROM users WHERE id = ?', [
        userId,
      ]);
      if (userId === rows[0].id.toString()) {
        req.user = userId;
        next();
      } else {
        res.set('WWW-Authenticate', 'Bearer');
        return res.status(401).json({ error: 'Unauthorized' });
      }
    } else {
      res.set('WWW-Authenticate', 'Bearer');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  } catch (error) {
    console.error(error);
    res.set('WWW-Authenticate', 'Bearer');
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

module.exports = authenticate;
