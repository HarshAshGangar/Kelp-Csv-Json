const fs = require('fs');
const path = require('path');

/**
 * Generate large CSV files for bulk processing testing
 * This will create realistic test data by duplicating and modifying base records
 */

const firstNames = ['Rohit', 'Priya', 'Amit', 'Sneha', 'Rajesh', 'Anita', 'Vikas', 'Kavita', 'Suresh', 'Deepa',
                    'Rahul', 'Pooja', 'Vikram', 'Neha', 'Arjun', 'Simran', 'Karan', 'Riya', 'Aditya', 'Divya'];

const lastNames = ['Prasad', 'Sharma', 'Kumar', 'Patel', 'Singh', 'Verma', 'Mehta', 'Reddy', 'Nair', 'Joshi',
                   'Gupta', 'Iyer', 'Desai', 'Malhotra', 'Kulkarni', 'Rao', 'Agarwal', 'Chopra', 'Bose', 'Trivedi'];

const addresses = [
  { line1: 'A-563 Rakshak Society', line2: 'New Pune Road', city: 'Pune', state: 'Maharashtra' },
  { line1: 'B-101 Green Park', line2: 'Link Road', city: 'Mumbai', state: 'Maharashtra' },
  { line1: 'C-45 Sector 12', line2: 'Main Street', city: 'Delhi', state: 'Delhi' },
  { line1: 'D-789 Heritage Villa', line2: 'MG Road', city: 'Bangalore', state: 'Karnataka' },
  { line1: 'E-234 Sunset Apartments', line2: 'Beach Road', city: 'Chennai', state: 'Tamil Nadu' },
  { line1: 'F-567 Golden Heights', line2: 'Ring Road', city: 'Hyderabad', state: 'Telangana' },
  { line1: 'G-890 Silver Oak', line2: 'Station Road', city: 'Jaipur', state: 'Rajasthan' },
  { line1: 'H-123 Rose Garden', line2: 'Park Street', city: 'Kolkata', state: 'West Bengal' },
  { line1: 'I-456 Palm Grove', line2: 'Lake Road', city: 'Kochi', state: 'Kerala' },
  { line1: 'J-789 Maple Court', line2: 'Hill Road', city: 'Shimla', state: 'Himachal Pradesh' }
];

const genders = ['male', 'female'];

/**
 * Generate a random record
 */
function generateRecord(index) {
  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[Math.floor(index / firstNames.length) % lastNames.length];
  let age;
  const ageGroup = index % 10;
  if (ageGroup < 1) age = Math.floor(Math.random() * 8) + 12;        // <20: 10%
  else if (ageGroup < 5) age = Math.floor(Math.random() * 20) + 20;  // 20-40: 40%
  else if (ageGroup < 8) age = Math.floor(Math.random() * 20) + 41;  // 40-60: 30%
  else age = Math.floor(Math.random() * 20) + 61;                    // >60: 20%
  
  const address = addresses[index % addresses.length];
  const gender = genders[index % genders.length];
  
  return {
    'name.firstName': firstName,
    'name.lastName': lastName,
    age: age,
    'address.line1': address.line1,
    'address.line2': address.line2,
    'address.city': address.city,
    'address.state': address.state,
    gender: gender
  };
}

/**
 * Generate CSV file with specified number of records
 */
function generateCSV(numRecords, outputPath) {
  console.log(`\n🔄 Generating CSV with ${numRecords.toLocaleString()} records...`);
  
  const startTime = Date.now();
  
  
  const headers = ['name.firstName', 'name.lastName', 'age', 'address.line1', 'address.line2', 'address.city', 'address.state', 'gender'];
  
  fs.writeFileSync(outputPath, headers.join(',') + '\n');
  
  const batchSize = 1000;
  let csvBatch = '';
  
  for (let i = 0; i < numRecords; i++) {
    const record = generateRecord(i);
    const row = headers.map(header => record[header]).join(',');
    csvBatch += row + '\n';
    
    if ((i + 1) % batchSize === 0 || i === numRecords - 1) {
      fs.appendFileSync(outputPath, csvBatch);
      csvBatch = '';
      
      const progress = ((i + 1) / numRecords * 100).toFixed(1);
      process.stdout.write(`\r   Progress: ${progress}% (${(i + 1).toLocaleString()} / ${numRecords.toLocaleString()} records)`);
    }
  }
  
  const endTime = Date.now();
  const timeTaken = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(`\n✓ CSV file generated successfully!`);
  console.log(`   Location: ${outputPath}`);
  console.log(`   Records: ${numRecords.toLocaleString()}`);
  console.log(`   File Size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Time Taken: ${timeTaken}s\n`);
  
  return outputPath;
}

/**
 * Main execution
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('\n' + '='.repeat(70));
    console.log('📊 BULK CSV GENERATOR');
    console.log('='.repeat(70));
    console.log('\nUsage: node generate-bulk-csv.js <number_of_records>');
    console.log('\nExamples:');
    console.log('  node generate-bulk-csv.js 1000      # 1K records');
    console.log('  node generate-bulk-csv.js 10000     # 10K records');
    console.log('  node generate-bulk-csv.js 50000     # 50K records');
    console.log('  node generate-bulk-csv.js 100000    # 100K records');
    console.log('\n' + '='.repeat(70) + '\n');
    process.exit(1);
  }
  
  const numRecords = parseInt(args[0]);
  
  if (isNaN(numRecords) || numRecords <= 0) {
    console.error('❌ Error: Please provide a valid positive number');
    process.exit(1);
  }
  
  if (numRecords > 1000000) {
    console.error('❌ Error: Maximum 1,000,000 records allowed');
    process.exit(1);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('📊 BULK CSV GENERATOR');
  console.log('='.repeat(70));
  
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `bulk_${numRecords}_${timestamp}.csv`;
  const outputPath = path.join(uploadsDir, filename);
  
  generateCSV(numRecords, outputPath);
  
  console.log('📝 NEXT STEPS:');
  console.log('='.repeat(70));
  console.log('1. Update your .env file:');
  console.log(`   CSV_FILE_PATH=./uploads/${filename}`);
  console.log('');
  console.log('2. Run the test script:');
  console.log('   node test-upload.js');
  console.log('');
  console.log('3. Or test manually:');
  console.log('   curl -X DELETE http://localhost:3000/api/users');
  console.log('   curl -X POST http://localhost:3000/api/upload');
  console.log('='.repeat(70) + '\n');
}

main();