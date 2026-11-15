import { useApp } from '../app/ctx';
import { useNav } from '../app/nav';
import { Btn, Screen } from '../ui/kit';

/** Свободная игра: безопасная копия мира со всеми вещами и 99 999 валюты. Основной прогресс не меняется и не сохраняется. */
export function SandboxScreen() {
  const { store } = useApp(); const nav = useNav();
  const on = store.mode === 'sandbox';
  return (
    <Screen title="🧪 Свободная игра">
      <div className="stack">
        <div className="card stack center" style={{ alignItems: 'center' }}>
          <div className="emoji xl">🎨</div>
          <div className="bold">Примеряй всё что хочешь!</div>
          <div className="small muted">Здесь открыто всё: все вещи, комнаты и Нанабо, а валюты 99 999. Ты можешь экспериментировать с образами и декором без последствий.</div>
          <div className="banner" style={{ textAlign: 'left' }}><b>Важно:</b> всё, что происходит в свободной игре, <b>не сохраняется</b> и не влияет на настоящий прогресс — ни награды, ни покупки, ни достижения. Когда выйдешь, всё вернётся как было.</div>
        </div>
        {on ? <Btn block xl color="red" onClick={() => { store.exitSandbox(); nav.reset('tabs'); }}>Выйти в настоящую игру</Btn>
          : <Btn block xl color="teal" onClick={() => { store.enterSandbox(); nav.reset('tabs'); }}>Войти в свободную игру</Btn>}
      </div>
    </Screen>
  );
}
