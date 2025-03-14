# JobApp Tracker - Backend

This is the backend for the Job Application Tracker application. It's built with Flask and provides a RESTful API for managing job applications, analyzing job postings, and handling file uploads.

## Features

- RESTful API for CRUD operations on job applications
- OpenAI integration for analyzing job postings
- File upload handling for CV and cover letter files
- SQLite database for persistent storage
- Salary conversion between different currencies and payment periods

## Project Structure

- `app.py` - Main application file with API endpoints
- `utils/` - Utility functions
  - `llm_utils.py` - OpenAI integration for job posting analysis
- `data/` - Directory for the SQLite database
- `uploads/` - Directory for uploaded files
  - `cvs/` - Uploaded CV files
  - `cover_letters/` - Uploaded cover letter files

## API Endpoints

- `GET /api/applications` - Get all applications
- `POST /api/applications` - Add a new application
- `GET /api/applications/<id>` - Get a specific application
- `PUT /api/applications/<id>` - Update an application
- `DELETE /api/applications/<id>` - Delete an application
- `POST /api/analyze-url` - Analyze a job posting URL
- `POST /api/upload-file` - Upload a CV or cover letter file
- `POST /api/calculate-yearly-salary` - Calculate salary equivalents

## Setup

### Prerequisites

- Python 3.9+
- OpenAI API key

### Installation

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

3. Run the application:
   ```
   python app.py
   ```

4. The API will be available at http://localhost:5000

## Docker

The backend is also available as a Docker container. See the main README.md for instructions on running the application with Docker Compose.
