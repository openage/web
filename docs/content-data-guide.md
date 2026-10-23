# Applegos runtime content data

The website's local application configuration points to JSON content served by the Applegos data server. In local development, `%24content` in the URL is the URL-encoded form of `$content` and maps to the data root at `D:\code\oa\solutions\applegos\data`.

## Map a content URL to a file

For a URL such as:

```text
http://localhost:8080/%24content/system/applications/local.json
```

decode the URL path and remove the `/$content/` prefix. The remaining relative path is `system/applications/local.json`, so the file to inspect is:

```text
D:\code\oa\solutions\applegos\data\system\applications\local.json
```

For another `/$content/<relative-path>` URL, join `<relative-path>` to the same data root. Ignore the URL origin, query string, and fragment when deriving the filesystem path. Preserve subdirectories and filenames exactly.

## Editing workflow

1. Find the exact URL or content reference in the application configuration, navigation metadata, or sibling content file.
2. Decode `%24content` as `$content`, map the path to the data root, and inspect the target file plus nearby related files before editing.
3. Treat the external data folder as the source of truth for content served by `/$content/`. Do not create a shadow copy under `pages-app` or change application code when the request is only about content.
4. Make the smallest content change. Preserve the existing JSON/HTML structure, identifier conventions, references, and formatting; inspect linked assets or metadata when they affect the requested content.
5. Validate the changed file's syntax and any local references affected by the edit. For JSON, parse the file and check that referenced routes/assets still exist where practical.
6. Report the exact external file changed and summarize the user-visible content change.

The data directory is outside this repository. If the active workspace or tool permissions do not allow writing there, do not silently edit a copy or claim the change is complete; use the available approved access path for the external directory.

## Repository reference

The local environment currently points at `http://localhost:8080/%24content/system/applications/local.json` in [environment.local.ts](../src/environments/environment.local.ts). The external data directory contains application configuration, navigation/page JSON, templates, and assets in subfolders such as `system/` and `assets/`. The application configuration and individual content references are authoritative if this guide becomes stale.
