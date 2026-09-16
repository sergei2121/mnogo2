import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

export default function launchRoutes(db) {
  const router = express.Router();

  // Generate script
  router.post('/generate', authenticateToken, (req, res) => {
    const { exe_path, copies, method, delay } = req.body;

    if (!exe_path) {
      return res.status(400).json({ error: 'exe_path required' });
    }

    const script = generateScript({
      exePath: exe_path,
      copies: copies || 2,
      method: method || 'simple',
      delay: delay || 500,
    });

    // Save to history
    db.prepare(`
      INSERT INTO launch_history (user_id, exe_path, copies, method, status)
      VALUES (?, ?, ?, ?, 'generated')
    `).run(req.user.id, exe_path, copies || 2, method || 'simple');

    res.json({ script });
  });

  // Get launch history
  router.get('/history', authenticateToken, (req, res) => {
    let history;
    if (req.user.role === 'admin') {
      history = db.prepare(`
        SELECT lh.*, u.username 
        FROM launch_history lh 
        LEFT JOIN users u ON lh.user_id = u.id 
        ORDER BY lh.created_at DESC 
        LIMIT 50
      `).all();
    } else {
      history = db.prepare(`
        SELECT lh.*, u.username 
        FROM launch_history lh 
        LEFT JOIN users u ON lh.user_id = u.id 
        WHERE lh.user_id = ?
        ORDER BY lh.created_at DESC 
        LIMIT 50
      `).all(req.user.id);
    }
    res.json(history);
  });

  return router;
}

function generateScript({ exePath, copies, method, delay }) {
  const normalizedPath = exePath.replace(/\//g, '\\');
  const delaySec = Math.max(1, Math.round(delay / 1000));

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
    timeout /t ${delaySec} /nobreak >nul
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
    timeout /t ${delaySec} /nobreak >nul
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
    copy "${normalizedPath}" "%TEMP_BASE%\\copy_%%i\\" >nul
    start "" "%TEMP_BASE%\\copy_%%i\\%%~nx${normalizedPath}"
    timeout /t ${delaySec} /nobreak >nul
)

echo.
echo ============================================
echo   Все ${copies} копий запущены!
echo   Временные файлы: %TEMP_BASE%
echo ============================================
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
    timeout /t ${delaySec} /nobreak >nul
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
}
