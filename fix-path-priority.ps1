# PowerShell script to fix PATH priority for UV over Goose
# Run this as Administrator

Write-Host "Fixing PATH priority for UV..." -ForegroundColor Cyan

# Get current user PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
$pathArray = $currentPath -split ';'

# Define the paths
$uvPath = "C:\Users\HP\.local\bin"
$goosePath = "C:\Users\HP\AppData\Local\Goose\bin"

# Remove both paths if they exist
$pathArray = $pathArray | Where-Object { $_ -ne $uvPath -and $_ -ne $goosePath }

# Add UV path first (higher priority), then Goose path
$newPathArray = @($uvPath) + $pathArray + @($goosePath)

# Join and set the new PATH
$newPath = $newPathArray -join ';'
[Environment]::SetEnvironmentVariable("Path", $newPath, "User")

Write-Host "`nPATH updated successfully!" -ForegroundColor Green
Write-Host "`nNew priority order:" -ForegroundColor Yellow
Write-Host "  1. $uvPath (UV - HIGHEST PRIORITY)" -ForegroundColor Green
Write-Host "  2. Other paths..."
Write-Host "  3. $goosePath (Goose - LOWEST PRIORITY)" -ForegroundColor Gray

Write-Host "`nIMPORTANT: Close and reopen your terminal for changes to take effect." -ForegroundColor Cyan

# Verify
Write-Host "`nVerifying uvx location after restart will show:" -ForegroundColor Yellow
Write-Host "  First: $uvPath\uvx.exe" -ForegroundColor Green
