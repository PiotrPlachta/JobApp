#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import os
from PyQt6.QtWidgets import QApplication, QMainWindow, QWidget, QVBoxLayout, QLabel, QPushButton, QLineEdit, QFileDialog, QTableWidget, QTableWidgetItem, QHBoxLayout, QFormLayout
from PyQt6.QtCore import Qt
import sqlite3
import json
from datetime import datetime

class JobApplicationTracker(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Job Application Tracker")
        self.setGeometry(100, 100, 800, 600)
        self.initUI()
        self.initDB()
        
    def initUI(self):
        # Main widget and layout
        main_widget = QWidget()
        main_layout = QVBoxLayout()
        
        # Form for adding new applications
        form_widget = QWidget()
        form_layout = QFormLayout()
        
        self.url_input = QLineEdit()
        form_layout.addRow("Job URL:", self.url_input)
        
        self.company_input = QLineEdit()
        form_layout.addRow("Company:", self.company_input)
        
        self.role_input = QLineEdit()
        form_layout.addRow("Role:", self.role_input)
        
        self.salary_input = QLineEdit()
        form_layout.addRow("Salary:", self.salary_input)
        
        # CV file selection
        cv_layout = QHBoxLayout()
        self.cv_path_input = QLineEdit()
        self.cv_path_input.setReadOnly(True)
        cv_button = QPushButton("Select CV")
        cv_button.clicked.connect(self.select_cv)
        cv_layout.addWidget(self.cv_path_input)
        cv_layout.addWidget(cv_button)
        form_layout.addRow("CV File:", cv_layout)
        
        # Buttons
        button_layout = QHBoxLayout()
        
        analyze_button = QPushButton("Analyze URL")
        analyze_button.clicked.connect(self.analyze_job_posting)
        button_layout.addWidget(analyze_button)
        
        save_button = QPushButton("Save Application")
        save_button.clicked.connect(self.save_application)
        button_layout.addWidget(save_button)
        
        form_widget.setLayout(form_layout)
        
        # Table for displaying applications
        self.table = QTableWidget()
        self.table.setColumnCount(6)
        self.table.setHorizontalHeaderLabels(["Company", "Role", "Salary", "Date Posted", "Date Applied", "CV"])
        self.table.setColumnWidth(0, 150)
        self.table.setColumnWidth(1, 150)
        self.table.setColumnWidth(2, 100)
        self.table.setColumnWidth(3, 100)
        self.table.setColumnWidth(4, 100)
        self.table.setColumnWidth(5, 150)
        
        # Add widgets to main layout
        main_layout.addWidget(form_widget)
        main_layout.addLayout(button_layout)
        main_layout.addWidget(self.table)
        
        # Set main widget
        main_widget.setLayout(main_layout)
        self.setCentralWidget(main_widget)
        
        # Load existing applications
        self.load_applications()
    
    def initDB(self):
        # Initialize SQLite database
        db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'applications.db')
        self.conn = sqlite3.connect(db_path)
        self.cursor = self.conn.cursor()
        
        # Create tables if they don't exist
        self.cursor.execute('''
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
        self.conn.commit()
    
    def select_cv(self):
        file_path, _ = QFileDialog.getOpenFileName(self, "Select CV File", "", "PDF Files (*.pdf);;Word Files (*.docx);;All Files (*)")
        if file_path:
            self.cv_path_input.setText(file_path)
    
    def analyze_job_posting(self):
        # This is a placeholder for the LLM integration
        # In a real implementation, this would call an LLM to analyze the job posting URL
        url = self.url_input.text()
        if url:
            # For now, just set some placeholder text
            self.company_input.setText("Example Company")
            self.role_input.setText("Software Developer")
            self.salary_input.setText("$100,000 - $120,000")
    
    def save_application(self):
        company = self.company_input.text()
        role = self.role_input.text()
        salary = self.salary_input.text()
        url = self.url_input.text()
        cv_path = self.cv_path_input.text()
        date_applied = datetime.now().strftime("%Y-%m-%d")
        
        # For now, use the same date for posting date (would come from LLM analysis in real implementation)
        date_posted = date_applied
        
        # Save to database
        self.cursor.execute('''
        INSERT INTO applications (company, role, salary, url, date_posted, date_applied, cv_path)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (company, role, salary, url, date_posted, date_applied, cv_path))
        self.conn.commit()
        
        # Clear form
        self.url_input.clear()
        self.company_input.clear()
        self.role_input.clear()
        self.salary_input.clear()
        self.cv_path_input.clear()
        
        # Reload applications
        self.load_applications()
    
    def load_applications(self):
        # Clear table
        self.table.setRowCount(0)
        
        # Get applications from database
        self.cursor.execute("SELECT company, role, salary, date_posted, date_applied, cv_path FROM applications")
        applications = self.cursor.fetchall()
        
        # Add applications to table
        for row_idx, app in enumerate(applications):
            self.table.insertRow(row_idx)
            for col_idx, value in enumerate(app):
                self.table.setItem(row_idx, col_idx, QTableWidgetItem(str(value)))
    
    def closeEvent(self, event):
        # Close database connection when application closes
        self.conn.close()
        super().closeEvent(event)

def main():
    app = QApplication(sys.argv)
    window = JobApplicationTracker()
    window.show()
    sys.exit(app.exec())

if __name__ == "__main__":
    main()
