FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend files
COPY backend /app/backend

# Expose port for the application
EXPOSE 5000

# Command to run the application
CMD ["python", "-m", "backend.run"]
