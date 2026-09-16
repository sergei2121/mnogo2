import { useState, useEffect } from 'react';
import { apps, launch, type AppConfig } from '../api';

const methodLabels: Record<string, { label: string; icon: string }> = {
  simple: { label: 'Простой', icon: '🚀' },
  sandbox: { label: 'Sandboxie', icon: '🛡️' },
  copy: { label: 'Копирование', icon: '📁' },
  env: { label: 'Переменные', icon: '⚙️' },
};

export default function AppsManager() {
  const [configs, setConfigs] = useState<AppConfig[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AppConfig | null>(null);
  const [name, setName] = useState('');
  const [exePath, setExePath] = useState('');
  const [method, setMethod] = useState<'simple' | 'sandbox' | 'copy' | 'env'>('simple');
  const [copies, setCopies] = useState(3);
  const [delay, setDelay] = useState(500);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showScript, setShowScript] = useState<string | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const data = await apps.list();
      setConfigs(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editingConfig) {
        await apps.update(editingConfig.id, { name, exe_path: exePath, method, copies, delay });
      } else {
        await apps.create({ name, exe_path: exePath, method, copies, delay });
      }
      resetForm();
      loadConfigs();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config: AppConfig) => {
    setEditingConfig(config);
    setName(config.name);
    setExePath(config.exe_path);
    setMethod(config.method);
    setCopies(config.copies);
    setDelay(config.delay);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить конфигурацию?')) return;
    try {
      await apps.delete(id);
      loadConfigs();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLaunch = async (config: AppConfig) => {
    try {
      const { script } = await launch.generate({
        exe_path: config.exe_path,
        copies: config.copies,
        method: config.method,
        delay: config.delay,
      });
      setShowScript(script);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDownload = () => {
    if (!showScript) return;
    const blob = new Blob([showScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `multi_launch_${Date.now()}.bat`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingConfig(null);
    setName('');
    setExePath('');
    setMethod('simple');
    setCopies(3);
    setDelay(500);
    setError('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <span>📂</span> Конфигурации приложений
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
        >
          + Добавить
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-medium text-white">
            {editingConfig ? 'Редактировать' : 'Новая'} конфигурация
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Название</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-900/80 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="Мой Telegram"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Путь к .exe</label>
              <input
                type="text"
                value={exePath}
                onChange={(e) => setExePath(e.target.value)}
                className="w-full bg-gray-900/80 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="C:\Program Files\App\app.exe"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Метод запуска</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="w-full bg-gray-900/80 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {Object.entries(methodLabels).map(([key, val]) => (
                  <option key={key} value={key}>{val.icon} {val.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Количество копий</label>
              <input
                type="number"
                min="2"
                max="50"
                value={copies}
                onChange={(e) => setCopies(parseInt(e.target.value) || 2)}
                className="w-full bg-gray-900/80 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Задержка (мс)</label>
              <input
                type="number"
                min="0"
                max="10000"
                step="100"
                value={delay}
                onChange={(e) => setDelay(parseInt(e.target.value) || 0)}
                className="w-full bg-gray-900/80 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Сохранение...' : editingConfig ? 'Сохранить' : 'Создать'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      {/* Script Preview Modal */}
      {showScript && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-medium text-white">📄 Готовый скрипт</h3>
              <button
                onClick={() => setShowScript(null)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="bg-gray-900 rounded-lg p-4 text-xs text-green-400 font-mono whitespace-pre-wrap">
                {showScript}
              </pre>
            </div>
            <div className="p-4 border-t border-gray-700 flex gap-2">
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg text-sm font-medium transition-all"
              >
                ⬇️ Скачать .bat
              </button>
              <button
                onClick={() => setShowScript(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configs List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {configs.map((config) => (
          <div key={config.id} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-medium text-white">{config.name}</h3>
                <p className="text-xs text-gray-500 font-mono mt-1 truncate max-w-[250px]">
                  {config.exe_path}
                </p>
              </div>
              <span className="text-lg">{methodLabels[config.method]?.icon}</span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2 py-0.5 bg-gray-700/50 rounded text-xs text-gray-300">
                {config.copies} копий
              </span>
              <span className="px-2 py-0.5 bg-gray-700/50 rounded text-xs text-gray-300">
                {methodLabels[config.method]?.label}
              </span>
              <span className="px-2 py-0.5 bg-gray-700/50 rounded text-xs text-gray-300">
                {config.delay}мс
              </span>
            </div>
            {config.created_by_username && (
              <p className="text-xs text-gray-500 mb-3">
                Создал: {config.created_by_username}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => handleLaunch(config)}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg text-xs font-medium transition-all"
              >
                ▶ Запустить
              </button>
              <button
                onClick={() => handleEdit(config)}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs transition-colors"
              >
                ✏️
              </button>
              <button
                onClick={() => handleDelete(config.id)}
                className="px-3 py-2 bg-red-900/50 hover:bg-red-800/50 rounded-lg text-xs transition-colors"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {configs.length === 0 && !showForm && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-3">📂</p>
          <p>Нет конфигураций. Создайте первую!</p>
        </div>
      )}
    </div>
  );
}
