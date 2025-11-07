import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

interface TriviaQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
}

interface Player {
  name: string;
  score: number;
}

interface TriviaGameProps {
  mode: 'solo' | 'multiplayer';
}

// Built-in trivia questions for solo mode
const SOLO_QUESTIONS: TriviaQuestion[] = [
  {
    id: 1,
    question: 'מה זה React?',
    options: ['Framework', 'Library', 'Language', 'Database'],
    correctAnswer: 1,
    category: 'Frontend',
  },
  {
    id: 2,
    question: 'מה זה TypeScript?',
    options: ['Superset של JavaScript', 'Framework', 'Database', 'OS'],
    correctAnswer: 0,
    category: 'Programming',
  },
  {
    id: 3,
    question: 'מה זה Astro?',
    options: ['Framework', 'Library', 'Build Tool', 'All of the above'],
    correctAnswer: 3,
    category: 'Web Development',
  },
  {
    id: 4,
    question: 'מהו היתרון העיקרי של מיקרו-שירותים על פני מונוליט?',
    options: ['קל יותר לפתח', 'סקיילביליות ועצמאות', 'פחות קוד', 'יותר מהיר תמיד'],
    correctAnswer: 1,
    category: 'Architecture',
  },
  {
    id: 5,
    question: 'מה תפקידו של Kafka במערכות מבוזרות?',
    options: ['Database', 'Message Broker/Streaming', 'Load Balancer', 'Cache'],
    correctAnswer: 1,
    category: 'Backend',
  },
  {
    id: 6,
    question: 'מה זה Docker?',
    options: ['Programming Language', 'Containerization Platform', 'Cloud Provider', 'Database'],
    correctAnswer: 1,
    category: 'DevOps',
  },
  {
    id: 7,
    question: 'מהו Kubernetes?',
    options: ['Container Runtime', 'Orchestration Platform', 'CI/CD Tool', 'Monitoring Tool'],
    correctAnswer: 1,
    category: 'DevOps',
  },
  {
    id: 8,
    question: 'מה זה Redis?',
    options: ['Relational Database', 'In-Memory Data Store', 'File System', 'API Gateway'],
    correctAnswer: 1,
    category: 'Backend',
  },
  {
    id: 9,
    question: 'מהו היתרון של CI/CD?',
    options: ['אוטומציה של דיפלוי', 'פחות באגים', 'פיתוח מהיר יותר', 'כל התשובות נכונות'],
    correctAnswer: 3,
    category: 'DevOps',
  },
  {
    id: 10,
    question: 'מה זה REST API?',
    options: ['Protocol', 'Architectural Style', 'Database', 'Framework'],
    correctAnswer: 1,
    category: 'Backend',
  },
];

export default function TriviaGame({ mode }: TriviaGameProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<TriviaQuestion | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [leaderboard, setLeaderboard] = useState<Player[]>([]);
  const [gameEnded, setGameEnded] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [soloQuestions, setSoloQuestions] = useState<TriviaQuestion[]>([]);
  const [soloQuestionIndex, setSoloQuestionIndex] = useState(0);
  const [hasJoined, setHasJoined] = useState(false);

  // Reset game state when mode changes (but not on initial mount)
  const prevModeRef = useRef<'solo' | 'multiplayer' | null>(null);
  useEffect(() => {
    if (prevModeRef.current !== null && prevModeRef.current !== mode) {
      // Only reset if mode actually changed (not on initial mount)
      setGameStarted(false);
      setCurrentQuestion(null);
      setQuestionNumber(0);
      setTotalQuestions(0);
      setSelectedAnswer(null);
      setScore(0);
      setPlayers([]);
      setLeaderboard([]);
      setGameEnded(false);
      setTimeLeft(15);
      setSoloQuestions([]);
      setSoloQuestionIndex(0);
      setPlayerName('');
    }
    prevModeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    if (mode === 'multiplayer') {
      const wsUrl = import.meta.env.PUBLIC_WS_URL || 'http://localhost:3001';
      console.log('Connecting to WebSocket server:', wsUrl);
      const newSocket = io(wsUrl, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 5000,
      });
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Connected to WebSocket server');
        setConnected(true);
        // Request rooms info when connected
        newSocket.emit('game:rooms');
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Disconnected from WebSocket server:', reason);
        setConnected(false);
        setHasJoined(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setConnected(false);
      });

      newSocket.on('game:rooms', (data: { rooms: Array<{ id: string; players: Player[]; playerCount: number }> }) => {
        // If there are waiting rooms, show players from the first room
        // This updates in real-time when players join/leave
        if (data.rooms.length > 0 && data.rooms[0].players.length > 0) {
          console.log('Rooms updated, showing players:', data.rooms[0].players);
          setPlayers(data.rooms[0].players);
        } else if (data.rooms.length === 0) {
          // No waiting rooms, clear players list
          setPlayers([]);
        }
      });

      newSocket.on('game:players', (data: { players: Player[] }) => {
        console.log('Players updated (from game:players event):', data.players);
        setPlayers(data.players);
      });

      newSocket.on('game:start', (data: {
        question: TriviaQuestion;
        questionNumber: number;
        totalQuestions: number;
      }) => {
        setGameStarted(true);
        setCurrentQuestion(data.question);
        setQuestionNumber(data.questionNumber);
        setTotalQuestions(data.totalQuestions);
        setTimeLeft(15);
      });

      newSocket.on('game:question', (data: {
        question: TriviaQuestion;
        questionNumber: number;
        totalQuestions: number;
      }) => {
        setCurrentQuestion(data.question);
        setQuestionNumber(data.questionNumber);
        setSelectedAnswer(null);
        setTimeLeft(15);
      });

      newSocket.on('game:result', (data: { correct: boolean; score: number }) => {
        setScore(data.score);
      });

      newSocket.on('game:scores', (data: { players: Player[] }) => {
        setPlayers(data.players);
      });

      newSocket.on('game:end', (data: { leaderboard: Player[] }) => {
        setGameEnded(true);
        setLeaderboard(data.leaderboard);
      });

      return () => {
        newSocket.close();
      };
    }
  }, [mode]);

  useEffect(() => {
    if (gameStarted && timeLeft > 0 && mode === 'solo' && !selectedAnswer && currentQuestion) {
      const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && selectedAnswer === null && currentQuestion && mode === 'solo' && gameStarted) {
      // Auto-submit wrong answer if time runs out
      const answerIndex = -1;
      setSelectedAnswer(answerIndex);
      if (mode === 'solo') {
        const isCorrect = false; // Time ran out
        setScore((prevScore) => {
          const newScore = prevScore;
          setTimeout(() => {
            setSoloQuestionIndex((currentIndex) => {
              const nextIndex = currentIndex + 1;
              if (nextIndex < soloQuestions.length) {
                setCurrentQuestion(soloQuestions[nextIndex]);
                setQuestionNumber(nextIndex + 1);
                setSelectedAnswer(null);
                setTimeLeft(15);
                return nextIndex;
              } else {
                setGameEnded(true);
                setLeaderboard([{ name: 'אתה', score: newScore }]);
                return currentIndex;
              }
            });
          }, 2500);
          return newScore;
        });
      }
    }
  }, [timeLeft, gameStarted, selectedAnswer, currentQuestion, mode, soloQuestions]);

  const handleJoin = () => {
    console.log('handleJoin called', { mode, soloQuestionsCount: SOLO_QUESTIONS.length, hasJoined });
    
    if (mode === 'multiplayer') {
      if (hasJoined) {
        console.warn('Already joined, ignoring');
        return;
      }
      if (socket && playerName.trim()) {
        setHasJoined(true);
        socket.emit('game:join', { name: playerName.trim() });
      } else {
        console.warn('Cannot join multiplayer:', { hasSocket: !!socket, hasName: !!playerName.trim() });
      }
    } else if (mode === 'solo') {
      // Solo mode - shuffle questions and start immediately
      if (SOLO_QUESTIONS.length === 0) {
        console.error('No questions available');
        alert('אין שאלות זמינות. אנא רענן את הדף.');
        return;
      }
      
      console.log('Starting solo game with', SOLO_QUESTIONS.length, 'questions');
      const shuffled = [...SOLO_QUESTIONS].sort(() => Math.random() - 0.5);
      
      // Reset all state first
      setGameEnded(false);
      setScore(0);
      setSelectedAnswer(null);
      setSoloQuestionIndex(0);
      
      // Then set questions and start
      setSoloQuestions(shuffled);
      setCurrentQuestion(shuffled[0]);
      setQuestionNumber(1);
      setTotalQuestions(shuffled.length);
      setTimeLeft(15);
      setGameStarted(true);
      
      console.log('Game started, first question:', shuffled[0]);
    }
  };

  const handleAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null || !currentQuestion) return;

    setSelectedAnswer(answerIndex);

    if (mode === 'multiplayer' && socket) {
      socket.emit('game:answer', { answer: answerIndex });
    } else {
      // Solo mode logic
      const isCorrect = answerIndex === currentQuestion.correctAnswer;
      
      // Update score using functional update to ensure we have the latest score
      setScore((prevScore) => {
        const newScore = isCorrect ? prevScore + 10 : prevScore;
        
        // Move to next question after 2.5 seconds
        setTimeout(() => {
          setSoloQuestionIndex((currentIndex) => {
            const nextIndex = currentIndex + 1;
            if (nextIndex < soloQuestions.length) {
              setCurrentQuestion(soloQuestions[nextIndex]);
              setQuestionNumber(nextIndex + 1);
              setSelectedAnswer(null);
              setTimeLeft(15);
              return nextIndex;
            } else {
              // Game ended
              setGameEnded(true);
              setLeaderboard([{ name: 'אתה', score: newScore }]);
              return currentIndex;
            }
          });
        }, 2500);
        
        return newScore;
      });
    }
  };

  if (gameEnded) {
    return (
      <div className="card max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary-500 to-brand-500 flex items-center justify-center">
            <span className="text-4xl">🎉</span>
          </div>
          <h2 className="text-3xl font-bold mb-2 text-white">המשחק נגמר!</h2>
          <p className="text-gray-300">כל הכבוד על ההשתתפות</p>
        </div>
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">תוצאות:</h3>
          <div className="space-y-3">
            {leaderboard.map((player, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  idx === 0
                    ? 'bg-gradient-to-r from-primary-500/20 to-brand-500/20 border-primary-400/50 shadow-lg shadow-primary-500/20'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold ${
                    idx === 0 ? 'text-primary-300' : 'text-gray-400'
                  }`}>
                    #{idx + 1}
                  </span>
                  <span className="font-medium text-white">
                    {player.name}
                  </span>
                </div>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-brand-300 font-bold text-lg">
                  {player.score} נקודות
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary w-full mt-6"
          >
            משחק חדש
          </button>
        </div>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="card max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-white">הצטרף למשחק</h2>
        {mode === 'multiplayer' && (
          <div className="mb-4">
            <label htmlFor="player-name" className="block mb-2 font-medium text-gray-200">
              שם השחקן:
            </label>
            <input
              id="player-name"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="הכנס את שמך"
              className="w-full px-4 py-3 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500/50 transition-all"
              disabled={!connected}
            />
            {!connected && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2 text-sm text-yellow-400">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                  ממתין לחיבור לשרת...
                </div>
                <div className="text-xs text-gray-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <p className="font-medium text-yellow-300 mb-1">שרת WebSocket לא פעיל</p>
                  <p>כדי להריץ את השרת, פתח טרמינל נוסף והרץ:</p>
                  <code className="block mt-2 bg-neutral-900 p-2 rounded text-primary-300">
                    cd server && npm run dev
                  </code>
                </div>
              </div>
            )}
            {connected && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-400">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                מחובר לשרת
              </div>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            console.log('Button clicked, mode:', mode);
            handleJoin();
          }}
          disabled={mode === 'multiplayer' && (!connected || !playerName.trim() || hasJoined)}
          className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mode === 'multiplayer' 
            ? (hasJoined ? 'הצטרפת למשחק' : 'הצטרף למשחק')
            : 'התחל משחק סולו'}
        </button>
        {mode === 'solo' && (
          <p className="text-sm text-gray-400 text-center mt-4">
            לחץ על הכפתור כדי להתחיל משחק סולו עם 10 שאלות
          </p>
        )}
        {mode === 'multiplayer' && (
          <div className="mt-6 glass-panel p-4">
            <p className="text-sm font-medium mb-3 text-white">
              שחקנים בחדר: {players.length > 0 ? `${players.length}/4` : '0/4'}
            </p>
            {players.length > 0 ? (
              <ul className="space-y-2">
                {players.map((player, idx) => (
                  <li key={idx} className="flex items-center justify-between text-sm text-gray-200 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse"></span>
                      <span>{player.name}</span>
                    </div>
                    <span className="text-primary-300 font-medium">{player.score} נקודות</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 text-center py-2">
                {hasJoined 
                  ? 'ממתין לשחקנים נוספים...'
                  : 'עדיין אין שחקנים בחדר. לחץ על "הצטרף למשחק" כדי להתחיל.'}
              </p>
            )}
            {hasJoined && players.length >= 2 && players.length < 4 && (
              <p className="text-xs text-primary-300 mt-3 text-center animate-pulse">
                המשחק יתחיל אוטומטית בעוד כמה שניות...
              </p>
            )}
            {hasJoined && players.length === 1 && (
              <p className="text-xs text-yellow-300 mt-3 text-center">
                ממתין לשחקן נוסף כדי להתחיל...
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">שאלה {questionNumber} מתוך {totalQuestions}</h2>
          <p className="text-sm text-primary-200 mt-1 px-3 py-1 rounded-full bg-primary-500/20 border border-primary-500/30 inline-block">
            {currentQuestion?.category}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-brand-300">
            {score} נקודות
          </div>
          <div className="text-sm text-gray-300 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${timeLeft <= 5 ? 'bg-red-500 animate-pulse' : timeLeft <= 10 ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
            זמן: {timeLeft} שניות
          </div>
        </div>
      </div>

      {currentQuestion && (
        <>
          <h3 className="text-xl font-semibold mb-6 text-white">{currentQuestion.question}</h3>
          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrect = idx === currentQuestion.correctAnswer;
              const showResult = selectedAnswer !== null;

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={selectedAnswer !== null}
                  className={`
                    w-full p-4 rounded-xl text-right transition-all duration-300 font-medium
                    ${isSelected && showResult
                      ? isCorrect
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/50 ring-2 ring-green-400'
                        : 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/50 ring-2 ring-red-400'
                      : showResult && isCorrect
                      ? 'bg-gradient-to-r from-green-500/20 to-emerald-600/20 text-green-100 border-2 border-green-500/50'
                      : 'bg-white/10 border border-white/20 text-gray-100 hover:bg-white/15 hover:border-primary-400/50 hover:text-white'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {showResult && isCorrect && (
                      <span className="text-2xl">✓</span>
                    )}
                    {isSelected && showResult && !isCorrect && (
                      <span className="text-2xl">✗</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {mode === 'multiplayer' && players.length > 1 && (
        <div className="mt-6 pt-6 border-t border-white/10">
          <h4 className="font-semibold mb-3 text-white">ניקוד שחקנים:</h4>
          <div className="space-y-2">
            {players
              .sort((a, b) => b.score - a.score)
              .map((player, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                    idx === 0
                      ? 'bg-primary-500/20 border border-primary-400/30'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${
                      idx === 0 ? 'text-primary-300' : 'text-gray-400'
                    }`}>
                      #{idx + 1}
                    </span>
                    <span className="text-gray-200">{player.name}</span>
                  </div>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-brand-300 font-bold">
                    {player.score} נקודות
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

