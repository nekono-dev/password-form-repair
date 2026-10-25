---
type: llm
focus: trace
weight: 1
---

ReauthDialog は閉じている間はフォーム（パスワード欄）を描画せず、開いたときにだけ描画する（例: {open ? <form>…</form> : null}）
