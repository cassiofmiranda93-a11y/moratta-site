$ErrorActionPreference = "Stop"
$project = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $project

Write-Host "" 
Write-Host "Moratta Site 1.0 - Catálogo e Administração" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

if (-not (Test-Path ".env.local")) {
    $atlasEnv = "C:\Users\cassi\atlas-ai\.env.local"
    if (Test-Path $atlasEnv) {
        Copy-Item $atlasEnv ".env.local" -Force
        Add-Content ".env.local" "`nNEXT_PUBLIC_SITE_URL=http://localhost:3000"
        Write-Host "Credenciais públicas copiadas do Atlas." -ForegroundColor Green
    } elseif (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env.local"
        Write-Host "Arquivo .env.local criado. Preencha as credenciais do Firebase antes de usar /admin." -ForegroundColor Yellow
    }
} else {
    Write-Host ".env.local existente preservado." -ForegroundColor Green
}

Write-Host "Instalando dependências..." -ForegroundColor Cyan
npm install

Write-Host "Executando testes..." -ForegroundColor Cyan
npm test

Write-Host "Verificando código..." -ForegroundColor Cyan
npm run lint

Write-Host "Gerando build de produção..." -ForegroundColor Cyan
npm run build

Write-Host "" 
Write-Host "Validação concluída." -ForegroundColor Green
Write-Host "Abra o site com: npm run dev" -ForegroundColor White
Write-Host "Administração: http://localhost:3000/admin" -ForegroundColor White
Write-Host "" 
Write-Host "IMPORTANTE: publique firestore.rules e storage.rules no projeto atlas-ai-83f0d." -ForegroundColor Yellow
