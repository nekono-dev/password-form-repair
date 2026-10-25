// 雛形（Preact）: ユーザー名＋パスワード（＋任意の2段階認証）のログインフォーム。SKILL.md「疑うポイント」#1・#7・#8。
// Reactの雛形との違いは、class・onInput・preact/hooksだけ。autoCompleteはこの表記で実機（Proton Pass）の自動入力を確認済み。
// 守ること:
// - autoCompleteはusername / current-password。offにしない（フォームが出なくなる）。
// - 2段階認証欄は最初から<form>に置かない。ボタンで後から追加する（同居するとPassが反応しない）。
// - <form>にはユーザー名・パスワード・送信ボタンだけを置く。サーバ名などの他の欄は<form>の外の別の区画に置き、
//   type="search"にする（同じ区画のtext欄がPassの分類を崩した）。form属性で関連づけない。
// - 秘密（パスワード・コード）は送信直後にstateから消す。
import { useState } from "preact/hooks";

interface Props {
  isSubmitting: boolean;
  // TODO: 送信処理（API呼び出し）。成功・失敗の通知は呼び出し側が行う。
  onSubmit: (credentials: { username: string; password: string; twoFactorCode?: string }) => Promise<void>;
}

const valueOf = (e: Event) => (e.target as HTMLInputElement).value;

export function LoginFormTemplate({ isSubmitting, onSubmit }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [showTwoFactor, setShowTwoFactor] = useState(false);

  async function handleSubmit(event: Event): Promise<void> {
    event.preventDefault();
    const code = twoFactorCode.trim();
    setPassword("");
    setTwoFactorCode("");
    await onSubmit({ username: username.trim(), password, ...(code.length > 0 ? { twoFactorCode: code } : {}) });
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)}>
      <label>
        ユーザー名
        <input type="text" name="username" autoComplete="username" value={username} disabled={isSubmitting} onInput={(e) => setUsername(valueOf(e))} />
      </label>
      <label>
        パスワード
        <input type="password" name="password" autoComplete="current-password" value={password} disabled={isSubmitting} onInput={(e) => setPassword(valueOf(e))} />
      </label>
      {showTwoFactor ? (
        <label>
          2段階認証
          <input type="text" name="twoFactorCode" inputMode="numeric" autoComplete="off" value={twoFactorCode} disabled={isSubmitting} onInput={(e) => setTwoFactorCode(valueOf(e))} />
        </label>
      ) : (
        <button type="button" disabled={isSubmitting} onClick={() => setShowTwoFactor(true)}>
          2段階認証を設定している場合
        </button>
      )}
      <button type="submit" disabled={isSubmitting || username.trim() === "" || password === ""}>
        {isSubmitting ? "ログイン中..." : "ログイン"}
      </button>
    </form>
  );
}
