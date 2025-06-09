
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Timer, HelpCircle, SkipForward, Star, ArrowLeft, ImageIcon, ListChecks, Library, Flame, Skull, ThumbsUp, ThumbsDown, Volume2, Settings, KeyboardIcon, ArrowRightToLine } from 'lucide-react'; // Added more icons
import type { GameMode, GameModeDetails, WordData } from './types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const gameModesDetails: Record<GameMode, GameModeDetails> = {
  junior: { title: 'Junior Journey', description: 'Pictures & Simple Words', icon: ImageIcon, colorClass: 'border-blue-500/30 bg-blue-500/5 hover:shadow-blue-500/10', iconColorClass: 'text-blue-500' },
  basic: { title: 'Basic Builder', description: 'Everyday Words - MCQs', icon: ListChecks, colorClass: 'border-green-500/30 bg-green-500/5 hover:shadow-green-500/10', iconColorClass: 'text-green-500' },
  intermediate: { title: 'Intermediate Challenge', description: 'Fill-in-the-blanks', icon: Library, colorClass: 'border-teal-500/30 bg-teal-500/5 hover:shadow-teal-500/10', iconColorClass: 'text-teal-500' },
  advanced: { title: 'Advanced Arena', description: 'Descriptive Clues - Timed', icon: Flame, colorClass: 'border-orange-500/30 bg-orange-500/5 hover:shadow-orange-500/10', iconColorClass: 'text-orange-500' },
  expert: { title: 'Expert Arena', description: 'Rare & Sophisticated Words', icon: Skull, colorClass: 'border-purple-500/30 bg-purple-500/5 hover:shadow-purple-500/10', iconColorClass: 'text-purple-500' },
};

const MOCK_WORDS: Record<GameMode, WordData[]> = {
  junior: [
    { id: 'j1', word: 'Apple', clueType: 'image', clue: 'https://placehold.co/300x200/FF0000/FFFFFF?text=Apple', correctAnswer: 'Apple' },
    { id: 'j2', word: 'Ball', clueType: 'image', clue: 'https://placehold.co/300x200/0000FF/FFFFFF?text=Ball', correctAnswer: 'Ball' },
    { id: 'j3', word: 'Cat', clueType: 'image', clue: 'https://placehold.co/300x200/FFFF00/000000?text=Cat', correctAnswer: 'Cat' },
  ],
  basic: [ // Adjusted to 3 options
    { id: 'b1', word: 'Deep', clueType: 'definition', clue: 'adjective. Going far down from the surface or far inside.', options: ['Magazine', 'Deep', 'Japan'], correctAnswer: 'Deep' },
    { id: 'b2', word: 'Run', clueType: 'definition', clue: 'Move at a speed faster than a walk.', options: ['Walk', 'Sit', 'Run'], correctAnswer: 'Run' },
    { id: 'b3', word: 'Big', clueType: 'definition', clue: 'Of considerable size or extent.', options: ['Small', 'Tiny', 'Big'], correctAnswer: 'Big' },
  ],
  intermediate: [
    { id: 'i1', word: 'Persistent', clueType: 'fill-in-the-blank', clue: 'She was ___ in her efforts to learn coding. (Starts with P)', correctAnswer: 'Persistent', hint: "Starts with P" },
    { id: 'i2', word: 'Elaborate', clueType: 'fill-in-the-blank', clue: 'Can you ___ on that point? (Means to add more detail)', correctAnswer: 'Elaborate', hint: "Involves adding more detail" },
    { id: 'i3', word: 'Gratitude', clueType: 'fill-in-the-blank', clue: "Showing thankfulness and appreciation. (Ends with 'ude') ", correctAnswer: 'Gratitude', hint: "A feeling of thankfulness"},
  ],
  advanced: [
    { id: 'a1', word: 'Ephemeral', clueType: 'definition', clue: 'Lasting for a very short time.', correctAnswer: 'Ephemeral', hint: "Think 'fleeting'" },
    { id: 'a2', word: 'Ubiquitous', clueType: 'definition', clue: 'Present, appearing, or found everywhere.', correctAnswer: 'Ubiquitous', hint: "Like air, or popular trends"},
    { id: 'a3', word: 'Serendipity', clueType: 'definition', clue: 'The occurrence of events by chance in a happy or beneficial way.', correctAnswer: 'Serendipity', hint: "A fortunate accident"},
  ],
  expert: [
    { id: 'e1', word: 'Pulchritudinous', clueType: 'definition', clue: 'Having great physical beauty.', correctAnswer: 'Pulchritudinous', hint: "Relates to beauty" },
    { id: 'e2', word: 'Mellifluous', clueType: 'definition', clue: 'Pleasant and musical to hear.', correctAnswer: 'Mellifluous', hint: "Describes a sweet sound"},
    { id: 'e3', word: 'Supersede', clueType: 'definition', clue: 'Take the place of (a person or thing previously in authority or use); supplant.', correctAnswer: 'Supersede', hint: "To replace something older"},
  ],
};
const MAX_TIME_PER_QUESTION = 83; // 1:23 in seconds for Basic mode example

interface GameInterfaceProps {
  selectedMode: GameMode;
  onGoBack: () => void;
}

export default function GameInterface({ selectedMode, onGoBack }: GameInterfaceProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MAX_TIME_PER_QUESTION);
  const [isHintVisible, setIsHintVisible] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

  const wordsForMode = MOCK_WORDS[selectedMode] || MOCK_WORDS.basic;
  const currentWordData = wordsForMode[currentWordIndex];

  const resetTimer = useCallback(() => {
    let duration = MAX_TIME_PER_QUESTION;
    if (selectedMode === 'advanced' || selectedMode === 'expert') duration = 20;
    else if (selectedMode === 'intermediate') duration = 45;
    else if (selectedMode === 'junior') duration = 60;
    setTimeLeft(duration);
  }, [selectedMode]);

  useEffect(() => {
    if (currentWordData && (selectedMode === 'basic') && currentWordData.options) {
      setShuffledOptions([...currentWordData.options].sort(() => Math.random() - 0.5));
    }
  }, [currentWordData, selectedMode]);

  useEffect(() => {
    resetTimer();
    setIsHintVisible(false);
    setUserInput('');
    setFeedbackMessage(null);
  }, [currentWordIndex, selectedMode, resetTimer]);

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
  }, [timeLeft, gameOver]);

  const handleSubmitAnswer = () => {
    if (!currentWordData) return;
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
      if (currentWordIndex < wordsForMode.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
      } else {
        setGameOver(true);
      }
    }, 1500);
  };

  const handleOptionSelect = (option: string) => {
    setUserInput(option); // Set userInput for consistency, even though direct submit happens
    if (currentWordData) {
      const isCorrect = option === currentWordData.correctAnswer;
      if (isCorrect) {
        setScore(s => s + 10);
        setFeedbackMessage('Correct! 🎉');
      } else {
        setFeedbackMessage(`Oops! Correct answer: ${currentWordData.correctAnswer}`);
      }
      setTimeout(() => {
        if (currentWordIndex < wordsForMode.length - 1) {
          setCurrentWordIndex(prev => prev + 1);
        } else {
          setGameOver(true);
        }
      }, 1500);
    }
  };

  const handleSkip = () => {
    if (gameOver) return;
    setFeedbackMessage(`Skipped! The answer was: ${currentWordData?.correctAnswer || 'N/A'}`);
    setTimeout(() => {
      if (currentWordIndex < wordsForMode.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
      } else {
        setGameOver(true);
      }
    }, 1500);
  };

  const toggleHint = () => setIsHintVisible(prev => !prev);
  
  const formatTimeForDisplay = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  if (gameOver) {
    return (
      <Card className="w-full max-w-lg mx-auto text-center shadow-xl animate-in fade-in-50">
        <CardHeader>
          <Star className="mx-auto h-12 w-12 text-yellow-400 mb-2" />
          <CardTitle className="text-2xl font-bold">Game Over!</CardTitle>
          <CardDescription>Mode: {gameModesDetails[selectedMode]?.title || selectedMode}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-primary mb-4">{score}</p>
          <p className="text-muted-foreground">You answered {score / 10} out of {wordsForMode.length} questions correctly.</p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button onClick={onGoBack} variant="outline">Play Again</Button>
        </CardFooter>
      </Card>
    );
  }

  if (!currentWordData) {
    return <div className="text-center p-8">Loading word data or game finished... <Button onClick={onGoBack}>Back to Modes</Button></div>;
  }

  const renderClueContent = () => {
    switch (currentWordData.clueType) {
      case 'image':
        return (
          <img src={currentWordData.clue} alt="Word Clue" className="rounded-md shadow-md max-w-xs mx-auto h-auto" data-ai-hint="game clue image" />
        );
      case 'definition':
      case 'fill-in-the-blank':
      case 'meaning':
        return <p className="text-xl md:text-2xl lg:text-3xl text-foreground font-medium leading-tight">{currentWordData.clue}</p>;
      default:
        return <p className="text-muted-foreground">No clue available.</p>;
    }
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

      <div className="flex-grow grid grid-cols-1 md:grid-cols-3 min-h-[calc(100vh-150px)]"> {/* Adjust min-height as needed */}
        {/* Left Panel: Clue and Timer */}
        <motion.div 
          key={`clue-${currentWordIndex}`}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="md:col-span-2 bg-card text-card-foreground p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-center items-center text-center relative"
        >
          <div className="absolute top-4 left-4 text-sm text-muted-foreground flex items-center">
            Your clue <ArrowRightToLine className="ml-1 h-4 w-4" />
          </div>
          
          <div className="my-auto">
            {renderClueContent()}
          </div>

          <div className="absolute bottom-4 left-4 flex items-center space-x-3">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-green-500"><ThumbsUp className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500"><ThumbsDown className="h-5 w-5" /></Button>
          </div>
          <div className="absolute bottom-4 right-4 text-center">
            <div className="text-4xl sm:text-5xl font-bold tabular-nums text-foreground">{formatTimeForDisplay(timeLeft)}</div>
            <div className="text-xs text-muted-foreground">Time remaining</div>
          </div>
        </motion.div>

        {/* Right Panel: Options or Input */}
        <motion.div 
           key={`options-${currentWordIndex}`}
           initial={{ opacity: 0, x: 30 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
          className="bg-muted/30 p-6 sm:p-8 flex flex-col justify-center"
        >
          {selectedMode === 'basic' && currentWordData.options ? (
            <div className="space-y-3">
              {shuffledOptions.map((option, index) => (
                <Button
                  key={option}
                  variant="outline"
                  className={cn(
                    "w-full h-auto py-4 sm:py-5 text-base sm:text-lg justify-between items-center text-left whitespace-normal hover:bg-primary/10 hover:border-primary",
                    userInput === option && "bg-primary/20 border-primary ring-2 ring-primary"
                  )}
                  onClick={() => handleOptionSelect(option)}
                  disabled={!!feedbackMessage}
                >
                  <span>{option}</span>
                  <span className="text-xs font-mono text-muted-foreground border border-border rounded-full h-5 w-5 flex items-center justify-center ml-2">
                    {index + 1}
                  </span>
                </Button>
              ))}
            </div>
          ) : (
            // Fallback for non-basic or if options are missing (should not happen for basic if data is correct)
            <form onSubmit={(e) => { e.preventDefault(); handleSubmitAnswer(); }} className="space-y-4">
              <Input
                type="text"
                placeholder="Type your answer..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="text-lg h-12"
                disabled={!!feedbackMessage}
              />
              <Button type="submit" className="w-full h-12 text-lg" disabled={!userInput.trim() || !!feedbackMessage}>
                Submit
              </Button>
            </form>
          )}
           {feedbackMessage && (
            <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className={cn(
                    "mt-4 p-3 rounded-md text-center font-semibold text-sm",
                    feedbackMessage.includes('Correct') ? "bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-300" 
                                                        : "bg-red-100 text-red-700 dark:bg-red-800/30 dark:text-red-300"
                )}
            >
                {feedbackMessage}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

