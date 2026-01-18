---
description: Build the site and check for errors
allowed-tools:
  - Bash
---

Build the site and report any issues.

## Instructions

1. Run `npm run build`
2. Watch for any errors or warnings
3. Report the results

## Output

If successful:
```
✅ Build successful!

Pages generated: [count]
Build time: [time]

Ready to publish with /publish
```

If errors:
```
❌ Build failed

Error in [file]:
  [error message]

[Suggest how to fix]
```

## Common Issues

- **Missing frontmatter field**: Check that all required fields are present
- **Invalid date format**: Dates must be YYYY-MM-DD
- **Broken internal links**: Check file paths
- **Invalid URL in resources**: Ensure URLs are properly formatted

If build fails, identify the problematic file and suggest a fix.
