export function getAuthMessage(message:string) {
  if (message.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
  if (message.includes("User already registered") || message.includes("duplicate key") || message.includes("users_email_partial_key")) return "Este e-mail já possui uma conta. Tente entrar ou use outro endereço.";
  if (message.includes("Email not confirmed") || message.includes("email_not_confirmed")) return "Confirme seu e-mail antes de entrar. Verifique a caixa de entrada e o spam.";
  if (message.includes("Password should be")) return "A senha precisa ter pelo menos 8 caracteres.";
  if (message.includes("rate limit") || message.includes("over_email_send_rate_limit")) return "O limite de envio de e-mails foi atingido. Aguarde alguns minutos antes de tentar novamente.";
  if (message.includes("email provider") || message.includes("Error sending confirmation email")) return "Não foi possível enviar o e-mail de confirmação. Tente novamente mais tarde.";
  return "Não foi possível concluir. Revise os dados e tente novamente.";
}
