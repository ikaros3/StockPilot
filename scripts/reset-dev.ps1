# Reset Development Environment
Write-Host "🧹 Cleaning up environment..." -ForegroundColor Yellow

# 1. Remove node_modules
if (Test-Path "node_modules") {
    Write-Host "Removing node_modules..."
    Remove-Item -Recurse -Force node_modules
}

# 2. Remove build artifacts
$artifacts = @(".next", "out", "build", "dist", ".firebase")
foreach ($artifact in $artifacts) {
    if (Test-Path $artifact) {
        Write-Host "Removing $artifact..."
        Remove-Item -Recurse -Force $artifact
    }
}

# 3. Reinstall dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm ci

# 4. Check for .env.local
if (-not (Test-Path ".env.local")) {
    Write-Host "⚠️ Warning: .env.local file missing!" -ForegroundColor Red
    Write-Host "Please create one based on .env.example"
} else {
    Write-Host "✅ .env.local found." -ForegroundColor Green
}

Write-Host "✨ Environment reset complete! Try running 'npm run dev' now." -ForegroundColor Green
