import React, { useState, useEffect } from 'react';
import './App.css';

// Helper function: check for a winner or draw
function calculateWinner(cells) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (
      cells[a] &&
      cells[a] === cells[b] &&
      cells[a] === cells[c]
    ) {
      return cells[a]; // "X" or "O"
    }
  }
  if (cells.every(cell => cell)) return 'draw';
  return null;
}

// Basic AI: win if possible, block opponent if needed, otherwise random/center/corner/first available
function getAIMove(cells, aiMark, humanMark) {
  // 1. Can AI win in next move?
  for (let i = 0; i < 9; i++) {
    if (!cells[i]) {
      const tryCells = cells.slice();
      tryCells[i] = aiMark;
      if (calculateWinner(tryCells) === aiMark) {
        return i;
      }
    }
  }
  // 2. Can human win next? Block them.
  for (let i = 0; i < 9; i++) {
    if (!cells[i]) {
      const tryCells = cells.slice();
      tryCells[i] = humanMark;
      if (calculateWinner(tryCells) === humanMark) {
        return i;
      }
    }
  }
  // 3. Take center
  if (!cells[4]) return 4;
  // 4. Take one of the corners
  const corners = [0, 2, 6, 8];
  for (let idx of corners) {
    if (!cells[idx]) return idx;
  }
  // 5. Take any empty cell
  for (let i = 0; i < 9; i++) {
    if (!cells[i]) return i;
  }
  // Board full - shouldn't reach here
  return null;
}

// UI components
function ModeSelect({ mode, setMode, disabled }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <span style={{ marginRight: 16, fontWeight: 500 }}>
        Mode:
      </span>
      <button
        className={`btn${mode === "pvp" ? " btn-active" : ""}`}
        onClick={() => setMode("pvp")}
        disabled={disabled}
        style={{ marginRight: 8 }}
      >
        Player vs Player
      </button>
      <button
        className={`btn${mode === "ai" ? " btn-active" : ""}`}
        onClick={() => setMode("ai")}
        disabled={disabled}
      >
        Player vs AI
      </button>
    </div>
  );
}
function Status({mode, winner, next, isAITurn, aiMark}) {
  if (winner === "draw") {
    return <div className="status">It's a draw! 🤝</div>;
  }
  if (winner === "X" || winner === "O") {
    return (
      <div className="status">
        {mode === "ai" && winner === aiMark
          ? "AI wins! 🤖"
          : `${winner === "X" ? "Player 1" : (mode === "ai" ? "You" : "Player 2")} wins! 🎉`}
      </div>
    );
  }
  if (mode === "ai" && isAITurn) {
    return <div className="status">AI is thinking... 🤖</div>;
  }
  if (mode === "ai") {
    return (
      <div className="status">
        {next === aiMark ? "AI's Turn (O)" : "Your Turn (X)"}
      </div>
    );
  }
  return <div className="status">{next === "X" ? "Player 1's Turn (X)" : "Player 2's Turn (O)"}</div>;
}
function Board({cells, onClick, disabled}) {
  return (
    <div className="board" style={{ margin: "0 auto" }}>
      {cells.map((cell, idx) => (
        <button
          className="cell"
          key={idx}
          onClick={() => onClick(idx)}
          disabled={!!cell || disabled}
          aria-label={`Cell ${idx+1}: ${cell ? cell : "empty"}`}
        >
          {cell}
        </button>
      ))}
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState('light');
  const [mode, setMode] = useState("pvp"); // 'pvp' | 'ai'
  const [cells, setCells] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);

  // AI Info
  const aiMark = "O";
  const humanMark = "X";
  const isAITurn = mode === "ai" && !winner && !isXNext;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    setCells(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
  }, [mode]);

  // Handle winner
  useEffect(() => {
    const res = calculateWinner(cells);
    setWinner(res);
  }, [cells]);

  // Let AI move when it's AI's turn (only after human moved)
  useEffect(() => {
    if (isAITurn && !winner) {
      const timer = setTimeout(() => {
        // AI plays as "O"
        const idx = getAIMove(cells, aiMark, humanMark);
        if (idx !== null) {
          handleMove(idx);
        }
      }, 450 + Math.random() * 250); // add some delay to be natural
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line
  }, [isAITurn, cells, winner]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // PUBLIC_INTERFACE
  const handleMove = (idx) => {
    if (winner || cells[idx]) return;
    setCells(prev => {
      const newCells = prev.slice();
      newCells[idx] = isXNext ? "X" : "O";
      return newCells;
    });
    setIsXNext(prev => !prev);
  };

  // PUBLIC_INTERFACE
  const handleCellClick = (idx) => {
    if (mode === "ai") {
      // Only allow X (you) to play if not finished and not AI's turn
      if (!isXNext || winner) return;
    }
    handleMove(idx);
  };

  // PUBLIC_INTERFACE
  const handleRestart = () => {
    setCells(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
  };

  // PUBLIC_INTERFACE
  const handleModeChange = (nextMode) => {
    setMode(nextMode);
  };

  // UI Styles
  // Add custom board/cell minimal style & accent button for current theme
  // (Styles are mostly in App.css, but we override/add below)
  // Player vs AI: X = Player, O = AI

  return (
    <div className="App">
      <header className="App-header" style={{paddingTop: 44, minHeight: "100vh"}}>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
        <h1 style={{ marginBottom: 8, color: "var(--text-primary)" }}>Tic Tac Toe</h1>
        <div className="subtitle" style={{ marginBottom: 8, color: "var(--text-secondary)" }}>
          {mode === "ai"
            ? "Player vs AI"
            : "Player vs Player"}
        </div>
        <ModeSelect mode={mode} setMode={handleModeChange} disabled={winner !== null || cells.some(c => c)} />
        <Status mode={mode} winner={winner} next={isXNext ? "X" : "O"} isAITurn={isAITurn} aiMark={aiMark} />
        <Board cells={cells} onClick={handleCellClick} disabled={!!winner || (mode === "ai" && !isXNext)} />
        <button className="btn btn-large" onClick={handleRestart} style={{ marginTop: 24, marginBottom: 4 }}>
          {winner || cells.every(Boolean) ? "Restart Game" : "Reset"}
        </button>
        <div style={{marginTop: 16, fontSize: 13, color: "var(--text-secondary)", opacity: 0.76}}>
          {mode === "ai" 
            ? "You play as X. AI plays as O." 
            : "Player 1 = X, Player 2 = O."}
        </div>
        <div style={{marginTop: 36, fontSize:12, color:"var(--border-color)"}}>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
            style={{fontWeight: 400}}
          >
            Learn React
          </a>
        </div>
      </header>
      <style>
      {`
      .board {
        display: grid;
        grid-template-columns: repeat(3, 72px);
        grid-template-rows: repeat(3, 72px);
        gap: 8px;
        margin: 24px auto 8px auto;
        width: min-content;
      }
      @media (max-width: 600px) {
        .board { grid-template-columns: repeat(3, 55px); grid-template-rows: repeat(3, 55px);}
      }
      .cell {
        font-size: 2.3rem;
        font-weight: 700;
        background: var(--bg-primary);
        color: var(--text-primary);
        border: 2.5px solid var(--border-color);
        border-radius: 10px;
        cursor: pointer;
        outline: none;
        height: 72px;
        width: 72px;
        transition: background 0.2s, border 0.2s, color 0.2s;
        box-shadow: 0 2px 3px rgba(0,0,0,0.04);
      }
      @media (max-width: 600px) {
        .cell { height: 55px; width: 55px;}
      }
      .cell:disabled {
        opacity: 0.6;
        cursor: default;
        background: var(--bg-secondary);
      }
      .btn {
        background: var(--button-bg);
        color: var(--button-text);
        border: none;
        border-radius: 8px;
        padding: 7.5px 15px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.25s;
        margin-top: 2px;
        margin-bottom: 2px;
      }
      .btn.btn-active, .btn:hover:not(:disabled) {
        background: var(--text-secondary);
        color: var(--text-primary);
      }
      .btn-large {
        font-size: 1.1rem;
        padding: 11px 28px;
        margin-top: 14px;
      }
      .status {
        margin-bottom: 20px;
        font-size: 1.18rem;
        font-weight: 500;
        color: var(--text-primary);
        min-height: 24px;
      }
      `}
      </style>
    </div>
  );
}

export default App;
