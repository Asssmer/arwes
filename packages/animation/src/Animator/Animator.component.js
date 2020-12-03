import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';

import { ENTERED, ENTERING, EXITED, EXITING } from '../constants';
import { expandAnimatorDuration } from '../utils/expandAnimatorDuration';
import { AnimatorContext } from '../AnimatorContext';
import { useAnimation } from '../useAnimation';
import { useAnimator } from '../useAnimator';

function Component (props) {
  const { animator, children } = props;

  const parentAnimation = useAnimation();
  const parentAnimator = useAnimator();

  const animate = animator.animate !== undefined
    ? animator.animate
    : (parentAnimator ? parentAnimator.animate !== false : true);

  const root = parentAnimator ? !!animator.root : true;

  const merge = !root && animator.merge;

  const activate = animate
    ? root
        ? (animator.activate !== undefined ? animator.activate : true)
        : (merge
            ? (parentAnimator.flow.value === ENTERING || parentAnimator.flow.value === ENTERED)
            : (parentAnimator.flow.value === ENTERED)
          )
    : true;

  const [flow, _setFlow] = useState(() => {
    const value = animate ? EXITED : ENTERED;
    const hasEntered = value === ENTERED;
    const hasExited = value === EXITED;
    return Object.freeze({ value, [value]: true, hasEntered, hasExited });
  });

  const setFlowValue = value => {
    const hasEntered = flow.hasEntered || value === ENTERED;
    const hasExited = flow.hasExited || value === EXITED;
    _setFlow(Object.freeze({ value, [value]: true, hasEntered, hasExited }));
  };

  const duration = useMemo(() => {
    return Object.freeze({
      enter: 100,
      exit: 100,
      stagger: 25,
      delay: 0,
      offset: 0,
      ...parentAnimation?.duration,
      ...expandAnimatorDuration(animator.duration)
    });
  }, [animator.duration, parentAnimation]);

  useEffect(() => {
    if (!animate) {
      return;
    }

    let timeout;

    if (activate) {
      if (flow.value === ENTERING || flow.value === ENTERED) {
        return;
      }

      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setFlowValue(ENTERING);

        clearTimeout(timeout);
        timeout = setTimeout(() => setFlowValue(ENTERED), duration.enter);
      }, duration.delay);
    }
    else {
      if (flow.value === EXITING || flow.value === EXITED) {
        return;
      }

      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setFlowValue(EXITING);

        clearTimeout(timeout);
        timeout = setTimeout(() => setFlowValue(EXITED), duration.exit);
      }, 0);
    }

    return () => clearTimeout(timeout);
  }, [activate]);

  useEffect(
    () => animate && animator.onTransition?.(flow),
    [flow]
  );

  const animatorToProvide = useMemo(
    () => Object.freeze({ animate, duration, root, merge, flow }),
    [animate, duration, root, merge, flow]
  );

  return (
    <AnimatorContext.Provider value={animatorToProvide}>
      {children}
    </AnimatorContext.Provider>
  );
}

Component.propTypes = {
  animator: PropTypes.shape({
    animate: PropTypes.bool,
    duration: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.shape({
        enter: PropTypes.number,
        exit: PropTypes.number,
        stagger: PropTypes.number,
        delay: PropTypes.number,
        offset: PropTypes.number
      })
    ]),
    root: PropTypes.bool,
    merge: PropTypes.bool,
    activate: PropTypes.bool,
    onTransition: PropTypes.func
  }),
  children: PropTypes.any
};

Component.defaultProps = {
  animator: {}
};

export { Component };
