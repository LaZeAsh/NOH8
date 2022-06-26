import express from 'express';
const app = express();
const PORT = process.env.PORT || 6111;
app.get('/', (req, res) => res.send('OK'))
app.listen(PORT, () => console.log(`listening at http://localhost:${PORT}`));