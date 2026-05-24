#!/bin/bash

# CableEasy Dokploy Setup Script
# Run this after first deployment to setup database

echo "🚀 CableEasy Database Setup"
echo "================================"

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable not set"
    exit 1
fi

echo "✅ DATABASE_URL found"

# Generate migrations
echo "📝 Generating migrations..."
npm run db:generate

# Run migrations
echo "🔄 Running migrations..."
npm run db:migrate

# Seed database
echo "🌱 Seeding database..."
npm run db:seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "Default Admin Credentials:"
echo "Username: admin"
echo "Password: admin123"
echo ""
echo "⚠️  IMPORTANT: Change admin password after first login!"
