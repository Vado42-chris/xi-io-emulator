/** Classify emulator process exit codes for GUI emulators (FCEUX, RetroArch). */
export const classifyEmulatorExit = (exitCode: number | null | undefined): 'clean' | 'error' => {
  if (exitCode === null || exitCode === undefined) {
    // Unix signal termination or missing code — common when closing Qt/SDL windows.
    return 'clean';
  }
  if (exitCode === 0 || exitCode === 130 || exitCode === 143) {
    return 'clean';
  }
  return 'error';
};

export const emulatorExitSummary = (exitCode: number | null | undefined): string => {
  const kind = classifyEmulatorExit(exitCode);
  if (kind === 'clean') {
    if (exitCode === null || exitCode === undefined) {
      return 'Emulator closed (no exit code reported — treated as normal quit).';
    }
    return 'Emulator closed normally.';
  }
  return `Emulator exited with code ${exitCode}.`;
};
