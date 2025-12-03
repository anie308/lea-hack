# PowerShell Setup script for Supabase configuration
# This script helps you quickly set up your Supabase project

Write-Host "🚀 LifeEvents Africa - Supabase Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
$supabaseExists = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseExists) {
    Write-Host "❌ Supabase CLI is not installed" -ForegroundColor Red
    Write-Host "Please install it: https://supabase.com/docs/guides/cli" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Supabase CLI detected" -ForegroundColor Green
Write-Host ""

# Login to Supabase
Write-Host "📝 Step 1: Login to Supabase" -ForegroundColor Cyan
Write-Host "If you're already logged in, you can skip this step"
$loginChoice = Read-Host "Do you want to login? (y/N)"

if ($loginChoice -eq 'y' -or $loginChoice -eq 'Y') {
    supabase login
}

Write-Host ""

# Link to existing project or create new one
Write-Host "🔗 Step 2: Link to Supabase Project" -ForegroundColor Cyan
Write-Host "You can either:"
Write-Host "  1. Link to an existing project"
Write-Host "  2. Create a new project"
Write-Host ""
$projectChoice = Read-Host "Enter choice (1 or 2)"

if ($projectChoice -eq "1") {
    Write-Host "Linking to existing project..." -ForegroundColor Yellow
    supabase link
}
elseif ($projectChoice -eq "2") {
    Write-Host "Creating new project..." -ForegroundColor Yellow
    $projectName = Read-Host "Enter project name"
    $dbPassword = Read-Host "Enter database password" -AsSecureString
    $dbPasswordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
    )
    $region = Read-Host "Enter region (e.g., us-east-1)"

    supabase projects create $projectName --db-password $dbPasswordPlain --region $region

    Write-Host "Linking to newly created project..." -ForegroundColor Yellow
    supabase link
}
else {
    Write-Host "Invalid choice. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Run migrations
Write-Host "📊 Step 3: Running Database Migrations" -ForegroundColor Cyan
$migrateChoice = Read-Host "Run migrations now? (y/N)"

if ($migrateChoice -eq 'y' -or $migrateChoice -eq 'Y') {
    Write-Host "Running migrations..." -ForegroundColor Yellow
    supabase db push
}
else {
    Write-Host "⚠️  Skipped migrations. Run 'supabase db push' later." -ForegroundColor Yellow
}

Write-Host ""

# Deploy Edge Functions
Write-Host "⚡ Step 4: Deploy Edge Functions" -ForegroundColor Cyan
$functionChoice = Read-Host "Deploy Paystack webhook function? (y/N)"

if ($functionChoice -eq 'y' -or $functionChoice -eq 'Y') {
    Write-Host "Deploying paystack-webhook function..." -ForegroundColor Yellow
    supabase functions deploy paystack-webhook --no-verify-jwt
    Write-Host "✅ Function deployed successfully" -ForegroundColor Green
}
else {
    Write-Host "⚠️  Skipped function deployment. Run 'supabase functions deploy paystack-webhook' later." -ForegroundColor Yellow
}

Write-Host ""

# Get project details
Write-Host "📋 Step 5: Getting Project Details" -ForegroundColor Cyan
Write-Host "To get your API keys and URLs:"
Write-Host "1. Run: supabase projects list" -ForegroundColor Yellow
Write-Host "2. Run: supabase projects api-keys --project-ref YOUR_PROJECT_REF" -ForegroundColor Yellow
Write-Host ""
Write-Host "Or visit: https://app.supabase.com/project/_/settings/api" -ForegroundColor Yellow

Write-Host ""
Write-Host "✨ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update .env.local with your Supabase credentials"
Write-Host "2. Get your Camp Network API key from https://camp.network"
Write-Host "3. Get your Paystack secret from https://dashboard.paystack.com"
Write-Host "4. Run 'npm run dev' to start the development server"
Write-Host ""
Write-Host "For full setup guide, see: ORIGIN_SETUP.md" -ForegroundColor Yellow
