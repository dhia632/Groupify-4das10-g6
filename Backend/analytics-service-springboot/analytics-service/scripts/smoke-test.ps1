param(
  [string]$BaseUrl = "http://localhost:8085"
)

$headers = @{
  "X-User-Id" = "teacher1"
  "X-User-Name" = "Amel Haddad"
  "X-User-Roles" = "TEACHER"
}

Write-Host "1) Balance"
Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/analytics/courses/1/balance" -Headers $headers | ConvertTo-Json -Depth 8

Write-Host "2) Engagement"
Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/analytics/courses/1/engagement" -Headers $headers | ConvertTo-Json -Depth 8

Write-Host "3) Promotion"
Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/analytics/promotions/4DAS/summary" -Headers $headers | ConvertTo-Json -Depth 8

Write-Host "4) Reports"
Invoke-RestMethod -Method Get -Uri "$BaseUrl/api/analytics/reports" -Headers $headers | ConvertTo-Json -Depth 8

Write-Host "5) Create report"
$body = @{ scope = "COURSE"; scopeId = "1"; period = "Semaine de test" } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "$BaseUrl/api/analytics/reports" -Headers $headers -ContentType "application/json" -Body $body | ConvertTo-Json -Depth 8
