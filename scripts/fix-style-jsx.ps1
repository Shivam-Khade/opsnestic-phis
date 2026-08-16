$files = Get-ChildItem -Path "app\(app)" -Recurse -Filter "*.tsx"
foreach ($f in $files) {
  $content = Get-Content -Path $f.FullName -Raw
  $fixed = $content -replace '<style jsx>', '<style>'
  if ($content -ne $fixed) {
    Set-Content -Path $f.FullName -Value $fixed -NoNewline
    Write-Host "Fixed: $($f.Name)"
  }
}
Write-Host "Done"
