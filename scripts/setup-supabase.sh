#!/bin/bash

# Setup script for Supabase configuration
# This script helps you quickly set up your Supabase project

echo "🚀 LifeEvents Africa - Supabase Setup"
echo "======================================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed"
    echo "Please install it: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "✅ Supabase CLI detected"
echo ""

# Login to Supabase
echo "📝 Step 1: Login to Supabase"
echo "If you're already logged in, you can skip this step"
read -p "Do you want to login? (y/N): " login_choice

if [[ $login_choice =~ ^[Yy]$ ]]; then
    supabase login
fi

echo ""

# Link to existing project or create new one
echo "🔗 Step 2: Link to Supabase Project"
echo "You can either:"
echo "  1. Link to an existing project"
echo "  2. Create a new project"
echo ""
read -p "Enter choice (1 or 2): " project_choice

if [[ $project_choice == "1" ]]; then
    echo "Linking to existing project..."
    supabase link
elif [[ $project_choice == "2" ]]; then
    echo "Creating new project..."
    read -p "Enter project name: " project_name
    read -p "Enter database password: " db_password
    read -p "Enter region (e.g., us-east-1): " region

    supabase projects create "$project_name" \
        --db-password "$db_password" \
        --region "$region"

    echo "Linking to newly created project..."
    supabase link
else
    echo "Invalid choice. Exiting."
    exit 1
fi

echo ""

# Run migrations
echo "📊 Step 3: Running Database Migrations"
read -p "Run migrations now? (y/N): " migrate_choice

if [[ $migrate_choice =~ ^[Yy]$ ]]; then
    echo "Running migrations..."
    supabase db push
else
    echo "⚠️  Skipped migrations. Run 'supabase db push' later."
fi

echo ""

# Deploy Edge Functions
echo "⚡ Step 4: Deploy Edge Functions"
read -p "Deploy Paystack webhook function? (y/N): " function_choice

if [[ $function_choice =~ ^[Yy]$ ]]; then
    echo "Deploying paystack-webhook function..."
    supabase functions deploy paystack-webhook --no-verify-jwt
    echo "✅ Function deployed successfully"
else
    echo "⚠️  Skipped function deployment. Run 'supabase functions deploy paystack-webhook' later."
fi

echo ""

# Get project details
echo "📋 Step 5: Getting Project Details"
echo "Fetching API keys and URLs..."
echo ""

# Get project ref
PROJECT_REF=$(supabase projects list -o json | jq -r '.[0].id' 2>/dev/null)

if [ -n "$PROJECT_REF" ]; then
    echo "Project Reference: $PROJECT_REF"
    echo ""
    echo "🔑 Add these to your .env.local file:"
    echo "NEXT_PUBLIC_SUPABASE_URL=https://$PROJECT_REF.supabase.co"

    # Get API keys
    echo "Fetching API keys..."
    supabase projects api-keys --project-ref "$PROJECT_REF"
else
    echo "⚠️  Could not auto-detect project. Please get your keys from:"
    echo "https://app.supabase.com/project/_/settings/api"
fi

echo ""
echo "✨ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your Supabase credentials"
echo "2. Get your Camp Network API key from https://camp.network"
echo "3. Get your Paystack secret from https://dashboard.paystack.com"
echo "4. Run 'npm run dev' to start the development server"
echo ""
echo "For full setup guide, see: ORIGIN_SETUP.md"
