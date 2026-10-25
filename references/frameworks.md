# フレームワークごとの書き方

構成（どの欄をどの`<form>`に置き、いつDOMへ追加するか）はフレームワークによらず同じで、違うのは書き方だけ。雛形は`templates/<フレームワーク>/`にあり、同じ種類のファイルを並べて比べられる。

| 観点 | React | Preact | 素のHTML | Astro |
|---|---|---|---|---|
| autocompleteの書き方 | `autoComplete="username"` | `autoComplete="username"`（実機で確認済み。`autocomplete`でもよい） | `autocomplete="username"` | `autocomplete="username"` |
| クラス | `className` | `class` | `class` | `class` |
| 入力の受け取り | `onChange` | `onInput`（`(e.target as HTMLInputElement).value`） | `FormData`・`form.elements` | 同左（`<script>`内） |
| 後から欄を足す（#3・#7） | `{show ? (<label>…) : null}` | 同左 | `<template>`の中身を複製して`append` | 同左。`{x && …}`はサーバ側で1回だけ評価されるので使えない |
| ダイアログを開く（#2） | `useEffect`で`dialog.show()` | 同左 | `dialog.show()` | 同左（`<script>`内） |
| Escで閉じる | `onKeyDown`で補う | 同左 | `keydown`で補う | 同左 |

## React

- 制御入力（`value`＋`onChange`）でも自動入力は入る。値を保持したくないパスワード欄は、非制御（`ref`）にしてもよい。
- 共通のダイアログ用フックが`showModal()`を呼んでいるなら、引数でモーダルかどうかを選べるようにし、パスワード欄を持つダイアログだけ非モーダルにする（監査は`useXxxDialog(open, false)`や`modal={false}`の形を非モーダルとみなす）。
- 単体テスト（jsdom）では`HTMLDialogElement.prototype.show`/`close`が無い。`open`属性を切り替えるポリフィルを`setupTests`に置く。

## Preact

- Reactとの違いは`class`・`onInput`・`preact/hooks`だけ。`autoComplete`（キャメルケース）は、Preactが属性として設定し、HTMLでは大小文字を区別しないため、そのまま効く。
- `type="search"`の欄は、Escで入力が消える標準動作がある。候補つき入力部品などでEscを別の用途に使うなら`preventDefault()`する。

## 素のHTML

- 後から追加する欄・閉じている間のフォームは`<template>`に置く。`<template>`の中身はDOMの外にあり、拡張機能にもフォームとして見えない。開くたびに`content.cloneNode(true)`で複製し、閉じたら`replaceChildren()`で取り除く。
- 現在のユーザー名など、サーバから渡す値は`data-*`属性で受け取り、複製の直後に入れる。

## Astro

- `.astro`のテンプレートはサーバ側（ビルド時）で描画されるので、開閉に合わせた条件付き描画はできない。HTMLと同じく`<template>`と`<script>`で行う。
- `<script>`はバンドルされ、同じコンポーネントを複数置いても1回だけ実行される。要素は`data-*`属性で`querySelectorAll`して、すべてに処理を付ける。
- フォームをReact・Preactの島（`client:load`など）で描く場合は、そのフレームワークの雛形を使う。島の外（`.astro`）に置いたtext欄も#8の対象になる。

## 雛形の無いフレームワーク（Vue・Svelteなど）

HTMLの雛形の構成を移す。条件付き描画（`v-if`・`{#if}`）があれば、JSXと同じく開いたときだけ描画する（`v-show`のように表示だけを切り替える手段は、閉じている間もDOMにフォームが残るので使わない）。監査スクリプトは`.vue`・`.svelte`を見ないので、SKILL.mdの表を手で当てはめる。

## 資格情報でない秘密の欄（#9、全フレームワーク共通）

```html
<input type="search" name="api-token" class="secret" autocomplete="off" spellcheck="false" />
```

`templates/secret-field.css`を読み込む。`<form>`の外の別の区画に置く。`-webkit-text-security`は非標準なので、対象ブラウザで伏せ字になることを確かめる。
