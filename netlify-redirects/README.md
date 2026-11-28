# Netlify redirects for the old app addresses

The web apps used to live on Netlify. They now run on Cloudflare at their spacekidlabs.com subdomains
(see `docs/HOSTING.md`). Each old Netlify site is linked to one folder here and serves only its
`_redirects` file, which sends every URL to the new address with a 301:

| Old address | Folder | New address |
| --- | --- | --- |
| noiseforge.netlify.app | `noiseforge/` | noiseforge.spacekidlabs.com |
| datapaint.netlify.app | `datapaint/` | datapaint.spacekidlabs.com |
| spectralrotatorfx.netlify.app | `spectralrotatorfx/` | spectralrotator.spacekidlabs.com |
| databenddaw.netlify.app | `databenddaw/` | databend.spacekidlabs.com |

Builds are stopped on those Netlify sites after the first deploy, so pushes to this repo don't use
Netlify build credits. To change a redirect: edit the file, then in the Netlify site turn builds back on
(**Project configuration → Build & deploy → Continuous deployment → Build status**), deploy, and stop them again.
