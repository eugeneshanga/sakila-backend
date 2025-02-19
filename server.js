const express = require('express');
const cors = require('cors');
const db = require('./db');
const filmsRoutes = require('./routes/films');
const customersRoutes = require('./routes/customers');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/films', filmsRoutes)
app.use('/customers', customersRoutes);

// In server.js (backend)
app.get('/top-rented-films', (req, res) => {
    const query = `
      SELECT f.title, COUNT(r.rental_id) AS rental_count
      FROM film f
      JOIN inventory i ON f.film_id = i.film_id
      JOIN rental r ON i.inventory_id = r.inventory_id
      GROUP BY f.title
      ORDER BY rental_count DESC
      LIMIT 5;
    `;
  
    db.query(query, (err, results) => {
      if (err) throw err;
      res.json(results); // Send the result to the frontend
    });
  });

const PORT = process.env.PORT || 5000;
app.listen(5000, () => {
    console.log('Server running on port 5000');
});
