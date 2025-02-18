import './index.css';

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import AsciiRipple from './experiments/AsciiRipple';
import AsciiWebcam from './experiments/AsciiWebcam';

const EXPERIMENTS = {
  RIPPLE: 'ripple',
  WEBCAM: 'webcam',
} as const;

type Experiment = (typeof EXPERIMENTS)[keyof typeof EXPERIMENTS];

const EXPERIMENT_COMPONENTS: Record<Experiment, React.ComponentType> = {
  [EXPERIMENTS.RIPPLE]: AsciiRipple,
  [EXPERIMENTS.WEBCAM]: AsciiWebcam,
};

const ExperimentChooser = ({
  currentExperiment,
  onExperimentChange,
}: {
  currentExperiment: Experiment;
  onExperimentChange: (experiment: Experiment) => void;
}) => {
  return (
    <div className="fixed bottom-4 left-4 text-[12px] text-gray-300 z-10">
      <select
        value={currentExperiment}
        onChange={(e) => onExperimentChange(e.target.value as Experiment)}
        className="bg-transparent text-gray-300 hover:text-[#c6fdea] transition-colors duration-200 cursor-pointer focus:outline-none hover:underline"
      >
        {Object.values(EXPERIMENTS).map((exp) => (
          <option key={exp} value={exp}>
            {exp}
          </option>
        ))}
      </select>
    </div>
  );
};

const StyleInitializer = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    document.documentElement.classList.remove('loading');
    document.documentElement.classList.add('loaded');
  }, []);

  return <>{children}</>;
};

const App = () => {
  const [experiment, setExperiment] = useState<Experiment>(EXPERIMENTS.RIPPLE);

  const ExperimentComponent = EXPERIMENT_COMPONENTS[experiment];

  return (
    <>
      <ExperimentComponent />
      <ExperimentChooser
        currentExperiment={experiment}
        onExperimentChange={setExperiment}
      />
    </>
  );
};
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <StrictMode>
    <StyleInitializer>
      <App />
    </StyleInitializer>
  </StrictMode>
);
