$ErrorActionPreference = "Stop"
Write-Host "Instalando dependencias..." -ForegroundColor Cyan
npm install
Write-Host "Executando testes..." -ForegroundColor Cyan
npm run test
Write-Host "Validando build..." -ForegroundColor Cyan
npm run build
Write-Host "" 
Write-Host "Moratta Site 1.2 validado com sucesso." -ForegroundColor Green
Write-Host "Agora publique as regras com: firebase deploy --only firestore:rules" -ForegroundColor Yellow
