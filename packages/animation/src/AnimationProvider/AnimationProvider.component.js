import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';

import { expandAnimatorDuration } from '../utils/expandAnimatorDuration';
import { AnimationContext } from '../AnimationContext';

function Component (props) {
  const { animation: localSettings } = props;
  const parentSettings = useContext(AnimationContext);

  const settings = useMemo(() => {
    if (!localSettings) {
      return parentSettings;
    }

    return {
      ...parentSettings,
      duration: {
        ...parentSettings?.duration,
        ...expandAnimatorDuration(localSettings.duration)
      }
    };
  }, [localSettings, parentSettings]);

  return (
    <AnimationContext.Provider value={settings}>
      {props.children}
    </AnimationContext.Provider>
  );
}

Component.propTypes = {
  // TODO: Is this the right name?
  animation: PropTypes.shape({
    duration: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.shape({
        enter: PropTypes.number,
        exit: PropTypes.number,
        stagger: PropTypes.number,
        delay: PropTypes.number,
        offset: PropTypes.number
      })
    ])
  }),
  children: PropTypes.any
};

export { Component };
