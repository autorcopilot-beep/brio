export function getAuthMessage(message:string) {
  if (message.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
  if (message.includes("User already registered")) return "Este e-mail já possui uma conta.";
  if (message.includes("Password should be")) return "A senha precisa ter pelo menos 8 caracteres.";
  if (message.includes("rate limit")) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  return "Não foi possível concluir. Revise os dados e tente novamente.";
}
