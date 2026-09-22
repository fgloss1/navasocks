"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  User,
  ArrowRight,
  RefreshCw,
  Shield,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSitePreferences } from "@/components/SitePreferences";

const THEME_BOOTSTRAP = `
(() => {
  try {
    const darkValues = new Set(["dark", "true", "1"]);
    const lightValues = new Set(["light", "false", "0"]);

    let dark;

    const themeKeys = Object.keys(localStorage).filter((key) =>
      /theme|appearance|preference|dark/i.test(key)
    );

    for (const key of themeKeys) {
      const rawValue = localStorage.getItem(key);
      let value = rawValue;

      try {
        const parsedValue = rawValue
          ? JSON.parse(rawValue)
          : null;

        value =
          parsedValue?.theme ??
          parsedValue?.appearance ??
          parsedValue?.dark ??
          parsedValue;
      } catch {
        value = rawValue;
      }

      const normalizedValue = String(value).toLowerCase();

      if (darkValues.has(normalizedValue)) {
        dark = true;
        break;
      }

      if (lightValues.has(normalizedValue)) {
        dark = false;
        break;
      }
    }

    if (dark === undefined) {
      dark =
        window.matchMedia?.("(prefers-color-scheme: dark)")
          ?.matches ?? true;
    }

    const backgroundColor = dark
      ? "#080d19"
      : "#f1f5f9";

    document.documentElement.dataset.theme = dark
      ? "dark"
      : "light";

    document.documentElement.classList.toggle(
      "dark",
      dark
    );

    document.documentElement.style.backgroundColor =
      backgroundColor;

    document.documentElement.style.setProperty(
      "--page-bg",
      backgroundColor
    );
  } catch {}
})();
`;

const LOGIN_TEXT: Record<
  string,
  Record<string, string>
> = {
  en: {
    title: "NAVA SOCKS Login",
    subtitle: "User and pass to open the proxy market",
    user: "User",
    pass: "Pass",
    forgotPass: "Forgot pass?",
    twoFARequired: "2FA required",
    login: "Login",
    newOperator: "New operator?",
    createAccount: "Create an account",
  },

  de: {
    title: "NAVA SOCKS Anmeldung",
    subtitle:
      "Benutzername und Passwort, um den Proxy-Markt zu öffnen",
    user: "Benutzer",
    pass: "Passwort",
    forgotPass: "Passwort vergessen?",
    twoFARequired: "2FA erforderlich",
    login: "Anmelden",
    newOperator: "Neuer Operator?",
    createAccount: "Konto erstellen",
  },

  es: {
    title: "Inicio de sesión de NAVA SOCKS",
    subtitle:
      "Usuario y contraseña para abrir el mercado de proxies",
    user: "Usuario",
    pass: "Contraseña",
    forgotPass: "¿Olvidaste la contraseña?",
    twoFARequired: "Se requiere 2FA",
    login: "Iniciar sesión",
    newOperator: "¿Nuevo operador?",
    createAccount: "Crear una cuenta",
  },

  fr: {
    title: "Connexion NAVA SOCKS",
    subtitle:
      "Identifiant et mot de passe pour ouvrir le marché des proxys",
    user: "Utilisateur",
    pass: "Mot de passe",
    forgotPass: "Mot de passe oublié ?",
    twoFARequired: "2FA requis",
    login: "Se connecter",
    newOperator: "Nouvel opérateur ?",
    createAccount: "Créer un compte",
  },

  ja: {
    title: "NAVA SOCKS ログイン",
    subtitle:
      "プロキシマーケットを開くにはユーザー名とパスワードを入力してください",
    user: "ユーザー",
    pass: "パスワード",
    forgotPass: "パスワードをお忘れですか？",
    twoFARequired: "2FA が必要です",
    login: "ログイン",
    newOperator: "新しいオペレーターですか？",
    createAccount: "アカウントを作成",
  },

  ko: {
    title: "NAVA SOCKS 로그인",
    subtitle:
      "프록시 마켓을 열려면 사용자 이름과 비밀번호를 입력하세요",
    user: "사용자",
    pass: "비밀번호",
    forgotPass: "비밀번호를 잊으셨나요?",
    twoFARequired: "2FA가 필요합니다",
    login: "로그인",
    newOperator: "새 운영자이신가요?",
    createAccount: "계정 만들기",
  },

  it: {
    title: "Accesso NAVA SOCKS",
    subtitle:
      "Nome utente e password per aprire il mercato proxy",
    user: "Nome utente",
    pass: "Password",
    forgotPass: "Password dimenticata?",
    twoFARequired: "2FA richiesto",
    login: "Accedi",
    newOperator: "Nuovo operatore?",
    createAccount: "Crea un account",
  },

  pl: {
    title: "Logowanie do NAVA SOCKS",
    subtitle:
      "Nazwa użytkownika i hasło, aby otworzyć rynek proxy",
    user: "Użytkownik",
    pass: "Hasło",
    forgotPass: "Nie pamiętasz hasła?",
    twoFARequired: "Wymagane 2FA",
    login: "Zaloguj",
    newOperator: "Nowy operator?",
    createAccount: "Utwórz konto",
  },

  pt: {
    title: "Login NAVA SOCKS",
    subtitle:
      "Utilizador e palavra-passe para abrir o mercado de proxies",
    user: "Utilizador",
    pass: "Palavra-passe",
    forgotPass: "Esqueceu a palavra-passe?",
    twoFARequired: "2FA necessário",
    login: "Entrar",
    newOperator: "Novo operador?",
    createAccount: "Criar uma conta",
  },

  ru: {
    title: "Вход в NAVA SOCKS",
    subtitle:
      "Имя пользователя и пароль для открытия прокси-маркета",
    user: "Пользователь",
    pass: "Пароль",
    forgotPass: "Забыли пароль?",
    twoFARequired: "Требуется 2FA",
    login: "Войти",
    newOperator: "Новый оператор?",
    createAccount: "Создать аккаунт",
  },

  zh: {
    title: "NAVA SOCKS 登录",
    subtitle: "输入用户名和密码以打开代理市场",
    user: "用户",
    pass: "密码",
    forgotPass: "忘记密码？",
    twoFARequired: "需要 2FA",
    login: "登录",
    newOperator: "新用户？",
    createAccount: "创建账户",
  },

  "es-ar": {
    title: "Inicio de sesión de NAVA SOCKS",
    subtitle:
      "Ingresá con tu usuario y contraseña para abrir el mercado de proxies",
    user: "Usuario",
    pass: "Contraseña",
    forgotPass: "¿Olvidaste tu contraseña?",
    twoFARequired: "Se requiere 2FA",
    login: "Iniciar sesión",
    newOperator: "¿Nuevo operador?",
    createAccount: "Crear una cuenta",
  },

  tr: {
    title: "NAVA SOCKS Giriş",
    subtitle:
      "Proxy pazarını açmak için kullanıcı adı ve şifre",
    user: "Kullanıcı",
    pass: "Şifre",
    forgotPass: "Şifrenizi mi unuttunuz?",
    twoFARequired: "2FA gerekli",
    login: "Giriş yap",
    newOperator: "Yeni operatör müsünüz?",
    createAccount: "Hesap oluştur",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { language } = useSitePreferences();

  const loginText =
    LOGIN_TEXT[language] ?? LOGIN_TEXT.en;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
          twoFactorCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      if (data.requires2FA) {
        setRequires2FA(true);
        setLoading(false);
        return;
      }

      router.push(
        data.user?.role === "admin"
          ? "/admin"
          : "/dashboard"
      );
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: THEME_BOOTSTRAP,
        }}
      />

      <div className="min-h-screen flex flex-col selection:bg-cyan-500 selection:text-slate-950 transition-colors duration-200 bg-slate-100 text-slate-950 dark:bg-[#080d19] dark:text-white">
        <Navbar />

        <main className="flex-1 flex items-center justify-center p-4 py-10 sm:py-16 relative">
          <div className="max-w-md w-full border rounded-2xl p-5 sm:p-7 shadow-2xl relative z-10 transition-all bg-white border-slate-200 dark:bg-[#0d1424]/90 dark:border-cyan-800/50">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-cyan-500/20">
                <Lock className="w-6 h-6 text-slate-950 dark:text-white" />
              </div>

              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {loginText.title}
              </h1>

              <p className="text-xs mt-1 font-bold text-slate-700 dark:text-slate-400">
                {loginText.subtitle}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg border text-xs font-black bg-rose-100 border-rose-300 text-rose-800 dark:bg-rose-950/80 dark:border-rose-500/40 dark:text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={submit} className="space-y-4">
              {!requires2FA ? (
                <>
                  <div>
                    <label className="text-xs font-black block mb-1 text-slate-800 dark:text-slate-300">
                      {loginText.user}
                    </label>

                    <div className="relative">
                      <input
                        value={username}
                        onChange={(e) =>
                          setUsername(e.target.value)
                        }
                        required
                        autoComplete="username"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-bold outline-none focus:border-cyan-500 bg-slate-50 border-slate-300 text-black dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                      />

                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-xs font-black text-slate-800 dark:text-slate-300">
                        {loginText.pass}
                      </label>

                      <Link
                        href="/auth/forgot-password"
                        className="text-[11px] font-black hover:underline text-cyan-600 dark:text-cyan-400"
                      >
                        {loginText.forgotPass}
                      </Link>
                    </div>

                    <div className="relative">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) =>
                          setPassword(e.target.value)
                        }
                        required
                        autoComplete="current-password"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-bold outline-none focus:border-cyan-500 bg-slate-50 border-slate-300 text-black dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                      />

                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2 p-4 rounded-xl border bg-cyan-50 border-cyan-200 dark:bg-cyan-950/30 dark:border-cyan-500/40">
                  <p className="text-xs font-black inline-flex items-center gap-2 text-cyan-800 dark:text-cyan-300">
                    <Shield className="w-4 h-4" />
                    {loginText.twoFARequired}
                  </p>

                  <input
                    value={twoFactorCode}
                    onChange={(e) =>
                      setTwoFactorCode(e.target.value)
                    }
                    maxLength={6}
                    autoFocus
                    className="w-full py-2.5 rounded-xl border text-center font-mono font-black tracking-widest outline-none bg-white border-cyan-500 text-black dark:bg-slate-950 dark:border-cyan-500 dark:text-white"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs font-mono flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {loginText.login}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-5 text-xs font-bold text-center text-slate-700 dark:text-slate-400">
              {loginText.newOperator}{" "}
              <Link
                href="/auth/signup"
                className="font-black hover:underline text-cyan-600 dark:text-cyan-400"
              >
                {loginText.createAccount}
              </Link>
            </p>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}