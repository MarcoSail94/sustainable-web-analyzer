/**
 * Enhanced loading steps feedback system.
 * This provides better visual feedback during the analysis process.
 */

// Store the steps and their current state
const loadingSteps = {
  step1: { id: 'loadingStep1', status: 'pending', name: 'Analisi risorse' },
  step2: { id: 'loadingStep2', status: 'pending', name: 'Misurazione performance' },
  step3: { id: 'loadingStep3', status: 'pending', name: 'Calcolo impatto ambientale' },
  step4: { id: 'loadingStep4', status: 'pending', name: 'Analisi economica' }
};

/**
 * Initialize the loading steps system
 */
export function initLoadingSteps() {
  // Reset all steps to pending state
  Object.values(loadingSteps).forEach(step => {
    step.status = 'pending';
    updateStepUI(step.id, 'pending');
  });

  // Listen to analysis events
  document.addEventListener('analysis:resource-start', () => updateStep('step1', 'active'));
  document.addEventListener('analysis:resource-complete', () => updateStep('step1', 'completed'));
  document.addEventListener('analysis:resource-error', () => updateStep('step1', 'error'));

  document.addEventListener('analysis:webvitals-start', () => updateStep('step2', 'active'));
  document.addEventListener('analysis:webvitals-complete', () => updateStep('step2', 'completed'));
  document.addEventListener('analysis:webvitals-error', () => updateStep('step2', 'error'));

  document.addEventListener('analysis:sustainability-start', () => updateStep('step3', 'active'));
  document.addEventListener('analysis:sustainability-complete', () => updateStep('step3', 'completed'));

  document.addEventListener('analysis:economics-start', () => updateStep('step4', 'active'));
  document.addEventListener('analysis:economics-complete', () => updateStep('step4', 'completed'));

  // Fallback automatic progression for when real events aren't available
  setupFallbackProgression();
}

/**
 * Update a step's status and UI
 * @param {string} stepKey - Key of the step to update (step1, step2, etc.)
 * @param {string} status - New status (pending, active, completed, error)
 */
export function updateStep(stepKey, status) {
  if (!loadingSteps[stepKey]) return;

  loadingSteps[stepKey].status = status;
  updateStepUI(loadingSteps[stepKey].id, status);

  // Update loading message based on current step
  updateLoadingMessage(stepKey, status);

  // Dispatch a custom event for other components to react
  document.dispatchEvent(new CustomEvent('loading:step-update', {
    detail: { step: stepKey, status, name: loadingSteps[stepKey].name }
  }));
}

/**
 * Update the UI representation of a step
 * @param {string} elementId - DOM ID of the step element
 * @param {string} status - Status to apply
 */
function updateStepUI(elementId, status) {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Remove all status classes
  element.classList.remove('pending', 'active', 'completed', 'error');

  // Add the appropriate class
  element.classList.add(status);

  // Update icon based on status
  const icon = element.querySelector('i');
  if (icon) {
    // Reset icon class
    icon.className = '';

    // Set appropriate icon
    switch(status) {
      case 'pending':
        icon.className = 'fas fa-circle';
        break;
      case 'active':
        icon.className = 'fas fa-spinner fa-spin';
        break;
      case 'completed':
        icon.className = 'fas fa-check-circle';
        break;
      case 'error':
        icon.className = 'fas fa-exclamation-circle';
        break;
    }
  }
}

/**
 * Update the loading message based on current step
 * @param {string} stepKey - Current active step key
 * @param {string} status - Status of the step
 */
function updateLoadingMessage(stepKey, status) {
  const messageElement = document.getElementById('loadingMessage');
  if (!messageElement) return;

  if (status === 'error') {
    messageElement.textContent = `Errore durante ${loadingSteps[stepKey].name.toLowerCase()}. Riprovo con altro metodo...`;
    messageElement.classList.add('error-message');
    return;
  }

  messageElement.classList.remove('error-message');

  if (status === 'active') {
    messageElement.textContent = `${loadingSteps[stepKey].name} in corso...`;
  } else if (status === 'completed' && stepKey === 'step4') {
    messageElement.textContent = 'Analisi completata! Preparazione dei risultati...';
  }
}

/**
 * Setup fallback automatic progression for demo purposes
 * or when real events aren't being dispatched
 */
function setupFallbackProgression() {
  // Only activate this when the loading section is shown
  document.getElementById('analyzerForm').addEventListener('submit', function() {
    const loadingSection = document.getElementById('loadingSection');
    if (!loadingSection || loadingSection.style.display === 'none') return;

    // Reset steps first
    Object.keys(loadingSteps).forEach(key => {
      updateStep(key, 'pending');
    });

    // Fake progression with timeouts
    setTimeout(() => {
      updateStep('step1', 'active');

      setTimeout(() => {
        updateStep('step1', 'completed');
        updateStep('step2', 'active');

        setTimeout(() => {
          updateStep('step2', 'completed');
          updateStep('step3', 'active');

          setTimeout(() => {
            updateStep('step3', 'completed');
            updateStep('step4', 'active');

            setTimeout(() => {
              updateStep('step4', 'completed');
            }, 800);
          }, 1000);
        }, 1200);
      }, 1000);
    }, 500);
  });
}

export default { initLoadingSteps, updateStep };