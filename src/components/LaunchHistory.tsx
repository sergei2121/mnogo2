import { useState, useEffect } from 'react';
import { launch, type LaunchHistory } from '../api';

const methodLabels: Record<string, string> = {
  simple: '🚀 Простой',
  sandbox: '🛡️ Sandboxie',
  copy: '📁 Копирование',
  env: '⚙️ Переменные',
};

export default function LaunchHistory() {
  const [history, setHistory] = useState<LaunchHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await launch.history();
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
        <span>📋</span> История запусков
      </h2>

      {history.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-3">📋</p>
          <p>История пуста</p>
        </div>
      ) : (
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Время</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Пользователь</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Приложение</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Метод</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Копий</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Статус</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id} className="border-b border-gray-700/30 hover:bg-gray-700/20">
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-white">{item.username || '-'}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-300 font-mono truncate max-w-[200px]">
                      {item.exe_path}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {methodLabels[item.method] || item.method}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">{item.copies}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.status === 'generated' ? 'bg-green-900/50 text-green-300' :
                      item.status === 'pending' ? 'bg-yellow-900/50 text-yellow-300' :
                      'bg-gray-700/50 text-gray-300'
                    }`}>
                      {item.status === 'generated' ? 'Создан' : item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
