from flask import Flask, jsonify, request
import sqlite3
import os
from datetime import datetime
from flask_cors import CORS
from werkzeug.utils import secure_filename

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
    
    # Drop existing table to recreate with updated schema
    cursor.execute('DROP TABLE IF EXISTS applications')
    
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
        cover_letter_path TEXT,
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

# File upload configuration
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt', 'rtf'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

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
    data.setdefault('cover_letter_path', '')
    data.setdefault('status', 'Applied')
    data.setdefault('notes', '')
    data.setdefault('last_updated', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO applications (company, role, salary, salary_amount, salary_currency, salary_type, url, date_posted, date_applied, cv_path, cover_letter_path, status, notes, last_updated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (data['company'], data['role'], data['salary'], data['salary_amount'], data['salary_currency'], data['salary_type'], data['url'], 
          data['date_posted'], data['date_applied'], data['cv_path'], data['cover_letter_path'], 
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
    fields = ['company', 'role', 'salary', 'salary_amount', 'salary_currency', 'salary_type', 'url', 'date_posted', 'date_applied', 'cv_path', 'cover_letter_path', 'status', 'notes']
    updates = {field: data.get(field, dict(application)[field]) for field in fields}
    
    # Always update the last_updated timestamp
    updates['last_updated'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    cursor = conn.cursor()
    cursor.execute('''
    UPDATE applications
    SET company = ?, role = ?, salary = ?, salary_amount = ?, salary_currency = ?, salary_type = ?, url = ?, date_posted = ?, date_applied = ?, cv_path = ?, cover_letter_path = ?, status = ?, notes = ?, last_updated = ?
    WHERE id = ?
    ''', (updates['company'], updates['role'], updates['salary'], updates['salary_amount'], updates['salary_currency'], updates['salary_type'], updates['url'],
          updates['date_posted'], updates['date_applied'], updates['cv_path'], updates['cover_letter_path'], 
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
    print(f"\n[DEBUG] Received salary calculation request: {data}")
    
    # Validate required fields
    required_fields = ['amount', 'currency', 'type']
    for field in required_fields:
        if field not in data:
            print(f"[ERROR] Missing required field: {field}")
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    try:
        # Ensure amount is a float
        amount = float(data['amount'])
        currency = data['currency']
        salary_type = data['type']
        
        print(f"[DEBUG] Processing: amount={amount}, currency={currency}, type={salary_type}")
        
        # Define conversion rates (as of March 2025)
        conversion_rates = {
            'PLN': 1.0,
            'EUR': 4.17,  
            'USD': 3.84,  
            'GBP': 4.96   
        }
        
        # Convert to PLN
        rate = conversion_rates.get(currency, 1.0)
        amount_in_pln = amount * rate
        print(f"[DEBUG] Converted to PLN: {amount} {currency} * {rate} = {amount_in_pln} PLN")
        
        # Convert to yearly based on type
        if salary_type == 'hourly':
            # Assuming 40 hours per week, 52 weeks per year
            yearly_amount = amount_in_pln * 40 * 52
            print(f"[DEBUG] Converted hourly to yearly: {amount_in_pln} * 40 * 52 = {yearly_amount}")
        elif salary_type == 'monthly':
            # 12 months per year
            yearly_amount = amount_in_pln * 12
            print(f"[DEBUG] Converted monthly to yearly: {amount_in_pln} * 12 = {yearly_amount}")
        else:  # yearly
            yearly_amount = amount_in_pln
            print(f"[DEBUG] Already yearly amount: {yearly_amount}")
        
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
            'daily': {
                'PLN': yearly_amount / 365,
                'EUR': (yearly_amount / 365) / conversion_rates['EUR'],
                'USD': (yearly_amount / 365) / conversion_rates['USD'],
                'GBP': (yearly_amount / 365) / conversion_rates['GBP']
            },
            'hourly': {
                'PLN': yearly_amount / (40 * 52),
                'EUR': (yearly_amount / (40 * 52)) / conversion_rates['EUR'],
                'USD': (yearly_amount / (40 * 52)) / conversion_rates['USD'],
                'GBP': (yearly_amount / (40 * 52)) / conversion_rates['GBP']
            }
        }
        
        print(f"[DEBUG] Calculation successful. Result sample: yearly.PLN = {result['yearly']['PLN']}")
        return jsonify(result)
    except Exception as e:
        print(f"[ERROR] Error calculating salary: {str(e)}")
        return jsonify({'error': f'Error calculating salary: {str(e)}'}), 500

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

@app.route('/api/test-openai', methods=['GET'])
def test_openai():
    try:
        # Import the OpenAI module
        import openai
        
        # Make a simple API call
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Say hello world!"}
            ],
            max_tokens=50
        )
        
        # Return the response
        return jsonify({
            'status': 'success',
            'message': 'OpenAI API call successful',
            'response': response.choices[0].message.content
        })
    except Exception as e:
        import traceback
        return jsonify({
            'status': 'error',
            'message': f'Error calling OpenAI API: {str(e)}',
            'traceback': traceback.format_exc()
        }), 500

@app.route('/api/upload-file', methods=['POST'])
def upload_file():
    # Check if a file was included in the request
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
    
    file = request.files['file']
    file_type = request.form.get('type', 'cv')  # Default to CV if not specified
    
    # If user submits an empty form
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Check if the file type is allowed
    if file and allowed_file(file.filename):
        # Secure the filename to prevent directory traversal attacks
        filename = secure_filename(file.filename)
        
        # Create a unique filename with timestamp to prevent overwriting
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        unique_filename = f"{timestamp}_{filename}"
        
        # Create subdirectory based on file type
        subdir = 'cvs' if file_type == 'cv' else 'cover_letters'
        full_upload_dir = os.path.join(app.config['UPLOAD_FOLDER'], subdir)
        os.makedirs(full_upload_dir, exist_ok=True)
        
        # Save the file
        file_path = os.path.join(full_upload_dir, unique_filename)
        file.save(file_path)
        
        # Return the relative path to be stored in the database
        relative_path = os.path.join('uploads', subdir, unique_filename)
        
        return jsonify({
            'success': True,
            'filename': unique_filename,
            'path': relative_path,
            'type': file_type
        })
    
    return jsonify({'error': 'File type not allowed'}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
