#!/usr/bin/env bash
# Start the Flask application with Gunicorn for production

exec gunicorn --bind 0.0.0.0:$PORT app:app