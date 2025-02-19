const db = require('../db');

// Fetch customer by ID
exports.getCustomerById = (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT customer_id, first_name, last_name, email, address, phone
    FROM customer
    WHERE customer_id = ?
  `;
  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(results[0]);
  });
};
