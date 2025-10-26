const fs = require('fs');

class CSVParser {
  /**
   * Parse CSV file to JSON without using external packages
   */
  static parseCSVFile(filePath) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return this.parseCSVContent(fileContent);
    } catch (error) {
      throw new Error(`Error reading CSV file: ${error.message}`);
    }
  }

  /**
   * Parse CSV content string to JSON
   */
  static parseCSVContent(content) {
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    // First line is headers
    const headers = this.parseCSVLine(lines[0]);
    const records = [];

    // Parse each data line
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      
      if (values.length !== headers.length) {
        console.warn(`Warning: Line ${i + 1} has mismatched columns. Skipping.`);
        continue;
      }

      const record = this.createNestedObject(headers, values);
      records.push(record);
    }

    return records;
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  static parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Create nested object from dot notation
   * Example: name.firstName -> { name: { firstName: value } }
   */
  static createNestedObject(headers, values) {
    const result = {};

    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].trim();
      const value = values[i].trim();

      if (!header) continue;

      // Split by dot to handle nested properties
      const keys = header.split('.');
      let current = result;

      for (let j = 0; j < keys.length; j++) {
        const key = keys[j].trim();
        
        if (j === keys.length - 1) {
          // Last key - assign value
          current[key] = this.convertValue(value);
        } else {
          // Intermediate key - create nested object if doesn't exist
          if (!current[key] || typeof current[key] !== 'object') {
            current[key] = {};
          }
          current = current[key];
        }
      }
    }

    return result;
  }

  /**
   * Convert string value to appropriate type
   */
  static convertValue(value) {
    // Empty value
    if (value === '' || value === null || value === undefined) {
      return null;
    }

    // Try to convert to number
    const num = Number(value);
    if (!isNaN(num) && value !== '') {
      return num;
    }

    // Boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // Return as string
    return value;
  }
}

module.exports = CSVParser;