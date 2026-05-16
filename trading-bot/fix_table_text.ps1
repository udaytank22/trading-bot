$srcDir = "c:\Users\HP\Desktop\trading-bot\trading-bot\src\components"
$files = Get-ChildItem -Path $srcDir -Recurse -Include "*.jsx" | Where-Object {
  $_.FullName -notmatch '\\ui\\' -and
  $_.FullName -notmatch '\\layout\\' -and
  $_.FullName -notmatch '\\chat\\'
}

foreach ($file in $files) {
  $content = [System.IO.File]::ReadAllText($file.FullName)
  $original = $content

  # ── Table element base text (text-gray-300 on table itself, becomes theme-aware) ──
  $content = $content -replace '<table className="w-full text-left text-sm text-gray-300"', '<table className="w-full text-left text-sm text-gray-700 dark:text-gray-300"'
  $content = $content -replace '<table className="w-full text-left text-xs text-gray-300"', '<table className="w-full text-left text-xs text-gray-700 dark:text-gray-300"'

  # ── Table body cell: product/item name text-white → theme-aware ──
  $content = $content -replace '(<td [^>]*?)text-white font-medium', '$1text-gray-900 dark:text-white font-medium'
  $content = $content -replace '(<td [^>]*?)text-white font-bold', '$1text-gray-900 dark:text-white font-bold'
  $content = $content -replace '(<td [^>]*?)font-medium text-white', '$1font-medium text-gray-900 dark:text-white'
  $content = $content -replace '(<td [^>]*?)font-bold text-white', '$1font-bold text-gray-900 dark:text-white'

  # ── Inline <p> or <span> inside table cells with text-white ──
  $content = $content -replace '(<p className="font-bold )text-white"', '$1text-gray-900 dark:text-white"'
  $content = $content -replace '(<span className="text-white font-bold">)', '<span className="text-gray-900 dark:text-white font-bold">'
  $content = $content -replace '(<span className="text-gray-200 font-bold)', '<span className="text-gray-800 dark:text-gray-200 font-bold'

  # ── td total/right-side values text-white ──
  $content = $content -replace '(<td [^>]*?)text-right font-mono font-bold text-white', '$1text-right font-mono font-bold text-gray-900 dark:text-white'
  $content = $content -replace '(<td [^>]*?)font-mono font-bold text-white text-right', '$1font-mono font-bold text-gray-900 dark:text-white text-right'

  # ── Tbody divide colors (hardcoded dark separator) ──
  $content = $content -replace 'divide-\[#2a2d36\]/50', 'divide-gray-200 dark:divide-[#2a2d36]/50'
  $content = $content -replace 'divide-\[#2a2d33\](?!/50)', 'divide-gray-200 dark:divide-[#2a2d33]'

  # ── tr hover on dark backgrounds → light-safe ──
  $content = $content -replace 'className="hover:bg-white/\[0\.03\] bg-white/\[0\.01\]"', 'className="hover:bg-gray-50 dark:hover:bg-white/[0.03] bg-transparent dark:bg-white/[0.01]"'
  $content = $content -replace 'className=\{`hover:bg-white/\[0\.02\] transition-colors`\}', 'className={`hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors`}'

  # ── Summary card big numbers: text-2xl font-mono font-bold text-white ──
  $content = $content -replace '(<p className="text-2xl font-mono font-bold )text-white"', '$1text-gray-900 dark:text-white"'

  # ── Modal header title still text-white (non dark-prefixed) ──
  $content = $content -replace '(<h2 className="text-lg font-bold )text-white"', '$1text-gray-900 dark:text-white"'
  $content = $content -replace '(<h2 className="text-lg font-bold )text-white ', '$1text-gray-900 dark:text-white '

  # ── Misc standalone text-white inside tables ──
  # Table total footer row value
  $content = $content -replace '(<div className="text-\[14px\] )text-white"', '$1text-gray-900 dark:text-white"'

  if ($content -ne $original) {
    [System.IO.File]::WriteAllText($file.FullName, $content)
    Write-Host "Updated: $($file.Name)"
  } else {
    Write-Host "No change: $($file.Name)"
  }
}
Write-Host "`nDone."
