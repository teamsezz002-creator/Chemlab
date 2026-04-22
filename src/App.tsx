import { useState, useRef, useEffect } from 'react';
import { METALS } from './constants';
import { SCENARIOS } from './gameData';
import { DndContext } from '@dnd-kit/core';
import { 
  FlaskConical, Circle, Box, Sparkles, Zap, Atom, 
  Trophy, Star, Clock, Target, ArrowRight, RotateCcw,
  CheckCircle2, AlertCircle, Menu, LayoutDashboard, Play,
  Lock, Beaker, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Metal, Scenario, UserStats } from './types';

// --- Sub-components ---

const TapIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg width="160" height="130" viewBox="0 0 160 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="filter drop-shadow-lg overflow-visible">
    <defs>
      <linearGradient id="metal" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="20%" stopColor="#94a3b8" />
        <stop offset="50%" stopColor="#cbd5e1" />
        <stop offset="80%" stopColor="#64748b" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
      <linearGradient id="pipeShine" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="white" stopOpacity="0.5" />
        <stop offset="50%" stopColor="white" stopOpacity="0" />
        <stop offset="100%" stopColor="black" stopOpacity="0.2" />
      </linearGradient>
    </defs>

    {/* Main Pipe with Bended Spout */}
    <path 
      d="M0 50 H80 Q110 50 110 80 V105" 
      stroke="url(#metal)" 
      strokeWidth="28" 
      strokeLinecap="butt" 
      fill="none" 
    />
    
    {/* Shine on the pipe */}
    <path 
      d="M0 44 H80 Q104 44 104 80 V105" 
      stroke="url(#pipeShine)" 
      strokeWidth="4" 
      strokeLinecap="round" 
      fill="none" 
      className="opacity-50"
    />

    {/* Flared Spout End */}
    <path 
      d="M93 105 H127 Q127 120 135 130 H85 Q93 120 93 105Z" 
      fill="url(#metal)" 
    />

    {/* Valve Control Block with LED Indicator */}
    <rect x="65" y="35" width="40" height="18" rx="4" fill="url(#metal)" stroke="#475569" strokeWidth="1.5" />
    <motion.rect 
      x="70" y="40" width="30" height="4" rx="2" 
      animate={{ fill: isOpen ? '#3b82f6' : '#1e293b' }}
      opacity="0.8" 
    />
  </svg>
);

const MetalIcon = ({ type, color, symbol, size = 'big' }: { type: string, color: string, symbol: string, size?: 'big' | 'small' }) => {
  const isBig = size === 'big';
  const baseClass = `${color} text-white ${isBig ? 'p-5 rounded-2xl' : 'p-2.5 rounded-xl'} shadow-xl border border-white/20 relative group transition-all`;
  const iconSize = isBig ? 32 : 18;
  
  const getIcon = () => {
    const s = iconSize;
    switch (type) {
      case 'irregular': // Jagged chunk (Sodium)
        return (
          <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 10l4-6 10 2 2 10-8 4-8-10z" />
          </svg>
        );
      case 'granular': // Cluster of pebbles (Calcium)
        return (
          <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
            <circle cx="6" cy="8" r="3" /><circle cx="14" cy="6" r="3.5" /><circle cx="18" cy="14" r="3" />
            <circle cx="8" cy="18" r="3.5" /><circle cx="14" cy="18" r="2.5" />
          </svg>
        );
      case 'ribbon': // Curved strip (Magnesium)
        return (
          <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M4 4c10 0 0 16 16 16" />
            <path d="M8 4c10 0 0 16 16 16" opacity="0.4" />
          </svg>
        );
      case 'block': // Solid cuboid (Iron)
        return (
          <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
            <rect x="4" y="4" width="16" height="16" rx="1" />
            <path d="M4 4l4 4h12l-4-4H4z" fill="white" fillOpacity="0.2" />
            <path d="M20 4l-4 4v12l4-4V4z" fill="black" fillOpacity="0.2" />
          </svg>
        );
      case 'wire': // Coiled wire (Copper)
        return (
          <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M4 12c0-8 16-8 16 0s-16 8-16 0" />
            <path d="M4 8c0-8 16-8 16 0" opacity="0.3" />
            <path d="M4 16s16 8 16 0" opacity="0.3" />
          </svg>
        );
      default:
        return <Circle size={iconSize} />;
    }
  };

  return (
    <div className={baseClass}>
      <div className="flex flex-col items-center gap-1">
        {getIcon()}
        <span className={`${isBig ? 'text-lg' : 'text-[10px]'} font-black tracking-tighter`}>{symbol}</span>
      </div>
      {/* Glossy overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent rounded-inherit pointer-events-none" />
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [gameState, setGameState] = useState<'MENU' | 'DASHBOARD' | 'INTRO' | 'PLAYING' | 'QUIZ' | 'RECAP'>('MENU');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [stats, setStats] = useState<UserStats>({
    score: 0,
    level: 1,
    completedLevels: [],
    highestStreak: 0
  });

  const [waterLevel, setWaterLevel] = useState(0);
  const [activeMetal, setActiveMetal] = useState<Metal | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [beakerDamage, setBeakerDamage] = useState<'none' | 'cracked' | 'broken'>('none');
  const [isValveOpen, setIsValveOpen] = useState(false);
  const [isWaterFlowing, setIsWaterFlowing] = useState(false);
  const [timer, setTimer] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const fillInterval = useRef<NodeJS.Timeout | null>(null);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  const scenario = SCENARIOS[currentLevel];

  // Game timer
  useEffect(() => {
    if (gameState === 'PLAYING') {
      timerInterval.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      if (timerInterval.current) clearInterval(timerInterval.current);
    }
    return () => { if (timerInterval.current) clearInterval(timerInterval.current); };
  }, [gameState]);

  const startLevel = (index: number) => {
    setCurrentLevel(index);
    setWaterLevel(0);
    setActiveMetal(null);
    setIsSimulating(false);
    setBeakerDamage('none');
    setTimer(0);
    setGameState('INTRO');
  };

  const toggleValve = () => {
    if (isValveOpen) {
      // Close sequence
      setIsWaterFlowing(false);
      if (fillInterval.current) clearInterval(fillInterval.current);
      setTimeout(() => {
        setIsValveOpen(false);
      }, 150); // Clean mechanical shutoff delay
      checkObjectives();
    } else {
      if (waterLevel >= 100) return;
      
      // Open sequence
      setIsValveOpen(true);
      
      // Water starts shortly after the handle begins turning
      setTimeout(() => {
        if (waterLevel >= 100) return;
        setIsWaterFlowing(true);
        fillInterval.current = setInterval(() => {
          setWaterLevel(prev => {
            if (prev >= 100) {
              clearInterval(fillInterval.current!);
              setIsValveOpen(false);
              setIsWaterFlowing(false);
              return 100;
            }
            return prev + 1;
          });
        }, 50);
      }, 300); // 300ms mechanical anticipation
    }
  };

  const startReaction = (id: string) => {
    const metal = METALS.find(m => m.id === id);
    if (!metal || waterLevel === 0) return;

    setActiveMetal(metal);
    setIsSimulating(false);
    setBeakerDamage('none');
    
    setTimeout(() => {
      setIsSimulating(true);
      if (metal.reactivity === 'High') setBeakerDamage('broken');
      else if (metal.reactivity === 'Medium') setBeakerDamage('cracked');
      
      setTimeout(() => {
        checkObjectives(id);
      }, 2000);
    }, 500);
  };

  const checkObjectives = (metalId?: string) => {
    if (gameState !== 'PLAYING') return;

    const waterTarget = scenario.targetWaterLevel;
    const metalTarget = scenario.targetMetalId;

    let completed = true;
    if (waterTarget && Math.abs(waterLevel - waterTarget) > 5) completed = false;
    if (metalTarget && metalId !== metalTarget) completed = false;
    if (metalTarget && !metalId) completed = false;

    if (completed && (metalId || !metalTarget)) {
      if (scenario.quiz) {
         setGameState('QUIZ');
      } else {
         finishLevel(true);
      }
    }
  };

  const handleQuizChoice = (idx: number) => {
    setQuizAnswer(idx);
    setShowFeedback(true);
    setTimeout(() => {
      setShowFeedback(false);
      setQuizAnswer(null);
      finishLevel(idx === scenario.quiz?.correctIndex);
    }, 3000);
  };

  const finishLevel = (success: boolean) => {
    if (success) {
      const timeBonus = Math.max(0, 100 - timer);
      const levelScore = 500 + timeBonus;
      setScore(s => s + levelScore);
      setStats(prev => ({
        ...prev,
        score: prev.score + levelScore,
        completedLevels: Array.from(new Set([...prev.completedLevels, currentLevel]))
      }));
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
    setGameState('RECAP');
  };

  // --- Views ---

  if (gameState === 'MENU') {
    return (
      <div className="h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden relative font-sans">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-none" />
        
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="z-10 text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-6 rounded-3xl shadow-blue-500/50 shadow-2xl animate-float">
              <Beaker size={80} className="text-white" />
            </div>
          </div>
          <h1 className="text-6xl font-black mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-300">
            Chemlab Pro
          </h1>
          <p className="text-blue-200/60 text-xl max-w-md mx-auto mb-12 font-medium">
            Master the periodic table through high-stakes chemical simulations and tactical safety decisions.
          </p>

          <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
            <button 
              onClick={() => startLevel(0)}
              className="group relative bg-white text-black py-4 px-8 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-xl hover:shadow-white/20"
            >
              <Play className="fill-black" size={24} />
              New experiment
            </button>
            <button 
              onClick={() => setGameState('DASHBOARD')}
              className="bg-neutral-900 text-white py-4 px-8 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all hover:bg-neutral-800 border border-white/10"
            >
              <LayoutDashboard size={24} />
              Dashboard
            </button>
          </div>
        </motion.div>

        <div className="absolute bottom-8 text-neutral-500 font-mono text-sm">
          Version 2.0.4 // Academy of sciences
        </div>
      </div>
    );
  }

  if (gameState === 'DASHBOARD') {
    return (
      <div className="h-screen bg-neutral-950 text-white p-8 font-sans overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-12">
             <h1 className="text-4xl font-black flex items-center gap-4">
               <LayoutDashboard className="text-blue-500" size={40} />
               Your laboratory
             </h1>
             <button onClick={() => setGameState('MENU')} className="p-3 bg-neutral-900 rounded-xl hover:bg-neutral-800 transition-colors border border-white/10">
               <RotateCcw size={24} />
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 text-center">
            <div className="bg-neutral-900 p-8 rounded-3xl border border-white/5 shadow-2xl">
              <Trophy size={48} className="mx-auto text-yellow-500 mb-4" />
              <p className="text-neutral-400 text-sm font-bold mb-1">Total score</p>
              <h2 className="text-4xl font-black">{stats.score}</h2>
            </div>
            <div className="bg-neutral-900 p-8 rounded-3xl border border-white/5 shadow-2xl">
              <Star size={48} className="mx-auto text-blue-500 mb-4" />
              <p className="text-neutral-400 text-sm font-bold mb-1">Rank</p>
              <h2 className="text-3xl font-black">
                {stats.score < 1000 ? 'Beginner' : stats.score < 3000 ? 'Chemist' : 'Professor'}
              </h2>
            </div>
            <div className="bg-neutral-900 p-8 rounded-3xl border border-white/5 shadow-2xl">
              <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
              <p className="text-neutral-400 text-sm font-bold mb-1">Missions</p>
              <h2 className="text-4xl font-black">{stats.completedLevels.length} / {SCENARIOS.length}</h2>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
             <Target className="text-blue-500" /> Mission log
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="space-y-4">
              {SCENARIOS.map((s, i) => (
                <div key={s.id} className="bg-neutral-900/50 p-6 rounded-2xl flex items-center justify-between border border-white/5 hover:border-white/20 transition-all">
                  <div className="flex items-center gap-6">
                    <div className={`p-4 rounded-xl ${stats.completedLevels.includes(i) ? 'bg-emerald-500/20 text-emerald-500' : 'bg-neutral-800 text-neutral-500'}`}>
                      {stats.completedLevels.includes(i) ? <CheckCircle2 size={32} /> : <Lock size={32} />}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{s.title}</h3>
                      <p className="text-neutral-400 text-sm">{s.objective}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => startLevel(i)}
                    className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:scale-105 transition-all active:scale-95 text-sm"
                  >
                    Start
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-neutral-900 p-8 rounded-[3rem] border border-white/5 shadow-2xl">
              <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                <Atom className="text-blue-500" /> Skills matrix
              </h3>
              <div className="space-y-6">
                {[
                  { name: 'Precision handling', value: stats.completedLevels.includes(0) ? 85 : 0, color: 'bg-blue-500' },
                  { name: 'Chemical knowledge', value: stats.completedLevels.length * 30, color: 'bg-emerald-500' },
                  { name: 'Safety protocols', value: stats.completedLevels.includes(1) ? 95 : 0, color: 'bg-yellow-500' },
                  { name: 'Reaction prediction', value: stats.completedLevels.length * 20, color: 'bg-red-500' },
                ].map((skill, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-xs font-black mb-2">
                       <span className="text-neutral-400">{skill.name}</span>
                       <span className="text-white">{skill.value}%</span>
                    </div>
                    <div className="h-2 bg-black rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${skill.value}%` }}
                         className={`h-full ${skill.color}`}
                       />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 p-6 bg-blue-600/10 rounded-2xl border border-blue-500/20">
                 <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-2">
                   Analysis
                 </h4>
                 <p className="text-sm text-blue-100/70 italic">
                   {stats.completedLevels.length === 0 
                     ? "Awaiting first experiment data to generate cognitive profile."
                     : stats.completedLevels.length === SCENARIOS.length
                       ? "Exceptional safety record. Strengths in high-reactivity containment."
                       : "Focus on Alkali handling to improve Safety Protocol ratings."}
                 </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'INTRO') {
    return (
      <div className="h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-white font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full bg-neutral-900 p-12 rounded-[2.5rem] border border-white/10 shadow-3xl text-center"
        >
          <div className="w-16 h-2 bg-blue-500 rounded-full mx-auto mb-8" />
          <h1 className="text-5xl font-black mb-6 tracking-tight">Mission {currentLevel + 1}: {scenario.title}</h1>
          <p className="text-blue-200/70 text-xl leading-relaxed mb-12">
            "{scenario.intro}"
          </p>
          
          <div className="bg-blue-600/10 p-6 rounded-2xl border border-blue-500/30 mb-12 flex items-center gap-4 text-left">
             <Target className="text-blue-500 shrink-0" size={32} />
             <div>
               <p className="text-xs font-black text-blue-500">Main objective</p>
               <p className="text-lg font-bold">{scenario.objective}</p>
             </div>
          </div>

          <button 
            onClick={() => setGameState('PLAYING')}
            className="w-full py-5 bg-white text-black text-2xl font-black rounded-2xl flex items-center justify-center gap-4 hover:bg-blue-50 transition-all active:scale-[0.98]"
          >
            Engage <ArrowRight />
          </button>
        </motion.div>
      </div>
    );
  }

  if (gameState === 'QUIZ') {
    const quiz = scenario.quiz!;
    return (
      <div className="h-screen bg-black flex items-center justify-center p-6 text-white font-sans relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="w-full h-full animate-[pulse_8s_infinite] bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-blue-900 via-transparent to-transparent" />
        </div>
        
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-3xl w-full z-10"
        >
           <div className="bg-neutral-900 p-12 rounded-[3rem] border border-white/10 shadow-3xl relative overflow-hidden">
             
             {showFeedback && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className={`absolute inset-0 z-20 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center ${quizAnswer === quiz.correctIndex ? 'bg-emerald-950/90' : 'bg-red-950/90'}`}
               >
                 {quizAnswer === quiz.correctIndex ? (
                   <CheckCircle2 size={120} className="text-emerald-500 mb-6" />
                 ) : (
                   <AlertCircle size={120} className="text-red-500 mb-6" />
                 )}
                 <h2 className="text-4xl font-black mb-4">
                   {quizAnswer === quiz.correctIndex ? 'Exemplary!' : 'Critical error'}
                 </h2>
                 <p className="text-xl leading-relaxed text-neutral-200">
                   {quiz.explanation}
                 </p>
               </motion.div>
             )}

             <span className="inline-block px-4 py-1.5 bg-blue-600 rounded-full text-xs font-black mb-6">Post-experiment evaluation</span>
             <h2 className="text-4xl font-black mb-10 leading-tight">
               {quiz.question}
             </h2>

             <div className="grid gap-4">
               {quiz.options.map((opt, i) => (
                 <button 
                   key={i}
                   onClick={() => handleQuizChoice(i)}
                   disabled={showFeedback}
                   className="w-full p-6 text-left text-xl font-bold rounded-2xl border border-white/5 bg-neutral-800 hover:bg-neutral-700 hover:border-white/20 transition-all flex items-center gap-4 group"
                 >
                   <div className="w-10 h-10 rounded-lg bg-neutral-900 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                     {String.fromCharCode(65 + i)}
                   </div>
                   {opt}
                 </button>
               ))}
             </div>
           </div>
        </motion.div>
      </div>
    );
  }

  if (gameState === 'RECAP') {
    return (
      <div className="h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-white font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full text-center"
        >
          <div className="mb-12">
            <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-400 mb-2 italic tracking-tighter">Mission report</h1>
            <div className="h-1 w-32 bg-blue-500 mx-auto rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500/50 mt-4">Laboratory Analysis System v2.0</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-12">
            <div className="bg-neutral-900 p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-colors">
              <div className="absolute top-0 right-0 p-2 opacity-5"><Clock size={40} /></div>
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1 text-left">Tempo</p>
              <p className="text-5xl font-black text-left font-mono">{timer.toString().padStart(3, '0')}<span className="text-xl text-neutral-600 ml-1">S</span></p>
            </div>
            <div className="bg-neutral-900 p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
              <div className="absolute top-0 right-0 p-2 opacity-5"><Trophy size={40} /></div>
              <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1 text-left">Yield</p>
              <p className="text-5xl font-black text-left text-emerald-400 font-mono">+{Math.max(0, 100 - timer) + 500}</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {currentLevel < SCENARIOS.length - 1 ? (
              <button 
                onClick={() => startLevel(currentLevel + 1)}
                className="w-full py-5 bg-white text-black text-2xl font-black rounded-2xl flex items-center justify-center gap-4 hover:bg-blue-50 transition-all transition-all shadow-xl shadow-white/5"
              >
                Next mission
              </button>
            ) : (
                <button 
                  onClick={() => setGameState('DASHBOARD')}
                  className="w-full py-5 bg-blue-600 text-white text-2xl font-black rounded-2xl flex items-center justify-center gap-4 hover:bg-blue-500 transition-all"
                >
                  View profile
                </button>
            )}
            <button 
              onClick={() => startLevel(currentLevel)}
              className="w-full py-4 bg-neutral-900 text-white font-bold rounded-2xl border border-white/10 hover:bg-neutral-800 transition-all"
            >
              Retry experiment
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- Playing View ---

  return (
    <DndContext>
      <div className="flex h-screen bg-neutral-950 text-white overflow-hidden font-sans border-8 border-neutral-900">
        {/* HUD - Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-neutral-900/80 backdrop-blur-xl border-b border-white/10 z-50 flex items-center justify-between px-10">
           <div className="flex items-center gap-6">
              <button 
                onClick={() => setGameState('MENU')}
                className="p-3 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-all border border-white/5"
              >
                <Menu size={20} />
              </button>
              <div>
                <p className="text-[10px] font-black text-blue-500 mb-0.5">Mission active</p>
                <h3 className="text-xl font-black flex items-center gap-2">
                  <ShieldAlert className="text-yellow-500" size={18} /> {scenario.title}
                </h3>
              </div>
           </div>

           <div className="flex items-center gap-12">
              <div className="text-right">
                <p className="text-[10px] font-black text-neutral-500 mb-0.5">Objective</p>
                <p className="font-bold text-white tracking-tight">{scenario.objective}</p>
              </div>
               <div className="flex items-center gap-4 bg-black/40 px-6 py-2.5 rounded-2xl border border-white/5 shadow-inner">
                 <div className="flex items-center gap-2 text-yellow-500 font-black text-2xl font-mono">
                    <Clock size={24} className="opacity-50" /> {timer.toString().padStart(3, '0')}<span className="text-xs text-yellow-500/40 ml-0.5 font-sans">S</span>
                 </div>
               </div>
           </div>
        </div>

        {/* Sidebar */}
        <div className="w-32 mt-20 pt-8 pb-8 bg-neutral-900 border-r border-white/5 flex flex-col gap-6 items-center shadow-2xl relative z-10">
          <div className="p-3 bg-blue-600/20 rounded-2xl text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <FlaskConical size={24}/>
          </div>
          
          <div className="flex flex-col gap-5 w-full flex-1 items-center px-2">
            <div className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-2 px-4 w-full border-b border-white/5 pb-2">Reactants</div>
            {METALS.map((metal) => (
                <div 
                  key={metal.id} 
                  draggable 
                  onDragStart={(e) => e.dataTransfer.setData('metalId', metal.id)} 
                  className="flex flex-col items-center gap-1.5 cursor-grab group transition-all hover:translate-x-1 active:scale-95 w-full pr-2 pl-2"
                >
                    <MetalIcon type={metal.iconType} color={metal.color} symbol={metal.chemical} size="small" />
                    <div className="flex flex-col items-center">
                      <span className='text-[11px] text-white font-bold tracking-tight group-hover:text-blue-400 transition-colors uppercase'>{metal.name}</span>
                      <span className='text-[9px] text-neutral-500 font-black uppercase tracking-tighter'>{metal.reactivity}</span>
                    </div>
                </div>
            ))}
          </div>
        </div>
        
        {/* Lab Area */}
        <div className="flex-1 flex flex-col justify-center items-center pt-20 p-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-800 via-neutral-950 to-neutral-950 relative">
          
          <div className="absolute inset-0 pointer-events-none opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

          {/* Water Valve & Capacity Controls */}
          <div className="flex flex-col items-center mb-12 relative z-20 w-full max-w-4xl px-8">
              {/* Tap Background Glow */}
              <AnimatePresence>
                {isWaterFlowing && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1.5 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute left-1/2 -translate-x-1/2 -top-10 w-40 h-40 bg-blue-500/10 blur-[60px] pointer-events-none"
                  />
                )}
              </AnimatePresence>

              <div className="flex items-center justify-center w-full relative">
                {/* Centered Faucet Assembly */}
                <div 
                  className="flex flex-col items-center gap-1 cursor-pointer select-none relative -ml-[60px]" 
                  onClick={toggleValve}
                >
                  <motion.div 
                    className="hover:scale-105 transition-transform active:scale-95 relative"
                    animate={isWaterFlowing ? { 
                      x: [0, -1, 1, -1, 1, 0],
                      y: [0, 1, -1, 1, -1, 0] 
                    } : {}}
                    transition={{ repeat: Infinity, duration: 0.1 }}
                  >
                    <TapIcon isOpen={isValveOpen} />
                    
                    {/* Integrated Water Stream (Inside Tap Container) */}
                    <AnimatePresence>
                        {isWaterFlowing && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }} 
                              animate={{ opacity: 1, height: `${480 - (waterLevel * 4.4)}px` }} 
                              exit={{ height: 0, opacity: 0 }} 
                              transition={{ duration: 0.2, ease: "linear" }}
                              className='absolute top-[130px] left-[110px] -translate-x-1/2 w-4 z-[-1] pointer-events-none'
                            >
                                <div className="w-full h-full bg-gradient-to-b from-blue-400 via-blue-500 to-blue-400/20 shadow-[0_0_20px_rgba(59,130,246,0.3)] rounded-full overflow-hidden border-x border-white/10">
                                   {/* Animated stream texture */}
                                   <motion.div 
                                     className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"
                                     animate={{ backgroundPositionY: ['0%', '100%'] }}
                                     transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
                                   />
                                   {/* Bubble effects in stream */}
                                   {[...Array(8)].map((_, i) => (
                                     <motion.div
                                       key={i}
                                       className="absolute left-1/2 -translate-x-1/2 w-1 bg-white/40 rounded-full"
                                       animate={{ 
                                         top: ['0%', '100%'],
                                         opacity: [0, 1, 0] 
                                       }}
                                       transition={{ 
                                         duration: 0.5, 
                                         repeat: Infinity, 
                                         delay: i * 0.1 
                                       }}
                                       style={{ height: `${Math.random() * 20 + 10}px` }}
                                     />
                                   ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                  </motion.div>
                  <div className="flex flex-col items-center">
                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] transition-colors duration-300 ${isWaterFlowing ? 'text-blue-400' : 'text-neutral-600'}`}>
                      {isWaterFlowing ? 'Flow Active' : (isValveOpen ? 'Ready' : 'Valve Closed')}
                    </span>
                  </div>
                </div>

                {/* Offset Capacity HUD */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/40 p-6 rounded-3xl border border-white/5 backdrop-blur-md shadow-xl flex flex-col gap-3 min-w-[280px]">
                  <div className="flex justify-between items-end mb-1">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-neutral-500 tracking-widest mb-1">total capacity</span>
                      <span className="text-2xl font-black text-white tabular-nums drop-shadow-sm select-none font-mono">
                        {Math.round(waterLevel).toString().padStart(3, '0')}<span className="text-blue-500 text-sm ml-1">%</span>
                      </span>
                    </div>
                    <div className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter transition-all duration-500 ${isWaterFlowing ? 'bg-blue-500 text-white animate-pulse' : 'bg-neutral-800 text-neutral-500'}`}>
                      {isWaterFlowing ? 'Filling...' : (isValveOpen ? 'Primed' : 'Idle')}
                    </div>
                  </div>
                  
                  <div className="w-full bg-black/60 h-3 rounded-full overflow-hidden border border-white/5 shadow-inner relative">
                    <motion.div 
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 via-blue-400 to-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)]" 
                      initial={{ width: 0 }}
                      animate={{ width: `${waterLevel}%` }}
                      transition={{ type: 'spring', stiffness: 30, damping: 10 }}
                    />
                  </div>
                </div>
              </div>
          </div>

            <div className="relative w-80 h-[30rem] z-10">
                <motion.div
                    id="beaker"
                    animate={
                        beakerDamage === 'broken' 
                            ? { x: [0, 10, -10, 10, -10, 0], scale: [1, 1.05, 1] } 
                            : beakerDamage === 'cracked' 
                                ? { x: [0, 3, -3, 3, -3, 0] } 
                                : { rotate: 0 }
                    }
                    transition={{ duration: 0.3 }}
                    className={`w-full h-full rounded-b-[4rem] border-x-[12px] border-b-[12px] backdrop-blur-xl flex justify-center items-end p-8 transition-all relative overflow-hidden ${beakerDamage === 'broken' ? 'bg-red-950/40 border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.3)]' : beakerDamage === 'cracked' ? 'bg-orange-950/40 border-orange-500/50 shadow-[0_0_50px_rgba(249,115,22,0.2)]' : 'bg-white/5 border-white/20 shadow-2xl'}`}
                    onDrop={(e) => {
                        e.preventDefault();
                        const metalId = e.dataTransfer.getData('metalId');
                        if (metalId) startReaction(metalId);
                    }}
                    onDragOver={(e) => e.preventDefault()}
                >
                    {/* Measurement Lines */}
                    <div className="absolute left-6 top-8 bottom-8 flex flex-col justify-between items-start opacity-20 pointer-events-none">
                       {[100, 80, 60, 40, 20].map(val => (
                         <div key={val} className="flex items-center gap-2">
                           <div className={`h-0.5 rounded-full bg-white ${val % 20 === 0 ? 'w-8' : 'w-4'}`} />
                           <span className="text-[10px] font-bold">{val}</span>
                         </div>
                       ))}
                    </div>

                    {/* Heat Overlay */}
                    <AnimatePresence>
                      {isSimulating && (
                          <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 0.4 }}
                              exit={{ opacity: 0 }}
                              className={`absolute inset-0 z-0 ${beakerDamage === 'cracked' ? 'bg-orange-500' : beakerDamage === 'broken' ? 'bg-red-600' : 'bg-yellow-400'}`}
                          />
                      )}
                    </AnimatePresence>
                    
                    {/* Broken Pieces */}
                    {beakerDamage === 'broken' && (
                        <motion.div className="absolute inset-0 z-50">
                            {[...Array(12)].map((_, i) => (
                                <motion.div key={i} className="absolute bg-neutral-400/50 backdrop-blur-md w-16 h-16 rounded-xl border border-white/20"
                                    initial={{ x: 0, y: 0, rotate: 0 }}
                                    animate={{ 
                                        x: (Math.random() - 0.5) * 600, 
                                        y: (Math.random() - 0.5) * 600, 
                                        rotate: Math.random() * 720,
                                        scale: 0
                                    }}
                                    transition={{ duration: 1.2, ease: "easeOut" }}
                                />
                            ))}
                        </motion.div>
                    )}

                    {/* Gas / Bubbles */}
                    <AnimatePresence>
                      {isSimulating && activeMetal?.reactivity !== 'None' && (
                        <div className="absolute bottom-0 left-0 right-0 h-full pointer-events-none z-20">
                           {[...Array(20)].map((_, i) => (
                             <motion.div 
                               key={i}
                               className="absolute w-4 h-4 bg-white/20 rounded-full backdrop-blur-sm"
                               initial={{ bottom: 0, left: `${Math.random() * 100}%`, opacity: 0 }}
                               animate={{ 
                                 bottom: '100%', 
                                 opacity: [0, 1, 0.4, 0],
                                 scale: [0.5, 1.2, 0.8],
                                 x: (Math.random() - 0.5) * 50
                               }}
                               transition={{ 
                                 duration: 1 + Math.random() * 2, 
                                 repeat: Infinity,
                                 delay: Math.random() * 2
                               }}
                             />
                           ))}
                        </div>
                      )}
                    </AnimatePresence>

                    {/* Water Level */}
                    <motion.div 
                      className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-blue-600/60 to-blue-400/40 backdrop-blur-sm border-t border-white/40" 
                      animate={{ height: `${waterLevel}%` }} 
                      transition={{ type: 'spring', stiffness: 100, damping: 20 }} 
                    >
                       <div className="absolute top-0 left-0 right-0 h-4 bg-white/20 pointer-events-none overflow-hidden">
                          <motion.div 
                            className="h-full w-[200%] bg-white/10"
                            animate={{ x: ['-50%', '0%'] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                          />
                       </div>

                       {/* Ripples on surface during flow */}
                       {isWaterFlowing && (
                         <motion.div 
                           className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-6 bg-white/30 blur-md rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                           initial={{ scale: 0, opacity: 0 }}
                           animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0.3, 0.6] }}
                           transition={{ repeat: Infinity, duration: 0.4 }}
                         />
                       )}
                    </motion.div>
                    
                    {/* Active Metal Piece */}
                    <AnimatePresence>
                        {activeMetal && (
                            <motion.div 
                              initial={{ y: -300, opacity: 0, rotate: -45 }} 
                              animate={{ y: 0, opacity: 1, rotate: 0 }} 
                              exit={{ scale: 0, opacity: 0 }} 
                              className={`relative z-40 transition-all ${isSimulating ? 'animate-[bounce_0.5s_infinite]' : ''}`}
                            >
                              <MetalIcon type={activeMetal.iconType} color={activeMetal.color} symbol={activeMetal.chemical} size="big" />
                              
                              {/* Explosion FX */}
                              {isSimulating && activeMetal.reactivity === 'High' && (
                                <motion.div 
                                  initial={{ scale: 0, opacity: 0 }} 
                                  animate={{ scale: [2, 3, 2], opacity: [1, 0.4, 0] }} 
                                  transition={{ duration: 0.4, repeat: Infinity }} 
                                  className="absolute -top-12 -left-12 w-48 h-48 bg-orange-500 rounded-full mix-blend-screen blur-xl"
                                />
                              )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>

        {/* Right Info Panel */}
        <div className="w-[30%] mt-20 p-8 border-l border-white/5 bg-neutral-900 flex flex-col gap-6 relative z-10">
            <h2 className="text-[10px] font-black text-blue-500">Chemical analysis</h2>
            
            <AnimatePresence mode="wait">
              {activeMetal ? (
                  <motion.div 
                    key={activeMetal.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex flex-col gap-6"
                  >
                      <div className='flex items-center gap-5 p-6 bg-black/40 rounded-3xl border border-white/5'>
                          <MetalIcon type={activeMetal.iconType} color={activeMetal.color} size='small' />
                          <div>
                            <p className="text-[10px] font-black text-neutral-500">{activeMetal.chemical}</p>
                            <h4 className="font-black text-white text-3xl tracking-tight">{activeMetal.name}</h4>
                          </div>
                      </div>
                      
                      <div className="bg-neutral-800/40 p-6 rounded-3xl border border-white/5">
                        <p className="text-sm text-neutral-300 leading-relaxed font-medium">
                          {activeMetal.description}
                        </p>
                      </div>

                      <div className='grid grid-cols-2 gap-4'>
                          <div className={`p-4 rounded-2xl border text-center ${activeMetal.reactivity === 'High' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-neutral-800 border-white/5 text-neutral-400'}`}>
                             <p className="text-[10px] font-black mb-1">Reactivity</p>
                             <p className="font-black text-lg">{activeMetal.reactivity}</p>
                          </div>
                          <div className={`p-4 rounded-2xl border text-center bg-blue-500/10 border-blue-500/30 text-blue-400`}>
                             <p className="text-[10px] font-black mb-1">Phase</p>
                             <p className="font-black text-lg">Solid</p>
                          </div>
                      </div>

                      {beakerDamage !== 'none' && (
                        <motion.div 
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="bg-red-600 p-6 rounded-3xl flex items-center gap-4 text-white shadow-2xl shadow-red-500/20"
                        >
                           <ShieldAlert size={32} strokeWidth={3} />
                           <div>
                             <p className="font-black text-lg leading-tight">Vessel breach</p>
                             <p className="text-xs font-bold text-red-100 opacity-80 leading-tight">Critical energy release</p>
                           </div>
                        </motion.div>
                      )}
                  </motion.div>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 px-6">
                      <div className="w-20 h-20 rounded-full border-4 border-dashed border-neutral-600 mb-6 flex items-center justify-center">
                        <Atom className="text-neutral-500" size={32} />
                      </div>
                      <h4 className="text-lg font-bold mb-2">Awaiting scan</h4>
                      <p className="text-sm font-medium">Drag a chemical element into the beaker to begin real-time safety analysis.</p>
                  </div>
              )}
            </AnimatePresence>
            
            <div className="mt-auto pt-8 border-t border-white/5">
                <div className="flex items-center justify-between text-xs font-black text-neutral-500 mb-4">
                  <span>Safety protocol</span>
                  <span className="text-emerald-500">Active</span>
                </div>
                <div className="space-y-4">
                   <div className="flex items-center gap-4 px-4 py-3 bg-black/20 rounded-xl border border-white/5 opacity-60">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold">Goggles & lab coat</span>
                   </div>
                   <div className="flex items-center gap-4 px-4 py-3 bg-black/20 rounded-xl border border-white/5 opacity-60">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-bold">Pressure equalizer</span>
                   </div>
                </div>
            </div>
        </div>
      </div>
    </DndContext>
  );
}
