const db = require('../db/sqliteConnect');

const createTransactionsTable = () => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      price TEXT NOT NULL,
      description TEXT NOT NULL,
      image TEXT NOT NULL,
      category TEXT NOT NULL,
      sold INTEGER NOT NULL,
      dateOfSale DATE NOT NULL
    )
  `;

  db.run(createTableQuery, (err) => {
    if (err) {
      console.error('Error creating transactions table:', err.message);
    } else {
      console.log('Transactions table created successfully.');
    }
  });
};

module.exports = {
  createTransactionsTable
};
