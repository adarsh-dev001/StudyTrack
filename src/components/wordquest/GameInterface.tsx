
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Timer, HelpCircle, SkipForward, Star, ArrowLeft, ImageIcon, ListChecks, Library, Flame, Skull, ThumbsUp, ThumbsDown, Volume2, Settings, KeyboardIcon, ArrowRightToLine, ChevronsRight, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { GameMode, GameModeDetails } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { generateWordQuestChallenge, type GenerateWordQuestChallengeInput, type WordQuestChallengeOutput } from '@/ai/flows/generate-wordquest-challenge-flow';
import { useToast } from '@/hooks/use-toast';

// Consistent Game Mode Details
const gameModesDetails: Record<GameMode, GameModeDetails> = {
  basic: { title: 'Basic', description: 'Multiple Choice Questions', icon: ListChecks, colorClass: 'border-green-500/30 bg-green-500/5 hover:shadow-green-500/10', iconColorClass: 'text-green-500' },
  intermediate: { title: 'Intermediate', description: 'Fill-in-the-blanks/Definitions', icon: Library, colorClass: 'border-teal-500/30 bg-teal-500/5 hover:shadow-teal-500/10', iconColorClass: 'text-teal-500' },
  advanced: { title: 'Advanced', description: 'Challenging Definitions - Timed', icon: Flame, colorClass: 'border-orange-500/30 bg-orange-500/5 hover:shadow-orange-500/10', iconColorClass: 'text-orange-500' },
};

// Modified WordData type to align with AI output
export interface WordDataForGame {
  id: string; // Will use the 'word' itself as ID
  word: string;
  clueType: 'definition' | 'fill-in-the-blank'; // Simplified from AI output for now
  clue: string;
  options?: string[]; // For basic mode
  correctAnswer: string; // Always the 'word'
  hint?: string; // For intermediate/advanced
}


const MAX_QUESTIONS_PER_SESSION = 5; // Number of questions per game session

interface GameInterfaceProps {
  selectedMode: GameMode;
  onGoBack: () => void;
}

const panelVariants = {
  initial: (custom: 'left' | 'right') => ({
    opacity: 0,
    x: custom === 'left' ? -30 : 30,
  }),
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  },
  exit: (custom: 'left' | 'right') => ({
    opacity: 0,
    x: custom === 'left' ? -30 : 30,
    transition: { duration: 0.3, ease: "easeIn" }
  })
};

const optionVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.3, ease: "easeOut" }
  })
};

const feedbackVariants = {
  initial: { opacity: 0, scale: 0.8, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 15 } },
  exit: { opacity: 0, scale: 0.8, y: -10, transition: { duration: 0.2 } }
};

// Fisher-Yates shuffle function - still needed for MCQ options
function shuffleArray<T>(array: T[]): T[] {
  if (!array) return [];
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}


export default function GameInterface({ selectedMode, onGoBack }: GameInterfaceProps) {
  const [currentWordData, setCurrentWordData] = useState<WordDataForGame | null>(null);
  const [currentQuestionNum, setCurrentQuestionNum] = useState(0); // Tracks number of questions asked in this session
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0); // Will be set by AI or mode
  const [isHintUsedForQuestion, setIsHintUsedForQuestion] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [isLoadingWord, setIsLoadingWord] = useState(true);
  const [gameSessionWords, setGameSessionWords] = useState<string[]>([]); // Track words used in this session
  
  const { toast } = useToast();
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const correctAnswerSoundRef = useRef<HTMLAudioElement | null>(null);
  const wrongAnswerSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      correctAnswerSoundRef.current = new Audio('/sounds/correct_answer.mp3');
      correctAnswerSoundRef.current.preload = 'auto';
      wrongAnswerSoundRef.current = new Audio('/sounds/wrong_answer.mp3');
      wrongAnswerSoundRef.current.preload = 'auto';
    }
  }, []);

  const getTimeLimitForMode = useCallback(() => {
    switch (selectedMode) {
      case 'basic': return 83;
      case 'intermediate': return 78;
      case 'advanced': return 20;
      default: return 60;
    }
  }, [selectedMode]);

  const fetchNextWord = useCallback(async () => {
    setIsLoadingWord(true);
    setFeedbackMessage(null);
    setUserInput('');
    setIsHintUsedForQuestion(false);

    const aiInput: GenerateWordQuestChallengeInput = {
      gameMode: selectedMode,
      previousWords: gameSessionWords,
    };

    try {
      const aiResult = await generateWordQuestChallenge(aiInput);
      const newWordData: WordDataForGame = {
        id: aiResult.word, // Use word as ID
        word: aiResult.word,
        clueType: aiResult.clueType,
        clue: aiResult.clue,
        options: aiResult.options ? shuffleArray(aiResult.options) : undefined,
        correctAnswer: aiResult.word, // Correct answer is the word itself
        hint: aiResult.hint,
      };
      setCurrentWordData(newWordData);
      setGameSessionWords(prev => [...prev, newWordData.word]);
      if (newWordData.options) {
        setShuffledOptions(newWordData.options); // Already shuffled by AI or here
      }
      setTimeLeft(getTimeLimitForMode());
    } catch (error: any) {
      console.error("Error fetching word from AI:", error);
      toast({ title: "Error Generating Word", description: error.message || "Could not fetch a new word. Please try restarting.", variant: "destructive" });
      // Potentially handle this by ending game or allowing retry
      setGameOver(true); // Or offer a retry button
    } finally {
      setIsLoadingWord(false);
    }
  }, [selectedMode, gameSessionWords, getTimeLimitForMode, toast]);

  useEffect(() => {
    // Initial game setup or when mode changes (via gameKey prop)
    setGameSessionWords([]);
    setCurrentQuestionNum(0);
    setScore(0);
    setGameOver(false);
    fetchNextWord(); // Fetch the first word
  }, [selectedMode, fetchNextWord]); // Triggered by gameKey from parent if restarting same mode


  useEffect(() => {
    if (currentWordData && (selectedMode === 'intermediate' || selectedMode === 'advanced') && !gameOver && !isLoadingWord) {
      hiddenInputRef.current?.focus();
    }
  }, [currentWordData, selectedMode, gameOver, isLoadingWord]);


  const proceedToNextOrEnd = useCallback(() => {
    if (currentQuestionNum < MAX_QUESTIONS_PER_SESSION -1) {
      setCurrentQuestionNum(prev => prev + 1);
      fetchNextWord(); // Fetch next word
    } else {
      setGameOver(true);
    }
  }, [currentQuestionNum, fetchNextWord]);

  const handleSubmitAnswer = useCallback(() => {
    if (!currentWordData || feedbackMessage || isLoadingWord) return;

    let isCorrect = false;
    if (selectedMode === 'basic') {
      isCorrect = userInput === currentWordData.correctAnswer;
    } else {
      isCorrect = userInput.trim().toLowerCase() === currentWordData.correctAnswer.toLowerCase();
    }

    if (isCorrect) {
      setScore(s => s + 10);
      setFeedbackMessage('Correct! 🎉');
      correctAnswerSoundRef.current?.play().catch(e => console.error("Error playing correct sound:", e));
    } else {
      setFeedbackMessage(`Oops! The correct answer was: ${currentWordData.correctAnswer}`);
      wrongAnswerSoundRef.current?.play().catch(e => console.error("Error playing wrong sound:", e));
    }

    setTimeout(() => {
      proceedToNextOrEnd();
    }, 1500);
  }, [currentWordData, userInput, selectedMode, feedbackMessage, isLoadingWord, proceedToNextOrEnd]);

  const handleOptionSelect = (option: string) => {
    if (feedbackMessage || !currentWordData || isLoadingWord) return;
    setUserInput(option); 
    if (selectedMode === 'basic') {
        let isCorrect = option === currentWordData.correctAnswer;
        if (isCorrect) {
            setScore(s => s + 10);
            setFeedbackMessage('Correct! 🎉');
            correctAnswerSoundRef.current?.play().catch(e => console.error("Error playing correct sound:", e));
        } else {
            setFeedbackMessage(`Oops! The correct answer was: ${currentWordData.correctAnswer}`);
            wrongAnswerSoundRef.current?.play().catch(e => console.error("Error playing wrong sound:", e));
        }
        setTimeout(() => {
            proceedToNextOrEnd();
        }, 1500);
    }
  };

  const handleSkip = useCallback(() => {
    if (gameOver || feedbackMessage || !currentWordData || isLoadingWord) return;
    setFeedbackMessage(`Skipped! The answer was: ${currentWordData.correctAnswer}`);
    wrongAnswerSoundRef.current?.play().catch(e => console.error("Error playing wrong sound on skip:", e));
    setTimeout(() => {
      proceedToNextOrEnd();
    }, 1500);
  }, [gameOver, feedbackMessage, currentWordData, isLoadingWord, proceedToNextOrEnd]);
  
  const formatTimeForDisplay = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };
  
   useEffect(() => {
    if (gameOver || isLoadingWord || feedbackMessage) return;
    if (timeLeft <= 0) {
      handleSkip();
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, gameOver, isLoadingWord, feedbackMessage, handleSkip]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameOver || feedbackMessage || !currentWordData || isLoadingWord) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        handleSkip();
        return;
      }

      if (selectedMode === 'intermediate' || selectedMode === 'advanced') {
        if (event.key === 'Enter') {
          event.preventDefault();
          if (userInput.trim()) handleSubmitAnswer();
        } else if (event.key === 'Backspace') {
          setUserInput(prev => prev.slice(0, -1));
        } else if (event.key.length === 1 && /^[a-zA-Z]$/.test(event.key) && userInput.length < currentWordData.correctAnswer.length) {
          setUserInput(prev => prev + event.key.toUpperCase());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameOver, feedbackMessage, selectedMode, userInput, handleSubmitAnswer, handleSkip, currentWordData, isLoadingWord]);

  useEffect(() => {
    if (
      (selectedMode === 'intermediate' || selectedMode === 'advanced') &&
      currentWordData &&
      userInput.length === currentWordData.correctAnswer.length &&
      !feedbackMessage && !isLoadingWord
    ) {
      handleSubmitAnswer();
    }
  }, [userInput, currentWordData, selectedMode, handleSubmitAnswer, feedbackMessage, isLoadingWord]);


  if (gameOver) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Card className="w-full max-w-lg mx-auto text-center shadow-xl">
          <CardHeader>
            <Star className="mx-auto h-12 w-12 text-yellow-400 mb-2" />
            <CardTitle className="text-2xl font-bold">Game Over!</CardTitle>
            <CardDescription>Mode: {gameModesDetails[selectedMode]?.title || selectedMode}</CardDescription>
          </CardHeader>
          <CardContent>
             <motion.p
                className="text-4xl font-bold text-primary mb-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                {score}
              </motion.p>
            <p className="text-muted-foreground">You answered {score / 10} out of {MAX_QUESTIONS_PER_SESSION} questions correctly.</p>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={onGoBack} variant="outline">Play Again</Button>
          </CardFooter>
        </Card>
      </motion.div>
    );
  }
  
  if (isLoadingWord || !currentWordData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Generating next word challenge...</p>
        <Button onClick={onGoBack} variant="outline" className="mt-4">Back to Modes</Button>
      </div>
    );
  }


  const renderClueContent = () => {
    // Clue types from AI are 'definition' or 'fill-in-the-blank'
    return <p className="text-xl md:text-2xl lg:text-3xl text-foreground font-medium leading-tight">{currentWordData.clue}</p>;
  };

  const renderLetterBoxes = () => {
    if (!currentWordData) return null;
    const wordLength = currentWordData.correctAnswer.length;
    return (
      <div className="flex justify-center space-x-1.5 sm:space-x-2">
        {Array.from({ length: wordLength }).map((_, index) => (
          <motion.div
            key={index}
            className={cn(
              "flex items-center justify-center h-10 w-8 sm:h-12 sm:w-10 md:h-14 md:w-12 text-xl sm:text-2xl font-semibold border-2 rounded",
              userInput[index] ? "border-primary text-primary bg-primary/10" : "border-muted-foreground/50 bg-muted/20"
            )}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03, duration: 0.2 }}
          >
            {userInput[index]?.toUpperCase() || ''}
          </motion.div>
        ))}
      </div>
    );
  };


  return (
    <div className="w-full h-full flex flex-col">
       <div className="flex justify-between items-center p-3 sm:p-4 border-b">
        <Button onClick={onGoBack} variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> WordQuest Modes
        </Button>
        <div className="text-sm text-muted-foreground">
          Question: {currentQuestionNum + 1} / {MAX_QUESTIONS_PER_SESSION} | Score: <span className="font-semibold text-primary">{score}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><KeyboardIcon className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><Volume2 className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><Settings className="h-5 w-5" /></Button>
        </div>
      </div>

      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 min-h-[calc(100vh-150px)]">
        {/* Left Panel - Clue */}
        <AnimatePresence mode="wait">
        <motion.div
            key={`clue-panel-${currentQuestionNum}`}
            custom="left"
            variants={panelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-card text-card-foreground p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-between relative"
        >
            <div> 
                <div className="absolute top-4 left-4 text-sm text-muted-foreground flex items-center">
                    Your clue <ArrowRightToLine className="ml-1 h-4 w-4" />
                </div>
            </div>

            <div className="my-auto flex items-center justify-center h-full"> 
                {renderClueContent()}
            </div>

            <div className="mt-auto"> 
                <div className="flex justify-between items-end">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                        {(selectedMode === 'intermediate' || selectedMode === 'advanced') && (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={handleSkip}
                                disabled={!!feedbackMessage || gameOver || isLoadingWord}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm px-3 py-1.5 h-auto"
                            >
                                <span className="bg-indigo-700/80 px-1.5 py-0.5 rounded-sm text-xs mr-1.5">esc</span> Skip
                            </Button>
                        )}
                        {selectedMode === 'basic' && (
                           <>
                             <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-green-500"><ThumbsUp className="h-5 w-5"/></Button>
                             <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500"><ThumbsDown className="h-5 w-5"/></Button>
                           </>
                        )}
                        {(selectedMode === 'intermediate' || selectedMode === 'advanced') && currentWordData.hint && (
                            <>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-muted-foreground hover:text-foreground text-xs"
                                    onClick={() => setIsHintUsedForQuestion(true)}
                                    disabled={isHintUsedForQuestion || !currentWordData.hint}
                                >
                                    <HelpCircle className="h-4 w-4 mr-1" /> Hint {isHintUsedForQuestion ? `(${currentWordData.hint})` : ''}
                                </Button>
                                {/* <div className="flex items-center text-muted-foreground text-sm">
                                    <Flame className="h-4 w-4 mr-1" /> 0
                                </div> */}
                            </>
                        )}
                    </div>
                    <div className="text-right">
                        <div className="text-4xl sm:text-5xl font-bold tabular-nums text-foreground">{formatTimeForDisplay(timeLeft)}</div>
                        <div className="text-xs text-muted-foreground">Time remaining <ChevronsRight className="inline h-3 w-3" /></div>
                    </div>
                </div>
            </div>
        </motion.div>
        </AnimatePresence>


        {/* Right Panel - Options/Input */}
        <AnimatePresence mode="wait">
        <motion.div
           key={`input-panel-${currentQuestionNum}`}
           custom="right"
           variants={panelVariants}
           initial="initial"
           animate="animate"
           exit="exit"
          className="bg-muted/30 p-6 sm:p-8 flex flex-col justify-center items-center"
        >
          {selectedMode === 'basic' && currentWordData.options ? (
            <motion.div
              className="space-y-3 w-full max-w-sm"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.05 }}}}
            >
              {shuffledOptions.map((option, index) => (
                <motion.div
                  key={`${currentWordData.id}-opt-${index}`} // Ensure key is unique even if options repeat across words
                  custom={index}
                  variants={optionVariants}
                  whileHover={{ scale: 1.03, transition: { duration: 0.15 } }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full h-auto py-4 sm:py-5 text-base sm:text-lg justify-between items-center text-left whitespace-normal",
                      userInput === option && !feedbackMessage && "bg-primary/20 border-primary ring-2 ring-primary",
                      feedbackMessage && option === currentWordData.correctAnswer && "bg-green-500/20 border-green-500 ring-2 ring-green-500 text-green-700 dark:text-green-300",
                      feedbackMessage && userInput === option && option !== currentWordData.correctAnswer && "bg-red-500/20 border-red-500 ring-2 ring-red-500 text-red-700 dark:text-red-300"
                    )}
                    onClick={() => handleOptionSelect(option)}
                    disabled={!!feedbackMessage || isLoadingWord}
                  >
                    <span>{option}</span>
                    <span className="text-xs font-mono text-muted-foreground border border-border rounded-full h-5 w-5 flex items-center justify-center ml-2">
                      {index + 1}
                    </span>
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          ) : (selectedMode === 'intermediate' || selectedMode === 'advanced') ? (
            <div className="w-full max-w-md text-center space-y-6">
              {currentWordData.hint && (isHintUsedForQuestion || selectedMode === 'intermediate') && ( 
                <motion.p
                  className="text-2xl sm:text-3xl font-semibold text-foreground/80"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {currentWordData.hint}
                </motion.p>
              )}
              {renderLetterBoxes()}
              <input
                ref={hiddenInputRef}
                type="text"
                className="opacity-0 w-0 h-0 absolute"
                onFocus={() => hiddenInputRef.current?.focus()}
                value={userInput} // This is fine for controlled hidden input
                readOnly // Important for this setup
              />
            </div>
          ) : (
            <p className="text-muted-foreground">Game mode not fully configured for display.</p>
          )}

          <AnimatePresence>
            {feedbackMessage && (
              <motion.div
                  key="feedback"
                  variants={feedbackVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className={cn(
                      "mt-6 p-3 rounded-md text-center font-semibold text-sm w-full max-w-sm",
                      feedbackMessage.includes('Correct') ? "bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-300"
                                                          : "bg-red-100 text-red-700 dark:bg-red-800/30 dark:text-red-300"
                  )}
              >
                  {feedbackMessage.includes('Correct') && <CheckCircle className="inline mr-1.5 h-5 w-5" />}
                  {feedbackMessage.includes('Oops') && <XCircle className="inline mr-1.5 h-5 w-5" />}
                  {feedbackMessage.includes('Skipped') && <SkipForward className="inline mr-1.5 h-5 w-5" />}
                  {feedbackMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
