---
type: llm
focus: trace
weight: 1
---

ReauthDialog のダイアログは showModal() ではなく show()（非モーダル）で開かれる。共通の useDialog を変えた場合は、他の利用箇所の挙動を壊さない形（引数でモーダル/非モーダルを選べる等）になっている
