import { useState, useCallback } from 'react';

interface LaunchConfig {
  exePath: string;
  copies: number;
  method: 'simple' | 'sandbox' | 'copy' | 'env';
  delay: number;
  name: string;
}

interface HistoryItem extends LaunchConfig {
  id: string;
  createdAt: Date;
}

function App() {
  const [exePath, setExePath] = useState('');
  const [copies, setCopies] = useState(3);
  const [method, setMethod] = useState<'simple' | 'sandbox' | 'copy' | 'env'>('simple');
  const [delay, setDelay] = useState(500);
  const [name, setName] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [notification, setNotification] = useState('');

  const methods = {
    simple: {
      label: 'Простой запуск',
      description: 'Запускает несколько экземпляров напрямую через start',
      icon: '🚀',
    },
    sandbox: {
      label: 'Через Sandboxie',
      description: 'Использует Sandboxie для изолированных копий',
      icon: '🛡️',
    },
    copy: {
      label: 'Копирование в разные папки',
      description: 'Копирует .exe в разные временные папки и запускает оттуда',
      icon: '📁',
    },
    env: {
      label: 'Через переменные окружения',
      description: 'Устанавливает уникальные переменные окружения для каждого экземпляра',
      icon: '⚙️',
    },
  };

  const generateScript = useCallback((config: LaunchConfig): string => {
    const { exePath, copies, method, delay } = config;
    const normalizedPath = exePath.replace(/\//g, '\\');

    switch (method) {
      case 'simple':
        return `@echo off
chcp 65001 >nul
title Multi Launcher - Simple Mode
echo ============================================
echo   Multi Launcher - Простой запуск
echo   Приложение: ${normalizedPath}
echo   Количество копий: ${copies}
echo ============================================
echo.

if not exist "${normalizedPath}" (
    echo [ОШИБКА] Файл не найден: ${normalizedPath}
    echo Проверьте путь к приложению.
    pause
    exit /b 1
)

echo Запуск ${copies} копий приложения...
echo.

for /L %%i in (1,1,${copies}) do (
    echo [%%i/${copies}] Запуск копии...
    start "" "${normalizedPath}"
    timeout /t ${Math.round(delay / 1000)} /nobreak >nul
)

echo.
echo ============================================
echo   Все ${copies} копий запущены!
echo ============================================
timeout /t 3 /nobreak >nul
`;

      case 'sandbox':
        return `@echo off
chcp 65001 >nul
title Multi Launcher - Sandboxie Mode
echo ============================================
echo   Multi Launcher - Режим Sandboxie
echo   Приложение: ${normalizedPath}
echo   Количество копий: ${copies}
echo ============================================
echo.

:: Проверка наличия Sandboxie
if not exist "C:\\Program Files\\Sandboxie-Plus\\Start.exe" (
    if not exist "C:\\Program Files (x86)\\Sandboxie\\Start.exe" (
        echo [ОШИБКА] Sandboxie не найден!
        echo Установите Sandboxie-Plus: https://sandboxie-plus.com/
        pause
        exit /b 1
    )
)

if not exist "${normalizedPath}" (
    echo [ОШИБКА] Файл не найден: ${normalizedPath}
    pause
    exit /b 1
)

echo Запуск ${copies} изолированных копий...
echo.

for /L %%i in (1,1,${copies}) do (
    echo [%%i/${copies}] Запуск в песочнице "Sandbox_%%i"...
    "C:\\Program Files\\Sandboxie-Plus\\Start.exe" /sandbox:Sandbox_%%i "${normalizedPath}"
    timeout /t ${Math.round(delay / 1000)} /nobreak >nul
)

echo.
echo ============================================
echo   Все ${copies} изолированных копий запущены!
echo ============================================
timeout /t 3 /nobreak >nul
`;

      case 'copy':
        return `@echo off
chcp 65001 >nul
title Multi Launcher - Copy Mode
echo ============================================
echo   Multi Launcher - Режим копирования
echo   Приложение: ${normalizedPath}
echo   Количество копий: ${copies}
echo ============================================
echo.

if not exist "${normalizedPath}" (
    echo [ОШИБКА] Файл не найден: ${normalizedPath}
    pause
    exit /b 1
)

set "TEMP_BASE=%TEMP%\\MultiLauncher_%RANDOM%"
echo Создание временной директории: %TEMP_BASE%
mkdir "%TEMP_BASE%" 2>nul

echo Запуск ${copies} копий из разных директорий...
echo.

for /L %%i in (1,1,${copies}) do (
    echo [%%i/${copies}] Копирование и запуск копии %%i...
    mkdir "%TEMP_BASE%\\copy_%%i" 2>nul
    
    :: Копируем основной exe
    copy "${normalizedPath}" "%TEMP_BASE%\\copy_%%i\\" >nul
    
    :: Копируем все файлы из папки приложения (dll и др.)
    for %%f in ("${normalizedPath}") do (
        xcopy "%%~dpf*.*" "%TEMP_BASE%\\copy_%%i\\" /Y /Q /E /I >nul 2>nul
    )
    
    :: Запускаем из копии
    start "" "%TEMP_BASE%\\copy_%%i\\%%~nx${normalizedPath}"
    timeout /t ${Math.round(delay / 1000)} /nobreak >nul
)

echo.
echo ============================================
echo   Все ${copies} копий запущены!
echo   Временные файлы: %TEMP_BASE%
echo ============================================
echo.
echo Очистить временные файлы после закрытия? (Y/N)
set /p cleanup=
if /i "%cleanup%"=="Y" (
    rmdir /s /q "%TEMP_BASE%" 2>nul
    echo Временные файлы удалены.
) else (
    echo Временные файлы сохранены в: %TEMP_BASE%
)
timeout /t 3 /nobreak >nul
`;

      case 'env':
        return `@echo off
chcp 65001 >nul
title Multi Launcher - Environment Mode
echo ============================================
echo   Multi Launcher - Режим переменных окружения
echo   Приложение: ${normalizedPath}
echo   Количество копий: ${copies}
echo ============================================
echo.

if not exist "${normalizedPath}" (
    echo [ОШИБКА] Файл не найден: ${normalizedPath}
    pause
    exit /b 1
)

echo Запуск ${copies} копий с уникальным окружением...
echo.

for /L %%i in (1,1,${copies}) do (
    echo [%%i/${copies}] Запуск с INSTANCE_ID=%%i...
    
    :: Создаём bat-файл для запуска с уникальными переменными
    (
        echo @echo off
        echo set "MULTI_INSTANCE_ID=%%i"
        echo set "MULTI_INSTANCE_DIR=%TEMP%\\instance_%%i"
        echo set "APPDATA=%APPDATA%\\instance_%%i"
        echo set "LOCALAPPDATA=%LOCALAPPDATA%\\instance_%%i"
        echo mkdir "%%MULTI_INSTANCE_DIR%%" 2^>nul
        echo mkdir "%%APPDATA%%" 2^>nul
        echo mkdir "%%LOCALAPPDATA%%" 2^>nul
        echo start "" "${normalizedPath}"
    ) > "%TEMP%\\launch_instance_%%i.bat"
    
    start "" cmd /c "%TEMP%\\launch_instance_%%i.bat"
    timeout /t ${Math.round(delay / 1000)} /nobreak >nul
)

echo.
echo ============================================
echo   Все ${copies} копий запущены с уникальным окружением!
echo ============================================
timeout /t 3 /nobreak >nul
`;

      default:
        return '';
    }
  }, []);

  const handleGenerate = () => {
    if (!exePath.trim()) {
      showNotification('Укажите путь к .exe файлу!', 'error');
      return;
    }

    const config: LaunchConfig = {
      exePath: exePath.trim(),
      copies,
      method,
      delay,
      name: name.trim() || `Конфиг ${new Date().toLocaleTimeString()}`,
    };

    const script = generateScript(config);
    const blob = new Blob([script], { type: 'text/plain;charset=windows-1251' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `multi_launch_${Date.now()}.bat`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Save to history
    setHistory(prev => [{
      ...config,
      id: Date.now().toString(),
      createdAt: new Date(),
    }, ...prev].slice(0, 10));

    showNotification('Скрипт успешно сгенерирован и скачан!', 'success');
  };

  const handleLoadFromHistory = (item: HistoryItem) => {
    setExePath(item.exePath);
    setCopies(item.copies);
    setMethod(item.method);
    setDelay(item.delay);
    setName(item.name);
    showNotification('Конфигурация загружена из истории', 'info');
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification(`${type}:${message}`);
    setTimeout(() => setNotification(''), 3000);
  };

  const getPreviewScript = () => {
    if (!exePath.trim()) return '// Укажите путь к .exe файлу для предпросмотра';
    return generateScript({
      exePath: exePath.trim(),
      copies,
      method,
      delay,
      name: name.trim() || 'Preview',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-2xl transform transition-all duration-300 animate-slide-in ${
          notification.startsWith('success') ? 'bg-green-600' :
          notification.startsWith('error') ? 'bg-red-600' :
          'bg-blue-600'
        }`}>
          <p className="text-sm font-medium">{notification.split(':')[1]}</p>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-gray-700/50 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">
              🚀
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Multi Launcher
              </h1>
              <p className="text-xs text-gray-400">Запуск нескольких копий приложений</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">
              Windows .bat генератор
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Info Banner */}
        <div className="mb-8 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700/30 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">💡</div>
            <div>
              <h2 className="text-lg font-semibold text-blue-300 mb-1">Как это работает?</h2>
              <p className="text-gray-300 text-sm leading-relaxed">
                Укажите путь к .exe файлу, выберите метод запуска и количество копий. 
                Приложение сгенерирует .bat скрипт, который при запуске откроет нужное количество экземпляров приложения.
                Скачайте файл и запустите его на вашем компьютере.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Path Input */}
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                <span className="flex items-center gap-2">
                  <span className="text-lg">📂</span>
                  Путь к .exe файлу
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={exePath}
                  onChange={(e) => setExePath(e.target.value)}
                  placeholder="C:\Program Files\App\application.exe"
                  className="w-full bg-gray-900/80 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-mono text-sm"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                  .exe
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Укажите полный путь к исполняемому файлу (.exe)
              </p>
            </div>

            {/* Method Selection */}
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm">
              <label className="block text-sm font-medium text-gray-300 mb-4">
                <span className="flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  Метод запуска
                </span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.entries(methods) as [string, { label: string; description: string; icon: string }][]).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setMethod(key as typeof method)}
                    className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                      method === key
                        ? 'bg-blue-600/20 border-blue-500/50 ring-1 ring-blue-500/30'
                        : 'bg-gray-900/50 border-gray-700/50 hover:border-gray-500/50 hover:bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{val.icon}</span>
                      <span className={`text-sm font-medium ${method === key ? 'text-blue-300' : 'text-gray-300'}`}>
                        {val.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{val.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm">
              <label className="block text-sm font-medium text-gray-300 mb-4">
                <span className="flex items-center gap-2">
                  <span className="text-lg">🔧</span>
                  Настройки
                </span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Количество копий</label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCopies(Math.max(2, copies - 1))}
                      className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="2"
                      max="50"
                      value={copies}
                      onChange={(e) => setCopies(Math.max(2, Math.min(50, parseInt(e.target.value) || 2)))}
                      className="w-20 bg-gray-900/80 border border-gray-600/50 rounded-lg px-3 py-2 text-center text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <button
                      onClick={() => setCopies(Math.min(50, copies + 1))}
                      className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Задержка между запусками (мс)</label>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    step="100"
                    value={delay}
                    onChange={(e) => setDelay(Math.max(0, Math.min(10000, parseInt(e.target.value) || 0)))}
                    className="w-full bg-gray-900/80 border border-gray-600/50 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-xs text-gray-400 mb-2">Название конфигурации (необязательно)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Моя конфигурация"
                  className="w-full bg-gray-900/80 border border-gray-600/50 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleGenerate}
                className="flex-1 sm:flex-none px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-medium text-sm transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 flex items-center justify-center gap-2"
              >
                <span>⬇️</span>
                Скачать .bat файл
              </button>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex-1 sm:flex-none px-8 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span>👁️</span>
                {showPreview ? 'Скрыть' : 'Показать'} скрипт
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preview */}
            {showPreview && (
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4 backdrop-blur-sm">
                <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                  <span>📄</span> Предпросмотр скрипта
                </h3>
                <pre className="bg-gray-900/80 rounded-xl p-3 text-xs text-green-400 font-mono overflow-x-auto max-h-80 overflow-y-auto border border-gray-700/30">
                  {getPreviewScript()}
                </pre>
              </div>
            )}

            {/* Quick Info */}
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                <span>ℹ️</span> О методах
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-gray-900/50 rounded-lg">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    <strong className="text-blue-400">Простой:</strong> Самый быстрый способ. Подходит для приложений, которые не блокируют повторный запуск.
                  </p>
                </div>
                <div className="p-3 bg-gray-900/50 rounded-lg">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    <strong className="text-purple-400">Sandboxie:</strong> Полная изоляция. Требует установленный Sandboxie-Plus.
                  </p>
                </div>
                <div className="p-3 bg-gray-900/50 rounded-lg">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    <strong className="text-green-400">Копирование:</strong> Создаёт копии файлов. Работает с большинством приложений.
                  </p>
                </div>
                <div className="p-3 bg-gray-900/50 rounded-lg">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    <strong className="text-yellow-400">Переменные:</strong> Уникальное окружение для каждого экземпляра. Для продвинутых пользователей.
                  </p>
                </div>
              </div>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 backdrop-blur-sm">
                <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                  <span>📋</span> История
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleLoadFromHistory(item)}
                      className="w-full text-left p-3 bg-gray-900/50 hover:bg-gray-700/50 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-300 group-hover:text-white truncate max-w-[180px]">
                          {item.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {item.copies}x
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-1 font-mono">
                        {item.exePath}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {item.createdAt.toLocaleTimeString()}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-gray-800/30 border border-gray-700/30 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <span>📝</span> Советы по использованию
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-900/30 rounded-xl">
              <h4 className="text-sm font-medium text-blue-400 mb-2">💬 Мессенджеры</h4>
              <p className="text-xs text-gray-400">
                Используйте метод "Копирование" или "Переменные окружения" для запуска нескольких аккаунтов Telegram, Discord и др.
              </p>
            </div>
            <div className="p-4 bg-gray-900/30 rounded-xl">
              <h4 className="text-sm font-medium text-purple-400 mb-2">🎮 Игры</h4>
              <p className="text-xs text-gray-400">
                Для игр лучше всего подходит "Копирование" — каждая копия будет иметь свои файлы сохранения.
              </p>
            </div>
            <div className="p-4 bg-gray-900/30 rounded-xl">
              <h4 className="text-sm font-medium text-green-400 mb-2">🛡️ Безопасность</h4>
              <p className="text-xs text-gray-400">
                Sandboxie обеспечивает максимальную изоляцию — идеально для тестирования неизвестных программ.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 mt-12 py-6">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-500">
            Multi Launcher — генератор скриптов для запуска нескольких копий приложений • Windows
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
