import { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import AdminPanel from './components/AdminPanel';
import AppsManager from './components/AppsManager';
import LaunchHistory from './components/LaunchHistory';

type Tab = 'apps' | 'history' | 'admin';

interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('apps');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (token: string, userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Загрузка...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-700/50 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-lg shadow-lg shadow-blue-500/20">
              🚀
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Multi Launcher
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Tabs */}
            <nav className="hidden sm:flex items-center gap-1 bg-gray-800/50 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('apps')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  activeTab === 'apps' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                📂 Приложения
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                📋 История
              </button>
              {user.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    activeTab === 'admin' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  👥 Админ
                </button>
              )}
            </nav>

            {/* User info */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-200">{user.username}</p>
                <p className="text-xs text-gray-500">
                  {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                title="Выйти"
              >
                🚪
              </button>
            </div>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="sm:hidden border-t border-gray-700/50 px-4 py-2 flex gap-1">
          <button
            onClick={() => setActiveTab('apps')}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs transition-colors ${
              activeTab === 'apps' ? 'bg-blue-600 text-white' : 'bg-gray-800/50 text-gray-400'
            }`}
          >
            📂 Приложения
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs transition-colors ${
              activeTab === 'history' ? 'bg-blue-600 text-white' : 'bg-gray-800/50 text-gray-400'
            }`}
          >
            📋 История
          </button>
          {user.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs transition-colors ${
                activeTab === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-800/50 text-gray-400'
              }`}
            >
              👥 Админ
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'apps' && <AppsManager />}
        {activeTab === 'history' && <LaunchHistory />}
        {activeTab === 'admin' && user.role === 'admin' && <AdminPanel />}
      </main>
    </div>
  );
}

export default App;
