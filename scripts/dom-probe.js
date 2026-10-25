// 責務: 利用者のブラウザの開発者ツール（コンソール）に貼り付けて、フォームの実状態を取得する。
// ファイル全体は貼らない。「1.」〜「4.」の該当する1つのブロック（1行の式）だけを貼り、出力を貼り返してもらう。
// 値（パスワード等）は出力しない。文字数だけを出す。
// 対象のフォームは、画面上の最初のパスワード欄を含む<form>（無ければその親要素）。別のフォームを見るときは、
// 各ブロック先頭の`const S=null`を`const S='CSSセレクタ'`に書き換えてもらう。

// ---- 1. 入力欄の一覧（フォームを開いた状態で、入力欄は未クリックのまま実行する） ----
console.log(JSON.stringify([...document.querySelectorAll('input,textarea,select')].map(e=>({tag:e.tagName,type:e.type,name:e.name,ac:e.autocomplete,form:e.form?(e.form.id||e.form.className||'(form)'):null,dlg:!!e.closest('dialog'),modal:!!e.closest('dialog:modal'),vis:e.offsetWidth+'x'+e.offsetHeight})),null,1))

// ---- 2. 対象フォームの祖先と、Passが付けた印（data-protonpass-*）を見る ----
(()=>{const S=null;const p=document.querySelector('input[type=password]');const f=S?document.querySelector(S):(p?.form||p?.parentElement);if(!f)return console.log('対象のフォームが見つかりません');const c=[];for(let e=f;e&&e!==document.documentElement;e=e.parentElement)c.push(e.tagName+(e.id?'#'+e.id:'')+(e.className&&typeof e.className==='string'?'.'+e.className.trim().replace(/\s+/g,'.'):'')+[...e.attributes].filter(a=>!['id','class','style'].includes(a.name)).map(a=>'['+a.name+'='+a.value+']').join(''));console.log('祖先: '+c.join(' < '));console.log('Passの印: '+[...document.querySelectorAll('*')].flatMap(e=>[...e.attributes].filter(a=>a.name.startsWith('data-protonpass')).map(a=>e.tagName+'['+a.name+'='+a.value+']')).join(', '));console.log(f.parentElement.outerHTML.replace(/value="[^"]*"/g,'value="…"'))})()

// ---- 3. 自動入力の記録（実行後に、ユーザー名欄で候補を選び、出た行を全部貼り返してもらう）。
//         パスワード欄にイベントが1つも出なければ、Passはパスワードを入力しようとしていない（フォーム分類の問題）。
//         イベントが来て値が消えるなら、アプリの再描画の問題 ----
(()=>{const S=null;const p0=document.querySelector('input[type=password]');const f=S?document.querySelector(S):(p0?.form||p0?.parentElement);const p=f.querySelector('input[type=password]'),u=f.querySelector('input[autocomplete=username]')||f.querySelector('input:not([type=password]):not([type=hidden])');['focus','blur','input','change','keydown','keyup'].forEach(t=>{u&&u.addEventListener(t,e=>console.log('USER',t,'trusted='+e.isTrusted,'len='+u.value.length));p.addEventListener(t,e=>console.log('PASS',t,'trusted='+e.isTrusted,'len='+p.value.length))});new MutationObserver(m=>console.log('DOM変化',m.map(x=>x.type+':'+x.target.nodeName+(x.attributeName?'.'+x.attributeName:'')).join(',')+' pass接続中='+p.isConnected+' user接続中='+(u?u.isConnected:'なし'))).observe(document.body,{subtree:true,childList:true,attributes:true});console.log('記録を開始しました（ユーザー名欄: '+(u?u.name||'(name無し)':'なし')+'）')})()

// ---- 4. フォームを写す（元のフォームの下と、ページ先頭に静的な複製を置く）。複製の結果は、毎回再読み込みした直後に試す ----
(()=>{const S=null;const p=document.querySelector('input[type=password]');const f=S?document.querySelector(S):(p?.form||p?.parentElement);const mk=t=>{const d=document.createElement('div');d.innerHTML='<b style="display:block;margin-top:12px">'+t+'</b>'+f.outerHTML;return d};f.after(mk('複製X: 元のフォームのすぐ下（祖先は同じ）'));document.body.prepend(mk('複製Y: ページの先頭（祖先なし）'));window.scrollTo(0,0)})()
