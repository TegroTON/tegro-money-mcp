# Publishing `@tegroton/tegro-money-mcp` to npm

This package is published to the **`@tegroton`** npm scope (same as
`@tegroton/tegro-money` and `@tegroton/tegro-finance`). It's already configured for a
public scoped publish (`"publishConfig": { "access": "public" }` in `package.json`), so you
never need to pass `--access`.

There are two ways to publish. **The tag-based CI flow is recommended** — it adds verified
[npm provenance](https://docs.npmjs.com/generating-provenance-statements) (the "Built and
signed on GitHub Actions" badge), which requires the GitHub repo to be **public**.

---

## One-time setup

1. **npm account + org access.** Log in to <https://www.npmjs.com> with the account that owns
   the `@tegroton` org. Confirm you can publish to the scope (you already publish
   `@tegroton/tegro-money`). Keep 2FA on.

2. **Create an automation token** (for CI): npm → avatar → **Access Tokens** →
   **Generate New Token** → **Granular Access Token** → scope it to **Packages: Read and write**
   for the `@tegroton` org (or classic **Automation** token). Copy it.

3. **Add the token to the repo** (for the CI flow): GitHub repo → **Settings → Secrets and
   variables → Actions → New repository secret** → name **`NPM_TOKEN`**, value = the token.

---

## Option A — Tag-based release via CI (recommended, adds provenance)

Provenance requires a **public** repo, so make it public first.

```bash
# 1) make the GitHub repo public (Settings → General → Change visibility), then:
cd tegro-money-mcp
git pull

# 2) set the version (edit package.json "version", or use npm to bump + tag):
npm version patch      # 0.1.0 -> 0.1.1, creates a commit + tag v0.1.1
#   (use `npm version minor` / `major` as appropriate; first real release can stay 0.1.0)

# 3) push the commit and the tag — the tag triggers .github/workflows/release.yml:
git push && git push --tags
```

`release.yml` then runs `npm ci → typecheck → build → test → npm publish --provenance --access public`.
Watch it under the repo's **Actions** tab; on success the version appears on npm with the
provenance badge.

> First release with `npm version`: if you keep `0.1.0`, create the tag manually instead —
> `git tag v0.1.0 && git push origin v0.1.0`.

## Option B — Manual publish from your machine (no provenance)

Works whether the repo is public or private, but produces no provenance attestation.

```bash
cd tegro-money-mcp
npm login                 # once per machine
npm ci
npm run typecheck && npm run build && npm test    # must pass
npm publish               # access is already public via publishConfig
```

---

## Verify the release

```bash
npm view @tegroton/tegro-money-mcp version          # shows the published version
npx -y @tegroton/tegro-money-mcp                    # should start (stderr banner), then Ctrl-C
```

Then add it to an MCP client (Claude Desktop / Cursor) per the README and ask "what's my
Tegro.Money balance?" with a real `TEGRO_API_KEY`.

## Cutting future releases

1. Land changes on `main` (CI green).
2. Update `CHANGELOG.md`.
3. `npm version <patch|minor|major>` → `git push && git push --tags` → CI publishes.

Semver: **patch** = fixes, **minor** = new (still read-only) tools/back-compatible, **major** =
breaking changes to tool names/inputs.
