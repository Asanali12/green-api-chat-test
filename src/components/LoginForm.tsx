import { useState, type FormEvent } from 'react';
import { getSettings, GreenApiError } from '../api/greenApi';
import type { Credentials } from '../types';

const DEFAULT_API_URL = 'https://api.green-api.com';

const ENV_ID_INSTANCE = import.meta.env.VITE_GREEN_API_ID_INSTANCE ?? '';
const ENV_API_TOKEN_INSTANCE = import.meta.env.VITE_GREEN_API_API_TOKEN_INSTANCE ?? '';
const ENV_API_URL = import.meta.env.VITE_GREEN_API_URL ?? '';
const HAS_ENV_CREDENTIALS = Boolean(ENV_ID_INSTANCE && ENV_API_TOKEN_INSTANCE);

interface LoginFormProps {
  onSuccess: (creds: Credentials) => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [idInstance, setIdInstance] = useState(ENV_ID_INSTANCE);
  const [apiTokenInstance, setApiTokenInstance] = useState(ENV_API_TOKEN_INSTANCE);
  const [apiUrl, setApiUrl] = useState(ENV_API_URL || DEFAULT_API_URL);
  const [showAdvanced, setShowAdvanced] = useState(Boolean(ENV_API_URL));
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const creds: Credentials = {
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
      apiUrl: apiUrl.trim() || DEFAULT_API_URL,
    };

    if (!creds.idInstance || !creds.apiTokenInstance) {
      setError('Укажите idInstance и apiTokenInstance');
      return;
    }

    setChecking(true);
    try {
      await getSettings(creds);
      onSuccess(creds);
    } catch (err) {
      if (err instanceof GreenApiError) {
        setError(`Не удалось проверить учётные данные: ${err.message}`);
      } else {
        setError('Не удалось проверить учётные данные');
      }
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Веб-чат WhatsApp</h1>
        <p className="login-subtitle">Войдите с учётными данными вашего инстанса GREEN-API</p>
        {HAS_ENV_CREDENTIALS && (
          <p className="login-hint">Поля заполнены из .env — проверьте и нажмите «Войти».</p>
        )}

        <label className="field">
          <span>idInstance</span>
          <input
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value)}
            placeholder="1101234567"
            autoComplete="off"
            inputMode="numeric"
          />
        </label>

        <label className="field">
          <span>apiTokenInstance</span>
          <input
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
            placeholder="d0b443a1a2b34c..."
            autoComplete="off"
            type="password"
          />
        </label>

        <button
          type="button"
          className="link-button"
          onClick={() => setShowAdvanced((v) => !v)}
          title={showAdvanced ? 'Скрыть дополнительные настройки' : 'Дополнительные настройки'}
        >
          {showAdvanced ? 'Скрыть дополнительные настройки' : 'Дополнительные настройки'}
        </button>

        {showAdvanced && (
          <label className="field">
            <span>API URL</span>
            <input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder={DEFAULT_API_URL} />
          </label>
        )}

        {error && <div className="form-error">{error}</div>}

        <button type="submit" className="primary-button" disabled={checking} title="Войти">
          {checking ? 'Проверка…' : 'Войти'}
        </button>
      </form>
    </div>
  );
}
