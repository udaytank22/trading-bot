$srcDir = "c:\Users\HP\Desktop\trading-bot\trading-bot\src\components"
$files = Get-ChildItem -Path $srcDir -Recurse -Include "*.jsx" | Where-Object {
  $_.FullName -notmatch '\\ui\\' -and
  $_.FullName -notmatch '\\layout\\' -and
  $_.FullName -notmatch '\\chat\\'
}

foreach ($file in $files) {
  $content = [System.IO.File]::ReadAllText($file.FullName)
  $original = $content

  # --- Drawer/modal MAIN panel backgrounds (right-side drawers) ---
  $content = $content -replace 'bg-\[#1e2028\]', 'bg-white dark:bg-[#1e2028]'

  # --- Section header / footer backgrounds ---
  $content = $content -replace 'bg-\[#1a1d23\] flex-shrink-0', 'bg-gray-50 dark:bg-[#1a1d23] flex-shrink-0'
  $content = $content -replace 'bg-\[#1a1d23\] mt-', 'bg-gray-50 dark:bg-[#1a1d23] mt-'
  $content = $content -replace "bg-\[#1a1d23\] flex flex-col", 'bg-gray-50 dark:bg-[#1a1d23] flex flex-col'
  # Generic remaining bg-[#1a1d23] not yet replaced
  $content = $content -replace "(?<!dark:)bg-\[#1a1d23\](?! dark:bg)", 'bg-gray-50 dark:bg-[#1a1d23]'

  # --- Deep content / input backgrounds ---
  $content = $content -replace "(?<!dark:)bg-\[#0c0e12\](?! dark:bg)", 'bg-gray-100 dark:bg-[#0c0e12]'

  # --- Card/subtle section backgrounds ---
  $content = $content -replace "(?<!dark:)bg-\[#242830\](?! dark:bg)", 'bg-gray-100 dark:bg-[#242830]'
  $content = $content -replace "(?<!dark:)bg-\[#161922\](?! dark:bg)", 'bg-white dark:bg-[#161922]'

  # --- Borders ---
  $content = $content -replace "(?<!dark:)border-\[#2a2d33\](?! dark:border)", 'border-gray-200 dark:border-[#2a2d33]'
  $content = $content -replace "(?<!dark:)border-\[#2a2d36\](?! dark:border)", 'border-gray-200 dark:border-[#2a2d36]'

  # --- Fix text color on inputs (text-white → text-gray-900 dark:text-white) ---
  # Input/select/textarea elements that have hardcoded text-white
  $content = $content -replace 'text-sm text-white focus:border-purple-500', 'text-sm text-gray-900 dark:text-white focus:border-purple-500'
  $content = $content -replace 'text-xs text-white focus:border-purple-500', 'text-xs text-gray-900 dark:text-white focus:border-purple-500'
  $content = $content -replace 'text-\[10px\] text-white focus:border-purple-500', 'text-[10px] text-gray-900 dark:text-white focus:border-purple-500'
  $content = $content -replace 'text-\[11px\] text-white focus:border-purple-500', 'text-[11px] text-gray-900 dark:text-white focus:border-purple-500'

  # --- Fix heading text-white in modal headers ---
  $content = $content -replace 'text-lg font-bold text-white tracking-tight', 'text-lg font-bold text-gray-900 dark:text-white tracking-tight'
  $content = $content -replace 'text-xl font-bold text-white tracking-tight', 'text-xl font-bold text-gray-900 dark:text-white tracking-tight'
  $content = $content -replace 'text-\[18px\] font-bold text-white', 'text-[18px] font-bold text-gray-900 dark:text-white'

  # --- Footer/Cancel button border and text ---
  $content = $content -replace "border-\[#2a2d33\] text-gray-300 text-sm font-bold hover:bg-white", 'border-gray-200 dark:border-[#2a2d33] text-gray-700 dark:text-gray-300 text-sm font-bold hover:bg-gray-100 dark:hover:bg-white'

  # --- Fix bg-[#1a1d23] standalone in class-only strings (remaining) ---
  $content = $content -replace '"bg-\[#1a1d23\]"', '"bg-gray-50 dark:bg-[#1a1d23]"'

  # --- Dividers ---
  $content = $content -replace 'bg-\[#2a2d36\] w-full', 'bg-gray-200 dark:bg-[#2a2d36] w-full'
  $content = $content -replace 'bg-\[#2a2d33\] w-full', 'bg-gray-200 dark:bg-[#2a2d33] w-full'

  if ($content -ne $original) {
    [System.IO.File]::WriteAllText($file.FullName, $content)
    Write-Host "Updated: $($file.Name)"
  } else {
    Write-Host "No change: $($file.Name)"
  }
}
Write-Host "`nDone."
