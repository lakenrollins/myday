#!/usr/bin/env bash
# Start the Flask application with Gunicorn for production

exec gunicorn app:app