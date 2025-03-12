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
    data.setdefault('date_posted', '')
    data.setdefault('date_applied', datetime.now().strftime('%Y-%m-%d'))
    data.setdefault('cv_path', '')
    data.setdefault('status', 'Applied')
    data.setdefault('notes', '')
    data.setdefault('last_updated', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO applications (company, role, salary, url, date_posted, date_applied, cv_path, status, notes, last_updated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (data['company'], data['role'], data['salary'], data['url'], 
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
    fields = ['company', 'role', 'salary', 'url', 'date_posted', 'date_applied', 'cv_path', 'status', 'notes']
    updates = {field: data.get(field, dict(application)[field]) for field in fields}
    
    # Always update the last_updated timestamp
    updates['last_updated'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    cursor = conn.cursor()
    cursor.execute('''
    UPDATE applications
    SET company = ?, role = ?, salary = ?, url = ?, date_posted = ?, date_applied = ?, cv_path = ?, status = ?, notes = ?, last_updated = ?
    WHERE id = ?
    ''', (updates['company'], updates['role'], updates['salary'], updates['url'],
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

@app.route('/api/analyze-url', methods=['POST'])
def analyze_url():
    data = request.json
    
    if 'url' not in data:
        return jsonify({'error': 'URL is required'}), 400
    
    # This is a placeholder for the LLM integration
    # In a real implementation, this would call an LLM to analyze the job posting URL
    # For now, return mock data
    mock_analysis = {
        'company': 'Example Company',
        'role': 'Software Developer',
        'salary': '$100,000 - $120,000',
        'date_posted': datetime.now().strftime('%Y-%m-%d')
    }
    
    return jsonify(mock_analysis)

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
    
    # Get applications by date
    date_counts = conn.execute('''
        SELECT date_applied, COUNT(*) as count 
        FROM applications 
        GROUP BY date_applied 
        ORDER BY date_applied DESC 
        LIMIT 30
    ''').fetchall()
    
    conn.close()
    
    return jsonify({
        'total_applications': total_count,
        'status_breakdown': [dict(item) for item in status_counts],
        'top_companies': [dict(item) for item in company_counts],
        'recent_activity': [dict(item) for item in date_counts]
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
