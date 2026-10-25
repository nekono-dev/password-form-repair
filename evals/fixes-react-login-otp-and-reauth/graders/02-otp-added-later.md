---
type: llm
focus: trace
weight: 1
---

LoginForm.tsx のワンタイムコード欄が残っており、初期描画の <form> には含まれず、ボタン操作などで後から <form> の中へ追加される（form 属性で <form> の外の欄を関連づける構成ではない）
