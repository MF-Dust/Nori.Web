from typing import Dict, Any

SITES = {
    "https://doodle.search/": {
        "title": "Doodle Search",
        "html": """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: sans-serif; background: #0f172a; color: #f8fafc; text-align: center; padding: 50px 20px; }
                h1 { color: #38bdf8; font-size: 32px; }
                input { width: 80%; max-width: 500px; padding: 12px 18px; border-radius: 24px; border: 1px solid #334155; background: #1e293b; color: #fff; font-size: 16px; outline: none; }
                .results { margin-top: 40px; text-align: left; max-width: 600px; margin-left: auto; margin-right: auto; }
                .card { background: #1e293b; padding: 16px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #334155; }
                .card a { color: #38bdf8; text-decoration: none; font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>Doodle Search</h1>
            <p>Fictional Internet Gateway · NoriOS Network</p>
            <input type="text" placeholder="Search the simulated net..." value="NoriOS architecture">
            <div class="results">
                <div class="card">
                    <a href="https://meridianpost.com/">The Meridian Post: NoriOS Next-Gen Node Launch</a>
                    <p style="color:#94a3b8; font-size:14px;">Autonomous AI companion and world engine successfully deployed in production.</p>
                </div>
                <div class="card">
                    <a href="https://pulse.social/">Pulse Social Feed</a>
                    <p style="color:#94a3b8; font-size:14px;">Latest network chatter, developer updates and community signals.</p>
                </div>
            </div>
        </body>
        </html>
        """
    },
    "https://meridianpost.com/": {
        "title": "The Meridian Post",
        "html": """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: serif; background: #fafaf9; color: #1c1917; padding: 30px; line-height: 1.6; }
                h1 { border-bottom: 2px solid #1c1917; padding-bottom: 10px; }
                .meta { color: #78716c; font-size: 14px; margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <h1>The Meridian Post</h1>
            <div class="meta">Special Edition · 2026</div>
            <h2>NoriOS: The Convergence of Live Virtual Companions and Realtime Runtimes</h2>
            <p>In a breakthrough development, NoriOS has seamlessly integrated Live2D emotional state tracking, WebSocket-based world presence, and local cognitive models into a unified desktop interface.</p>
        </body>
        </html>
        """
    },
    "https://pulse.social/": {
        "title": "Pulse Social",
        "html": """
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: sans-serif; background: #09090b; color: #fafafa; padding: 20px; }
                .post { background: #18181b; padding: 14px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #27272a; }
                .author { font-weight: bold; color: #a1a1aa; margin-bottom: 4px; }
            </style>
        </head>
        <body>
            <h2>Pulse Network</h2>
            <div class="post">
                <div class="author">@nori_core</div>
                <div>System status: optimal. Memory link: synchronized. Happy exploring! ✨</div>
            </div>
            <div class="post">
                <div class="author">@operator</div>
                <div>Connected to NoriOS node. Ready for party games and chat.</div>
            </div>
        </body>
        </html>
        """
    }
}

def get_browser_page(url: str) -> Dict[str, Any]:
    clean = url.split("?")[0].rstrip("/") + "/"
    if clean in SITES:
        return SITES[clean]
    for k, v in SITES.items():
        if k.rstrip("/") == clean.rstrip("/"):
            return v
    return {
        "title": "Simulated Net Page",
        "html": f"<html><body style='font-family:sans-serif;background:#111;color:#eee;padding:40px;text-align:center;'><h2>Page: {url}</h2><p>Simulated web page hosted inside NoriOS network.</p></body></html>"
    }
