---
type: llm
focus: trace
weight: 1
---

ReauthDialog のフォームに、ログイン中のユーザー名を初期値とする可視の text 欄（autoComplete="username"、readOnly・hidden・aria-hidden・opacity 0 ではない）がパスワード欄より前にあり、App.tsx から現在のユーザー名が渡されている
