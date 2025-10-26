const CSVParser = require('../utils/csvParser');
const UserService = require('../services/userService');
const path = require('path');

class UploadController {
  /**
   * Process CSV file and upload to database
   */
  static async processCSV(req, res) {
    try {
      const filePath = process.env.CSV_FILE_PATH || './uploads/users.csv';
      const absolutePath = path.resolve(filePath);

      console.log(`\n📂 Reading CSV file from: ${absolutePath}`);

      // Parse CSV file
      console.log('⚙️  Parsing CSV file...');
      const records = CSVParser.parseCSVFile(absolutePath);
      console.log(`✓ Parsed ${records.length} records from CSV`);

      // Insert into database
      console.log('⚙️  Inserting records into database...');
      const insertedCount = await UserService.insertUsers(records);

      // Calculate and print age distribution
      console.log('⚙️  Calculating age distribution...');
      const distribution = await UserService.calculateAgeDistribution();

      res.json({
        success: true,
        message: 'CSV processed successfully',
        recordsProcessed: insertedCount,
        ageDistribution: distribution
      });

    } catch (error) {
      console.error('❌ Error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get age distribution report
   */
  static async getAgeDistribution(req, res) {
    try {
      const distribution = await UserService.calculateAgeDistribution();
      
      res.json({
        success: true,
        ageDistribution: distribution
      });
    } catch (error) {
      console.error('❌ Error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Clear all users
   */
  static async clearUsers(req, res) {
    try {
      await UserService.clearAllUsers();
      
      res.json({
        success: true,
        message: 'All users cleared successfully'
      });
    } catch (error) {
      console.error('❌ Error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = UploadController;