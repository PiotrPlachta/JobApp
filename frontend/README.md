# JobApp Tracker - Frontend (v1.0.0)

This is the frontend for the Job Application Tracker application. It's built with React and Material UI to provide a modern, responsive user interface for managing job applications.

## Features

- Interactive form for adding and editing job applications
- File upload components for CV and cover letter files
- Job posting URL analyzer that extracts information automatically
- Salary calculator that converts between different currencies and payment periods
- Application list with filtering and sorting options

## Project Structure

- `src/components/` - React components
  - `ApplicationForm.js` - Form for adding/editing applications
  - `ApplicationList.js` - List of saved applications
  - `Header.js` - Application header
- `src/App.js` - Main application component

## Setup

### Prerequisites

- Node.js and npm

### Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```

3. Access the application at http://localhost:3000

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.

### `npm test`

Launches the test runner in the interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.

## Docker

The frontend is also available as a Docker container. See the main README.md for instructions on running the application with Docker Compose.
