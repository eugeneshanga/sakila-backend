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

// REST GET CALLS 
app.get('/', (req, res) => {
    res.send('API is running...');
});

//Landing Page 
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

//Film Page
app.get('/search-films', (req, res) => {
    const { query } = req.query; // Get search query from frontend

    console.log("Search query received:", query); // debug 
    if (!query || query.trim() === ''){
        return res.status(400).json({ error: 'Search query cannot be empty' });
    }
    const sql = `
        SELECT DISTINCT f.film_id, f.title, f.description, c.name AS category, 
               GROUP_CONCAT(CONCAT(a.first_name, ' ', a.last_name)) AS actors
        FROM film f
        LEFT JOIN film_actor fa ON f.film_id = fa.film_id
        LEFT JOIN actor a ON fa.actor_id = a.actor_id
        LEFT JOIN film_category fc ON f.film_id = fc.film_id
        LEFT JOIN category c ON fc.category_id = c.category_id
        WHERE f.title LIKE ? 
        OR a.first_name LIKE ? 
        OR a.last_name LIKE ? 
        OR c.name LIKE ?
        GROUP BY f.film_id, c.name
    `;

    const searchTerm = `%${query}%`; // Wildcard search
    db.query(sql, [searchTerm, searchTerm, searchTerm, searchTerm], (err, results) => {
        if (err) {
            console.error("Database error", err);
            return res.status(500).json({ error: err.message });
        }
        console.log("Query Results:", results);
        res.json(results || []);
    });
});


//Customer Page 


const PORT = process.env.PORT || 5000;
app.listen(5000, () => {
    console.log('Server running on port 5000');
});
