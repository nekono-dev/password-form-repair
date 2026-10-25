// 管理者アカウント（1人だけ）の読み書き。実体はSQLite。
export interface Account {
  username: string;
}
export declare function verifyPassword(username: string, password: string): Promise<boolean>;
export declare function updateAccount(currentUsername: string, change: { username?: string; password?: string }): Promise<Account>;
