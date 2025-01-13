import './index.css';

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import AsciiLiquid from './AsciiLiquid';
import AsciiRipple from './AsciiRipple';

type Experiment = 'liquid' | 'ripple';

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
        <option value="liquid">liquid</option>
        <option value="ripple">ripple</option>
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
  const [experiment, setExperiment] = useState<Experiment>('liquid');

  return (
    <>
      {experiment === 'liquid' ? <AsciiLiquid /> : <AsciiRipple />}
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
