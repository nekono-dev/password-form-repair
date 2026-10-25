#!/usr/bin/env node
// 責務: JSX/TSX（React・Preact等）・HTML・Astroのソースを走査し、パスワードマネージャ（Proton Pass実機で確定）が
// 反応しなくなる既知の落とし穴を指摘する。SKILL.mdの「疑うポイント」のうち、静的に検出できるものだけを見る。依存パッケージなし。
// 使い方: node audit-forms.mjs [ファイルまたはディレクトリ...]（省略時はsrc）。ERRORがあれば終了コード1。
// 出力の[#n]はSKILL.mdの「疑うポイント」の番号。
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";

const SKIP_DIRS = ["node_modules", "dist", "build", ".git", ".astro", ".next", "coverage"];
const TARGET = /\.(jsx|tsx|html?|astro)$/;
const TEST = /\.(test|spec|stories)\.\w+$/;

function collect(path, out) {
  const st = statSync(path);
  if (st.isDirectory()) {
    for (const name of readdirSync(path)) {
      if (SKIP_DIRS.includes(name)) continue;
      collect(join(path, name), out);
    }
  } else if (TARGET.test(path) && !TEST.test(path)) {
    out.push(path);
  }
  return out;
}

// コメント（//・/* */・<!-- -->）を、位置（行番号）を保ったまま空白に置き換え、コメント内のタグを数えない。
// `//`の直前が`:`のもの（URL）は残す。
const blank = (s) => s.replace(/[^\n]/g, " ");
function stripComments(source) {
  return source
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/\/\*[\s\S]*?\*\/|(^|[^:"'`])\/\/[^\n]*/g, (m, lead) => (lead ?? "") + blank(m.slice((lead ?? "").length)));
}

// 開始タグ（`<input ...>`）を、属性内の`{}`（JSXの式）と引用符を考慮して切り出す。
function tags(source, name) {
  const found = [];
  const re = new RegExp(`<${name}(?=[\\s/>])`, "gi");
  let m;
  while ((m = re.exec(source)) !== null) {
    let depth = 0;
    let quote = null;
    let i = m.index + m[0].length;
    for (; i < source.length; i++) {
      const c = source[i];
      if (quote) {
        if (c === quote) quote = null;
      } else if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (depth === 0 && (c === '"' || c === "'")) quote = c;
      else if (c === ">" && depth === 0) break;
    }
    found.push({ text: source.slice(m.index, i + 1), index: m.index, end: i + 1 });
  }
  return found;
}

// 要素の範囲（開始タグから対応する閉じタグまで）。入れ子は数える。
function elements(source, name) {
  const opens = tags(source, name);
  const closeRe = new RegExp(`</${name}\\s*>`, "gi");
  const closes = [...source.matchAll(closeRe)].map((m) => ({ index: m.index, end: m.index + m[0].length }));
  return opens.map((o) => {
    let depth = 0;
    const events = [...opens.filter((x) => x.index > o.index).map((x) => ({ i: x.index, d: 1 })), ...closes.filter((c) => c.index > o.index).map((c) => ({ i: c.index, d: -1, end: c.end }))].sort((a, b) => a.i - b.i);
    for (const e of events) {
      if (e.d === -1 && depth === 0) return { ...o, close: e.end, body: source.slice(o.index, e.end) };
      depth += e.d;
    }
    return { ...o, close: source.length, body: source.slice(o.index) };
  });
}

// 属性値を取り出す（"x"・'x'・{x}・{"x"}・引用符なし）。属性名は大小文字を区別しない（autoComplete / autocomplete）。
function attr(tag, name) {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|\\{\\s*(?:"([^"]*)"|'([^']*)'|\`([^\`]*)\`|([^}]*))\\s*\\}|([^\\s>"'{}]+))`, "i"));
  if (!m) return undefined;
  return m.slice(1).find((v) => v !== undefined)?.trim();
}
const hasAttr = (tag, name) => new RegExp(`\\s${name}(?=[\\s/>=])`, "i").test(tag);
const lineOf = (source, index) => source.slice(0, index).split("\n").length;
const inside = (index, ranges) => ranges.some((r) => index > r.index && index < r.close);

const typeOf = (t) => (attr(t.text, "type") ?? "text").toLowerCase();
const acOf = (t) => attr(t.text, "autocomplete")?.toLowerCase();
const isPassword = (t) => typeOf(t) === "password";
const TEXTISH = ["text", "email", "tel", "url", "number"];
const OTP_NAME = /two-?factor|totp|otp|mfa|2fa|one-?time/i;
const SECRET_NAME = /token|api[-_]?key|secret|apikey/i;
// 非表示・読み取り専用の印（#5）。
const HIDDEN = /\s(readonly|hidden|aria-hidden)(?=[\s/>=])|visually-?hidden|sr-only|opacity|display\s*:\s*["']?none|tabindex\s*=\s*["{]?\s*-1/i;

export function auditSource(source, file) {
  const findings = [];
  const add = (level, rule, index, message) => findings.push({ level, rule, file, line: lineOf(source, index), message });
  const isJsx = /\.(jsx|tsx)$/.test(file);
  const src = stripComments(source);

  const inputs = tags(src, "input");
  const forms = elements(src, "form");
  const dialogs = elements(src, "dialog");
  const templates = elements(src, "template");
  const hasPasswordInFile = inputs.some(isPassword);

  // JSXの条件付き描画（`{x ? (<label>` / `{x && (<label>` / `{x ? <input`）の中にあるか。
  // 入力欄を囲む直近の<label>（なければ入力欄自身）の直前を見る近似。
  const conditionalAt = (index) => {
    if (!isJsx) return false;
    const label = src.lastIndexOf("<label", index);
    const start = label >= 0 && index - label < 300 ? label : index;
    return /(\?|&&)\s*\(?\s*$/.test(src.slice(Math.max(0, start - 80), start));
  };
  // 後から追加される（JSXの条件付き描画、HTML/Astroの<template>の中）か。
  const addedLater = (index) => inside(index, templates) || conditionalAt(index);

  // パスワード欄を持つ<form>ごとに、最初のパスワード欄より前の最初のtext欄を「ユーザー名欄」とみなす。
  const userLike = new Set();
  for (const f of forms) {
    const formInputs = inputs.filter((t) => t.index > f.index && t.index < f.close);
    const firstPw = formInputs.find(isPassword);
    const u = firstPw && formInputs.find((t) => t.index < firstPw.index && TEXTISH.includes(typeOf(t)));
    if (u) userLike.add(u);
  }

  // #1・#9: autocompleteの指定。
  for (const t of inputs) {
    const ac = acOf(t);
    const name = attr(t.text, "name") ?? "";
    const id = attr(t.text, "id") ?? "";
    const credentialName = /^(user(name)?|login|email|password|passwd|current-password|new-password)$/i.test(name);
    if (isPassword(t)) {
      if (SECRET_NAME.test(name + " " + id) && !["current-password", "new-password"].includes(ac)) {
        add("ERROR", "#9", t.index, `資格情報でない秘密（${name || id}）がtype="password"。新パスワードの作成フォームと判定される。type="search"＋伏せ字（secret-field.css）＋autocomplete="off"にする`);
      } else if (ac === undefined) {
        add("ERROR", "#1", t.index, "パスワード欄にautocompleteが無い（current-password / new-passwordを指定する）");
      } else if (!/(current|new)-password/.test(ac)) {
        add("ERROR", "#1", t.index, `パスワード欄のautocomplete="${ac}"ではフォーム種別を判定できず反応しない（current-password / new-password。資格情報でない秘密なら#9の対処）`);
      }
    } else if ((userLike.has(t) || (credentialName && hasPasswordInFile)) && ac !== "username" && typeOf(t) !== "hidden") {
      add("ERROR", "#1", t.index, `ユーザー名欄（${name ? `name="${name}"` : "パスワード欄の前のtext欄"}）のautocompleteが${ac ? `"${ac}"` : "無指定"}。autocomplete="username"にする`);
    }
  }

  // #5: 非表示・readOnlyのユーザー名欄。
  for (const t of inputs) {
    if (acOf(t) !== "username") continue;
    if (typeOf(t) === "hidden" || HIDDEN.test(t.text)) add("ERROR", "#5", t.index, "非表示・readOnlyのユーザー名欄は検出されない（可視のtext欄にする。現在値はdefaultValue/valueで入れる）");
  }

  for (const f of forms) {
    const formInputs = inputs.filter((t) => t.index > f.index && t.index < f.close);
    const pws = formInputs.filter(isPassword);
    if (pws.length === 0) continue;

    // #7: 同じ<form>にパスワード欄と2段階認証欄。
    const otp = formInputs.find((t) => OTP_NAME.test((attr(t.text, "name") ?? "") + " " + (attr(t.text, "id") ?? "")) || acOf(t) === "one-time-code");
    if (otp && !addedLater(otp.index)) {
      add("ERROR", "#7", otp.index, "同じ<form>にパスワード欄と2段階認証欄が最初からあるとPassが反応しない（2段階認証欄はボタンで後から追加する。templates/*/LoginForm参照）");
    }

    // #4: 変更フォーム（new-passwordあり、またはパスワード欄が2つ以上）に、username以外のtext欄。
    const isChange = pws.length >= 2 || formInputs.some((t) => acOf(t) === "new-password");
    if (isChange) {
      for (const t of formInputs) {
        if (isPassword(t) || acOf(t) === "username" || userLike.has(t) || !TEXTISH.includes(typeOf(t))) continue;
        if (otp && t === otp) continue;
        add("ERROR", "#4", t.index, "パスワード変更フォームにusername以外のtext欄（新しいユーザー名など）があると、新パスワードの生成が現在のパスワード欄に入る。ユーザー名の変更はusername欄の書き換えで行う");
      }
      const users = formInputs.filter((t) => acOf(t) === "username" || userLike.has(t));
      if (users.length === 0) add("WARN", "#4", f.index, "パスワード変更フォームに可視のusername欄が無い（欄順はユーザー名・現在のパスワード・新パスワード）");
      else if (users[0].index > pws[0].index) add("WARN", "#4", users[0].index, "username欄がパスワード欄より後ろにある（欄順はユーザー名・現在のパスワード・新パスワード）");
    } else if (!formInputs.some((t) => acOf(t) === "username" || userLike.has(t))) {
      // #5: パスワード欄だけのフォーム（再入力の確認など）。
      add("WARN", "#5", f.index, "パスワード欄はあるがusername欄が無い。Passが検出しない（ログイン中のユーザー名を可視のusername欄で置く）");
    }

    // #7b: form属性による<form>外の要素の関連づけ。
    const formId = attr(f.text, "id");
    const linked = [...tags(src, "input"), ...tags(src, "button")].filter((t) => hasAttr(t.text, "form") && !(t.index > f.index && t.index < f.close));
    if (linked.length > 0 && (formId === undefined || linked.some((t) => attr(t.text, "form") === formId) || isJsx)) {
      add("WARN", "#7", linked[0].index, "form属性で<form>外の要素を関連づけている。静的ページでは通ってもアプリ内でPassが<main>全体をフォーム扱いした実績がある（<form>内にユーザー名・パスワード・送信ボタンだけを置く）");
    }
  }

  // #8: パスワードのフォームがあるファイルで、<form>外にtype未指定/textの入力欄。
  if (forms.some((f) => inputs.some((t) => isPassword(t) && t.index > f.index && t.index < f.close))) {
    for (const t of inputs) {
      // <template>の中は、後から<form>へ複製して追加する欄なので除く。
      if (inside(t.index, forms) || inside(t.index, templates) || !TEXTISH.includes(typeOf(t))) continue;
      add("WARN", "#8", t.index, "ログインフォームの外（近く）にtext欄がある。同じ区画にあるとPassがフォームを誤判定し、パスワードを補完しなかった実績がある（type=\"search\"にして、フォームとは別の区画へ分ける）");
    }
  }

  // #6: 現在のパスワード欄のラベルに「確認」「再入力」。新パスワードの確認欄（new-passwordの2つ目）は正しい用途なので除く。
  for (const l of elements(src, "label")) {
    const pw = inputs.find((t) => isPassword(t) && t.index > l.index && t.index < l.close);
    const forId = attr(l.text, "for") ?? attr(l.text, "htmlFor");
    const target = pw ?? (forId ? inputs.find((t) => isPassword(t) && attr(t.text, "id") === forId) : undefined);
    if (!target || acOf(target) === "new-password") continue;
    const text = l.body.replace(/<[^>]*>|\{[^}]*\}/g, " ");
    const m = text.match(/[^\s]*(確認|再入力)[^\s]*/);
    if (m) add("WARN", "#6", l.index, `パスワード欄のラベル「${m[0]}」は確認欄と誤判定されうる（「ログインパスワード」のように避ける）`);
  }

  // #2・#3: パスワード欄を含むダイアログ。
  for (const d of dialogs) {
    const pw = inputs.find((t) => isPassword(t) && t.index > d.index && t.index < d.close);
    const holdsCredential = pw || /<\w*(Account|Password|Login|SignIn|Credential|Auth)\w*Form\b/.test(d.body);
    if (!holdsCredential) continue;
    if (/\.showModal\s*\(/.test(src) && !/\.show\s*\(/.test(src)) {
      add("ERROR", "#2", d.index, "パスワード欄を含むダイアログがモーダル（showModal）。トップレイヤーが拡張機能の候補表示を隠す（dialog.show()で開き、non-modal-dialog.cssで中央に固定する）");
    } else if (!/\.show\s*\(|use\w*Dialog\w*\([^)]*,\s*false|modal=\{false\}/.test(src)) {
      add("WARN", "#2", d.index, "ダイアログの開き方（モーダルか）をこのファイルから判定できない。パスワード欄を持つなら非モーダル（show()）で開くこと");
    }
    const renderedOnOpen = isJsx ? /\w*[oO]pen\w*\s*(\?|&&)/.test(d.body) : pw ? inside(pw.index, templates) : false;
    if (!renderedOnOpen) {
      add("ERROR", "#3", d.index, isJsx ? "閉じている間もフォームを描画している。閉じた<dialog>内のフォームは開いても再検出されない（{open ? <Form /> : null}）" : "閉じている間もフォームがDOMにある。閉じた<dialog>内のフォームは開いても再検出されない（<template>に置き、開いたときに複製して追加する）");
    }
  }
  return findings;
}

export function audit(roots) {
  return roots.flatMap((r) => collect(r, [])).flatMap((file) => auditSource(readFileSync(file, "utf8"), relative(process.cwd(), file)));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const roots = process.argv.slice(2);
  if (roots.length === 0) roots.push("src");
  const findings = audit(roots);
  if (findings.length === 0) {
    console.log("指摘なし");
  } else {
    for (const f of findings) console.log(`${f.level} [${f.rule}] ${f.file}:${f.line} ${f.message}`);
    console.log(`\nERROR ${findings.filter((f) => f.level === "ERROR").length}件 / WARN ${findings.filter((f) => f.level === "WARN").length}件`);
    console.log("[#n]はSKILL.mdの「疑うポイント」の番号。WARNは目視で確認する。");
  }
  process.exit(findings.some((f) => f.level === "ERROR") ? 1 : 0);
}
