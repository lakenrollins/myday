#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt
pip install psycopg2

# Build frontend if needed
cd react-vite
npm ci --only=production
npm run build
cd ..

# Run database migrations
flask db upgrade

# Seed database
flask seed all