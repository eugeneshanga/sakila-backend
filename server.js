const express = require('express');
const cors = require('cors');
const db = require('./db');
const filmsRoutes = require('./routes/films');
const customersRoutes = require('./routes/customers');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/films', filmsRoutes);
app.use('/customers', customersRoutes);

// REST GET CALLS 
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Landing Page

// Top Rented Films
app.get('/top-rented-films', (req, res) => {
    const query = `
      SELECT f.film_id, f.title, COUNT(r.rental_id) AS rental_count
      FROM film f
      JOIN inventory i ON f.film_id = i.film_id
      JOIN rental r ON i.inventory_id = r.inventory_id
      GROUP BY f.film_id, f.title
      ORDER BY rental_count DESC
      LIMIT 5;
    `;
  
    db.query(query, (err, results) => {
      if (err) throw err;
      res.json(results);
    });
});

// Get Film Details by ID
app.get('/film/:id', (req, res) => {
    const filmId = req.params.id;
    const sql = `
       SELECT f.film_id, f.title, f.description, f.release_year, f.rating, 
              GROUP_CONCAT(DISTINCT c.name) AS categories, 
              GROUP_CONCAT(DISTINCT CONCAT(a.first_name, ' ', a.last_name)) AS actors
       FROM film f
       LEFT JOIN film_category fc ON f.film_id = fc.film_id
       LEFT JOIN category c ON fc.category_id = c.category_id
       LEFT JOIN film_actor fa ON f.film_id = fa.film_id
       LEFT JOIN actor a ON fa.actor_id = a.actor_id
       WHERE f.film_id = ?
       GROUP BY f.film_id;
    `;
    db.query(sql, [filmId], (err, results) => {
        if (err) {
            console.error("Error fetching film details:", err);
            return res.status(500).json({ error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: "Film not found" });
        }
        res.json(results[0]);
    });
});

//Get top actors 
app.get('/top-actors', (req, res) => {
    const sql = `
      SELECT a.actor_id, CONCAT(a.first_name, ' ', a.last_name) AS actor_name, 
             COUNT(DISTINCT f.film_id) AS film_count
      FROM actor a
      JOIN film_actor fa ON a.actor_id = fa.actor_id
      JOIN film f ON fa.film_id = f.film_id
      JOIN inventory i ON f.film_id = i.film_id
      GROUP BY a.actor_id, actor_name
      ORDER BY film_count DESC
      LIMIT 5;
    `;
    db.query(sql, (err, results) => {
      if (err) {
        console.error("Error fetching top actors:", err);
        return res.status(500).json({ error: err.message });
      }
      res.json(results);
    });
  });
  
  //Get Actor details by id  
  app.get('/actor/:id', (req, res) => {
    const actorId = req.params.id;
    
    // First, get the actor's basic details.
    const actorSql = `
        SELECT actor_id, first_name, last_name
        FROM actor
        WHERE actor_id = ?;
    `;
    
    db.query(actorSql, [actorId], (err, actorResults) => {
      if (err) {
        console.error("Error fetching actor details:", err);
        return res.status(500).json({ error: err.message });
      }
      if (actorResults.length === 0) {
        return res.status(404).json({ error: "Actor not found" });
      }
      
      const actor = actorResults[0];
      
      // Now, get the top 5 films that the actor is in
      const filmsSql = `
        SELECT f.film_id, f.title, COUNT(r.rental_id) AS rental_count
        FROM film f
        JOIN film_actor fa ON f.film_id = fa.film_id
        LEFT JOIN inventory i ON f.film_id = i.film_id
        LEFT JOIN rental r ON i.inventory_id = r.inventory_id
        WHERE fa.actor_id = ?
        GROUP BY f.film_id, f.title
        ORDER BY rental_count DESC
        LIMIT 5;
      `;
      
      db.query(filmsSql, [actorId], (err, filmsResults) => {
        if (err) {
          console.error("Error fetching top films for actor:", err);
          return res.status(500).json({ error: err.message });
        }
        
        // Attach the top films to the actor details.
        actor.top_films = filmsResults;
        res.json(actor);
      });
    });
  });


// Film Page 

//Search bar Get
app.get('/search-films', (req, res) => {
    const { query } = req.query;
    console.log("Search query received:", query);
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
        OR CONCAT(a.first_name, ' ', a.last_name) LIKE ?
        OR c.name LIKE ?
        GROUP BY f.film_id, c.name;
    `;
    const searchTerm = `%${query}%`;
    db.query(sql, [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm], (err, results) => {
        if (err) {
            console.error("Database error", err);
            return res.status(500).json({ error: err.message });
        }
        console.log("Query Results:", results);
        res.json(results || []);
    });
});

// Customer Page 
app.get('/customers', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = 10;
    const offset = (page - 1) * pageSize;

    const sql = `
        SELECT c.customer_id, c.first_name, c.last_name, c.email, a.address, ct.city, a.phone
        FROM customer c
        JOIN address a ON c.address_id = a.address_id
        JOIN city ct ON a.city_id = ct.city_id
        ORDER BY c.first_name ASC
        LIMIT ? OFFSET ?;
    `;
    db.query(sql, [pageSize, offset], (err, results) => {
        if (err) {
            console.error("Error fetching customers:", err);
            return res.status(500).json({ error: err.message });
        }
        console.log("Fetched Customers:", results);
        const countSql = 'SELECT COUNT(*) AS total FROM customer';
        db.query(countSql, (countErr, countResults) => {
            if (countErr) {
                console.error("Error fetching customer count:", countErr);
                return res.status(500).json({ error: countErr.message });
            }
            const totalCustomers = countResults[0].total;
            const totalPages = Math.ceil(totalCustomers / pageSize);
            res.json({
                customers: results,
                totalPages,
                currentPage: page,
            });
        });
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
