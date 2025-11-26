FROM python:3.11-slim

WORKDIR /app

# Install only FastAPI and Uvicorn
RUN pip install fastapi uvicorn

# Copy the app code
COPY . .

# Run the server on port 8001 (to avoid conflict with 8000)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
# Use an official Python runtime as a parent image