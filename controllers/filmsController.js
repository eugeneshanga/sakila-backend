const db = require('../db');

// Fetch files

exports.getFilms = (req,res) => {
    const  query = `select film_id, title from film limit 10`;
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