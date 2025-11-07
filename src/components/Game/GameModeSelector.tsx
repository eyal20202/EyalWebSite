import { useState } from 'react';
import TriviaGame from './TriviaGame';

type GameType = 'trivia';
type GameMode = 'solo' | 'multiplayer';

export default function GameModeSelector() {
  const [gameType, setGameType] = useState<GameType>('trivia');
  const [mode, setMode] = useState<GameMode>('solo');

  return (
    <div>
      {/* Game Type Selector */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-white">בחר משחק</h2>
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setGameType('trivia')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              gameType === 'trivia'
                ? 'bg-gradient-to-r from-primary-500 to-brand-500 text-white shadow-lg shadow-primary-500/50'
                : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
            }`}
          >
            🎯 טריוויה טכנולוגית
          </button>
        </div>
      </div>

      {/* Game Mode Selector */}
      {gameType === 'trivia' && (
        <>
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-white">בחר מצב משחק</h3>
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => setMode('solo')}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  mode === 'solo'
                    ? 'bg-gradient-to-r from-primary-500 to-brand-500 text-white shadow-lg shadow-primary-500/50'
                    : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                🤖 סולו
              </button>
              <button
                onClick={() => setMode('multiplayer')}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  mode === 'multiplayer'
                    ? 'bg-gradient-to-r from-primary-500 to-brand-500 text-white shadow-lg shadow-primary-500/50'
                    : 'bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                👥 מרובה משתתפים
              </button>
            </div>
          </div>
          
          {/* Explanation cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="glass-panel p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-lg font-semibold text-white">מצב סולו (נגד AI)</h3>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                משחק עצמאי עם 10 שאלות על טכנולוגיות, ארכיטקטורות ו-best practices. 
                כל תשובה נכונה שווה 10 נקודות. המשחק מתחיל מיד ללא צורך בשרת.
              </p>
              <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                <li>10 שאלות מגוונות</li>
                <li>15 שניות לכל שאלה</li>
                <li>תוצאות מיידיות</li>
                <li>עובד ללא חיבור לשרת</li>
              </ul>
            </div>
            
            <div className="glass-panel p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
                <h3 className="text-lg font-semibold text-white">מרובה משתתפים</h3>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                משחק בזמן אמת עם שחקנים אחרים. מתחבר לשרת WebSocket, מחפש שחקנים נוספים, 
                ומתחיל אוטומטית כשיש 2-4 שחקנים בחדר.
              </p>
              <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                <li>משחק בזמן אמת</li>
                <li>2-4 שחקנים בחדר</li>
                <li>Leaderboard דינמי</li>
                <li>דורש שרת WebSocket פעיל</li>
              </ul>
            </div>
          </div>
        </>
      )}

      {/* Render selected game */}
      {gameType === 'trivia' && <TriviaGame mode={mode} />}
    </div>
  );
}

