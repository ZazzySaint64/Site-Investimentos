// Pure helpers for the login screens. No framework imports, so node --test can load them.

const GENERIC = "Não foi possível concluir agora. Tente de novo.";

const MESSAGES: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  email_not_confirmed: "Confirme seu e-mail pelo link que enviamos.",
  weak_password: "A senha precisa de pelo menos 8 caracteres.",
  same_password: "A nova senha precisa ser diferente da atual.",
  over_email_send_rate_limit: "Muitos e-mails enviados agora. Tente de novo em alguns minutos.",
};

export function authMessage(code: string | undefined): string {
  return (code && MESSAGES[code]) || GENERIC;
}

// The destination is fixed on purpose: a `next` parameter would be an open redirect.
export function callbackTarget(params: URLSearchParams, exchanged: boolean): string {
  if (!exchanged) {
    return params.get("type") === "recovery" ? "/entrar?aviso=link-senha" : "/entrar?aviso=link";
  }
  return params.get("type") === "recovery" ? "/nova-senha" : "/carteira";
}
