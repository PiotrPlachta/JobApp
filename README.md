# JobApp - Job Application Tracker

A comprehensive application for streamlining and tracking the job application process. The application uses LLM capabilities to extract information from job postings and manages application details including CV and cover letter files for each application.

## Features

- Extract job details (role, salary, company, posting date) from URLs using OpenAI's API
- Track application dates and statuses
- Upload and store CV and cover letter files for each application
- Calculate salary equivalents across different currencies and payment periods
- Persistent storage for all application data
- Modern, responsive user interface

## Architecture

- **Frontend**: React with Material UI
- **Backend**: Flask API
- **Database**: SQLite
- **AI Integration**: OpenAI API for job posting analysis

## Setup

### Prerequisites

- Docker and Docker Compose
- OpenAI API key

### Using Docker Compose

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/JobApp.git
   cd JobApp
   ```

2. Create a `.env` file in the `backend` directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

3. Build and start the containers:
   ```
   docker-compose up -d
   ```

4. Access the application at http://localhost:3000

### Manual Setup

#### Backend

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Create a `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

4. Run the Flask application:
   ```
   python app.py
   ```

#### Frontend

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the React application:
   ```
   npm start
   ```

4. Access the application at http://localhost:3000

## Usage

1. Click on the form to expand it
2. Enter a job posting URL and click "Analyze URL" to automatically extract job details
3. Upload your CV and cover letter files
4. Fill in any additional details
5. Click "Add Application" to save the application
6. View and manage your applications in the list below

## Data Storage

All application data is stored in an SQLite database located at `backend/data/applications.db`. Uploaded files are stored in the `backend/uploads` directory, organized into subdirectories for CVs and cover letters.
