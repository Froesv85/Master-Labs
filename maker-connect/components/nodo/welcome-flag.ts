// Sinaliza para o app que o maker acabou de entrar, para o Nodo dar as boas-vindas.
// sessionStorage (não cookie): vale só para esta aba e nunca vai ao servidor.
export const NODO_WELCOME_KEY = 'mc:nodo-welcome';

export type NodoWelcomeKind = 'login' | 'signup';

export function requestNodoWelcome(kind: NodoWelcomeKind) {
  try {
    sessionStorage.setItem(NODO_WELCOME_KEY, kind);
  } catch {
    // navegação privada sem storage: só pula a saudação
  }
}

export function takeNodoWelcome(): NodoWelcomeKind | null {
  try {
    const kind = sessionStorage.getItem(NODO_WELCOME_KEY);
    sessionStorage.removeItem(NODO_WELCOME_KEY);
    return kind === 'login' || kind === 'signup' ? kind : null;
  } catch {
    return null;
  }
}
