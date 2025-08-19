#!/usr/bin/env bash
# Start the Flask application with Gunicorn for production

exec gunicorn --bind 0.0.0.0:$PORT --workers 4 --timeout 120 --max-requests 1000 --max-requests-jitter 50 app:app