const validate = (fields) => {
  return (req, res, next) => {
    const missing = fields.filter((field) => {
      return req.body[field] === undefined || req.body[field] === null || req.body[field] === '';
    });

    if (missing.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missing.join(', ')}`,
      });
    }
    next();
  };
};

module.exports = validate;
