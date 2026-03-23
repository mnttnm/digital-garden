---
title: "I made Claude and Manus watch diaper prices for me. Scheduled tasks + browser use is an underrated combo."
date: 2026-03-23
kind: learning
tags: ["ai-tools", "browser-use", "automation", "claude", "manus"]
draft: false
images:
  - src: "/captures/discoveries/diaper-claude-scheduled-task.png"
    alt: "Claude scheduled task configured to monitor FirstCry diaper prices daily via the coupon API"
  - src: "/captures/discoveries/diaper-slack-messages.png"
    alt: "Slack notifications from both Manus and Claude showing price alerts with coupon codes, bank offers, and best prices for the diaper pack"
videos: []
code: ""
codeLanguage: ""
prompts:
  - |
    You are a price monitoring agent. Your job is to check the price of a specific product on FirstCry using their coupon API and send a Slack DM if the price is below ₹650.

    ## Product Details
    - **Product**: Pampers Premium Care Softest Ever Diaper Pants (M) Size - 54 Pieces
    - **Product URL**: [firstcry product link]
    - **Price threshold**: ₹650

    ## Steps

    1. **Fetch price and coupon data from the FirstCry API**:
       - Navigate to the coupon API URL with the product's brand ID, category, MRP, and product ID
       - Read the JSON response
       - Parse to extract: `bestPrice` (regular users), `bestPriceClub` (Club members), `couponinfo` (available coupons), `bankinfo` (bank offers)

    2. **Evaluate and notify**:
       - If `bestPrice` is below ₹650, send a Slack notification with the price breakdown, best coupon code, bank offers, and a direct buy link
       - If `bestPrice` is ₹650 or above, skip notification. Just note the price was checked.

    3. **Clean up**: Close any browser tabs opened during the check.

    ## Fallback
    - If the API fails, navigate to the product page directly and extract the price visually from a screenshot
    - If everything fails, send a failure notification via Slack
---

New father life means diapers. A lot of diapers. I order the same pack from FirstCry every few weeks, and the pricing on that site is chaotic. The same product swings from ~₹580 to over ₹1,000 depending on when you catch it. I usually wait for the ~₹600 range post-discounts, but between feeds and nap schedules, checking manually gets old fast.

Both Claude and Manus now have scheduled tasks and browser-use. I gave each a prompt: check this product's price periodically, notify me on Slack if it drops below ₹650. Both set it up in one go. Test notification came through, done.

The average price hovers around ₹900. Getting it at ~₹580 with stacked discounts, repeatedly, without lifting a finger, adds up. I'm going to set this up for every product I reorder regularly.

The implementation difference between the two was the surprise. Claude did standard browser automation, navigated the site, read the page, compiled a report. Manus analyzed the network calls FirstCry was making, found the underlying coupon API that returns the best possible price after all discounts, and used that directly. No browser navigation needed. I wasn't expecting that.

I took what Manus found and asked Claude to use the same API approach. Now the scheduled task hits the API directly, runs faster, and skips the flaky browser step entirely.
