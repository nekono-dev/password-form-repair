import { useState, type FormEvent } from "react";
import { useDialog } from "../hooks/useDialog";

interface Props {
  open: boolean;
  title: string;
  onConfirm: (password: string) => Promise<void>;
  onClose: () => void;
}

// 危険な操作（サーバの削除など）の前に、ログイン中のユーザーのパスワードを再入力させる。
export function ReauthDialog({ open, title, onConfirm, onClose }: Props) {
  const ref = useDialog(open);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await onConfirm(password);
      onClose();
    } finally {
      setPassword("");
      setBusy(false);
    }
  }

  return (
    <dialog ref={ref} onClose={onClose} aria-label={title}>
      <h2>{title}</h2>
      <form onSubmit={(event) => void handleSubmit(event)}>
        <label>
          パスワード（確認のため再入力）
          <input type="password" name="password" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <button type="submit" disabled={busy || !password}>
          実行
        </button>
        <button type="button" onClick={onClose}>
          キャンセル
        </button>
      </form>
    </dialog>
  );
}
