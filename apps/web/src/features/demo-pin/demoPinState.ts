import { validateDemoPin, type DemoPinStateId } from "@nerdeus/shared";

export type DemoPinUiState = {
  state: DemoPinStateId;
  input: string;
  message: string;
  unlocked: boolean;
};

export const initialDemoPinUiState: DemoPinUiState = {
  state: "locked",
  input: "",
  message: "Protected demo actions are locked.",
  unlocked: false
};

export function updateDemoPinInput(state: DemoPinUiState, input: string): DemoPinUiState {
  return { ...state, input };
}

export function submitDemoPin(state: DemoPinUiState): DemoPinUiState {
  const result = validateDemoPin(state.input);
  if (result.ok) {
    return {
      state: "unlocked",
      input: "",
      message: "Demo proceed actions unlocked.",
      unlocked: true
    };
  }
  return {
    state: result.state,
    input: "",
    message: result.reason === "empty_pin" ? "Enter the demo PIN to proceed." : "Wrong demo PIN.",
    unlocked: false
  };
}

export function clearDemoPinUnlock(): DemoPinUiState {
  return {
    state: "cleared",
    input: "",
    message: "Demo proceed unlock cleared.",
    unlocked: false
  };
}
