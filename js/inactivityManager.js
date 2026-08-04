const InactivityManager = (function() {
  const DEFAULT_CONFIG = {
    warningDelay: 30000,
    countdownDuration: 10000,
    nutritionExtension: 30000,
    activityEvents: ['touchstart', 'touchmove', 'mousemove'],
    shouldTrackActivity: null,
    onTimeout: null,
    onWarning: null,
    onReset: null
  };
  const MODAL_ROOT_ID = 'inactivity-modal-root';
  const MODAL_TEMPLATE = `
    <div id="inactivity-warning-modal" class="inactivity-modal">
      <div class="inactivity-modal-overlay"></div>
      <div class="inactivity-modal-container">
        <div class="countdown-circle">
          <svg width="120" height="120" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" stroke="#1a2332" stroke-width="8" fill="none" />
            <circle id="countdown-circle-progress" cx="50" cy="50" r="45" stroke="#5B9BD5" stroke-width="8"
              fill="none" stroke-linecap="round" transform="rotate(-90 50 50)"
              style="stroke-dasharray: 282.7; stroke-dashoffset: 0; transition: stroke-dashoffset 1s linear;" />
          </svg>
          <div id="inactivity-countdown" class="countdown-number">{{countdownSeconds}}</div>
        </div>
        <h2 class="inactivity-modal-heading">Are you still browsing?</h2>
        <p class="inactivity-modal-message">You'll be returned to the home screen in <span id="inactivity-countdown-text">{{countdownSeconds}}</span> seconds</p>
        <div class="inactivity-modal-buttons">
          <button id="continue-browsing-btn" class="inactivity-btn primary">Continue Browsing</button>
          <button id="return-home-btn" class="inactivity-btn secondary">Return to Home</button>
        </div>
      </div>
    </div>
  `;

  let config = {};
  let state = 'idle';
  let warningTimer = null;
  let countdownTimer = null;
  let countdownInterval = null;
  let remainingSeconds = 0;
  let modalElement = null;
  let countdownDisplay = null;
  let circleProgress = null;
  let nutritionModalOpen = false;
  let nutritionExtensionApplied = false;

  function shouldTrackActivity() {
    if (typeof config.shouldTrackActivity === 'function') {
      return !!config.shouldTrackActivity();
    }
    return true;
  }

  function ensureModalRoot() {
    let modalRoot = document.getElementById(MODAL_ROOT_ID);

    if (!modalRoot) {
      document.body.insertAdjacentHTML('beforeend', '<div id="' + MODAL_ROOT_ID + '"></div>');
      modalRoot = document.getElementById(MODAL_ROOT_ID);
    }

    return modalRoot;
  }

  function renderModal() {
    const modalRoot = ensureModalRoot();
    const countdownSeconds = Math.floor(config.countdownDuration / 1000);
    modalRoot.innerHTML = Mustache.render(MODAL_TEMPLATE, {
      countdownSeconds: countdownSeconds
    });
  }

  function handleUserActivity() {
    if (!shouldTrackActivity()) {
      return;
    }
    reset();
  }

  function bindActivityEvents() {
    if (!Array.isArray(config.activityEvents)) {
      return;
    }

    config.activityEvents.forEach((eventName) => {
      document.addEventListener(eventName, handleUserActivity, { passive: true });
    });
  }

  function unbindActivityEvents() {
    if (!Array.isArray(config.activityEvents)) {
      return;
    }

    config.activityEvents.forEach((eventName) => {
      document.removeEventListener(eventName, handleUserActivity, { passive: true });
    });
  }

  function init(userConfig = {}) {
    unbindActivityEvents();
    config = { ...DEFAULT_CONFIG, ...userConfig };

    renderModal();

    modalElement = document.getElementById('inactivity-warning-modal');
    countdownDisplay = document.getElementById('inactivity-countdown');
    circleProgress = document.getElementById('countdown-circle-progress');

    if (!modalElement) {
      console.error('Inactivity warning modal could not be rendered');
      return;
    }

    setupModalButtons();
    bindActivityEvents();
    reset();
  }

  function setupModalButtons() {
    const continueBtn = document.getElementById('continue-browsing-btn');
    const homeBtn = document.getElementById('return-home-btn');

    if (continueBtn) {
      continueBtn.onclick = handleContinueBrowsing;
    }

    if (homeBtn) {
      homeBtn.onclick = handleReturnHome;
    }
  }

  function reset() {
    clearAllTimers();
    hideModal();
    state = 'idle';
    nutritionExtensionApplied = false;

    warningTimer = setTimeout(() => {
      showWarning();
    }, config.warningDelay);

    if (config.onReset) {
      config.onReset();
    }
  }

  function pause() {
    clearAllTimers();
    hideModal();
    state = 'idle';
  }

  function resume() {
    if (state === 'idle' && !warningTimer) {
      reset();
    }
  }

  function extendForNutrition() {
    if (!nutritionExtensionApplied) {
      nutritionExtensionApplied = true;

      if (state === 'idle' && warningTimer) {
        clearTimeout(warningTimer);
        warningTimer = setTimeout(() => {
          showWarning();
        }, config.warningDelay + config.nutritionExtension);
      } else if (state === 'warning') {
        remainingSeconds += Math.floor(config.nutritionExtension / 1000);
        updateCountdownDisplay();
      }
    }
  }

  function showWarning() {
    state = 'warning';
    clearTimeout(warningTimer);
    warningTimer = null;

    if (modalElement) {
      modalElement.classList.add('active');
    }

    remainingSeconds = Math.floor(config.countdownDuration / 1000);
    updateCountdownDisplay();

    countdownInterval = setInterval(() => {
      remainingSeconds--;
      updateCountdownDisplay();

      if (remainingSeconds <= 0) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        timeout();
      }
    }, 1000);

    if (config.onWarning) {
      config.onWarning();
    }
  }

  function updateCountdownDisplay() {
    if (countdownDisplay) {
      countdownDisplay.textContent = remainingSeconds;

      if (remainingSeconds <= 5) {
        countdownDisplay.classList.add('pulse');
      } else {
        countdownDisplay.classList.remove('pulse');
      }
    }

    const countdownText = document.getElementById('inactivity-countdown-text');
    if (countdownText) {
      countdownText.textContent = remainingSeconds;
    }

    if (circleProgress) {
      const totalSeconds = Math.floor(config.countdownDuration / 1000);
      const progress = remainingSeconds / totalSeconds;
      const circumference = 2 * Math.PI * 45;
      const offset = circumference * (1 - progress);
      circleProgress.style.strokeDashoffset = offset;
    }
  }

  function hideModal() {
    if (modalElement) {
      modalElement.classList.remove('active');
    }

    if (countdownDisplay) {
      countdownDisplay.classList.remove('pulse');
    }
  }

  function handleContinueBrowsing() {
    reset();
  }

  function handleReturnHome() {
    clearAllTimers();
    hideModal();

    if (config.onTimeout) {
      config.onTimeout();
    }
  }

  function timeout() {
    state = 'idle';
    hideModal();

    if (config.onTimeout) {
      config.onTimeout();
    }
  }

  function clearAllTimers() {
    if (warningTimer) {
      clearTimeout(warningTimer);
      warningTimer = null;
    }

    if (countdownTimer) {
      clearTimeout(countdownTimer);
      countdownTimer = null;
    }

    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }

  function destroy() {
    unbindActivityEvents();
    clearAllTimers();
    hideModal();
    state = 'idle';
  }

  function getState() {
    return state;
  }

  return {
    init,
    reset,
    pause,
    resume,
    extendForNutrition,
    destroy,
    getState
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = InactivityManager;
}
