const express = require('express');
const app = express();
const port = 5000;
const cors = require('cors');

app.use(cors({
    origin: "http://localhost:3000",
}));

// Middleware to parse JSON
app.use(express.json());

// Sample route
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Another example route
app.get('/api', (req, res) => {
  res.json({ message: 'This is an API endpoint!' });
});

// Server listening
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
