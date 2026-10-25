# password-form-repair

Webアプリのログイン・パスワード入力フォームを、パスワードマネージャ（Proton Pass等）が自動入力・新パスワードの生成を行える形に直す／新しく作る Claude Code のスキル（プラグイン）。

「フォームが出ない」「ユーザー名だけ入ってパスワードが入らない」「候補が押せない」「生成したパスワードが現在のパスワード欄に入る」といった症状の原因と対処を、Proton Pass の実機で確かめた事実として持つ。1Password・Bitwarden・ブラウザ内蔵のパスワード管理では検証していない。

## 導入

```
/plugin marketplace add nekono-dev/claude-plugins
/plugin install password-form-repair@nekono-dev
```

「Proton Pass が反応しない」「自動入力されない」「ログイン画面を作って」「パスワード変更フォームを追加したい」といった依頼でスキルが使われる。

## 構成

| パス | 内容 |
|---|---|
| `SKILL.md` | スキル本体（進め方・疑うポイントの表・実機確認の頼み方） |
| `references/findings.md` | 疑うポイントの各項目の経緯（何を試して外れたか） |
| `references/frameworks.md` | React・Preact・HTML・Astro（とその他）での書き方の違い |
| `references/bisect.md` | 監査で直らないときの実機での切り分け手順 |
| `scripts/audit-forms.mjs` | `.jsx`/`.tsx`/`.html`/`.astro` を走査し、既知の落とし穴を指摘する静的監査（依存なし） |
| `scripts/make-bisect-page.mjs` | 構成違いのフォームを並べた切り分け用のテストページを生成する |
| `scripts/dom-probe.js` | 利用者のブラウザのコンソールに貼って、フォームの実状態・自動入力時のイベントを取る |
| `templates/` | ログイン・変更フォーム・非モーダルのダイアログの雛形（React・Preact・HTML・Astro）と共通CSS |
| `tests/` | 監査スクリプトの単体テスト |
| `evals/` | スキルの評価ケース（`claude plugin eval` の形式） |

監査は単体でも使える。

```sh
node scripts/audit-forms.mjs path/to/src
```

## 開発

```sh
node --test tests/*.test.mjs          # 監査スクリプトの単体テスト（雛形が指摘なしであることも含む）
node scripts/audit-forms.mjs templates
```

疑うポイントを増やすときは、実機で確かめた事実だけを `SKILL.md` の表と `references/findings.md` に足し、静的に検出できるなら `scripts/audit-forms.mjs` とテストにも足す。

## ライセンス

[Unlicense](LICENSE)
