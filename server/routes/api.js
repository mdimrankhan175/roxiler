const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

// Connect to SQLite database
const db = new sqlite3.Database('./transactions.db', (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Create transactions table if not exists
db.run(`CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  price REAL NOT NULL,
  description TEXT NOT NULL,
  image TEXT NOT NULL,
  category TEXT NOT NULL,
  sold INTEGER NOT NULL,
  dateOfSale TEXT NOT NULL
)`);

// Route to get transaction data by month
router.get('/transactions', (req, res) => {
  const { page = 1, limit = 10, search = '', month = 3 } = req.query;
  const offset = (page - 1) * limit;
  const searchQuery = `%${search}%`;

  const sql = `SELECT * FROM transactions 
               WHERE strftime('%m', dateOfSale) = ? 
               AND (title LIKE ? OR description LIKE ? OR price LIKE ?)
               LIMIT ? OFFSET ?`;
  
  db.all(sql, [month, searchQuery, searchQuery, searchQuery, limit, offset], (err, rows) => {
    if (err) {
      console.error('Error querying transactions:', err.message);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json({ success: true, transactions: rows });
    }
  });
});

// Route to get statistics by month
router.get('/statistics', (req, res) => {
  const { month = 3 } = req.query;

  const sql = `SELECT SUM(price) AS totalSale, 
                      COUNT(*) AS totalCount, 
                      SUM(sold) AS soldCount, 
                      COUNT(*) - SUM(sold) AS unsoldCount 
               FROM transactions 
               WHERE strftime('%m', dateOfSale) = ?`;

  db.get(sql, [month], (err, row) => {
    if (err) {
      console.error('Error querying statistics:', err.message);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json({ success: true, ...row });
    }
  });
});

router.get('/bar-chart', async (req, res) => {
  try {
      const month = !isNaN(parseInt(req.query.month)) ? parseInt(req.query.month) : 3;
      const monthQuery = month == 0 ? {} : {
          $expr: {
              $eq: [{ $month: "$dateOfSale" }, month]
          }
      }
      const projectQuery = {
          _id: 0,
          price: 1
      }
      const data = await Transaction.find(monthQuery, projectQuery);

      let accumulator = {};

      for(let i=1; i<=10; i++){
          let range = i*100;
          
          if(i == 10) 
              range = '901-above';
          else if(i == 1)
              range = '0-100';
          else
              range = `${range-100+1}-${range}`;

          accumulator[range] = 0;
      }

      const response = data.reduce((acc, curr) => {
          const currPrice = parseFloat(curr.price);

          // Calculation for price range such that all values <= priceRange && > priceRange-100 will fall in this range
          let priceRange = Math.ceil(currPrice / 100) * 100;

          if(priceRange == 100) 
              priceRange = '0-100';
          else if(priceRange > 900) 
              priceRange = '901-above';
          else 
              priceRange = `${priceRange-100+1}-${priceRange}`;

          // If current range does not exist then set to 1, else add 1
          acc[priceRange]++; 
          
          return acc;
      }, accumulator);

      res.status(200).json(response);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
  }
});

// Route for pie chart
router.get('/pie-chart', async (req, res) => {
  try {
      const month = !isNaN(parseInt(req.query.month)) ? parseInt(req.query.month) : 3;
      const monthQuery = month == 0 ? {} : {
          $expr: {
              $eq: [{ $month: "$dateOfSale" }, month]
          }
      }
      const projectQuery = {
          _id: 0,
          category: 1
      }
      const data = await Transaction.find(monthQuery, projectQuery);

      const response = data.reduce((acc, curr) => {
          // If current category does not exist then set to 1, else add 1
          acc[curr.category] ? acc[curr.category]++ : acc[curr.category] = 1;

          return acc;
      }, {});

      res.status(200).json(response);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
  }
});

// Route to fetch data from all the 3 APIs mentioned above, combines the response and sends a final response of the combined JSON
router.get('/combined-data', async (req, res) => {
  try {
      const [stats, barChart, pieChart] = await Promise.all([
          axios.get(`/api/statistics?month=${req.query.month}`),
          axios.get(`/api/bar-chart?month=${req.query.month}`),
          axios.get(`/api/pie-chart?month=${req.query.month}`)
      ]);

      const response = {
          statsData: stats.data,
          barChartData: barChart.data,
          pieChartData: pieChart.data
      };

      res.status(200).json(response);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
  }
});

module.exports = router;
