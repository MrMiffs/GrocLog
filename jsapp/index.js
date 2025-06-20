#!/usr/bin/env node

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const itemlog = require('./itemlog');
const users = require('./users');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());

// Authentication middleware
const SECRET = 'desert-you';
function authenticateToken(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized - No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET || SECRET, (err, user) => {
    if (err) {
      // Clear invalid token
      res.clearCookie('token');
      return res.status(403).json({ message: 'Forbidden - Invalid token' });
    }
    req.user = user;
    next();
  });
}
app.post('/api/login', users.login);
app.post('/api/register', users.addUser);

// Routes for itemlog
app.post('/api/additem', authenticateToken, itemlog.addItem);
app.post('/api/searchitem', authenticateToken, itemlog.searchItems);
app.delete('/api/deleteitem', authenticateToken, itemlog.deleteItem);
app.put("/api/edititem", authenticateToken, itemlog.editItem);

// Routes for analytics
app.post('/api/analytics', itemlog.getAnalytics);
app.post('/api/pricetrends', itemlog.getPriceTrends);

//Routes for users
app.post('/api/adduser', authenticateToken, users.addUser);
app.post('/api/getusers', authenticateToken, users.getUsers);
app.post('/api/searchusers', authenticateToken, users.searchUsers);
app.delete('/api/deleteuser', authenticateToken, users.deleteUser);
app.put('/api/edituser', authenticateToken, users.editUser);
app.post('/api/getID', authenticateToken, users.getID)

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});