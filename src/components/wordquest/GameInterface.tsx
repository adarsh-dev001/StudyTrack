
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Timer, HelpCircle, SkipForward, Star, ArrowLeft, ImageIcon, ListChecks, Library, Flame, Skull } from 'lucide-react'; // Adjusted icons
import type { GameMode, GameModeDetails, WordData } from './types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Updated gameModesDetails to match the new "Expert" mode and icons
const gameModesDetails: Record<GameMode, GameModeDetails> = {
  junior: { title: 'Junior Journey', description: 'Pictures & Simple Words', icon: ImageIcon },
  basic: { title: 'Basic Builder', description: 'Everyday Words - MCQs', icon: ListChecks },
  intermediate: { title: 'Intermediate Challenge', description: 'Fill-in-the-blanks', icon: Library },
  advanced: { title: 'Advanced Arena', description: 'Descriptive Clues - Timed', icon: Flame },
  expert: { title: 'Expert Arena', description: 'Rare & Sophisticated Words', icon: Skull }, // Changed from Rapid Fire
};

// Placeholder word data - Updated for "Expert" mode
const MOCK_WORDS: Record<GameMode, WordData[]> = {
  junior: [
    { id: 'j1', word: 'Apple', clueType: 'image', clue: 'https://placehold.co/300x200/FF0000/FFFFFF?text=Apple', options: [], correctAnswer: 'Apple' },
    { id: 'j2', word: 'Ball', clueType: 'image', clue: 'https://placehold.co/300x200/0000FF/FFFFFF?text=Ball', options: [], correctAnswer: 'Ball' },
    { id: 'j3', word: 'Cat', clueType: 'image', clue: 'https://placehold.co/300x200/FFFF00/000000?text=Cat', options: [], correctAnswer: 'Cat' },
  ],
  basic: [
    { id: 'b1', word: 'Happy', clueType: 'definition', clue: 'Feeling or showing pleasure or contentment.', options: ['Sad', 'Happy', 'Angry', 'Tired'], correctAnswer: 'Happy' },
    { id: 'b2', word: 'Run', clueType: 'definition', clue: 'Move at a speed faster than a walk.', options: ['Walk', 'Sit', 'Run', 'Jump'], correctAnswer: 'Run' },
    { id: 'b3', word: 'Big', clueType: 'definition', clue: 'Of considerable size or extent.', options: ['Small', 'Tiny', 'Big', 'Little'], correctAnswer: 'Big' },
  ],
  intermediate: [
    { id: 'i1', word: 'Persistent', clueType: 'fill-in-the-blank', clue: 'She was ___ in her efforts to learn coding. (Starts with P)', correctAnswer: 'Persistent', hint: "Starts with P" },
    { id: 'i2', word: 'Elaborate', clueType: 'fill-in-the-blank', clue: 'Can you ___ on that point? (Means to add more detail)', correctAnswer: 'Elaborate', hint: "Involves adding more detail" },
    { id: 'i3', word: 'Gratitude', clueType: 'fill-in-the-blank', clue: "Showing thankfulness and appreciation. (Ends with 'ude') ", correctAnswer: 'Gratitude', hint: "A feeling of thankfulness"},
  ],
  advanced: [
    { id: 'a1', word: 'Ephemeral', clueType: 'definition', clue: 'Lasting for a very short time.', options: [], correctAnswer: 'Ephemeral', hint: "Think 'fleeting'" },
    { id: 'a2', word: 'Ubiquitous', clueType: 'definition', clue: 'Present, appearing, or found everywhere.', options: [], correctAnswer: 'Ubiquitous', hint: "Like air, or popular trends"},
    { id: 'a3', word: 'Serendipity', clueType: 'definition', clue: 'The occurrence of events by chance in a happy or beneficial way.', options: [], correctAnswer: 'Serendipity', hint: "A fortunate accident"},
  ],
  expert: [ // New "Expert" mode data, similar to advanced for now
    { id: 'e1', word: 'Pulchritudinous', clueType: 'definition', clue: 'Having great physical beauty.', options: [], correctAnswer: 'Pulchritudinous', hint: "Relates to beauty" },
    { id: 'e2', word: 'Mellifluous', clueType: 'definition', clue: 'Pleasant and musical to hear.', options: [], correctAnswer: 'Mellifluous', hint: "Describes a sweet sound"},
    { id: 'e3', word: 'Supersede', clueType: 'definition', clue: 'Take the place of (a person or thing previously in authority or use); supplant.', options: [], correctAnswer: 'Supersede', hint: "To replace something older"},
  ],
};
const MAX_TIME_PER_QUESTION = 30; 

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


  const wordsForMode = MOCK_WORDS[selectedMode] || MOCK_WORDS.basic; // Fallback to basic if mode's words aren't defined
  const currentWordData = wordsForMode[currentWordIndex];

  const resetTimer = useCallback(() => {
    let duration = MAX_TIME_PER_QUESTION;
    // Adjust timer based on mode if needed
    if (selectedMode === 'advanced' || selectedMode === 'expert') duration = 20;
    setTimeLeft(duration);
  }, [selectedMode]);

  useEffect(() => {
    if (currentWordData && (selectedMode === 'basic') && currentWordData.options) { // Only basic mode uses MCQ from mock_words for now
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
  }, [timeLeft, gameOver]); // Removed handleSkip from deps

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
      setUserInput(option); 
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
  
  const renderClue = () => {
    switch (currentWordData.clueType) {
      case 'image':
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentWordData.clue} alt="Word Clue" className="rounded-md shadow-md max-w-xs mx-auto" data-ai-hint="game clue" />
        );
      case 'definition':
      case 'fill-in-the-blank':
      case 'meaning': 
        return <p className="text-lg text-foreground leading-relaxed">{currentWordData.clue}</p>;
      default:
        return <p className="text-muted-foreground">No clue available.</p>;
    }
  };

  const renderAnswerArea = () => {
    if (selectedMode === 'basic' && currentWordData.options && currentWordData.options.length > 0) {
      return (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {shuffledOptions.map(option => (
            <Button key={option} variant="outline" className="text-sm h-auto py-2.5" onClick={() => handleOptionSelect(option)}>
              {option}
            </Button>
          ))}
        </div>
      );
    }
    return (
      <form onSubmit={(e) => { e.preventDefault(); handleSubmitAnswer(); }} className="space-y-3">
        <Input
          type="text"
          placeholder={selectedMode === 'junior' ? `Type the word for the picture` : `Type your answer here...`}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          className="text-base h-11"
          disabled={!!feedbackMessage}
        />
        <Button type="submit" className="w-full" disabled={!userInput.trim() || !!feedbackMessage}>Submit Answer</Button>
      </form>
    );
  };


  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <Button onClick={onGoBack} variant="outline" size="sm" className="mb-2">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Modes
      </Button>

      <motion.div
        key={currentWordIndex} 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="shadow-xl overflow-hidden">
          <CardHeader className="p-4 sm:p-5 bg-muted/50">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl sm:text-2xl text-primary">{gameModesDetails[selectedMode]?.title || selectedMode}</CardTitle>
              <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
                <div className="flex items-center text-muted-foreground">
                  <Timer className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" /> {timeLeft}s
                </div>
                <div className="flex items-center font-semibold text-primary">
                  <Star className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 fill-yellow-400" /> Score: {score}
                </div>
              </div>
            </div>
             <Progress value={(timeLeft / MAX_TIME_PER_QUESTION) * 100} className="h-1.5 sm:h-2 mt-2" />
          </CardHeader>

          <CardContent className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className={cn("md:col-span-2 p-3 sm:p-4 border rounded-lg bg-background shadow-inner min-h-[150px] sm:min-h-[200px] flex flex-col justify-center items-center text-center", feedbackMessage && (feedbackMessage.includes('Correct') ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'))}>
              {feedbackMessage ? (
                <motion.div initial={{scale:0.5, opacity:0}} animate={{scale:1, opacity:1}} className="text-lg sm:text-xl font-semibold">
                    {feedbackMessage}
                </motion.div>
              ) : (
                <>
                  {selectedMode === 'junior' && <ImageIcon className="h-8 w-8 text-primary mb-2"/>}
                  {renderClue()}
                </>
              )}
            </div>

            <div className="space-y-3 sm:space-y-4 flex flex-col justify-between">
              <div>
                {(selectedMode === 'intermediate' || selectedMode === 'advanced' || selectedMode === 'expert') && (
                  <div className="mb-3 p-2 border-dashed border-2 rounded-md text-center text-sm sm:text-lg tracking-[0.2em] font-mono h-10 sm:h-12 flex items-center justify-center bg-muted/30">
                    {isHintVisible && currentWordData.hint ? currentWordData.hint : 
                     currentWordData.correctAnswer.split('').map((_, i) => (userInput[i] || '_')).join(' ')}
                  </div>
                )}
                {renderAnswerArea()}
              </div>

              <div className="space-y-2">
                {currentWordData.hint && (selectedMode === 'intermediate' || selectedMode === 'advanced' || selectedMode === 'expert') && (
                  <Button variant="outline" onClick={toggleHint} className="w-full text-xs sm:text-sm" disabled={!!feedbackMessage}>
                    <HelpCircle className="mr-2 h-4 w-4" /> {isHintVisible ? 'Hide' : 'Show'} Hint
                  </Button>
                )}
                <Button variant="secondary" onClick={handleSkip} className="w-full text-xs sm:text-sm" disabled={!!feedbackMessage}>
                  <SkipForward className="mr-2 h-4 w-4" /> Skip Question
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

    