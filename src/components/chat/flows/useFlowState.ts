import { useState, useCallback, useEffect } from 'react';
import { 
  FlowState, 
  FlowType, 
  FlowAction, 
  UserFlowData 
} from './types';

const STORAGE_KEY = 'mobile11_chatbot_flow_state';

const initialState: FlowState = {
  currentFlow: 'home',
  currentStep: null,
  previousFlow: null,
  previousStep: null,
  userData: {},
  history: [],
};

// Load state from localStorage
function loadPersistedState(): FlowState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate the parsed state has required properties
      if (parsed && typeof parsed === 'object' && parsed.currentFlow) {
        return {
          ...initialState,
          ...parsed,
          // Ensure arrays exist
          history: Array.isArray(parsed.history) ? parsed.history : [],
          userData: parsed.userData || {},
        };
      }
    }
  } catch (e) {
    console.error('[useFlowState] Error loading persisted state:', e);
  }
  return initialState;
}

// Save state to localStorage
function persistState(state: FlowState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('[useFlowState] Error persisting state:', e);
  }
}

export function useFlowState() {
  const [state, setState] = useState<FlowState>(() => loadPersistedState());

  // Persist state changes to localStorage
  useEffect(() => {
    persistState(state);
  }, [state]);

  const dispatch = useCallback((action: FlowAction) => {
    setState(prev => {
      let newState: FlowState;
      
      switch (action.type) {
        case 'navigate': {
          const newFlow = action.payload?.flow || prev.currentFlow;
          const newStep = action.payload?.step || null;
          
          newState = {
            ...prev,
            previousFlow: prev.currentFlow,
            previousStep: prev.currentStep,
            currentFlow: newFlow,
            currentStep: newStep,
            history: [
              ...prev.history,
              { flow: prev.currentFlow, step: prev.currentStep }
            ],
            userData: action.payload?.data 
              ? { ...prev.userData, ...action.payload.data }
              : prev.userData,
          };
          break;
        }
        
        case 'back': {
          if (prev.history.length === 0) {
            newState = { ...initialState };
          } else {
            const lastState = prev.history[prev.history.length - 1];
            newState = {
              ...prev,
              currentFlow: lastState.flow,
              currentStep: lastState.step,
              previousFlow: null,
              previousStep: null,
              history: prev.history.slice(0, -1),
            };
          }
          break;
        }
        
        case 'start-over': {
          newState = { 
            ...initialState,
            // Preserve some user data like email if they provided it
            userData: { email: prev.userData.email },
          };
          break;
        }
        
        case 'update-data': {
          newState = {
            ...prev,
            userData: { ...prev.userData, ...action.payload?.data },
          };
          break;
        }
        
        case 'complete-step': {
          const stepId = action.payload?.stepId;
          if (!stepId) {
            newState = prev;
          } else {
            const completedSteps = [...(prev.userData.completedSteps || []), stepId];
            newState = {
              ...prev,
              userData: { ...prev.userData, completedSteps },
            };
          }
          break;
        }
        
        default:
          newState = prev;
      }
      
      return newState;
    });
  }, []);

  const navigateTo = useCallback((flow: FlowType, step?: string, data?: Partial<UserFlowData>) => {
    dispatch({ type: 'navigate', payload: { flow, step, data } });
  }, [dispatch]);

  const navigateToStep = useCallback((step: string, data?: Partial<UserFlowData>) => {
    dispatch({ type: 'navigate', payload: { step, data } });
  }, [dispatch]);

  const goBack = useCallback(() => {
    dispatch({ type: 'back' });
  }, [dispatch]);

  const startOver = useCallback(() => {
    dispatch({ type: 'start-over' });
  }, [dispatch]);

  const updateData = useCallback((data: Partial<UserFlowData>) => {
    dispatch({ type: 'update-data', payload: { data } });
  }, [dispatch]);

  const completeStep = useCallback((stepId: string) => {
    dispatch({ type: 'complete-step', payload: { stepId } });
  }, [dispatch]);

  const isStepCompleted = useCallback((stepId: string) => {
    return state.userData.completedSteps?.includes(stepId) || false;
  }, [state.userData.completedSteps]);

  const canGoBack = state.history.length > 0;

  return {
    state,
    navigateTo,
    navigateToStep,
    goBack,
    startOver,
    updateData,
    completeStep,
    isStepCompleted,
    canGoBack,
  };
}
