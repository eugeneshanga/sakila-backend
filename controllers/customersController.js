const db = require('../db');

// Fetch customer by ID
exports.getCustomerById = (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT c.customer_id, c.first_name, c.last_name, c.email, a.address, a.city, a.phone
FROM customer c
JOIN address a ON c.address_id = a.address_id
LIMIT 10 OFFSET ?;
  `;
  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(results[0]);
  });
};
