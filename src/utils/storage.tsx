// src/utils/storage.ts - update the interfaces

interface TrialResponse {
    trialNumber: number;
    trialType: string;
    stimulus: string;
    response: string;
    isCorrect: boolean;
    reactionTime: number;
    isColored: boolean;
  }
  
  interface PhaseStats {
    correct: number;
    incorrect: number;
    averageTime: number;
    totalTrials: number;
  }
  
  interface TaskStats {
    trial1: PhaseStats;
    trial2: PhaseStats;
    trial3: PhaseStats;
    overall: {
      correct: number;
      incorrect: number;
      averageTime: number;
      totalTrials: number;
    };
  }
  
  interface ParticipantData {
    id: string;
    name: string;
    dateOfBirth: string;
    education: string;
    date: string;
  }
  
  interface TaskResult {
    participant: ParticipantData;
    trials: TrialResponse[];
    stats: TaskStats;
  }
  
  
  // Local storage functions
  export const saveToLocalStorage = (result: TaskResult) => {
    try {
      // Create a unique key using participant ID and timestamp
      const key = `cognitive-task-${result.participant.id}-${Date.now()}`;
      localStorage.setItem(key, JSON.stringify(result));
      return key;
    } catch (error) {
      console.error('Error saving to local storage:', error);
      return null;
    }
  };
  
  // Server storage function
  export const saveToServer = async (result: TaskResult) => {
    try {
      const response = await fetch('/api/save-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save results');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving to server:', error);
      return null;
    }
  };