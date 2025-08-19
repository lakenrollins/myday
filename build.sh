#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "🔧 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "📁 Verifying frontend build exists..."
ls -la react-vite/dist/

echo "🗄️ Initializing database..."
# Check if migrations directory exists, if not create it
if [ ! -d "migrations" ]; then
    echo "Creating migrations directory..."
    flask db init
fi

echo "🔄 Running database migrations..."
flask db upgrade

echo "🌱 Seeding database..."
# Check if seed command exists before running
if flask seed --help > /dev/null 2>&1; then
    flask seed all
else
    echo "Seed command not available, skipping..."
fi

echo "✅ Build completed successfully!"