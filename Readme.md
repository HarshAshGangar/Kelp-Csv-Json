# CSV to JSON Converter API

A high-performance Node.js application that parses CSV files with custom logic (no external libraries), converts to JSON, and stores in PostgreSQL using bulk insert optimization.

## 🚀 Key Features

- **Custom CSV Parser**: Built from scratch without external libraries
- **Bulk Insert Optimization**: 8.8x faster than individual inserts
- **Nested Objects**: Handles dot notation (`name.firstName` → `{ name: { firstName } }`)
- **High Performance**: Processes 50,000 records in ~17 seconds
- **Age Distribution**: Automatic calculation and reporting

## 📊 Performance

### Optimized (Bulk Insert) vs Manual (Individual Insert)

| Records | Bulk Insert Time | Individual Insert Time | Speedup |
|---------|------------------|------------------------|---------|
| 1,000   | 0.25s           | 3s                     | 12x faster |
| 10,000  | 3.45s           | 30s                    | 8.7x faster |
| 50,000  | 17.06s          | 150s (2.5 min)        | 8.8x faster |

**Key Metrics:**
- **Records/second**: ~2,900 (consistent across dataset sizes)
- **Time per record**: 0.34ms (optimized) vs 3ms (manual)
- **Average improvement**: 8-12x faster

**Visual Comparison (50,000 records):**
```
Individual Inserts: [████████████████████████████████████] 150s
Bulk Inserts:       [█████] 17s

Time Saved: 133 seconds (2 minutes 13 seconds)
```
## 📦 Installation

```bash
# Clone repository
git clone <repo-url>
cd csv-to-json-api

# Install dependencies
npm install

# Setup database
psql -U postgres -c "CREATE DATABASE csv_db;"
psql -U postgres -d csv_db -f schema.sql

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Start server
npm run dev
```

## ⚙️ Configuration

Create `.env` file:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=csv_db
DB_USER=postgres
DB_PASSWORD=your_password
PORT=3000
CSV_FILE_PATH=./uploads/users.csv
```

## 🔌 API Endpoints

### Upload CSV
```bash
POST /api/upload
```
Processes CSV file and returns age distribution.

### Get Users
```bash
GET /api/users
```
Returns all users from database.

### Age Distribution
```bash
GET /api/age-distribution
```
Returns age distribution statistics.

### Clear Users
```bash
DELETE /api/users
```
Removes all users from database.

## 📝 CSV Format

```csv
name.firstName,name.lastName,age,address.city,address.state,gender
Rohit,Prasad,35,Pune,Maharashtra,male
Priya,Sharma,28,Mumbai,Maharashtra,female
```

## 🧩 Custom Parser Logic

### How it works:

**Input CSV:**
```csv
name.firstName,name.lastName,age
Rohit,Prasad,35
```

**Output JSON:**
```json
{
  "name": {
    "firstName": "Rohit",
    "lastName": "Prasad"
  },
  "age": 35
}
```

### Algorithm:
1. Split header by dots: `name.firstName` → `['name', 'firstName']`
2. Create nested object structure
3. Assign value at the deepest level
4. Auto-convert types (string → number/boolean)

**Code snippet:**
```javascript
const keys = header.split('.');  
let current = result;

for (let i = 0; i < keys.length; i++) {
  if (i === keys.length - 1) {
    current[keys[i]] = value;
  } else {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];  
  }
}
```

## 🗄️ Database Schema

```sql
CREATE TABLE users (
    id serial4 PRIMARY KEY,
    name varchar NOT NULL,
    age int4 NOT NULL,
    address jsonb NULL,
    additional_info jsonb NULL
);
```

**Why JSONB?** Flexible schema for dynamic CSV fields.

## ⚡ Performance Optimization

### Bulk Insert Implementation

**Before (Manual - Individual Inserts):**
```javascript
for (const record of records) {
  await query('INSERT INTO users VALUES ($1, $2, $3, $4)', [...]);
}
```

**After (Optimized - Bulk Inserts):**
```javascript
// Batch 1000 records per query
const values = [];
const placeholders = [];

for (let i = 0; i < 1000; i++) {
  values.push(name, age, address, info);
  placeholders.push(`($${n}, $${n+1}, $${n+2}, $${n+3})`);
}

await query(`INSERT INTO users VALUES ${placeholders.join(', ')}`, values);
// 50,000 records = 50 bulk queries = 17 seconds (8.8x faster!)
// 10,000 records = 10 bulk queries = 3.45 seconds (8.7x faster!)
// 1,000 records = 1 bulk query = 0.25 seconds (12x faster!)
```

**Why 8-12x Faster?**
- Individual insert: 50,000 database round-trips
- Bulk insert: Only 50 database round-trips (1000 records each)
- Network overhead reduced by 99%

## 🧪 Testing

### Generate Test CSV
```bash
node test.js 10000
```

### Run Tests
```bash
# Update .env with generated CSV path
# Start server
npm run dev

# Test upload
curl -X POST http://localhost:3000/api/upload
```

## 📁 Project Structure

```
csv-to-json-api/
├── config/
│   └── database.js          # DB connection pool
├── controllers/
│   └── uploadController.js  # Request handlers
├── services/
│   └── userService.js       # Business logic + bulk insert
├── utils/
│   └── csvParser.js         # Custom CSV parser
├── uploads/
│   └── users.csv            # Sample CSV
├── .env                     # Configuration
├── index.js                 # Main server
└── package.json
```

## 🎯 Key Implementation Details

### 1. Custom CSV Parser (No External Libraries)
- Parses CSV line by line
- Handles quoted values with commas
- Converts dot notation to nested objects
- Auto-detects data types

### 2. Bulk Insert Strategy
- Batch size: 1000 records
- Single transaction (BEGIN/COMMIT)
- Parameterized queries for security
- Error rollback on failure

## 📊 Example Response

```json
{
  "success": true,
  "message": "CSV processed successfully",
  "recordsProcessed": 50000,
  "ageDistribution": {
    "less_than_20": "9.91",
    "20_to_40": "39.64",
    "40_to_60": "29.73",
    "greater_than_60": "20.71"
  }
}
```

**Console Output:**
```
============================================================
AGE DISTRIBUTION REPORT
============================================================
Total Users: 50000

Age-Group           % Distribution      Count
------------------------------------------------------------
< 20                9.91%               4955
20 to 40            39.64%              19820
40 to 60            29.73%              14865
> 60                20.71%              10360
============================================================
```
## 👤 Author

**[Your Name]**
- GitHub: https://github.com/HarshAshGangar
- Email: harshgan18@gmail.com

---

**Built for Kelp Global Coding Challenge** | Node.js + PostgreSQL + Custom CSV Parser
