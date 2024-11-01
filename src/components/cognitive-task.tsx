"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle } from 'lucide-react';
import { saveToLocalStorage, saveToServer } from '@/utils/storage';

const LetterAlternationTask = () => {
  const [participantData, setParticipantData] = useState({
    id: '',
    name: '',
    dateOfBirth: '',
    education: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [currentPhase, setCurrentPhase] = useState('registration');
  const [currentTrialNumber, setCurrentTrialNumber] = useState(0);
  const [responses, setResponses] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [feedback, setFeedback] = useState({ show: false, isCorrect: false });
  const [saveStatus, setSaveStatus] = useState('');
  const [showStimulus, setShowStimulus] = useState(true);

  // Timing states
  const [phaseStartTime, setPhaseStartTime] = useState(null);
  const [phaseTimes, setPhaseTimes] = useState({
    trial1: null,
    trial2: null,
    trial3: null,
    total: null
  });
  const [taskStartTime, setTaskStartTime] = useState(null);

  const [trialStats, setTrialStats] = useState({
    trial1: {
      correct: 0,
      incorrect: 0,
      averageTime: 0,
      totalTrials: 0
    },
    trial2: {
      correct: 0,
      incorrect: 0,
      averageTime: 0,
      totalTrials: 0
    },
    trial3: {
      correct: 0,
      incorrect: 0,
      averageTime: 0,
      totalTrials: 0
    },
    overall: {
      correct: 0,
      incorrect: 0,
      averageTime: 0,
      totalTrials: 0
    }
  });

  const trialsPerPhase = 20;
  const letterPairs = Array(trialsPerPhase).fill(null).map(() => ({
    top: Math.random() < 0.5 ? 'A' : 'B',
    bottom: Math.random() < 0.5 ? 'A' : 'B',
    colored: Math.random() < 0.5
  }));

  // Keyboard event listener
  // In your cognitive-task.tsx file, update the useEffect hook:

useEffect(() => {
  const handleKeyPress = (event: KeyboardEvent) => {
    if ((currentPhase === 'trial1' || currentPhase === 'trial2' || currentPhase === 'trial3') && 
        showStimulus && 
        !feedback.show) {
      if (event.key === 'ArrowLeft') {
        handleResponse('A');
      } else if (event.key === 'ArrowRight') {
        handleResponse('B');
      }
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => {
    window.removeEventListener('keydown', handleKeyPress);
  };
}, [currentPhase, showStimulus, feedback.show, handleResponse]); // Added handleResponse

// And in handleTaskComplete, remove the localStorageKey variable:
const handleTaskComplete = async () => {
  setSaveStatus('Saving results...');
  
  try {
    const response = await fetch('/api/save-results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        participant: participantData,
        trials: responses,
        stats: trialStats,
        phaseTimes: phaseTimes
      }),
    });

    if (response.ok) {
      setSaveStatus('Results saved successfully!');
    } else {
      setSaveStatus('Error saving results. Please contact the researcher.');
    }
  } catch (error) {
    console.error('Error saving results:', error);
    setSaveStatus('Error saving results. Please contact the researcher.');
  }

  setCurrentPhase('complete');
};

  const completePhase = (currentPhase) => {
    const phaseEndTime = Date.now();
    const phaseDuration = phaseEndTime - phaseStartTime;

    setPhaseTimes(prev => ({
      ...prev,
      [currentPhase]: phaseDuration
    }));
  };

  const updatePhaseStats = (phase, isCorrect, reactionTime) => {
    setTrialStats(prev => {
      const phaseStats = prev[phase];
      const newCorrect = isCorrect ? phaseStats.correct + 1 : phaseStats.correct;
      const newIncorrect = !isCorrect ? phaseStats.incorrect + 1 : phaseStats.incorrect;
      const newTotalTrials = phaseStats.totalTrials + 1;
      const newAverageTime = (phaseStats.averageTime * phaseStats.totalTrials + reactionTime) / newTotalTrials;

      const newOverallCorrect = prev.overall.correct + (isCorrect ? 1 : 0);
      const newOverallIncorrect = prev.overall.incorrect + (!isCorrect ? 1 : 0);
      const newOverallTotal = prev.overall.totalTrials + 1;
      const newOverallAverage = (prev.overall.averageTime * prev.overall.totalTrials + reactionTime) / newOverallTotal;

      return {
        ...prev,
        [phase]: {
          correct: newCorrect,
          incorrect: newIncorrect,
          averageTime: newAverageTime,
          totalTrials: newTotalTrials
        },
        overall: {
          correct: newOverallCorrect,
          incorrect: newOverallIncorrect,
          averageTime: newOverallAverage,
          totalTrials: newOverallTotal
        }
      };
    });
  };

  const handleResponse = (response) => {
    const reactionTime = Date.now() - startTime;
    const currentLetter = letterPairs[currentTrialNumber];
    let isCorrect = false;

    switch (currentPhase) {
      case 'trial1':
        isCorrect = response === currentLetter.top;
        updatePhaseStats('trial1', isCorrect, reactionTime);
        break;
      case 'trial2':
        isCorrect = response === (currentLetter.top === 'A' ? 'B' : 'A');
        updatePhaseStats('trial2', isCorrect, reactionTime);
        break;
      case 'trial3':
        if (currentLetter.colored) {
          isCorrect = response === (currentLetter.top === 'A' ? 'B' : 'A');
        } else {
          isCorrect = response === currentLetter.top;
        }
        updatePhaseStats('trial3', isCorrect, reactionTime);
        break;
    }

    setFeedback({ show: true, isCorrect });
    setShowStimulus(false);

    setResponses(prev => [...prev, {
      trialNumber: currentTrialNumber + 1,
      trialType: currentPhase,
      stimulus: currentLetter.top,
      response,
      isCorrect,
      reactionTime,
      isColored: currentLetter.colored
    }]);

    setTimeout(() => {
      setFeedback({ show: false, isCorrect: false });
      
      if (currentTrialNumber + 1 >= trialsPerPhase) {
        completePhase(currentPhase);
        
        if (currentPhase === 'trial1') {
          setCurrentPhase('instructions2');
        } else if (currentPhase === 'trial2') {
          setCurrentPhase('instructions3');
        } else {
          const totalTaskTime = Date.now() - taskStartTime;
          setPhaseTimes(prev => ({
            ...prev,
            total: totalTaskTime
          }));
          handleTaskComplete();
        }
      } else {
        setCurrentTrialNumber(prev => prev + 1);
        setTimeout(() => {
          setShowStimulus(true);
          setStartTime(Date.now());
        }, 100);
      }
    }, 100);
  };

  const getLetterStyle = () => {
    if (currentPhase === 'trial3' && letterPairs[currentTrialNumber].colored) {
      return 'text-6xl font-bold text-blue-600';
    }
    return 'text-6xl font-bold text-black';
  };

  const renderFeedback = () => {
    if (!feedback.show) return null;
    return feedback.isCorrect ? (
      <CheckCircle className="text-green-500 w-8 h-8" />
    ) : (
      <XCircle className="text-red-500 w-8 h-8" />
    );
  };

  const renderTrialStats = () => {
    if (currentPhase === 'trial1' || currentPhase === 'trial2' || currentPhase === 'trial3') {
      const currentStats = trialStats[currentPhase];
      return (
        <div className="mt-4 text-sm space-y-1">
          <p className="text-green-600">Correct: {currentStats.correct}</p>
          <p className="text-red-600">Incorrect: {currentStats.incorrect}</p>
          <p>Average Time: {currentStats.averageTime.toFixed(0)}ms</p>
        </div>
      );
    }
    return null;
  };

  const renderComplete = () => (
    <div className="text-center space-y-4">
      <h2 className="text-xl font-bold">Task Complete!</h2>
      <p>Thank you for your participation.</p>
      <div className="text-left space-y-4">
        <div>
          <h3 className="font-bold">Phase 1 (Reading) Results:</h3>
          <p className="text-green-600">Correct: {trialStats.trial1.correct}</p>
          <p className="text-red-600">Incorrect: {trialStats.trial1.incorrect}</p>
          <p>Accuracy: {((trialStats.trial1.correct / trialStats.trial1.totalTrials) * 100).toFixed(1)}%</p>
          <p>Average Time: {trialStats.trial1.averageTime.toFixed(0)}ms</p>
          <p>Phase Completion Time: {(phaseTimes.trial1 / 1000).toFixed(2)} seconds</p>
        </div>
        <div>
          <h3 className="font-bold">Phase 2 (Alternating) Results:</h3>
          <p className="text-green-600">Correct: {trialStats.trial2.correct}</p>
          <p className="text-red-600">Incorrect: {trialStats.trial2.incorrect}</p>
          <p>Accuracy: {((trialStats.trial2.correct / trialStats.trial2.totalTrials) * 100).toFixed(1)}%</p>
          <p>Average Time: {trialStats.trial2.averageTime.toFixed(0)}ms</p>
          <p>Phase Completion Time: {(phaseTimes.trial2 / 1000).toFixed(2)} seconds</p>
        </div>
        <div>
          <h3 className="font-bold">Phase 3 (Hybrid) Results:</h3>
          <p className="text-green-600">Correct: {trialStats.trial3.correct}</p>
          <p className="text-red-600">Incorrect: {trialStats.trial3.incorrect}</p>
          <p>Accuracy: {((trialStats.trial3.correct / trialStats.trial3.totalTrials) * 100).toFixed(1)}%</p>
          <p>Average Time: {trialStats.trial3.averageTime.toFixed(0)}ms</p>
          <p>Phase Completion Time: {(phaseTimes.trial3 / 1000).toFixed(2)} seconds</p>
        </div>
        <div className="mt-6">
          <h3 className="font-bold">Overall Results:</h3>
          <p>Total Trials: {trialStats.overall.totalTrials}</p>
          <p className="text-green-600">Total Correct: {trialStats.overall.correct}</p>
          <p className="text-red-600">Total Incorrect: {trialStats.overall.incorrect}</p>
          <p>Overall Accuracy: {((trialStats.overall.correct / trialStats.overall.totalTrials) * 100).toFixed(1)}%</p>
          <p>Overall Average Response Time: {trialStats.overall.averageTime.toFixed(0)}ms</p>
          <p>Total Task Time: {(phaseTimes.total / 1000).toFixed(2)} seconds</p>
        </div>
        {saveStatus && (
          <p className="text-blue-600 mt-4">{saveStatus}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-2xl font-bold text-center">
          Letter Alternation Task
        </CardHeader>
        <CardContent>
          {currentPhase === 'registration' && (
            <form onSubmit={handleRegistrationSubmit} className="space-y-4">
              <div>
                <Label htmlFor="id">Participant ID</Label>
                <Input
                  id="id"
                  value={participantData.id}
                  onChange={(e) => setParticipantData(prev => ({...prev, id: e.target.value}))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={participantData.name}
                  onChange={(e) => setParticipantData(prev => ({...prev, name: e.target.value}))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="dob">Date of Birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={participantData.dateOfBirth}
                  onChange={(e) => setParticipantData(prev => ({...prev, dateOfBirth: e.target.value}))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="education">Years of Education</Label>
                <Input
                  id="education"
                  type="number"
                  value={participantData.education}
                  onChange={(e) => setParticipantData(prev => ({...prev, education: e.target.value}))}
                  required
                />
              </div>
              <Button type="submit" className="w-full">Start Task</Button>
            </form>
          )}

          {currentPhase === 'instructions' && (
            <div className="space-y-4">
              <p>Trial 1: Read the letter shown (A or B)</p>
              <p className="text-sm text-gray-600">Use the left arrow key for A and right arrow key for B</p>
              <Button onClick={() => startTrial('trial1')} className="w-full">
                Begin Trial 1
              </Button>
            </div>
          )}

          {currentPhase === 'instructions2' && (
            <div className="space-y-4">
              <p>Trial 2: Say the opposite letter of what is shown</p>
              <p className="text-sm text-gray-600">Use the left arrow key for A and right arrow key for B</p>
              <Button onClick={() => startTrial('trial2')} className="w-full">
                Begin Trial 2
              </Button>
            </div>
          )}

          {currentPhase === 'instructions3' && (
            <div className="space-y-4">
              <p>Trial 3: Read the letter normally when black, but say the opposite for blue letters</p>
              <p className="text-sm text-gray-600">Use the left arrow key for A and right arrow key for B</p>
              <Button onClick={() => startTrial('trial3')} className="w-full">
                Begin Trial 3
              </Button>
            </div>
          )}

          {(currentPhase === 'trial1' || currentPhase === 'trial2' || currentPhase === 'trial3') && (
            <div className="text-center space-y-8">
              <div className={getLetterStyle()} style={{ minHeight: '72px' }}>
                {showStimulus && letterPairs[currentTrialNumber].top}
              </div>
              <div className="space-x-4">
                <Button 
                  onClick={() => handleResponse('A')}
                  disabled={feedback.show || !showStimulus}
                  className="relative"
                >
                  A
                  <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
                    ←
                  </span>
                </Button>
                <Button 
                  onClick={() => handleResponse('B')}
                  disabled={feedback.show || !showStimulus}
                  className="relative"
                >
                  B
                  <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">
                    →
                  </span>
                </Button>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <div className="text-sm">
                  Trial {currentTrialNumber + 1} of {trialsPerPhase}
                </div>
                {renderFeedback()}
                {renderTrialStats()}
              </div>
            </div>
          )}

          {currentPhase === 'complete' && renderComplete()}
        </CardContent>
      </Card>
    </div>
  );
};

export default LetterAlternationTask;