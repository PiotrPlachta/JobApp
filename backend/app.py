from flask import Flask, jsonify, request
import sqlite3
import os
from datetime import datetime
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Database helper functions
def get_db_connection():
    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'applications.db')
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create tables if they don't exist
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY,
        company TEXT,
        role TEXT,
        salary TEXT,
        salary_amount REAL,
        salary_currency TEXT DEFAULT 'PLN',
        salary_type TEXT DEFAULT 'yearly',
        url TEXT,
        date_posted TEXT,
        date_applied TEXT,
        cv_path TEXT,
        status TEXT DEFAULT 'Applied',
        notes TEXT,
        last_updated TEXT
    )
    ''')
    conn.commit()
    conn.close()
    print(f"Database initialized at {os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'applications.db')}")

# Initialize database on startup
init_db()

@app.route('/api/applications', methods=['GET'])
def get_applications():
    conn = get_db_connection()
    applications = conn.execute('SELECT * FROM applications ORDER BY date_applied DESC').fetchall()
    conn.close()
    
    # Convert to list of dictionaries
    result = [dict(app) for app in applications]
    return jsonify(result)

@app.route('/api/applications', methods=['POST'])
def add_application():
    data = request.json
    
    # Validate required fields
    required_fields = ['company', 'role', 'url']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # Set default values for optional fields
    data.setdefault('salary', '')
    data.setdefault('salary_amount', 0)
    data.setdefault('salary_currency', 'PLN')
    data.setdefault('salary_type', 'yearly')
    data.setdefault('date_posted', '')
    data.setdefault('date_applied', datetime.now().strftime('%Y-%m-%d'))
    data.setdefault('cv_path', '')
    data.setdefault('status', 'Applied')
    data.setdefault('notes', '')
    data.setdefault('last_updated', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO applications (company, role, salary, salary_amount, salary_currency, salary_type, url, date_posted, date_applied, cv_path, status, notes, last_updated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (data['company'], data['role'], data['salary'], data['salary_amount'], data['salary_currency'], data['salary_type'], data['url'], 
          data['date_posted'], data['date_applied'], data['cv_path'], 
          data['status'], data['notes'], data['last_updated']))
    conn.commit()
    
    # Get the ID of the inserted application
    app_id = cursor.lastrowid
    conn.close()
    
    return jsonify({'id': app_id, **data}), 201

@app.route('/api/applications/<int:app_id>', methods=['GET'])
def get_application(app_id):
    conn = get_db_connection()
    application = conn.execute('SELECT * FROM applications WHERE id = ?', (app_id,)).fetchone()
    conn.close()
    
    if application is None:
        return jsonify({'error': 'Application not found'}), 404
    
    return jsonify(dict(application))

@app.route('/api/applications/<int:app_id>', methods=['PUT'])
def update_application(app_id):
    data = request.json
    
    conn = get_db_connection()
    # Check if application exists
    application = conn.execute('SELECT * FROM applications WHERE id = ?', (app_id,)).fetchone()
    if application is None:
        conn.close()
        return jsonify({'error': 'Application not found'}), 404
    
    # Update fields
    fields = ['company', 'role', 'salary', 'salary_amount', 'salary_currency', 'salary_type', 'url', 'date_posted', 'date_applied', 'cv_path', 'status', 'notes']
    updates = {field: data.get(field, dict(application)[field]) for field in fields}
    
    # Always update the last_updated timestamp
    updates['last_updated'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    cursor = conn.cursor()
    cursor.execute('''
    UPDATE applications
    SET company = ?, role = ?, salary = ?, salary_amount = ?, salary_currency = ?, salary_type = ?, url = ?, date_posted = ?, date_applied = ?, cv_path = ?, status = ?, notes = ?, last_updated = ?
    WHERE id = ?
    ''', (updates['company'], updates['role'], updates['salary'], updates['salary_amount'], updates['salary_currency'], updates['salary_type'], updates['url'],
          updates['date_posted'], updates['date_applied'], updates['cv_path'], 
          updates['status'], updates['notes'], updates['last_updated'], app_id))
    conn.commit()
    conn.close()
    
    return jsonify({'id': app_id, **updates})

@app.route('/api/applications/<int:app_id>', methods=['DELETE'])
def delete_application(app_id):
    conn = get_db_connection()
    # Check if application exists
    application = conn.execute('SELECT * FROM applications WHERE id = ?', (app_id,)).fetchone()
    if application is None:
        conn.close()
        return jsonify({'error': 'Application not found'}), 404
    
    cursor = conn.cursor()
    cursor.execute('DELETE FROM applications WHERE id = ?', (app_id,))
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Application deleted successfully'})

@app.route('/api/application-statuses', methods=['GET'])
def get_application_statuses():
    # Return a list of possible application statuses
    statuses = [
        'Applied',
        'Phone Screen',
        'Technical Interview',
        'Onsite Interview',
        'Offer',
        'Rejected',
        'Withdrawn',
        'Not Interested'
    ]
    return jsonify(statuses)

@app.route('/api/salary-currencies', methods=['GET'])
def get_salary_currencies():
    # Return a list of supported currencies
    currencies = [
        'PLN',
        'EUR',
        'USD',
        'GBP'
    ]
    return jsonify(currencies)

@app.route('/api/salary-types', methods=['GET'])
def get_salary_types():
    # Return a list of salary types
    types = [
        'hourly',
        'monthly',
        'yearly'
    ]
    return jsonify(types)

@app.route('/api/analyze-url', methods=['POST'])
def analyze_url():
    data = request.json
    
    if 'url' not in data:
        return jsonify({'error': 'URL is required'}), 400
    
    try:
        # Import the LLM utilities
        from utils.llm_utils import process_job_posting_url
        import json
        
        # Process the URL
        result = process_job_posting_url(data['url'])
        
        # If result is a string (JSON), parse it
        if isinstance(result, str):
            try:
                result = json.loads(result)
            except json.JSONDecodeError:
                # If parsing fails, return the error
                return jsonify({'error': 'Failed to parse LLM response'}), 500
        
        # Ensure required fields have default values
        result.setdefault('company', '')
        result.setdefault('role', '')
        result.setdefault('salary', '')
        result.setdefault('salary_amount', 0)
        result.setdefault('salary_currency', 'PLN')
        result.setdefault('salary_type', 'yearly')
        result.setdefault('date_posted', '')
        
        return jsonify(result)
    except Exception as e:
        print(f"Error in analyze_url: {str(e)}")
        # Fallback to mock data if there's an error
        mock_analysis = {
            'company': 'Example Company',
            'role': 'Software Developer',
            'salary': '100,000 PLN per year',
            'salary_amount': 100000,
            'salary_currency': 'PLN',
            'salary_type': 'yearly',
            'date_posted': datetime.now().strftime('%Y-%m-%d'),
            'error_message': str(e)
        }
        
        return jsonify(mock_analysis)

@app.route('/api/calculate-yearly-salary', methods=['POST'])
def calculate_yearly_salary():
    data = request.json
    
    # Validate required fields
    required_fields = ['amount', 'currency', 'type']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    amount = float(data['amount'])
    currency = data['currency']
    salary_type = data['type']
    
    # Define conversion rates (as of March 2025)
    conversion_rates = {
        'PLN': 1.0,
        'EUR': 4.32,  # 1 EUR = 4.32 PLN
        'USD': 3.95,  # 1 USD = 3.95 PLN
        'GBP': 5.10   # 1 GBP = 5.10 PLN
    }
    
    # Convert to PLN
    amount_in_pln = amount * conversion_rates.get(currency, 1.0)
    
    # Convert to yearly based on type
    if salary_type == 'hourly':
        # Assuming 40 hours per week, 52 weeks per year
        yearly_amount = amount_in_pln * 40 * 52
    elif salary_type == 'monthly':
        # 12 months per year
        yearly_amount = amount_in_pln * 12
    else:  # yearly
        yearly_amount = amount_in_pln
    
    # Calculate in other currencies
    result = {
        'yearly': {
            'PLN': yearly_amount,
            'EUR': yearly_amount / conversion_rates['EUR'],
            'USD': yearly_amount / conversion_rates['USD'],
            'GBP': yearly_amount / conversion_rates['GBP']
        },
        'monthly': {
            'PLN': yearly_amount / 12,
            'EUR': (yearly_amount / 12) / conversion_rates['EUR'],
            'USD': (yearly_amount / 12) / conversion_rates['USD'],
            'GBP': (yearly_amount / 12) / conversion_rates['GBP']
        },
        'hourly': {
            'PLN': yearly_amount / (40 * 52),
            'EUR': (yearly_amount / (40 * 52)) / conversion_rates['EUR'],
            'USD': (yearly_amount / (40 * 52)) / conversion_rates['USD'],
            'GBP': (yearly_amount / (40 * 52)) / conversion_rates['GBP']
        }
    }
    
    return jsonify(result)

@app.route('/api/stats', methods=['GET'])
def get_stats():
    conn = get_db_connection()
    
    # Get total applications count
    total_count = conn.execute('SELECT COUNT(*) as count FROM applications').fetchone()['count']
    
    # Get applications by status
    status_counts = conn.execute('''
        SELECT status, COUNT(*) as count 
        FROM applications 
        GROUP BY status
    ''').fetchall()
    
    # Get applications by company
    company_counts = conn.execute('''
        SELECT company, COUNT(*) as count 
        FROM applications 
        GROUP BY company 
        ORDER BY count DESC 
        LIMIT 5
    ''').fetchall()
    
    # Get average salary (for applications with salary_amount > 0)
    avg_salary = conn.execute('''
        SELECT AVG(salary_amount) as avg_salary 
        FROM applications 
        WHERE salary_amount > 0
    ''').fetchone()
    
    # Get salary range
    salary_range = conn.execute('''
        SELECT MIN(salary_amount) as min_salary, MAX(salary_amount) as max_salary 
        FROM applications 
        WHERE salary_amount > 0
    ''').fetchone()
    
    conn.close()
    
    # Format results
    result = {
        'total_applications': total_count,
        'status_distribution': [dict(row) for row in status_counts],
        'top_companies': [dict(row) for row in company_counts],
        'salary_stats': {
            'average': avg_salary['avg_salary'] if avg_salary['avg_salary'] else 0,
            'min': salary_range['min_salary'] if salary_range and salary_range['min_salary'] else 0,
            'max': salary_range['max_salary'] if salary_range and salary_range['max_salary'] else 0
        }
    }
    
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
