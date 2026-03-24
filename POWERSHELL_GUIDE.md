# PowerShell Quick Reference for Housing App

## Common Commands

### Starting the Server
```powershell
# You're already in the housing-app directory, so just run:
npm start

# If you need to navigate first:
cd C:\Users\princ\OneDrive\Desktop\housing-app
npm start
```

### Chaining Commands in PowerShell
```powershell
# ❌ WRONG (Bash/Linux syntax - doesn't work in PowerShell)
cd housing-app && npm start

# ✅ CORRECT (PowerShell syntax)
cd housing-app; npm start

# ✅ BETTER (Run separately)
cd housing-app
npm start
```

### Other Useful Commands
```powershell
# Check Node version
node --version

# Check npm version
npm --version

# Install dependencies
npm install

# Run test script
node test-server.js

# Seed demo data
npm run seed:demo

# Stop server
# Press Ctrl+C in the terminal
```

## PowerShell vs Bash Differences

| Task | Bash (Linux/Mac) | PowerShell (Windows) |
|------|------------------|----------------------|
| Chain commands | `cmd1 && cmd2` | `cmd1; cmd2` |
| List files | `ls` | `ls` or `dir` |
| Change directory | `cd path` | `cd path` |
| Clear screen | `clear` | `cls` or `clear` |
| Environment variable | `$VAR` | `$env:VAR` |
| Run script | `./script.sh` | `.\script.ps1` |

## Tips for Windows Development

1. **Use PowerShell or Command Prompt** - Both work fine
2. **Run commands separately** - Easier to debug
3. **Keep terminal open** - See server logs in real-time
4. **Use Ctrl+C to stop** - Stops the running server

## Your App Commands

```powershell
# 1. Navigate to project (if needed)
cd C:\Users\princ\OneDrive\Desktop\housing-app

# 2. Start the server
npm start

# 3. Open browser to:
# http://localhost:3000/ui/services.html
```

That's it! The `&&` error is just PowerShell syntax - your app is fine! 🎉
