import { useApp, useGame } from '../app/ctx';

/** Подсказка-плашка: показывается один раз (пока игрок не нажмёт «Понятно»), её можно вернуть в настройках. */
export function Hint({ id, text, icon = '💡' }: { id: string; text: string; icon?: string }) {
  const g = useGame(); const { api } = useApp();
  if (g.player.tutorial.hintsSeen[id]) return null;
  return <div className="banner info row" style={{ gap: 10, justifyContent: 'space-between' }} role="note"><span>{icon} {text}</span><button className="btn small ghost" onClick={() => api.markHint(id)}>Понятно</button></div>;
}
