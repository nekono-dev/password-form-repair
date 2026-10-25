#!/usr/bin/env node
// 責務: パスワードマネージャの挙動を切り分けるための並置テストページ（静的HTML1枚）を生成する。
// 使い方: node make-bisect-page.mjs [出力先]（既定: ./pw-test.html）。生成したファイルを、静的に配信される場所
// （Viteの`public/`、Astroの`public/`、素のHTMLなら同じディレクトリ）へ置いて検証環境へ反映し、利用者に試してもらう。
// - ログインのブロック（A〜J）: 「ユーザー名」欄で候補を選び、「両方入った／ユーザー名だけ／どちらも入らない」を報告してもらう。
// - 変更のブロック（K〜L）: 新パスワード欄で生成を使い、「生成したパスワードがどの欄に入ったか」を報告してもらう。
// 切り分け後は必ず削除する（コミットしない）。ブロックはVARIANTSを編集して増やす（基準から1回に1要因だけ変える）。
import { writeFileSync } from "node:fs";

const out = process.argv[2] ?? "pw-test.html";

const USER = '<label>ユーザー名<input type="text" name="username" autocomplete="username"></label>';
const PASS = '<label>パスワード<input type="password" name="password" autocomplete="current-password"></label>';
const OTP = (extra = "") => `<label>2段階認証<input type="text" name="twoFactorCode" inputmode="numeric" autocomplete="off"${extra}></label>`;
const SERVER = (type) => `<label>サーバ名<input${type ? ` type="${type}"` : ""} name="server" autocomplete="off"></label>`;
const TOKEN = (type, cls = "") => `<label>APIトークン<input type="${type}" name="api-token" autocomplete="off"${cls}></label>`;
const BTN = "<button>ログイン</button>";
const FORM = (inner, attrs = "") => `<form onsubmit="return false"${attrs}>${inner}</form>`;
const esc = (s) => s.replace(/'/g, "&#39;");

// [ID, 説明, HTML]。基準Aが「両方入る」ことを最初に確認する（入らなければ、ページ以前の問題: 拡張機能の設定・対象URL）。
const VARIANTS = [
  ["A", "基準: ユーザー名＋パスワード＋ボタンのみ", FORM(USER + PASS + BTN)],
  ["B", "A＋2段階認証欄を同じformに最初から置く（autocomplete=one-time-code）", FORM(USER + PASS + OTP().replace('autocomplete="off"', 'autocomplete="one-time-code"') + BTN)],
  ["C", "A＋2段階認証欄を同じformに最初から置く（autocomplete=off）", FORM(USER + PASS + OTP() + BTN)],
  ["D", "ボタンを押すとAと同じフォームを動的に追加（読み込み後の追加でも検出されるか）", `<button onclick="var f=document.createElement('form');f.onsubmit=function(){return false};f.innerHTML=this.dataset.html;this.after(f);this.hidden=true" data-html='${esc(USER + PASS + BTN)}'>フォームを開く</button>`],
  ["E", "Aと同じ。「2段階認証を使う」ボタンで欄を後から同じformへ追加する（推奨構成）", FORM(`${USER}${PASS}<div class="slot"></div><button type="button" onclick="this.previousElementSibling.innerHTML=this.dataset.otp;this.hidden=true" data-otp='${esc(OTP())}'>2段階認証を使う</button> ${BTN}`)],
  ["F", "form内はユーザー名とパスワードのみ。2段階認証欄はform外に置きform属性で関連づけ（静的では通るが、アプリ内では通らなかった）", `${FORM(USER + PASS + BTN, ' id="ff"')}${OTP(' form="ff"')}`],
  ["G", "A＋同じ区画のform外に、type未指定のサーバ名欄（アカウントだけ補完された構成）", `<div class="sec">${SERVER()}${FORM(USER + PASS + BTN)}</div>`],
  ["H", "Gのサーバ名欄をtype=searchにし、別の区画に分ける（採用した対処）", `<div class="sec">${SERVER("search")}</div><div class="sec">${FORM(USER + PASS + BTN)}</div>`],
  ["I", "A＋form外にAPIトークン欄（type=password。新パスワード作成と判定された構成）", `<div class="sec">${FORM(USER + PASS + BTN)}${TOKEN("password")}</div>`],
  ["J", "IのAPIトークン欄をtype=search＋伏せ字にする（採用した対処）", `<div class="sec">${FORM(USER + PASS + BTN)}${TOKEN("search", ' class="secret"')}</div>`],
];
const CU = '<label>ユーザー名<input type="text" name="username" autocomplete="username" value="alice"></label>';
const CUR = '<label>現在のパスワード<input type="password" name="current-password" autocomplete="current-password"></label>';
const NEW = '<label>新しいパスワード<input type="password" name="new-password" autocomplete="new-password"></label>';
const CHANGE_VARIANTS = [
  ["K", "基準: ユーザー名・現在のパスワード・新パスワードの3欄", FORM(CU + CUR + NEW + "<button>変更</button>")],
  ["L", "K＋「新しいユーザー名」の別text欄（現在のパスワード欄へ生成値が入った構成）", FORM(CU + '<label>新しいユーザー名<input type="text" name="new-username" autocomplete="off"></label>' + CUR + NEW + "<button>変更</button>")],
];

const box = ([id, desc, html]) => `<div class="box"><b>${id}: ${desc}</b>${html}</div>`;
writeFileSync(
  out,
  `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>pw-test</title>
<style>body{font:14px sans-serif;margin:16px;max-width:560px}.box{border:1px solid #888;padding:8px;margin:12px 0}.sec{border:1px dashed #bbb;padding:6px;margin:6px 0}form{margin:8px 0}label{display:block;margin:4px 0}input{width:100%;box-sizing:border-box;padding:6px}input.secret{-webkit-text-security:disc;appearance:none}</style></head>
<body>
<h3>ログイン（各ブロックのユーザー名欄で候補を選び、ユーザー名とパスワードが両方入るかを見る）</h3>
${VARIANTS.map(box).join("\n")}
<h3>変更（新しいパスワード欄で生成を使い、生成値がどの欄に入るかを見る）</h3>
${CHANGE_VARIANTS.map(box).join("\n")}
</body></html>
`,
);
console.log(`生成しました: ${out}（${VARIANTS.length + CHANGE_VARIANTS.length}ブロック）。検証後は削除してください。`);
