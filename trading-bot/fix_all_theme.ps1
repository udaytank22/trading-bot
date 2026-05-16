$srcDir = "c:\Users\HP\Desktop\trading-bot\trading-bot\src"
$files = Get-ChildItem -Path $srcDir -Recurse -Include "*.jsx" | Where-Object {
  $_.FullName -notmatch '\\chat\\'
}

foreach ($file in $files) {
  $content = [System.IO.File]::ReadAllText($file.FullName)
  $original = $content

  # ══════════════════════════════════════════════
  # 1. TABLE BASE COLORS — fix un-prefixed text-gray-300 on <table>
  # ══════════════════════════════════════════════
  $content = $content -replace '<table className="w-full text-left text-sm text-gray-300"', '<table className="w-full text-left text-sm text-gray-700 dark:text-gray-300"'
  $content = $content -replace '<table className="w-full text-left text-xs text-gray-300"', '<table className="w-full text-left text-xs text-gray-700 dark:text-gray-300"'
  $content = $content -replace '<table className="w-full text-left text-\[12px\] text-gray-300"', '<table className="w-full text-left text-[12px] text-gray-700 dark:text-gray-300"'

  # ══════════════════════════════════════════════
  # 2. SECTION SUMMARY TEXT — un-prefixed text-gray-300 on divs
  # ══════════════════════════════════════════════
  $content = $content -replace '"grid grid-cols-2 gap-4 text-gray-300 text-sm"', '"grid grid-cols-2 gap-4 text-gray-700 dark:text-gray-300 text-sm"'
  $content = $content -replace '"grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300 text-sm"', '"grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300 text-sm"'

  # ══════════════════════════════════════════════
  # 3. INLINE ITEM TEXT — un-prefixed text-gray-300 in spans
  # ══════════════════════════════════════════════
  $content = $content -replace '"text-gray-300 font-medium"', '"text-gray-700 dark:text-gray-300 font-medium"'
  $content = $content -replace '"text-gray-300 font-bold text-lg"', '"text-gray-800 dark:text-gray-300 font-bold text-lg"'
  $content = $content -replace '"text-gray-300 text-sm font-bold"', '"text-gray-700 dark:text-gray-300 text-sm font-bold"'

  # ══════════════════════════════════════════════
  # 4. MODAL HEADER TITLES — standalone text-white without dark:
  # ══════════════════════════════════════════════
  # h2 in modal headers
  $content = $content -replace '(<h2 className="text-lg font-bold )text-white">', '$1text-gray-900 dark:text-white">'
  $content = $content -replace '(<h2 className="text-lg font-bold )text-white\s', '$1text-gray-900 dark:text-white '
  $content = $content -replace '(<h2 className="text-2xl font-bold )text-white\b', '$1text-gray-900 dark:text-white'

  # ══════════════════════════════════════════════
  # 5. TABLE CELL PRODUCT NAMES — text-sm/font-bold text-white
  # ══════════════════════════════════════════════
  $content = $content -replace '"text-sm font-bold text-white"', '"text-sm font-bold text-gray-900 dark:text-white"'
  $content = $content -replace '"text-sm font-mono font-bold text-white"', '"text-sm font-mono font-bold text-gray-900 dark:text-white"'

  # ══════════════════════════════════════════════
  # 6. INPUT TEXT COLORS — text-xs/sm text-white in inputs (no dark: prefix)
  # ══════════════════════════════════════════════
  $content = $content -replace '(\btext-xs\b) text-white focus:outline-none', '$1 text-gray-900 dark:text-white focus:outline-none'
  $content = $content -replace '(\btext-\[10px\]\b) text-white focus:outline-none', '$1 text-gray-900 dark:text-white focus:outline-none'
  $content = $content -replace '(\btext-sm\b) text-white focus:outline-none', '$1 text-gray-900 dark:text-white focus:outline-none'

  # ══════════════════════════════════════════════
  # 7. DealDrawer 2nd & 3rd table (seller quote, my quote) — still text-gray-300
  # ══════════════════════════════════════════════
  # Already handled above by rule #1 if not yet replaced, these cover the edge cases:
  $content = $content -replace '(<table className="w-full text-left text-sm )text-gray-300"', '$1text-gray-700 dark:text-gray-300"'

  # ══════════════════════════════════════════════
  # 8. CLOSE BUTTON TEXT — drawer/modal close buttons (hover only, safe to keep text-white)
  # BUT items like Cancel that are standalone text-white on light bg
  # ══════════════════════════════════════════════
  # PODrawer footer Cancel button text-gray-300
  $content = $content -replace '"flex-1 py-3 px-6 rounded-xl bg-white/\[0\.05\] border border-gray-200 dark:border-\[#2a2d36\] text-gray-300 font-bold', '"flex-1 py-3 px-6 rounded-xl bg-gray-100 dark:bg-white/[0.05] border border-gray-200 dark:border-[#2a2d36] text-gray-700 dark:text-gray-300 font-bold'

  # AddInquiryModal Cancel button
  $content = $content -replace '"px-6 py-2\.5 rounded-lg border border-gray-200 dark:border-\[#2a2d36\] text-gray-300 text-sm font-bold hover:bg-white/\[0\.05\]', '"px-6 py-2.5 rounded-lg border border-gray-200 dark:border-[#2a2d36] text-gray-700 dark:text-gray-300 text-sm font-bold hover:bg-gray-100 dark:hover:bg-white/[0.05]'

  # ══════════════════════════════════════════════
  # 9. QuoteModal product name (text-sm font-bold text-white already handled) 
  # QuoteModal h2 header
  # ══════════════════════════════════════════════
  $content = $content -replace '(<h2 className="text-lg font-bold )text-white"\>', '$1text-gray-900 dark:text-white">'

  # ══════════════════════════════════════════════
  # 10. StockCheckModal header title
  # ══════════════════════════════════════════════
  $content = $content -replace '(<h2 className="text-lg font-bold )text-white"\>Stock Availability Check', '$1text-gray-900 dark:text-white">Stock Availability Check'

  if ($content -ne $original) {
    [System.IO.File]::WriteAllText($file.FullName, $content)
    Write-Host "Updated: $($file.Name)"
  } else {
    Write-Host "No change: $($file.Name)"
  }
}

Write-Host "`nDone."
