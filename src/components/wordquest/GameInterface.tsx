
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Timer, HelpCircle, SkipForward, Star, ArrowLeft, ImageIcon, ListChecks, Library, Flame, Skull, ThumbsUp, ThumbsDown, Volume2, Settings, KeyboardIcon, ArrowRightToLine, ChevronsRight, CheckCircle, XCircle } from 'lucide-react';
import type { GameMode, GameModeDetails, WordData } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Consistent Game Mode Details, ensuring Advanced matches Intermediate's expected UI type
const gameModesDetails: Record<GameMode, GameModeDetails> = {
  basic: { title: 'Basic', description: 'Everyday Words - MCQs', icon: ListChecks, colorClass: 'border-green-500/30 bg-green-500/5 hover:shadow-green-500/10', iconColorClass: 'text-green-500' },
  intermediate: { title: 'Intermediate', description: 'Fill-in-the-blanks', icon: Library, colorClass: 'border-teal-500/30 bg-teal-500/5 hover:shadow-teal-500/10', iconColorClass: 'text-teal-500' },
  advanced: { title: 'Advanced', description: 'Descriptive Clues - Timed', icon: Flame, colorClass: 'border-orange-500/30 bg-orange-500/5 hover:shadow-orange-500/10', iconColorClass: 'text-orange-500' },
};

const MOCK_WORDS: Record<GameMode, WordData[]> = {
  basic: [
    { id: 'b1', word: 'Deep', clueType: 'definition', clue: 'adjective. Going far down from the top or surface.', options: ['Shallow', 'Deep', 'Narrow'], correctAnswer: 'Deep' },
    { id: 'b2', word: 'Run', clueType: 'definition', clue: 'Move at a speed faster than a walk.', options: ['Walk', 'Sit', 'Run'], correctAnswer: 'Run' },
    { id: 'b3', word: 'Big', clueType: 'definition', clue: 'Of considerable size or extent.', options: ['Small', 'Tiny', 'Big'], correctAnswer: 'Big' },
  ],
  intermediate: [
    { id: 'i1', word: 'Blunt', clueType: 'definition', clue: 'adjective. Not sharp; direct in speaking.', correctAnswer: 'Blunt', hint: "Starts with B" },
    { id: 'i2', word: 'Elaborate', clueType: 'fill-in-the-blank', clue: 'Can you ___ on that point? (Means to add more detail)', correctAnswer: 'Elaborate', hint: "Involves adding more detail" },
    { id: 'i3', word: 'Gratitude', clueType: 'fill-in-the-blank', clue: "Showing thankfulness and appreciation. (Ends with 'ude') ", correctAnswer: 'Gratitude', hint: "A feeling of thankfulness"},
  ],
  advanced: [
    { id: 'a1', word: 'Ephemeral', clueType: 'definition', clue: 'Lasting for a very short time.', correctAnswer: 'Ephemeral', hint: "Think 'fleeting'" },
    { id: 'a2', word: 'Ubiquitous', clueType: 'definition', clue: 'Present, appearing, or found everywhere.', correctAnswer: 'Ubiquitous', hint: "Like air, or popular trends"},
    { id: 'a3', word: 'Serendipity', clueType: 'definition', clue: 'The occurrence of events by chance in a happy or beneficial way.', correctAnswer: 'Serendipity', hint: "A fortunate accident"},
    { id: 'a4', word: 'Pulchritudinous', clueType: 'definition', clue: 'Characterized by extreme physical beauty and comeliness.', correctAnswer: 'Pulchritudinous', hint: "Synonym for beautiful (P)"},
  ],
};
const MAX_TIME_PER_QUESTION = 83;

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


export default function GameInterface({ selectedMode, onGoBack }: GameInterfaceProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MAX_TIME_PER_QUESTION);
  const [isHintUsedForQuestion, setIsHintUsedForQuestion] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const wordsForMode = MOCK_WORDS[selectedMode] || MOCK_WORDS.basic;
  const currentWordData = wordsForMode[currentWordIndex];

  const resetTimer = useCallback(() => {
    let duration = MAX_TIME_PER_QUESTION;
    if (selectedMode === 'advanced') duration = 20;
    else if (selectedMode === 'intermediate') duration = 78;
    setTimeLeft(duration);
  }, [selectedMode]);

  useEffect(() => {
    if (currentWordData && selectedMode === 'basic' && currentWordData.options) {
      setShuffledOptions([...currentWordData.options].sort(() => Math.random() - 0.5));
    }
    if ((selectedMode === 'intermediate' || selectedMode === 'advanced') && !gameOver) {
      hiddenInputRef.current?.focus();
    }
  }, [currentWordData, selectedMode, gameOver]);

  useEffect(() => {
    resetTimer();
    setIsHintUsedForQuestion(false);
    setUserInput('');
    setFeedbackMessage(null);
     if ((selectedMode === 'intermediate' || selectedMode === 'advanced') && !gameOver) {
      hiddenInputRef.current?.focus();
    }
  }, [currentWordIndex, selectedMode, resetTimer, gameOver]);

  const proceedToNextOrEnd = useCallback(() => {
    if (currentWordIndex < wordsForMode.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
    } else {
      setGameOver(true);
    }
  }, [currentWordIndex, wordsForMode.length]);

  const handleSubmitAnswer = useCallback(() => {
    if (!currentWordData || feedbackMessage) return;

    let isCorrect = false;
    if (selectedMode === 'basic') {
      isCorrect = userInput === currentWordData.correctAnswer;
    } else {
      isCorrect = userInput.trim().toLowerCase() === currentWordData.correctAnswer.toLowerCase();
    }

    if (isCorrect) {
      setScore(s => s + 10);
      setFeedbackMessage('Correct! 🎉');
    } else {
      setFeedbackMessage(`Oops! The correct answer was: ${currentWordData.correctAnswer}`);
    }

    setTimeout(() => {
      proceedToNextOrEnd();
    }, 1500);
  }, [currentWordData, userInput, selectedMode, feedbackMessage, proceedToNextOrEnd]);

  const handleOptionSelect = (option: string) => {
    if (feedbackMessage) return;
    setUserInput(option);
    if (selectedMode === 'basic') {
        handleSubmitAnswer(); // Submit immediately for basic mode
    }
  };

  const handleSkip = useCallback(() => {
    if (gameOver || feedbackMessage) return;
    setFeedbackMessage(`Skipped! The answer was: ${currentWordData?.correctAnswer || 'N/A'}`);
    setTimeout(() => {
      proceedToNextOrEnd();
    }, 1500);
  }, [gameOver, feedbackMessage, currentWordData, proceedToNextOrEnd]);
  
  const formatTimeForDisplay = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };
  
   useEffect(() => {
    if (gameOver) return;
    if (timeLeft <= 0) {
      handleSkip();
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, gameOver, handleSkip]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (gameOver || feedbackMessage) return;

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
        } else if (event.key.length === 1 && /^[a-zA-Z]$/.test(event.key) && userInput.length < (currentWordData?.correctAnswer.length || 20)) {
          setUserInput(prev => prev + event.key.toUpperCase());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameOver, feedbackMessage, selectedMode, userInput, handleSubmitAnswer, handleSkip, currentWordData]);

  useEffect(() => {
    if (
      (selectedMode === 'intermediate' || selectedMode === 'advanced') &&
      currentWordData &&
      userInput.length === currentWordData.correctAnswer.length &&
      !feedbackMessage
    ) {
      handleSubmitAnswer();
    }
  }, [userInput, currentWordData, selectedMode, handleSubmitAnswer, feedbackMessage]);


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
            <p className="text-muted-foreground">You answered {score / 10} out of {wordsForMode.length} questions correctly.</p>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={onGoBack} variant="outline">Play Again</Button>
          </CardFooter>
        </Card>
      </motion.div>
    );
  }

  if (!currentWordData) {
    return <div className="text-center p-8">Loading word data... <Button onClick={onGoBack}>Back to Modes</Button></div>;
  }

  const renderClueContent = () => {
    switch (currentWordData.clueType) {
      case 'image':
        return (
          <motion.img
            key={`clue-image-${currentWordIndex}`}
            src={currentWordData.clue}
            alt="Word Clue"
            className="rounded-md shadow-md max-w-xs mx-auto h-auto"
            data-ai-hint="game clue image"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        );
      case 'definition':
      case 'fill-in-the-blank':
      case 'meaning':
        return <p className="text-xl md:text-2xl lg:text-3xl text-foreground font-medium leading-tight">{currentWordData.clue}</p>;
      default:
        return <p className="text-muted-foreground">No clue available.</p>;
    }
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
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><KeyboardIcon className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><Volume2 className="h-5 w-5" /></Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><Settings className="h-5 w-5" /></Button>
        </div>
      </div>

      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 min-h-[calc(100vh-150px)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={`clue-panel-${currentWordIndex}`}
            custom="left"
            variants={panelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="bg-card text-card-foreground p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-between relative"
          >
            <div className="absolute top-4 left-4 text-sm text-muted-foreground flex items-center">
              Your clue <ArrowRightToLine className="ml-1 h-4 w-4" />
            </div>

            <div className="my-auto flex items-center justify-center h-full">
              {renderClueContent()}
            </div>

            <div className="mt-auto">
              <div className="flex justify-between items-end">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Button
                      variant="default"
                      size="sm"
                      onClick={handleSkip}
                      disabled={!!feedbackMessage || gameOver}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm px-3 py-1.5 h-auto"
                  >
                      <span className="bg-indigo-700/80 px-1.5 py-0.5 rounded-sm text-xs mr-1.5">esc</span> Skip
                  </Button>
                  <div className="flex items-center text-muted-foreground text-sm">
                      <HelpCircle className="h-4 w-4 mr-1" /> 0
                  </div>
                  <div className="flex items-center text-muted-foreground text-sm">
                      <Flame className="h-4 w-4 mr-1" /> 0
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl sm:text-5xl font-bold tabular-nums text-foreground">{formatTimeForDisplay(timeLeft)}</div>
                  <div className="text-xs text-muted-foreground">Time remaining <ChevronsRight className="inline h-3 w-3" /></div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
        <motion.div
           key={`input-panel-${currentWordIndex}`}
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
                  key={option}
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
                    disabled={!!feedbackMessage}
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
              {currentWordData.hint && (
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
                value={userInput}
                readOnly
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

