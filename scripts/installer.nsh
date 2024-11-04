!macro customInit
  ExecWait 'taskkill /F /IM "mezon.exe"'

  ReadRegStr $R0 HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\c837c073-4372-582d-8049-41f9c372ead4" "QuietUninstallString"

  # Check if the uninstall string exists (i.e., the previous version is installed)
  StrCmp $R0 "" 0 uninstall_old

  # If uninstall string is empty, skip the uninstallation
  Goto end_uninstall

  uninstall_old:
    # Run the uninstaller for the old version
    ClearErrors
    ExecWait '$R0' ; This will run the old uninstaller
    IfErrors 0 +2
    MessageBox MB_OK "Failed to uninstall old version."

  end_uninstall:
!macroend
