"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSitePreferences } from "@/components/SitePreferences";

const SIGNUP_TEXT: Record<string, Record<string, string>> = {
  en: {
    title: "Create NAVA SOCKS account",
    subtitle:
      "Use a real email address so you can recover your account later.",
    username: "Username",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    register: "Register",
    alreadyAccount: "Already have an account?",
    login: "Login",
    passwordMismatch: "Passwords do not match.",
    signupFailed: "Signup failed",
    networkError: "Network error",
    emailPlaceholder: "you@example.com",
  },

  de: {
    title: "NAVA SOCKS Konto erstellen",
    subtitle:
      "Verwende eine echte E-Mail-Adresse, damit du dein Konto später wiederherstellen kannst.",
    username: "Benutzername",
    email: "E-Mail",
    password: "Passwort",
    confirmPassword: "Passwort bestätigen",
    register: "Registrieren",
    alreadyAccount: "Du hast bereits ein Konto?",
    login: "Anmelden",
    passwordMismatch: "Die Passwörter stimmen nicht überein.",
    signupFailed: "Registrierung fehlgeschlagen",
    networkError: "Netzwerkfehler",
    emailPlaceholder: "du@beispiel.de",
  },

  es: {
    title: "Crear cuenta de NAVA SOCKS",
    subtitle:
      "Usa una dirección de correo real para poder recuperar tu cuenta más adelante.",
    username: "Usuario",
    email: "Correo electrónico",
    password: "Contraseña",
    confirmPassword: "Confirmar contraseña",
    register: "Registrarse",
    alreadyAccount: "¿Ya tienes una cuenta?",
    login: "Iniciar sesión",
    passwordMismatch: "Las contraseñas no coinciden.",
    signupFailed: "Error al registrarse",
    networkError: "Error de red",
    emailPlaceholder: "tu@ejemplo.com",
  },

  fr: {
    title: "Créer un compte NAVA SOCKS",
    subtitle:
      "Utilisez une vraie adresse e-mail afin de pouvoir récupérer votre compte plus tard.",
    username: "Nom d'utilisateur",
    email: "E-mail",
    password: "Mot de passe",
    confirmPassword: "Confirmer le mot de passe",
    register: "S'inscrire",
    alreadyAccount: "Vous avez déjà un compte ?",
    login: "Se connecter",
    passwordMismatch:
      "Les mots de passe ne correspondent pas.",
    signupFailed: "Échec de l'inscription",
    networkError: "Erreur réseau",
    emailPlaceholder: "vous@exemple.com",
  },

  ja: {
    title: "NAVA SOCKS アカウントを作成",
    subtitle:
      "後でアカウントを回復できるよう、実在するメールアドレスを使用してください。",
    username: "ユーザー名",
    email: "メール",
    password: "パスワード",
    confirmPassword: "パスワードを確認",
    register: "登録",
    alreadyAccount: "すでにアカウントをお持ちですか？",
    login: "ログイン",
    passwordMismatch:
      "パスワードが一致しません。",
    signupFailed: "登録に失敗しました",
    networkError: "ネットワークエラー",
    emailPlaceholder: "you@example.com",
  },

  ko: {
    title: "NAVA SOCKS 계정 생성",
    subtitle:
      "추후 계정을 복구할 수 있도록 실제 이메일 주소를 사용하세요.",
    username: "사용자 이름",
    email: "이메일",
    password: "비밀번호",
    confirmPassword: "비밀번호 확인",
    register: "등록",
    alreadyAccount: "이미 계정이 있으신가요?",
    login: "로그인",
    passwordMismatch:
      "비밀번호가 일치하지 않습니다.",
    signupFailed: "가입에 실패했습니다",
    networkError: "네트워크 오류",
    emailPlaceholder: "you@example.com",
  },

  it: {
    title: "Crea un account NAVA SOCKS",
    subtitle:
      "Usa un indirizzo e-mail reale per poter recuperare il tuo account in seguito.",
    username: "Nome utente",
    email: "E-mail",
    password: "Password",
    confirmPassword: "Conferma password",
    register: "Registrati",
    alreadyAccount: "Hai già un account?",
    login: "Accedi",
    passwordMismatch:
      "Le password non corrispondono.",
    signupFailed: "Registrazione non riuscita",
    networkError: "Errore di rete",
    emailPlaceholder: "tu@esempio.com",
  },

  pl: {
    title: "Utwórz konto NAVA SOCKS",
    subtitle:
      "Użyj prawdziwego adresu e-mail, aby móc później odzyskać konto.",
    username: "Nazwa użytkownika",
    email: "E-mail",
    password: "Hasło",
    confirmPassword: "Potwierdź hasło",
    register: "Zarejestruj",
    alreadyAccount: "Masz już konto?",
    login: "Zaloguj",
    passwordMismatch: "Hasła nie są zgodne.",
    signupFailed: "Rejestracja nie powiodła się",
    networkError: "Błąd sieci",
    emailPlaceholder: "ty@przyklad.pl",
  },

  pt: {
    title: "Criar conta NAVA SOCKS",
    subtitle:
      "Use um endereço de e-mail real para poder recuperar a sua conta mais tarde.",
    username: "Utilizador",
    email: "E-mail",
    password: "Palavra-passe",
    confirmPassword: "Confirmar palavra-passe",
    register: "Registar",
    alreadyAccount: "Já tem uma conta?",
    login: "Entrar",
    passwordMismatch:
      "As palavras-passe não coincidem.",
    signupFailed: "Falha no registo",
    networkError: "Erro de rede",
    emailPlaceholder: "voce@exemplo.com",
  },

  ru: {
    title: "Создать аккаунт NAVA SOCKS",
    subtitle:
      "Используйте действующий электронный адрес, чтобы позже восстановить аккаунт.",
    username: "Имя пользователя",
    email: "Электронная почта",
    password: "Пароль",
    confirmPassword: "Подтвердить пароль",
    register: "Зарегистрироваться",
    alreadyAccount: "Уже есть аккаунт?",
    login: "Войти",
    passwordMismatch:
      "Пароли не совпадают.",
    signupFailed: "Ошибка регистрации",
    networkError: "Ошибка сети",
    emailPlaceholder: "you@пример.com",
  },

  zh: {
    title: "创建 NAVA SOCKS 账户",
    subtitle:
      "请使用有效的电子邮箱地址，以便以后恢复账户。",
    username: "用户名",
    email: "电子邮箱",
    password: "密码",
    confirmPassword: "确认密码",
    register: "注册",
    alreadyAccount: "已经有账户？",
    login: "登录",
    passwordMismatch:
      "两次密码不一致。",
    signupFailed: "注册失败",
    networkError: "网络错误",
    emailPlaceholder: "you@example.com",
  },

  "es-ar": {
    title: "Crear cuenta de NAVA SOCKS",
    subtitle:
      "Usá un correo electrónico real para poder recuperar tu cuenta más adelante.",
    username: "Usuario",
    email: "Correo electrónico",
    password: "Contraseña",
    confirmPassword: "Confirmar contraseña",
    register: "Registrarse",
    alreadyAccount: "¿Ya tenés una cuenta?",
    login: "Iniciar sesión",
    passwordMismatch:
      "Las contraseñas no coinciden.",
    signupFailed: "Error al registrarse",
    networkError: "Error de red",
    emailPlaceholder: "vos@ejemplo.com",
  },

  tr: {
    title: "NAVA SOCKS hesabı oluştur",
    subtitle:
      "Hesabınızı daha sonra kurtarabilmek için gerçek bir e-posta adresi kullanın.",
    username: "Kullanıcı adı",
    email: "E-posta",
    password: "Şifre",
    confirmPassword: "Şifreyi onayla",
    register: "Kaydol",
    alreadyAccount: "Zaten bir hesabınız var mı?",
    login: "Giriş yap",
    passwordMismatch:
      "Şifreler eşleşmiyor.",
    signupFailed: "Kayıt başarısız",
    networkError: "Ağ hatası",
    emailPlaceholder: "siz@ornek.com",
  },
};

export default function SignupPage() {
  const router = useRouter();
  const { dark, language } = useSitePreferences();
  const signupText =
    SIGNUP_TEXT[language] ?? SIGNUP_TEXT.en;

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError(signupText.passwordMismatch);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error || signupText.signupFailed
        );
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError(signupText.networkError);
    } finally {
      setLoading(false);
    }
  };

  return (
<div
  style={{
    backgroundColor: dark ? "#080d19" : "#f1f5f9",
    color: dark ? "#ffffff" : "#020617",
  }}
className="min-h-screen flex flex-col selection:bg-cyan-500 selection:text-slate-950 bg-slate-100 text-slate-950 dark:bg-[#080d19] dark:text-white">      
<Navbar />

      <main className="flex-1 flex items-center justify-center p-4 py-12 sm:py-16">
<div
  style={{
    backgroundColor: dark ? "#0d1424" : "#ffffff",
    borderColor: dark
      ? "rgba(21, 94, 117, 0.5)"
      : "#e2e8f0",
  }}
  className="max-w-md w-full border rounded-2xl p-5 sm:p-7 shadow-2xl transition-all bg-white border-slate-200 dark:bg-[#0d1424]/90 dark:border-cyan-800/50"
>          <h1 className="text-2xl font-black mb-1 text-slate-900 dark:text-white">
            {signupText.title}
          </h1>

          <p className="text-xs mb-5 font-bold text-slate-700 dark:text-slate-400">
            {signupText.subtitle}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg border text-xs font-black bg-rose-100 border-rose-300 text-rose-800 dark:bg-rose-950/80 dark:border-rose-500/40 dark:text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-black block mb-1 text-slate-800 dark:text-slate-300">
                {signupText.username}
              </label>

              <div className="relative">
                <input
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value)
                  }
                  required
                  minLength={3}
                  maxLength={24}
                  autoComplete="username"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-bold outline-none focus:border-cyan-500 bg-slate-50 border-slate-300 text-black dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                />

                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="text-xs font-black block mb-1 text-slate-800 dark:text-slate-300">
                {signupText.email}
              </label>

              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  required
                  autoComplete="email"
                  placeholder={signupText.emailPlaceholder}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-bold outline-none focus:border-cyan-500 bg-slate-50 border-slate-300 text-black dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                />

                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="text-xs font-black block mb-1 text-slate-800 dark:text-slate-300">
                {signupText.password}
              </label>

              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-bold outline-none focus:border-cyan-500 bg-slate-50 border-slate-300 text-black dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                />

                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="text-xs font-black block mb-1 text-slate-800 dark:text-slate-300">
                {signupText.confirmPassword}
              </label>

              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs font-bold outline-none focus:border-cyan-500 bg-slate-50 border-slate-300 text-black dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                />

                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-2 disabled:opacity-60 shadow-lg"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {signupText.register}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-xs font-bold text-slate-700 dark:text-slate-400">
            {signupText.alreadyAccount}{" "}
            <Link
              href="/auth/login"
              className="font-black hover:underline text-cyan-600 dark:text-cyan-400"
            >
              {signupText.login}
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}