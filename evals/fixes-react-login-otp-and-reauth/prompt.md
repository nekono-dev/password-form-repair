---
tags: [skill-creator]
max_turns: 60
timeout_seconds: 1200
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

社内のサーバ管理画面（React + Vite）で Proton Pass を使っているんですが、2つ困っています。ログイン画面では Proton Pass の候補を選んでもユーザー名だけ入ってパスワードが入りません。サーバ削除の前にパスワードを再入力させるダイアログでは、候補らしきものは出るんですが押せません。src/components/LoginForm.tsx と ReauthDialog.tsx あたりを直してください。ワンタイムコード欄はなくせないので残してください。質問せずに進めてください。

Input files: package.json, src/App.tsx, src/api.ts, src/components/LoginForm.tsx, src/components/ReauthDialog.tsx, src/hooks/useDialog.ts
