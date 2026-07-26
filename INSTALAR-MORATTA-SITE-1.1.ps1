$ErrorActionPreference = "Stop"
$project = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $project

Write-Host ""
Write-Host "Moratta Site 1.1 - Operacao Comercial" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

if (-not (Test-Path ".env.local")) {
    $atlasEnv = "C:\Users\cassi\atlas-ai\.env.local"
    if (Test-Path $atlasEnv) {
        Copy-Item $atlasEnv ".env.local" -Force
        $current = Get-Content ".env.local" -Raw
        if ($current -notmatch "NEXT_PUBLIC_SITE_URL=") {
            Add-Content ".env.local" "`nNEXT_PUBLIC_SITE_URL=http://localhost:3000"
        }
        Write-Host "Credenciais publicas copiadas do Atlas." -ForegroundColor Green
    } elseif (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env.local"
        Write-Host "Preencha o .env.local antes de usar o painel." -ForegroundColor Yellow
    }
} else {
    Write-Host ".env.local existente preservado." -ForegroundColor Green
}

Write-Host "Instalando dependencias..." -ForegroundColor Cyan
npm install

Write-Host "Executando testes..." -ForegroundColor Cyan
npm test

Write-Host "Verificando lint..." -ForegroundColor Cyan
npm run lint

Write-Host "Gerando build de producao..." -ForegroundColor Cyan
npm run build

Write-Host ""
Write-Host "Moratta Site 1.1 validado." -ForegroundColor Green
Write-Host "Site:  npm run dev" -ForegroundColor White
Write-Host "Admin: http://localhost:3000/admin" -ForegroundColor White
Write-Host "Publique firestore.rules e storage.rules no Firebase." -ForegroundColor Yellow
