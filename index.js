const express = require('express');
const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on('connect', () => {
  console.log('✓ Database connected');
});

// CSV Parser
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const record = {};
    
    for (let j = 0; j < headers.length; j++) {
      const keys = headers[j].split('.');
      let current = record;
      
      for (let k = 0; k < keys.length; k++) {
        const key = keys[k];
        if (k === keys.length - 1) {
          current[key] = isNaN(values[j]) ? values[j] : Number(values[j]);
        } else {
          current[key] = current[key] || {};
          current = current[key];
        }
      }
    }
    records.push(record);
  }
  
  return records;
}

// Upload CSV endpoint
app.post('/api/upload', async (req, res) => {
  try {
    console.log('\n📂 Reading CSV file...');
    const content = fs.readFileSync('./uploads/users.csv', 'utf-8');
    
    console.log('⚙️  Parsing CSV...');
    const records = parseCSV(content);
    console.log(`✓ Parsed ${records.length} records`);
    
    console.log('⚙️  Inserting into database...');
    let count = 0;
    
    for (const record of records) {
      const name = `${record.name.firstName} ${record.name.lastName}`;
      const age = record.age;
      const address = record.address ? JSON.stringify(record.address) : null;
      
      const additionalInfo = {};
      for (const key in record) {
        if (key !== 'name' && key !== 'age' && key !== 'address') {
          additionalInfo[key] = record[key];
        }
      }
      
      await pool.query(
        'INSERT INTO users (name, age, address, additional_info) VALUES ($1, $2, $3, $4)',
        [name, age, address, Object.keys(additionalInfo).length > 0 ? JSON.stringify(additionalInfo) : null]
      );
      count++;
    }
    
    console.log(`✓ Inserted ${count} records`);
    
    // Calculate age distribution
    console.log('⚙️  Calculating age distribution...');
    const result = await pool.query('SELECT age FROM users');
    const ages = result.rows.map(row => row.age);
    
    const dist = {
      'less_than_20': 0,
      '20_to_40': 0,
      '40_to_60': 0,
      'greater_than_60': 0
    };
    
    ages.forEach(age => {
      if (age < 20) dist.less_than_20++;
      else if (age <= 40) dist['20_to_40']++;
      else if (age <= 60) dist['40_to_60']++;
      else dist.greater_than_60++;
    });
    
    const total = ages.length;
    const percentages = {
      'less_than_20': ((dist.less_than_20 / total) * 100).toFixed(2),
      '20_to_40': ((dist['20_to_40'] / total) * 100).toFixed(2),
      '40_to_60': ((dist['40_to_60'] / total) * 100).toFixed(2),
      'greater_than_60': ((dist.greater_than_60 / total) * 100).toFixed(2)
    };

    // Print age distribution report on console
    console.log('\n' + '='.repeat(60));
    console.log('AGE DISTRIBUTION REPORT');
    console.log('='.repeat(60));
    console.log(`Total Users: ${total}\n`);
    console.log('Age-Group'.padEnd(20) + '% Distribution'.padEnd(20) + 'Count');
    console.log('-'.repeat(60));
    console.log(`< 20`.padEnd(20) + `${percentages.less_than_20}%`.padEnd(20) + dist.less_than_20);
    console.log(`20 to 40`.padEnd(20) + `${percentages['20_to_40']}%`.padEnd(20) + dist['20_to_40']);
    console.log(`40 to 60`.padEnd(20) + `${percentages['40_to_60']}%`.padEnd(20) + dist['40_to_60']);
    console.log(`> 60`.padEnd(20) + `${percentages.greater_than_60}%`.padEnd(20) + dist.greater_than_60);
    console.log('='.repeat(60) + '\n');
    
    res.json({
      success: true,
      message: 'CSV processed successfully',
      recordsProcessed: count,
      ageDistribution: percentages
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY id');
    res.json({
      success: true,
      count: result.rows.length,
      users: result.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get age distribution
app.get('/api/age-distribution', async (req, res) => {
  try {
    const result = await pool.query('SELECT age FROM users');
    const ages = result.rows.map(row => row.age);
    
    if (ages.length === 0) {
      return res.json({ success: false, message: 'No users found' });
    }

    const dist = {
      'less_than_20': 0,
      '20_to_40': 0,
      '40_to_60': 0,
      'greater_than_60': 0
    };
    
    ages.forEach(age => {
      if (age < 20) dist.less_than_20++;
      else if (age <= 40) dist['20_to_40']++;
      else if (age <= 60) dist['40_to_60']++;
      else dist.greater_than_60++;
    });
    
    const total = ages.length;
    const percentages = {
      'less_than_20': ((dist.less_than_20 / total) * 100).toFixed(2),
      '20_to_40': ((dist['20_to_40'] / total) * 100).toFixed(2),
      '40_to_60': ((dist['40_to_60'] / total) * 100).toFixed(2),
      'greater_than_60': ((dist.greater_than_60 / total) * 100).toFixed(2)
    };

    // Print report on console
    console.log('\n' + '='.repeat(60));
    console.log('AGE DISTRIBUTION REPORT');
    console.log('='.repeat(60));
    console.log(`Total Users: ${total}\n`);
    console.log('Age-Group'.padEnd(20) + '% Distribution'.padEnd(20) + 'Count');
    console.log('-'.repeat(60));
    console.log(`< 20`.padEnd(20) + `${percentages.less_than_20}%`.padEnd(20) + dist.less_than_20);
    console.log(`20 to 40`.padEnd(20) + `${percentages['20_to_40']}%`.padEnd(20) + dist['20_to_40']);
    console.log(`40 to 60`.padEnd(20) + `${percentages['40_to_60']}%`.padEnd(20) + dist['40_to_60']);
    console.log(`> 60`.padEnd(20) + `${percentages.greater_than_60}%`.padEnd(20) + dist.greater_than_60);
    console.log('='.repeat(60) + '\n');

    res.json({
      success: true,
      totalUsers: total,
      ageDistribution: percentages,
      counts: dist
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete all users
app.delete('/api/users', async (req, res) => {
  try {
    await pool.query('TRUNCATE TABLE users RESTART IDENTITY');
    console.log('✓ All users cleared from database');
    res.json({
      success: true,
      message: 'All users cleared successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 CSV to JSON API Server Started');
  console.log('='.repeat(60));
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`📝 Endpoints:`);
  console.log(`   POST   /api/upload           - Process CSV file`);
  console.log(`   GET    /api/users            - Get all users`);
  console.log(`   GET    /api/age-distribution - Get age distribution`);
  console.log(`   DELETE /api/users            - Clear all users`);
  console.log(`   GET    /health               - Health check`);
  console.log('='.repeat(60) + '\n');
});

module.exports = app;