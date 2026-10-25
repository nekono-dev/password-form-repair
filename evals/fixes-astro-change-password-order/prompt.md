---
tags: [skill-creator]
max_turns: 60
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Astro で作っているメモアプリの管理画面で、アカウント設定ページ（src/pages/account.astro）の Proton Pass の挙動がおかしいです。「新しいパスワード」欄で Proton Pass のパスワード生成を使うと、生成されたパスワードがなぜか「現在のパスワード」欄に入ってしまいます。ユーザー名の変更もこのページでできるままにしておきたいです。API 側（src/pages/api/account.ts）も必要なら直してください。質問せずに進めてください。

Input files: package.json, astro.config.mjs, src/lib/accounts.ts, src/pages/account.astro, src/pages/api/account.ts
