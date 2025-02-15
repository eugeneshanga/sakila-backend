const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

app.get('/health', (req, res) => {
    res.send('Hello World');
});

app.listen(5000, () => {
    console.log('Server running on port 5000');
});
