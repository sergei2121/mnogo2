import { useState, useEffect } from 'react';
import { users, type User } from '../api';

export default function AdminPanel() {
  const [usersList, setUsersList] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await users.list();
      setUsersList(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editingUser) {
        await users.update(editingUser.id, { username, password: password || undefined, role });
      } else {
        await users.create({ username, password, role });
      }
      resetForm();
      loadUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setUsername(user.username);
    setPassword('');
    setRole(user.role);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить пользователя?')) return;
    try {
      await users.delete(id);
      loadUsers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setRole('user');
    setError('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <span>👥</span> Управление пользователями
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
            {editingUser ? 'Редактировать' : 'Новый'} пользователь
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Имя пользователя</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-900/80 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Пароль {editingUser && '(оставьте пустым)'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-900/80 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                required={!editingUser}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Роль</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
                className="w-full bg-gray-900/80 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="user">Пользователь</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Сохранение...' : editingUser ? 'Сохранить' : 'Создать'}
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

      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700/50">
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">ID</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Имя</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Роль</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Конфигов</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Запусков</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-400">Создан</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400">Действия</th>
            </tr>
          </thead>
          <tbody>
            {usersList.map((user) => (
              <tr key={user.id} className="border-b border-gray-700/30 hover:bg-gray-700/20">
                <td className="px-4 py-3 text-sm text-gray-400">{user.id}</td>
                <td className="px-4 py-3 text-sm text-white font-medium">{user.username}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'admin' ? 'bg-purple-900/50 text-purple-300' : 'bg-blue-900/50 text-blue-300'
                  }`}>
                    {user.role === 'admin' ? 'Админ' : 'Пользователь'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">{user.config_count || 0}</td>
                <td className="px-4 py-3 text-sm text-gray-400">{user.launch_count || 0}</td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs transition-colors"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="px-3 py-1 bg-red-900/50 hover:bg-red-800/50 rounded text-xs transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
