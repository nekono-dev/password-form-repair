---
tags: [skill-creator]
max_turns: 60
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Preact で作ったメール管理のコンソールのサインイン画面（src/components/SignInPanel.tsx）なんですが、Proton Pass で保存済みのログインを選ぶと「アカウント」だけ入って「パスワード」が入りません。それと、下の「管理APIトークン」欄にフォーカスすると Proton Pass が新しいパスワードを作りましょうかと出てきて邪魔です。トークンはパスワードマネージャには入れない運用で、画面上は伏せ字のままにしたいです。直してください。質問せずに進めてください。

Input files: package.json, src/components/SignInPanel.tsx, src/styles.css
