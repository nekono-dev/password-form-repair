import { useState } from "preact/hooks";

interface Props {
  onSignIn: (input: { host: string; account: string; password: string; apiToken?: string }) => Promise<void>;
}

// メールサーバへのサインイン。ホスト名・アカウント・パスワードと、任意で管理APIのトークンを受け取る。
export function SignInPanel({ onSignIn }: Props) {
  const [host, setHost] = useState(localStorage.getItem("host") ?? "");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    try {
      localStorage.setItem("host", host);
      await onSignIn({ host, account, password, ...(apiToken ? { apiToken } : {}) });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <section class="signin">
      <h2>サインイン</h2>
      <label class="field">
        <span>ホスト名</span>
        <input name="host" value={host} onInput={(e) => setHost((e.target as HTMLInputElement).value)} />
      </label>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label class="field">
          <span>アカウント</span>
          <input name="username" autoComplete="username" value={account} onInput={(e) => setAccount((e.target as HTMLInputElement).value)} />
        </label>
        <label class="field">
          <span>パスワード</span>
          <input name="password" type="password" autoComplete="current-password" value={password} onInput={(e) => setPassword((e.target as HTMLInputElement).value)} />
        </label>
        <button type="submit">サインイン</button>
      </form>
      <label class="field">
        <span>管理APIトークン（任意）</span>
        <input name="api-token" type="password" autoComplete="off" value={apiToken} onInput={(e) => setApiToken((e.target as HTMLInputElement).value)} />
      </label>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
