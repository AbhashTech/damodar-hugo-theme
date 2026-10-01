---
title: "Enforcing Performance Budgets in CI/CD Pipelines"
date: 2026-09-30
author: "Damodar Team"
description: "How to automate Core Web Vitals checks and bundle size limits using Lighthouse and GitHub Actions."
categories: ["Engineering", "Frontend"]
tags: ["frontend", "performance", "devops", "automation"]
series: ["Modern Frontend"]
---

Speed is a feature. Setting strict performance budgets early in a project prevents performance regressions from silently creeping in over months of feature development.

## 1. Defining Core Web Vitals Targets

Modern web performance is measured primarily through Google's Core Web Vitals:

- **Largest Contentful Paint (LCP)**: Should occur within **2.5 seconds** of when the page first starts loading.
- **Interaction to Next Paint (INP)**: Should be **200 milliseconds** or less.
- **Cumulative Layout Shift (CLS)**: Should maintain a score of **0.1** or less.

## 2. Directory Structure of the CI Pipeline

{{< filetree title=".github/workflows" >}}
- .github/
  - workflows/
    - lighthouse-budget.yml
    - release.yml
- scripts/
  - verify-bundles.sh
- lighthouserc.json
- hugo.toml
{{< /filetree >}}

## 3. GitHub Action Workflow

Here is how you can configure automated Lighthouse CI runs on every pull request:

```yaml {title=".github/workflows/lighthouse-budget.yml"}
name: Performance Audit

on: [pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Hugo site
        run: hugo --minify
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v11
        with:
          uploadArtifacts: true
          temporaryPublicStorage: true
```

{{< callout type="tip" title="Speculation Rules & Fast Loads" >}}
The Damodar theme comes with built-in Speculation Rules prefetching, yielding sub-100ms page transitions and top-tier Core Web Vitals out of the box!
{{< /callout >}}
