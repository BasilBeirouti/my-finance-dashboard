const express = require('express');
const fs = require('fs');
const Papa = require('papaparse');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors()); 
app.use(express.static('public'));

app.get('/data', (req, res) => {
    fs.readFile('./public/transactions.csv', 'utf8', (err, data) => {
        if (err) throw err;
        const jsonData = Papa.parse(data, {
            header: true,
            dynamicTyping: true,
        });
        res.send(jsonData.data);
    });
});

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
