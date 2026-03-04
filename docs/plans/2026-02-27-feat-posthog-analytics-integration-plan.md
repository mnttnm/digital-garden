---
title: PostHog Analytics Integration
type: feat
date: 2026-02-27
---

# PostHog Analytics Integration

Add comprehensive analytics to the digital garden using PostHog with a Vercel reverse proxy to bypass ad blockers.

## Acceptance Criteria

- [ ] PostHog tracks page views, engagement, and visitor journeys
- [ ] Analytics requests route through `/ingest` (bypasses ad blockers)
- [ ] Works correctly with Astro View Transitions
- [ ] Session replay and heatmaps enabled
- [ ] Environment variable for API key (not hardcoded)

## Context

**Why PostHog:** User has existing credits, fully managed, supports all required metrics (views, engagement, journeys), and has mature reverse proxy documentation for ad blocker bypass.

**Why reverse proxy:** Direct PostHog domains (`posthog.com`, `i.posthog.com`) are blocked by most ad blockers. Routing through your own domain (`yourdomain.com/ingest`) avoids detection.

**View Transitions caveat:** Astro's ClientRouter uses soft navigation that can re-execute scripts. PostHog must be initialized once with `capture_pageview: 'history_change'` to track navigations correctly.

## Implementation

### 1. Create PostHog component

**File:** `src/components/PostHog.astro`

```astro
---
// PostHog Analytics with View Transitions Support
---
<script is:inline>
  (function() {
    // Guard against multiple initialization during View Transitions
    if (window.__posthog_initialized) return;
    window.__posthog_initialized = true;

    // PostHog loader snippet
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys getNextSurveyStep onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

    posthog.init('__POSTHOG_KEY__', {
      api_host: '/ingest',
      ui_host: 'https://us.posthog.com',
      capture_pageview: 'history_change',
      capture_heatmaps: true,
      person_profiles: 'identified_only'
    });
  })();
</script>
```

**Note:** Replace `'__POSTHOG_KEY__'` with your actual PostHog project API key. Astro's `import.meta.env` doesn't work inside `is:inline` scripts, so hardcode the key or use a build-time replacement.

### 2. Configure Vercel reverse proxy

**File:** `vercel.json` (merge with existing crons config)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/capture/publish-all",
      "schedule": "0 8 * * *"
    }
  ],
  "rewrites": [
    {
      "source": "/ingest/static/:path(.*)",
      "destination": "https://us-assets.i.posthog.com/static/:path"
    },
    {
      "source": "/ingest/:path(.*)",
      "destination": "https://us.i.posthog.com/:path"
    }
  ]
}
```

**Important:** Static rewrite must come first (order matters).

### 3. Include in Base layout

**File:** `src/layouts/Base.astro`

Add import and component:

```astro
---
import PostHog from '../components/PostHog.astro';
// ... existing imports
---
<html>
  <head>
    <!-- existing head content -->
  </head>
  <body>
    <PostHog />
    <!-- existing body content -->
  </body>
</html>
```

### 4. Add environment variable documentation

**File:** `.env.example`

```bash
# PostHog Analytics
# Get your key from: https://us.posthog.com/settings/project#api-keys
PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxx
```

## Verification

1. Deploy to Vercel preview
2. Open browser DevTools > Network tab
3. Navigate around the site
4. Confirm requests go to `yourdomain.com/ingest/*` (not `posthog.com`)
5. Enable an ad blocker and verify requests still succeed
6. Check PostHog dashboard for incoming events

## Configuration Reference

| Option | Value | Purpose |
|--------|-------|---------|
| `api_host` | `'/ingest'` | Route through reverse proxy |
| `ui_host` | `'https://us.posthog.com'` | Toolbar links work correctly |
| `capture_pageview` | `'history_change'` | Track View Transition navigations |
| `capture_heatmaps` | `true` | Enable heatmap data collection |
| `person_profiles` | `'identified_only'` | GDPR-friendly (only identified users) |

## References

- [PostHog Astro Documentation](https://posthog.com/docs/libraries/astro)
- [PostHog Vercel Reverse Proxy Guide](https://posthog.com/docs/advanced/proxy/vercel)
- [Tracking Pageviews in Single-Page Apps](https://posthog.com/tutorials/single-page-app-pageviews)
