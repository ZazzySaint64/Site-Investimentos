import assert from "node:assert/strict";
import { test } from "node:test";
import { authMessage, callbackTarget } from "./auth-messages.ts";

test("known auth errors become plain sentences and unknown ones stay generic", () => {
  assert.equal(authMessage("invalid_credentials"), "E-mail ou senha incorretos.");
  assert.equal(authMessage("email_not_confirmed"), "Confirme seu e-mail pelo link que enviamos.");
  assert.equal(authMessage("weak_password"), "A senha precisa de pelo menos 8 caracteres.");
  assert.equal(
    authMessage("over_email_send_rate_limit"),
    "Muitos e-mails enviados agora. Tente de novo em alguns minutos.",
  );
  assert.equal(authMessage("same_password"), "A nova senha precisa ser diferente da atual.");
  assert.equal(authMessage("algo_novo"), "Não foi possível concluir agora. Tente de novo.");
  assert.equal(authMessage(undefined), "Não foi possível concluir agora. Tente de novo.");
});

test("the callback only goes to fixed places", () => {
  assert.equal(callbackTarget(new URLSearchParams(""), true), "/carteira");
  assert.equal(callbackTarget(new URLSearchParams("type=recovery"), true), "/nova-senha");
  assert.equal(callbackTarget(new URLSearchParams("type=recovery"), false), "/entrar?aviso=link-senha");
  assert.equal(callbackTarget(new URLSearchParams(""), false), "/entrar?aviso=link");
  assert.equal(callbackTarget(new URLSearchParams("next=//malicioso.example"), true), "/carteira");
});
