import { useStore } from '../lib/store';
import { toastStore } from '../lib/toast';

export function Toast() {
  const message = useStore(toastStore, (s) => s.message);
  const key = useStore(toastStore, (s) => s.key);
  if (!message) return null;
  return (
    <div className="toast" key={key} role="status">
      {message}
    </div>
  );
}
