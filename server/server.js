const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const db = require('./db/sqliteConnect');

// Create SQLite database tables
const { createTransactionsTable } = require('./models/transactionModel');
createTransactionsTable();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());
app.use('/', apiRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
