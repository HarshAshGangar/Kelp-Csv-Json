const pool = require('../config/database');

class UserService {
  /**
   * Insert users into database in batches for better performance
   * Uses bulk INSERT for optimal performance
   */
  static async insertUsers(records) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      let insertedCount = 0;
      const batchSize = 1000;
      
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        const values = [];
        const placeholders = [];
        let paramCount = 1;
        
        for (const record of batch) {
          const { name, age, address, additionalInfo } = this.mapRecordToSchema(record);
          
          values.push(name, age, address, additionalInfo);
          placeholders.push(
            `($${paramCount}, $${paramCount + 1}, $${paramCount + 2}, $${paramCount + 3})`
          );
          paramCount += 4;
        }
        
        await client.query(
          `INSERT INTO users (name, age, address, additional_info) 
           VALUES ${placeholders.join(', ')}`,
          values
        );
        
        insertedCount += batch.length;
        console.log(`✓ Inserted ${insertedCount} / ${records.length} records`);
      }
      
      await client.query('COMMIT');
      console.log(`✓ Successfully inserted ${insertedCount} records into database`);
      
      return insertedCount;
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Database insertion error: ${error.message}`);
    } finally {
      client.release();
    }
  }

  /**
   * Map CSV record to database schema
   */
  static mapRecordToSchema(record) {
    // Validate mandatory fields
    if (!record.name || !record.name.firstName || !record.name.lastName) {
      throw new Error('Missing mandatory field: name.firstName or name.lastName');
    }
    
    if (record.age === undefined || record.age === null) {
      throw new Error('Missing mandatory field: age');
    }

    const name = `${record.name.firstName} ${record.name.lastName}`;
    
    const age = parseInt(record.age);
    if (isNaN(age)) {
      throw new Error('Age must be a valid number');
    }

    let address = null;
    if (record.address) {
      address = JSON.stringify(record.address);
    }

    const additionalInfo = {};
    for (const key in record) {
      if (key !== 'name' && key !== 'age' && key !== 'address') {
        additionalInfo[key] = record[key];
      }
    }

    return {
      name,
      age,
      address,
      additionalInfo: Object.keys(additionalInfo).length > 0 ? JSON.stringify(additionalInfo) : null
    };
  }

  /**
   * Calculate age distribution
   * Fixed: Correct age range boundaries
   */
  static async calculateAgeDistribution() {
    try {
      const result = await pool.query('SELECT age FROM users');
      const ages = result.rows.map(row => row.age);
      
      if (ages.length === 0) {
        console.log('No users found in database');
        return;
      }

      const distribution = {
        'less_than_20': 0,
        '20_to_40': 0,
        '40_to_60': 0,
        'greater_than_60': 0
      };

      ages.forEach(age => {
        if (age < 20) {
          distribution.less_than_20++;
        } else if (age >= 20 && age < 40) {  
          distribution['20_to_40']++;
        } else if (age >= 40 && age <= 60) {  
          distribution['40_to_60']++;
        } else {  // > 60
          distribution.greater_than_60++;
        }
      });

      const total = ages.length;
      const percentages = {
        'less_than_20': ((distribution.less_than_20 / total) * 100).toFixed(2),
        '20_to_40': ((distribution['20_to_40'] / total) * 100).toFixed(2),
        '40_to_60': ((distribution['40_to_60'] / total) * 100).toFixed(2),
        'greater_than_60': ((distribution.greater_than_60 / total) * 100).toFixed(2)
      };

      this.printAgeDistributionReport(percentages, distribution, total);
      
      return percentages;
    } catch (error) {
      throw new Error(`Error calculating age distribution: ${error.message}`);
    }
  }

  /**
   * Print age distribution report on console
   */
  static printAgeDistributionReport(percentages, counts, total) {
    console.log('\n' + '='.repeat(60));
    console.log('AGE DISTRIBUTION REPORT');
    console.log('='.repeat(60));
    console.log(`Total Users: ${total}\n`);
    console.log('Age-Group'.padEnd(20) + '% Distribution'.padEnd(20) + 'Count');
    console.log('-'.repeat(60));
    console.log(`< 20`.padEnd(20) + `${percentages.less_than_20}%`.padEnd(20) + counts.less_than_20);
    console.log(`20 to 40`.padEnd(20) + `${percentages['20_to_40']}%`.padEnd(20) + counts['20_to_40']);
    console.log(`40 to 60`.padEnd(20) + `${percentages['40_to_60']}%`.padEnd(20) + counts['40_to_60']);
    console.log(`> 60`.padEnd(20) + `${percentages.greater_than_60}%`.padEnd(20) + counts.greater_than_60);
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Clear all users from database
   */
  static async clearAllUsers() {
    try {
      await pool.query('TRUNCATE TABLE users RESTART IDENTITY');
      console.log('✓ All users cleared from database');
    } catch (error) {
      throw new Error(`Error clearing users: ${error.message}`);
    }
  }
}

module.exports = UserService;