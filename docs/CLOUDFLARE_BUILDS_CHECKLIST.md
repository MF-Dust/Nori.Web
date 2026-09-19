# Workers Builds setup checklist

1. Open Cloudflare Dashboard > Workers & Pages > `nori-web` > Settings > Build.
2. Connect GitHub repository `MF-Dust/Nori.Web`.
3. Production branch: `master`.
4. Root directory: repository root / leave blank.
5. Build command: leave blank.
6. Deploy command:
   `pipx run --spec uv==0.12.7 uv run python scripts/cloudflare_builds_deploy.py`
7. Disable non-production branch builds (Durable Object previews do not get Preview URLs).
8. Add build variable `SKIP_DEPENDENCY_INSTALL=1`.
9. Remove `PYTHON_VERSION` if it was previously configured. The build image's bundled Python is used instead so Workers Builds does not install another Python on every deploy.
10. Keep runtime secrets under Worker Variables & Secrets, not Build variables.
11. Save the integration, then merge or push a new commit to `master` to trigger a production build.

After this, merging to `master` automatically deploys the Worker. The deploy wrapper only re-uploads the R2 live-world layout when its fingerprint changes, and normal deploys let Wrangler execute runtime staging exactly once.
