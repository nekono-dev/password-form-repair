export const api = {
  async login(input: { username: string; password: string; otp?: string }): Promise<{ username: string }> {
    const res = await fetch("/api/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
    if (!res.ok) throw new Error("ログインに失敗しました");
    return res.json();
  },
  async deleteServer(name: string, password: string): Promise<void> {
    const res = await fetch(`/api/servers/${name}`, { method: "DELETE", headers: { "x-reauth-password": password } });
    if (!res.ok) throw new Error("削除に失敗しました");
  },
};
