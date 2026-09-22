"use client";

import { useState } from "react";
import Link from "next/link";
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

const FORGOT_TEXT: Record<
  string,
  Record<string, string>
> = {
  en: {
    title: "Reset Password",
    subtitle:
      "Use your email or username. Reset tokens expire after 15 minutes and can only be used once.",
    emailOrUsername: "Email or Username",
    startReset: "START PASSWORD RESET",
    resetToken: "Reset Token",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New Password",
    savePassword: "SAVE NEW PASSWORD",
    backToLogin: "Back to login",
    unableToStart:
      "Unable to start password reset.",
    devResetToken:
      "Development reset token generated. This token is only shown for local testing.",
    productionReset:
      "If that account exists, a reset email will be sent once production email delivery is configured.",
    unableToReset:
      "Unable to reset password.",
    passwordUpdated:
      "Password updated successfully. You can now log in.",
    passwordMismatch:
      "Passwords do not match.",
    networkError: "Network error",
  },

  de: {
    title: "NAVA SOCKS Passwort zurücksetzen",
    subtitle:
      "Verwende deine E-Mail oder deinen Benutzernamen. Reset-Tokens laufen nach 15 Minuten ab und können nur einmal verwendet werden.",
    emailOrUsername: "E-Mail oder Benutzername",
    startReset: "PASSWORT-RESET STARTEN",
    resetToken: "Reset-Token",
    newPassword: "Neues Passwort",
    confirmNewPassword:
      "Neues Passwort bestätigen",
    savePassword:
      "NEUES PASSWORT SPEICHERN",
    backToLogin: "Zurück zur Anmeldung",
    unableToStart:
      "Passwort-Reset konnte nicht gestartet werden.",
    devResetToken:
      "Entwicklungs-Reset-Token erstellt. Dieses Token wird nur für lokale Tests angezeigt.",
    productionReset:
      "Falls das Konto existiert, wird eine Reset-E-Mail gesendet, sobald der E-Mail-Versand in der Produktion eingerichtet ist.",
    unableToReset:
      "Passwort konnte nicht zurückgesetzt werden.",
    passwordUpdated:
      "Passwort erfolgreich aktualisiert. Du kannst dich jetzt anmelden.",
    passwordMismatch:
      "Die Passwörter stimmen nicht überein.",
    networkError: "Netzwerkfehler",
  },

  es: {
    title: "Restablecer contraseña de NAVA SOCKS",
    subtitle:
      "Usa tu correo electrónico o usuario. Los tokens de restablecimiento caducan después de 15 minutos y solo pueden usarse una vez.",
    emailOrUsername: "Correo o usuario",
    startReset: "INICIAR RESTABLECIMIENTO",
    resetToken: "Token de restablecimiento",
    newPassword: "Nueva contraseña",
    confirmNewPassword:
      "Confirmar nueva contraseña",
    savePassword:
      "GUARDAR NUEVA CONTRASEÑA",
    backToLogin:
      "Volver al inicio de sesión",
    unableToStart:
      "No se pudo iniciar el restablecimiento de contraseña.",
    devResetToken:
      "Token de restablecimiento de desarrollo generado. Este token solo se muestra para pruebas locales.",
    productionReset:
      "Si la cuenta existe, se enviará un correo de restablecimiento cuando se configure el envío de correo en producción.",
    unableToReset:
      "No se pudo restablecer la contraseña.",
    passwordUpdated:
      "Contraseña actualizada correctamente. Ya puedes iniciar sesión.",
    passwordMismatch:
      "Las contraseñas no coinciden.",
    networkError: "Error de red",
  },

  fr: {
    title: "Réinitialiser le mot de passe NAVA SOCKS",
    subtitle:
      "Utilisez votre e-mail ou nom d'utilisateur. Les jetons de réinitialisation expirent après 15 minutes et ne peuvent être utilisés qu'une seule fois.",
    emailOrUsername:
      "E-mail ou nom d'utilisateur",
    startReset:
      "DÉMARRER LA RÉINITIALISATION",
    resetToken:
      "Jeton de réinitialisation",
    newPassword: "Nouveau mot de passe",
    confirmNewPassword:
      "Confirmer le nouveau mot de passe",
    savePassword:
      "ENREGISTRER LE NOUVEAU MOT DE PASSE",
    backToLogin:
      "Retour à la connexion",
    unableToStart:
      "Impossible de démarrer la réinitialisation du mot de passe.",
    devResetToken:
      "Jeton de réinitialisation de développement généré. Ce jeton est affiché uniquement pour les tests locaux.",
    productionReset:
      "Si ce compte existe, un e-mail de réinitialisation sera envoyé une fois l'envoi d'e-mails en production configuré.",
    unableToReset:
      "Impossible de réinitialiser le mot de passe.",
    passwordUpdated:
      "Mot de passe mis à jour avec succès. Vous pouvez maintenant vous connecter.",
    passwordMismatch:
      "Les mots de passe ne correspondent pas.",
    networkError: "Erreur réseau",
  },

  ja: {
    title: "NAVA SOCKS パスワードをリセット",
    subtitle:
      "メールまたはユーザー名を使用してください。リセットトークンは15分で失効し、一度だけ使用できます。",
    emailOrUsername:
      "メールまたはユーザー名",
    startReset:
      "パスワードリセットを開始",
    resetToken: "リセットトークン",
    newPassword: "新しいパスワード",
    confirmNewPassword:
      "新しいパスワードを確認",
    savePassword:
      "新しいパスワードを保存",
    backToLogin:
      "ログインに戻る",
    unableToStart:
      "パスワードリセットを開始できません。",
    devResetToken:
      "開発用リセットトークンが生成されました。このトークンはローカルテストでのみ表示されます。",
    productionReset:
      "アカウントが存在する場合、本番のメール配信が設定されるとリセットメールが送信されます。",
    unableToReset:
      "パスワードをリセットできません。",
    passwordUpdated:
      "パスワードを更新しました。ログインできます。",
    passwordMismatch:
      "パスワードが一致しません。",
    networkError: "ネットワークエラー",
  },

  ko: {
    title: "NAVA SOCKS 비밀번호 재설정",
    subtitle:
      "이메일 또는 사용자 이름을 사용하세요. 재설정 토큰은 15분 후 만료되며 한 번만 사용할 수 있습니다.",
    emailOrUsername:
      "이메일 또는 사용자 이름",
    startReset:
      "비밀번호 재설정 시작",
    resetToken: "재설정 토큰",
    newPassword: "새 비밀번호",
    confirmNewPassword:
      "새 비밀번호 확인",
    savePassword:
      "새 비밀번호 저장",
    backToLogin:
      "로그인으로 돌아가기",
    unableToStart:
      "비밀번호 재설정을 시작할 수 없습니다.",
    devResetToken:
      "개발용 재설정 토큰이 생성되었습니다. 이 토큰은 로컬 테스트에서만 표시됩니다.",
    productionReset:
      "해당 계정이 존재하면 프로덕션 이메일 전송이 설정된 후 재설정 이메일이 발송됩니다.",
    unableToReset:
      "비밀번호를 재설정할 수 없습니다.",
    passwordUpdated:
      "비밀번호가 성공적으로 업데이트되었습니다. 이제 로그인할 수 있습니다.",
    passwordMismatch:
      "비밀번호가 일치하지 않습니다.",
    networkError: "네트워크 오류",
  },

  it: {
    title: "Reimposta la password NAVA SOCKS",
    subtitle:
      "Usa la tua e-mail o il nome utente. I token di reimpostazione scadono dopo 15 minuti e possono essere usati una sola volta.",
    emailOrUsername:
      "E-mail o nome utente",
    startReset:
      "AVVIA REIMPOSTAZIONE",
    resetToken:
      "Token di reimpostazione",
    newPassword: "Nuova password",
    confirmNewPassword:
      "Conferma nuova password",
    savePassword:
      "SALVA NUOVA PASSWORD",
    backToLogin:
      "Torna al login",
    unableToStart:
      "Impossibile avviare il ripristino della password.",
    devResetToken:
      "Token di ripristino di sviluppo generato. Questo token viene mostrato solo per i test locali.",
    productionReset:
      "Se l'account esiste, verrà inviata un'e-mail di ripristino quando sarà configurata la consegna delle e-mail in produzione.",
    unableToReset:
      "Impossibile reimpostare la password.",
    passwordUpdated:
      "Password aggiornata correttamente. Ora puoi accedere.",
    passwordMismatch:
      "Le password non corrispondono.",
    networkError: "Errore di rete",
  },

  pl: {
    title: "Zresetuj hasło NAVA SOCKS",
    subtitle:
      "Użyj adresu e-mail lub nazwy użytkownika. Tokeny resetowania wygasają po 15 minutach i można ich użyć tylko raz.",
    emailOrUsername:
      "E-mail lub nazwa użytkownika",
    startReset:
      "ROZPOCZNIJ RESETOWANIE",
    resetToken:
      "Token resetowania",
    newPassword: "Nowe hasło",
    confirmNewPassword:
      "Potwierdź nowe hasło",
    savePassword:
      "ZAPISZ NOWE HASŁO",
    backToLogin:
      "Wróć do logowania",
    unableToStart:
      "Nie można rozpocząć resetowania hasła.",
    devResetToken:
      "Wygenerowano programistyczny token resetowania. Ten token jest widoczny tylko podczas lokalnych testów.",
    productionReset:
      "Jeśli konto istnieje, wiadomość resetująca zostanie wysłana po skonfigurowaniu wysyłki e-mail w produkcji.",
    unableToReset:
      "Nie można zresetować hasła.",
    passwordUpdated:
      "Hasło zostało pomyślnie zaktualizowane. Możesz się teraz zalogować.",
    passwordMismatch:
      "Hasła nie są zgodne.",
    networkError: "Błąd sieci",
  },

  pt: {
    title: "Redefinir palavra-passe NAVA SOCKS",
    subtitle:
      "Use o seu e-mail ou nome de utilizador. Os tokens de redefinição expiram após 15 minutos e só podem ser usados uma vez.",
    emailOrUsername:
      "E-mail ou utilizador",
    startReset:
      "INICIAR REDEFINIÇÃO",
    resetToken:
      "Token de redefinição",
    newPassword: "Nova palavra-passe",
    confirmNewPassword:
      "Confirmar nova palavra-passe",
    savePassword:
      "GUARDAR NOVA PALAVRA-PASSE",
    backToLogin:
      "Voltar ao login",
    unableToStart:
      "Não foi possível iniciar a redefinição da palavra-passe.",
    devResetToken:
      "Token de redefinição de desenvolvimento gerado. Este token é mostrado apenas para testes locais.",
    productionReset:
      "Se a conta existir, será enviado um e-mail de redefinição quando o envio de e-mails em produção estiver configurado.",
    unableToReset:
      "Não foi possível redefinir a palavra-passe.",
    passwordUpdated:
      "Palavra-passe atualizada com sucesso. Pode agora iniciar sessão.",
    passwordMismatch:
      "As palavras-passe não coincidem.",
    networkError: "Erro de rede",
  },

  ru: {
    title: "Сбросить пароль NAVA SOCKS",
    subtitle:
      "Используйте e-mail или имя пользователя. Токены сброса истекают через 15 минут и могут быть использованы только один раз.",
    emailOrUsername:
      "E-mail или имя пользователя",
    startReset:
      "НАЧАТЬ СБРОС ПАРОЛЯ",
    resetToken: "Токен сброса",
    newPassword: "Новый пароль",
    confirmNewPassword:
      "Подтвердить новый пароль",
    savePassword:
      "СОХРАНИТЬ НОВЫЙ ПАРОЛЬ",
    backToLogin:
      "Назад ко входу",
    unableToStart:
      "Не удалось начать сброс пароля.",
    devResetToken:
      "Токен сброса для разработки создан. Этот токен показывается только для локальных тестов.",
    productionReset:
      "Если аккаунт существует, письмо для сброса будет отправлено после настройки почтовой отправки в продакшене.",
    unableToReset:
      "Не удалось сбросить пароль.",
    passwordUpdated:
      "Пароль успешно обновлён. Теперь можно войти.",
    passwordMismatch:
      "Пароли не совпадают.",
    networkError: "Ошибка сети",
  },

  zh: {
    title: "重置 NAVA SOCKS 密码",
    subtitle:
      "使用电子邮箱或用户名。重置令牌 15 分钟后过期，且只能使用一次。",
    emailOrUsername:
      "电子邮箱或用户名",
    startReset:
      "开始密码重置",
    resetToken: "重置令牌",
    newPassword: "新密码",
    confirmNewPassword:
      "确认新密码",
    savePassword:
      "保存新密码",
    backToLogin:
      "返回登录",
    unableToStart:
      "无法开始密码重置。",
    devResetToken:
      "已生成开发环境重置令牌。此令牌仅在本地测试时显示。",
    productionReset:
      "如果账户存在，生产环境邮件发送配置完成后将发送重置邮件。",
    unableToReset:
      "无法重置密码。",
    passwordUpdated:
      "密码更新成功。现在可以登录。",
    passwordMismatch:
      "两次密码不一致。",
    networkError: "网络错误",
  },

  "es-ar": {
    title: "Restablecer contraseña de NAVA SOCKS",
    subtitle:
      "Usá tu correo o usuario. Los tokens de restablecimiento vencen a los 15 minutos y solo pueden usarse una vez.",
    emailOrUsername:
      "Correo o usuario",
    startReset:
      "INICIAR RESTABLECIMIENTO",
    resetToken:
      "Token de restablecimiento",
    newPassword: "Nueva contraseña",
    confirmNewPassword:
      "Confirmar nueva contraseña",
    savePassword:
      "GUARDAR NUEVA CONTRASEÑA",
    backToLogin:
      "Volver al inicio de sesión",
    unableToStart:
      "No se pudo iniciar el restablecimiento de contraseña.",
    devResetToken:
      "Se generó un token de restablecimiento de desarrollo. Solo se muestra para pruebas locales.",
    productionReset:
      "Si la cuenta existe, se enviará un correo de restablecimiento cuando se configure el envío en producción.",
    unableToReset:
      "No se pudo restablecer la contraseña.",
    passwordUpdated:
      "Contraseña actualizada correctamente. Ya podés iniciar sesión.",
    passwordMismatch:
      "Las contraseñas no coinciden.",
    networkError: "Error de red",
  },

  tr: {
    title: "NAVA SOCKS şifresini sıfırla",
    subtitle:
      "E-posta veya kullanıcı adınızı kullanın. Sıfırlama belirteçleri 15 dakika sonra sona erer ve yalnızca bir kez kullanılabilir.",
    emailOrUsername:
      "E-posta veya kullanıcı adı",
    startReset:
      "ŞİFRE SIFIRLAMAYI BAŞLAT",
    resetToken:
      "Sıfırlama belirteci",
    newPassword: "Yeni şifre",
    confirmNewPassword:
      "Yeni şifreyi onayla",
    savePassword:
      "YENİ ŞİFREYİ KAYDET",
    backToLogin:
      "Girişe dön",
    unableToStart:
      "Şifre sıfırlama başlatılamadı.",
    devResetToken:
      "Geliştirme sıfırlama belirteci oluşturuldu. Bu belirteç yalnızca yerel testlerde gösterilir.",
    productionReset:
      "Hesap mevcutsa, üretimde e-posta gönderimi yapılandırıldığında bir sıfırlama e-postası gönderilir.",
    unableToReset:
      "Şifre sıfırlanamadı.",
    passwordUpdated:
      "Şifre başarıyla güncellendi. Artık giriş yapabilirsiniz.",
    passwordMismatch:
      "Şifreler eşleşmiyor.",
    networkError: "Ağ hatası",
  },
};

export default function ForgotPasswordPage() {
  const { language } = useSitePreferences();

  const forgotText =
    FORGOT_TEXT[language] ?? FORGOT_TEXT.en;

  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [step, setStep] = useState<
    "request" | "reset"
  >("request");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const requestReset = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);

        if (data.mockToken) {
          setResetToken(data.mockToken);
        }

        setStep("reset");
      } else {
        setError(
          data.error || forgotText.unableToStart
        );
      }
    } catch {
      setError(forgotText.networkError);
    } finally {
      setLoading(false);
    }
  };

  const confirmReset = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            newPassword,
            resetToken,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage(forgotText.passwordUpdated);

        setTimeout(() => {
          window.location.href = "/auth/login";
        }, 1200);
      } else {
        setError(
          data.error || forgotText.unableToReset
        );
      }
    } catch {
      setError(forgotText.networkError);
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

      <div className="min-h-screen flex flex-col transition-colors duration-200 bg-slate-100 text-slate-950 dark:bg-[#080d19] dark:text-white">
        <Navbar />

        <main className="flex-1 flex items-center justify-center p-4 py-16">
          <div className="max-w-md w-full rounded-2xl p-7 border bg-white border-slate-200 dark:bg-[#0d1424]/90 dark:border-cyan-800/50">
            <h1 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              {forgotText.title}
            </h1>

            {error && (
              <div className="mb-3 text-xs text-rose-700 dark:text-rose-400">
                {error}
              </div>
            )}

            {message && (
              <div className="mb-3 text-xs text-emerald-700 dark:text-emerald-400">
                {message}
              </div>
            )}

            {step === "request" ? (
              <form
                onSubmit={requestReset}
                className="space-y-3"
              >
                <label className="text-xs font-semibold block text-slate-700 dark:text-slate-300">
                  {forgotText.emailOrUsername}
                </label>

                <input
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value)
                  }
                  required
                  className="w-full px-3 py-2.5 rounded-xl border text-xs outline-none focus:border-cyan-400 bg-white border-slate-300 text-slate-950 dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs font-mono disabled:opacity-60"
                >
                  {loading
                    ? "Loading..."
                    : forgotText.startReset}
                </button>
              </form>
            ) : (
              <form
                onSubmit={confirmReset}
                className="space-y-3"
              >
                <label className="text-xs font-semibold block text-slate-700 dark:text-slate-300">
                  {forgotText.resetToken}
                </label>

                <input
                  value={resetToken}
                  onChange={(e) =>
                    setResetToken(e.target.value)
                  }
                  className="w-full px-3 py-2.5 rounded-xl border font-mono text-xs bg-white border-slate-300 text-cyan-700 dark:bg-slate-950 dark:border-slate-800 dark:text-cyan-300"
                />

                <label className="text-xs font-semibold block text-slate-700 dark:text-slate-300">
                  {forgotText.newPassword}
                </label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                  minLength={6}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border text-xs bg-white border-slate-300 text-slate-950 dark:bg-slate-950 dark:border-slate-800 dark:text-white"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs font-mono disabled:opacity-60"
                >
                  {loading
                    ? "Loading..."
                    : forgotText.savePassword}
                </button>
              </form>
            )}

            <p className="mt-5 text-xs text-slate-600 dark:text-slate-400">
              <Link
                href="/auth/login"
                className="text-cyan-600 dark:text-cyan-400"
              >
                {forgotText.backToLogin}
              </Link>
            </p>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}