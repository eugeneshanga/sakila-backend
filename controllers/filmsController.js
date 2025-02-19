const db = require('../db');

// Fetch files

exports.getFilms = (req,res) => {
    const  query = `SELECT f.film_id, f.title, f.description, 
            MAX(c.name) AS category, 
            GROUP_CONCAT(CONCAT(a.first_name, ' ', a.last_name)) AS actors
            FROM film f
            LEFT JOIN film_actor fa ON f.film_id = fa.film_id
            LEFT JOIN actor a ON fa.actor_id = a.actor_id
            LEFT JOIN film_category fc ON f.film_id = fc.film_id
            LEFT JOIN category c ON fc.category_id = c.category_id
            GROUP BY f.film_id
            ORDER BY f.title ASC
            LIMIT 10;`;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message});
        res.json(results);
    });
};

//Fetch a film by id

exports.getFilmById = (req, res) => {
    const { id } = req.params;
    const query =  `select film_id, title from film where film_id = ?`;
    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: 'film not found'});
        res.json(results[0]);
    });
};