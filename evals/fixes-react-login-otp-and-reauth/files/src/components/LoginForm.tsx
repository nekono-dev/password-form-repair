import { useState, type FormEvent } from "react";

interface Props {
  onLogin: (input: { username: string; password: string; otp?: string }) => Promise<void>;
}

export function LoginForm({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await onLogin({ username, password, ...(otp ? { otp } : {}) });
    } finally {
      setPassword("");
      setOtp("");
      setBusy(false);
    }
  }

  return (
    <form className="login-form" onSubmit={(event) => void handleSubmit(event)}>
      <label>
        ユーザー名
        <input type="text" name="username" autoComplete="off" value={username} onChange={(e) => setUsername(e.target.value)} />
      </label>
      <label>
        パスワード
        <input type="password" name="password" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <label>
        ワンタイムコード（設定している場合）
        <input type="text" name="otp" inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(e) => setOtp(e.target.value)} />
      </label>
      <button type="submit" disabled={busy || !username || !password}>
        ログイン
      </button>
    </form>
  );
}
