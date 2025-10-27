$env:PGPASSWORD = "admin"
psql -U postgres -c "\l" | Select-String -Pattern "skyraksys|hrm|postgres"
Remove-Item Env:PGPASSWORD
