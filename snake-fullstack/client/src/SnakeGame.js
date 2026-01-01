import React, { useState, useEffect, useCallback, useRef } from 'react';

const SnakeGame = () => {
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false); // Новий стан для очікування старту
  const [score, setScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [speed, setSpeed] = useState(130);

  const directionRef = useRef({ x: 0, y: -1 });
  const lastProcessedDir = useRef({ x: 0, y: -1 });

  const fetchBoard = async () => {
    try {
      const res = await fetch('http://localhost:5000/leaderboard');
      setLeaderboard(await res.json());
    } catch (e) { console.error("Помилка завантаження рейтингу", e); }
  };

  useEffect(() => {
    fetchBoard();
  }, []);

  useEffect(() => {
    if (gameOver && score > 0) {
      fetch('http://localhost:5000/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score }),
        credentials: 'include',
      }).then(fetchBoard);
    }
  }, [gameOver]);

  const moveSnake = useCallback(() => {
    // Змійка не рухається, якщо гра закінчена АБО ще не почалася
    if (gameOver || !gameStarted) return;

    let nextX = snake[0].x + directionRef.current.x;
    let nextY = snake[0].y + directionRef.current.y;

    nextX = (nextX + 20) % 20;
    nextY = (nextY + 20) % 20;

    const head = { x: nextX, y: nextY };

    if (snake.some((segment) => segment.x === head.x && segment.y === head.y)) {
      setGameOver(true);
      return;
    }

    const newSnake = [head, ...snake];
    lastProcessedDir.current = directionRef.current;

    if (head.x === food.x && head.y === food.y) {
      setScore(s => s + 1);
      setFood({ x: Math.floor(Math.random() * 20), y: Math.floor(Math.random() * 20) });
    } else {
      newSnake.pop();
    }
    setSnake(newSnake);
  }, [snake, food, gameOver, gameStarted]);

  useEffect(() => {
    const timer = setInterval(moveSnake, speed);
    return () => clearInterval(timer);
  }, [moveSnake, speed]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Логіка для Пробілу
      if (e.code === 'Space') {
        if (gameOver) {
          // Якщо гра закінчена — скидаємо все і стартуємо
          setSnake([{ x: 10, y: 10 }]);
          setScore(0);
          setGameOver(false);
          setGameStarted(true);
          directionRef.current = { x: 0, y: -1 };
        } else if (!gameStarted) {
          // Якщо гра ще не почалася — просто стартуємо
          setGameStarted(true);
        }
        return;
      }

      const code = e.code;
      const newDir = { ...directionRef.current };

      if ((code === 'ArrowUp' || code === 'KeyW') && lastProcessedDir.current.y === 0) {
        newDir.x = 0; newDir.y = -1;
      } else if ((code === 'ArrowDown' || code === 'KeyS') && lastProcessedDir.current.y === 0) {
        newDir.x = 0; newDir.y = 1;
      } else if ((code === 'ArrowLeft' || code === 'KeyA') && lastProcessedDir.current.x === 0) {
        newDir.x = -1; newDir.y = 0;
      } else if ((code === 'ArrowRight' || code === 'KeyD') && lastProcessedDir.current.x === 0) {
        newDir.x = 1; newDir.y = 0;
      }
      directionRef.current = newDir;
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, gameStarted]);

  return (
    <div style={{ display: 'flex', gap: '40px', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 style={{ margin: 0 }}>Score: <span style={{ color: '#22c55e' }}>{score}</span></h2>
          <div style={{ width: '100px' }}>
            <input type="range" min="50" max="250" step="10" value={speed} 
              onChange={(e) => setSpeed(Number(e.target.value))} className="speed-slider" style={{ direction: 'rtl' }} />
          </div>
        </div>

        {/* Повідомлення для гравця */}
        <div style={{ height: '30px', marginBottom: '10px' }}>
          {gameOver ? (
            <h3 className="game-over-text" style={{ margin: 0 }}>КІНЕЦЬ ГРИ! [Space для рестарту]</h3>
          ) : !gameStarted ? (
            <h3 style={{ margin: 0, color: '#16a34a' }}>ГОТОВІ? [Натисніть Пробіл]</h3>
          ) : null}
        </div>
        
        <div className="game-grid">
          {Array.from({ length: 400 }).map((_, i) => {
            const x = i % 20, y = Math.floor(i / 20);
            const isHead = snake[0].x === x && snake[0].y === y;
            const isBody = snake.some(s => s.x === x && s.y === y);
            const isFood = food.x === x && food.y === y;
            const showBow = isHead && snake.length >= 2;

            let cellClass = "snake-cell";
            if (isHead) cellClass += " neon-head";
            else if (isBody) cellClass += " neon-body";
            else if (isFood) cellClass += " neon-food";

            return (
              <div key={i} className={cellClass}>
                {showBow && <span style={{ fontSize: '14px', zIndex: 10 }}>🎀</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-card" style={{ minWidth: '220px' }}>
        <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginTop: 0 }}>🏆 ТОП-10</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {leaderboard.map((entry, i) => (
              <tr key={i} style={{ background: i === 0 ? 'rgba(34, 197, 94, 0.05)' : 'transparent' }}>
                <td style={{ padding: '8px 5px', fontSize: '14px' }}>{i + 1}. {entry.username}</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#16a34a' }}>{entry.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="controls-hint">
        <div>🎮 Керування: <b>W A S D</b> або <b>Стрілки</b></div>
        <div>🔄 Старт/Рестарт: <b>Space</b> (Пробіл)</div>
        <div style={{marginTop: '5px', fontSize: '11px'}}>✨ Режим: <b>Без кордонів</b></div>
      </div>
    </div>
  );
};

export default SnakeGame;