#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "🔧 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "🚀 Building React frontend..."
cd react-vite
npm ci --only=production
npm run build
cd ..

echo "📁 Verifying build output..."
ls -la react-vite/dist/

echo "🗄️ Running database migrations..."
flask db upgrade

echo "🌱 Seeding database..."
flask seed all

echo "✅ Build completed successfully!"