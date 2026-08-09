$payload = @{
    ref = "refs/heads/main"
    repository = @{
        id = 987654321
        name = "ui-gonceng"
        full_name = "FikriBintangx/ui-gonceng"
        owner = @{
            login = "FikriBintangx"
            name = "FikriBintangx"
        }
    }
    commits = @(
        @{
            id = (New-Guid).ToString().Replace("-","").Substring(0,20)
            message = "feat(ui): GO-NCENG full app with desktop smartphone frame, mobile portrait, interactive maps, live driver tracking & Vercel deployment"
            timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
            author = @{
                name = "AI Agent (Antigravity)"
                email = "antigravity@ai-orchestrator.local"
            }
            added_lines = 2631
            deleted_lines = 0
            modified = @("index.html", "style.css", "app.js", "vercel.json")
        }
    )
} | ConvertTo-Json -Depth 4

Invoke-RestMethod -Uri "https://versatiles.vercel.app/api/webhook/github" -Method Post -Body $payload -ContentType "application/json"
