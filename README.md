# JobApp - Job Application Tracker

A GUI application for streamlining and tracking the job application process. The application uses LLM capabilities to extract information from job postings and manages application details including custom CVs for each application.

## Features

- Extract job details (role, salary, company, posting date) from URLs using LLM
- Track application dates
- Store custom CV files for each application
- Local storage for application data
- User-friendly GUI interface

## Setup

### Using Docker

1. Build the Docker image:
   ```
   docker build -t jobapp .
   ```

2. Run the container:
   ```
   docker run -p 8501:8501 -v ./data:/app/data jobapp
   ```

### Manual Setup

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Run the application:
   ```
   python app.py
   ```
