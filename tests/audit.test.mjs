// 責務: scripts/audit-forms.mjs が、既知の落とし穴（SKILL.md「疑うポイント」）を各書式で検出し、雛形では何も指摘しないことを確かめる。
// 実行: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { audit, auditSource } from "../scripts/audit-forms.mjs";

const rules = (source, file) => auditSource(source, file).map((f) => `${f.level} ${f.rule}`);

test("雛形（React・Preact・HTML・Astro）は指摘なし", () => {
  const findings = audit([fileURLToPath(new URL("../templates", import.meta.url))]);
  assert.deepEqual(findings, []);
});

test("#1 autocomplete=offのパスワード欄とユーザー名欄", () => {
  const src = `<form><input type="text" autoComplete="off" /><input type="password" autoComplete="off" /></form>`;
  assert.deepEqual(rules(src, "a.tsx"), ["ERROR #1", "ERROR #1"]);
});

test("#1 HTMLの小文字・引用符なしの属性も読む", () => {
  assert.deepEqual(rules(`<form><input name=username autocomplete=username><input type=password autocomplete=current-password></form>`, "a.html"), []);
  assert.deepEqual(rules(`<form><input name=username><input type=password></form>`, "a.html"), ["ERROR #1", "ERROR #1"]);
});

test("#9 資格情報でない秘密をtype=passwordにしている", () => {
  const src = `<form><input name="username" autoComplete="username" /><input type="password" autoComplete="current-password" /></form>
<input type="password" name="api-token" autoComplete="off" />`;
  assert.deepEqual(rules(src, "a.tsx"), ["ERROR #9"]);
});

test("#7 同じformに2段階認証欄。条件付き描画・<template>なら許容", () => {
  const base = (otp) => `<form><input name="username" autoComplete="username" /><input type="password" autoComplete="current-password" />${otp}</form>`;
  assert.deepEqual(rules(base(`<label>コード<input name="twoFactorCode" autoComplete="one-time-code" /></label>`), "a.tsx"), ["ERROR #7"]);
  assert.deepEqual(rules(base(`{show ? (<label>コード<input name="twoFactorCode" autoComplete="off" /></label>) : null}`), "a.tsx"), []);
  assert.deepEqual(rules(base(`<template><label>コード<input name="otp" autocomplete="off"></label></template>`), "a.astro"), []);
});

test("#4 変更フォームの「新しいユーザー名」欄", () => {
  const src = `<form><input name="username" autoComplete="username" /><input type="password" autoComplete="current-password" />
<input type="text" name="newUsername" autoComplete="off" /><input type="password" autoComplete="new-password" /></form>`;
  assert.deepEqual(rules(src, "a.tsx"), ["ERROR #4"]);
});

test("#5 非表示・readOnlyのユーザー名欄、ユーザー名欄の無いパスワードだけのフォーム", () => {
  assert.deepEqual(rules(`<form><input name="username" autoComplete="username" readOnly /><input type="password" autoComplete="current-password" /></form>`, "a.tsx"), ["ERROR #5"]);
  assert.deepEqual(rules(`<form><input type="password" autocomplete="current-password"></form>`, "a.html"), ["WARN #5"]);
});

test("#6 現在のパスワード欄のラベルに「確認」。新パスワードの確認欄は除く", () => {
  const cur = `<form><input name="username" autoComplete="username" /><label>パスワード（確認のため再入力）<input type="password" autoComplete="current-password" /></label></form>`;
  assert.deepEqual(rules(cur, "a.tsx"), ["WARN #6"]);
  const setup = `<form><input name="username" autoComplete="username" /><label>パスワード<input type="password" autoComplete="new-password" /></label><label>パスワード（確認）<input type="password" autoComplete="new-password" /></label></form>`;
  assert.deepEqual(rules(setup, "a.tsx"), []);
});

test("#8 フォーム外の同じ区画のtext欄", () => {
  const src = `<section><input name="server" autocomplete="off"><form><input name="username" autocomplete="username"><input type="password" autocomplete="current-password"></form></section>`;
  assert.deepEqual(rules(src, "a.html"), ["WARN #8"]);
  assert.deepEqual(rules(src.replace('name="server"', 'type="search" name="server"'), "a.html"), []);
});

test("#2・#3 モーダルのダイアログ、閉じている間も描画しているフォーム", () => {
  const jsx = `function D({ open }) { ref.current.showModal(); return <dialog><form><input name="username" autoComplete="username" /><input type="password" autoComplete="current-password" /></form></dialog> }`;
  assert.deepEqual(rules(jsx, "a.tsx"), ["ERROR #2", "ERROR #3"]);
  const html = `<dialog><form><input name="username" autocomplete="username"><input type="password" autocomplete="current-password"></form></dialog><script>d.show()</script>`;
  assert.deepEqual(rules(html, "a.html"), ["ERROR #3"]);
});

test("コメント内のタグは数えない", () => {
  assert.deepEqual(rules(`// <input type="password" autoComplete="off" />\n{/* <input type="password" /> */}`, "a.tsx"), []);
  assert.deepEqual(rules(`<!-- <input type="password" autocomplete="off"> -->`, "a.html"), []);
});
