import { hot } from 'react-hot-loader/root';
import React, { useState, useEffect } from 'react';

import styled from 'styled-components';
import { Container } from 'semantic-ui-react';

import useInterval from '../hooks/useInterval';

import Controls from './Controls';
import Pomodoro from './Pomodoro';
import Settings from './Settings';

const Display = styled.div`
  font-size: 80px;
  height: 400px;
  padding-top: 220px;
  @media only screen and (min-width: 480px) {
    font-size: 100px;
  }
  @media only screen and (min-width: 768px) {
    font-size: 120px;
  }
  @media only screen and (min-width: 992px) {
    font-size: 150px;
  }
  @media only screen and (min-width: 1200px) {
    font-size: 200px;
  }
`;

const Timer = styled.section`
  color: ghostwhite;
`;

const getTimeInMMSS = (seconds) => {
  const minutesLeft = Math.floor(seconds / 60);
  const secondsLeft = Math.floor(seconds - minutesLeft * 60);

  /**
   * Converts to MM:SS format...
   */
  let timeLeft = `${minutesLeft}:${secondsLeft}`;
  if (minutesLeft < 10 && secondsLeft < 10) {
    timeLeft = `0${minutesLeft}:0${secondsLeft}`;
  } else if (minutesLeft < 10) {
    timeLeft = `0${minutesLeft}:${secondsLeft}`;
  } else if (secondsLeft < 10) {
    timeLeft = `${minutesLeft}:0${secondsLeft}`;
  }

  return timeLeft;
};

const notify = (sessionCounter) => {
  let notification;
  if (!('Notification' in window)) {
    alert('This browser does not support desktop notifications!');
  } else if (Notification.permission === 'granted') {
    notification =
      sessionCounter % 2 !== 0
        ? new Notification("It's Break Time", {
            body: 'Take a short break... :)',
          })
        : new Notification("It's Work Time!", {
            body: 'Time to get back work... :)',
          });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
};

const App = () => {
  /**
   * Checks for previously set settings, if not available -
   * sets the numbers below (defaults)...
   */
  if (
    !localStorage.getItem('pomodoroDuration') ||
    !localStorage.getItem('shortBreakDuration') ||
    !localStorage.getItem('longBreakDuration') ||
    !localStorage.getItem('longBreakDelay')
  ) {
    localStorage.setItem('pomodoroDuration', 1500);
    localStorage.setItem('shortBreakDuration', 300);
    localStorage.setItem('longBreakDuration', 1200);
    localStorage.setItem('longBreakDelay', 4);
  }

  /**
   * Saves settings programmatically in order
   * to prevent calling localStorage methods every
   * time we need duration of a session...
   */
  const pomodoroDuration = parseInt(
    localStorage.getItem('pomodoroDuration'),
    10,
  );
  const shortBreakDuration = parseInt(
    localStorage.getItem('shortBreakDuration'),
    10,
  );
  const longBreakDuration = parseInt(
    localStorage.getItem('longBreakDuration'),
    10,
  );
  const longBreakDelay = parseInt(localStorage.getItem('longBreakDelay'), 10);

  const [seconds, setSeconds] = useState(pomodoroDuration);
  const [timerState, setTimerState] = useState('stopped');
  const [sessionCounter, setSessionCounter] = useState(1);

  useEffect(() => {
    document.title =
      sessionCounter % 2 !== 0
        ? `${getTimeInMMSS(seconds)} - Work`
        : `${getTimeInMMSS(seconds)} - Break`;
  }, [seconds, sessionCounter]);

  const handleStop = () => {
    setSeconds(pomodoroDuration);
    setSessionCounter(1);
    setTimerState('stopped');
  };

  /**
   * Session are represented as numbers (breaks included).
   * A timer with four pomodoro sessions equals eight total
   * sessions with breaks.
   *
   * e.g. 1 - work, 2 - short break, 3 - work... 8 - long break.
   * Odd numbers are always pomodoro sessions and even numbers - break.
   */
  const handleSkip = () => {
    if (sessionCounter === longBreakDelay) {
      setSeconds(longBreakDuration);
    } else if (sessionCounter % 2 !== 0) {
      setSeconds(shortBreakDuration);
    } else {
      setSeconds(pomodoroDuration);
      setTimerState('stopped');
    }

    setSessionCounter(sessionCounter + 1);

    /**
     * Play sound alert when session is over or skipped
     */
    const audioElement = document.querySelector('audio');
    if (sessionCounter === 1) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      const track = audioCtx.createMediaElementSource(audioElement);
      track.connect(audioCtx.destination);
    }
    audioElement.play();

    // Browser notification when session is over...
    notify(sessionCounter);
  };

  useInterval(
    () => {
      if (seconds === 0) handleSkip();
      else setSeconds(seconds - 1);
    },
    1000,
    timerState,
  );

  const handleSettingsChange = (settings) => {
    Array.from(settings).forEach((setting) => {
      if (setting[0] === 'longBreakDelay') {
        localStorage.setItem(setting[0], setting[1] * 2);
      } else {
        localStorage.setItem(setting[0], setting[1] * 60);
      }
    });

    setSeconds(localStorage.getItem('pomodoroDuration'));
    setTimerState('stopped');
    setSessionCounter(1);
  };

  let firstButtonText;
  if (timerState === 'stopped') firstButtonText = 'Start';
  else if (timerState === 'running') firstButtonText = 'Pause';
  else firstButtonText = 'Resume';
  const time = getTimeInMMSS(seconds);

  return (
    <>
      <Container fluid textAlign="center">
        <Timer>
          <Display>{time}</Display>
          <Controls
            isDisabled={!!(timerState === 'stopped' && sessionCounter === 1)}
            onSkip={handleSkip}
            onStart={
              timerState === 'stopped' || timerState === 'paused'
                ? () => setTimerState('running')
                : () => setTimerState('paused')
            }
            onStop={handleStop}
            textContext={firstButtonText}
          />
        </Timer>
        <Pomodoro
          longBreakDelay={longBreakDelay}
          sessionCounter={sessionCounter}
          timerState={timerState}
        />
        <Settings
          onSettingsChange={handleSettingsChange}
          longBreakDelay={longBreakDelay}
          longBreak={longBreakDuration}
          shortBreak={shortBreakDuration}
          pomodoro={pomodoroDuration}
        />
      </Container>
    </>
  );
};

export default hot(App);
