from flask import Blueprint, request, jsonify
import sqlite3
import os
from datetime import datetime
import json

main_bp = Blueprint('main', __name__)

# Database helper functions
def get_db_connection():
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'data', 'applications.db')
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
        cv_path TEXT
    )
    ''')
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

@main_bp.route('/api/applications', methods=['GET'])
def get_applications():
    conn = get_db_connection()
    applications = conn.execute('SELECT * FROM applications').fetchall()
    conn.close()
    
    # Convert to list of dictionaries
    result = [dict(app) for app in applications]
    return jsonify(result)

@main_bp.route('/api/applications', methods=['POST'])
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
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO applications (company, role, salary, url, date_posted, date_applied, cv_path)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (data['company'], data['role'], data['salary'], data['url'], 
          data['date_posted'], data['date_applied'], data['cv_path']))
    conn.commit()
    
    # Get the ID of the inserted application
    app_id = cursor.lastrowid
    conn.close()
    
    return jsonify({'id': app_id, **data}), 201

@main_bp.route('/api/applications/<int:app_id>', methods=['GET'])
def get_application(app_id):
    conn = get_db_connection()
    application = conn.execute('SELECT * FROM applications WHERE id = ?', (app_id,)).fetchone()
    conn.close()
    
    if application is None:
        return jsonify({'error': 'Application not found'}), 404
    
    return jsonify(dict(application))

@main_bp.route('/api/applications/<int:app_id>', methods=['PUT'])
def update_application(app_id):
    data = request.json
    
    conn = get_db_connection()
    # Check if application exists
    application = conn.execute('SELECT * FROM applications WHERE id = ?', (app_id,)).fetchone()
    if application is None:
        conn.close()
        return jsonify({'error': 'Application not found'}), 404
    
    # Update fields
    fields = ['company', 'role', 'salary', 'url', 'date_posted', 'date_applied', 'cv_path']
    updates = {field: data.get(field, dict(application)[field]) for field in fields}
    
    cursor = conn.cursor()
    cursor.execute('''
    UPDATE applications
    SET company = ?, role = ?, salary = ?, url = ?, date_posted = ?, date_applied = ?, cv_path = ?
    WHERE id = ?
    ''', (updates['company'], updates['role'], updates['salary'], updates['url'],
          updates['date_posted'], updates['date_applied'], updates['cv_path'], app_id))
    conn.commit()
    conn.close()
    
    return jsonify({'id': app_id, **updates})

@main_bp.route('/api/applications/<int:app_id>', methods=['DELETE'])
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

@main_bp.route('/api/analyze-url', methods=['POST'])
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
