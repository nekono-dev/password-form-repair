import { useState } from "react";
import { LoginForm } from "./components/LoginForm";
import { ReauthDialog } from "./components/ReauthDialog";
import { api } from "./api";

export function App() {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  if (!user) return <LoginForm onLogin={async (input) => setUser(await api.login(input))} />;
  return (
    <main>
      <p>{user.username} でログイン中</p>
      <button onClick={() => setDeleting("web-01")}>web-01 を削除</button>
      <ReauthDialog
        open={deleting !== null}
        title={`${deleting} を削除`}
        onConfirm={(password) => api.deleteServer(deleting!, password)}
        onClose={() => setDeleting(null)}
      />
    </main>
  );
}
