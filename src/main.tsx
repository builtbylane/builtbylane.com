import "./index.css";

import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import AsciiMetaBalls from "./experiments/AsciiMetaBalls";
import AsciiRipple from "./experiments/AsciiRipple";
import AsciiWebcam from "./experiments/AsciiWebcam";

const EXPERIMENTS = {
	RIPPLE: "waves",
	WEBCAM: "ascii cam",
	LIQUID: "liquid",
} as const;

type Experiment = (typeof EXPERIMENTS)[keyof typeof EXPERIMENTS];

const EXPERIMENT_COMPONENTS: Record<Experiment, React.ComponentType> = {
	[EXPERIMENTS.RIPPLE]: AsciiRipple,
	[EXPERIMENTS.WEBCAM]: AsciiWebcam,
	[EXPERIMENTS.LIQUID]: AsciiMetaBalls,
};

const EXPERIMENT_QUERY_PARAMS: Record<string, Experiment> = {
	waves: EXPERIMENTS.RIPPLE,
	camera: EXPERIMENTS.WEBCAM,
	cam: EXPERIMENTS.WEBCAM,
	liquid: EXPERIMENTS.LIQUID,
};

const getInitialExperiment = (): Experiment => {
	const params = new URLSearchParams(window.location.search);
	const experimentParam = params.get("e");

	if (experimentParam) {
		const experiment = EXPERIMENT_QUERY_PARAMS[experimentParam.toLowerCase()];
		if (experiment) {
			return experiment;
		}
	}

	const options = [EXPERIMENTS.RIPPLE, EXPERIMENTS.LIQUID];
	const randomIndex = Math.floor(Math.random() * options.length);
	return options[randomIndex];
};

const ExperimentChooser = ({
	currentExperiment,
	onExperimentChange,
}: {
	currentExperiment: Experiment;
	onExperimentChange: (experiment: Experiment) => void;
}) => {
	return (
		<div className="fixed bottom-4 left-4 z-10">
			<div className="relative inline-block min-w-0">
				<select
					value={currentExperiment}
					onChange={(e) => onExperimentChange(e.target.value as Experiment)}
					className="appearance-none bg-transparent text-gray-300 pl-2 pr-7 py-1 text-sm cursor-pointer outline-none hover:text-[#c6fdea] transition-colors duration-200 min-w-0 max-w-max"
				>
					{Object.values(EXPERIMENTS).map((exp) => (
						<option key={exp} value={exp}>
							{exp}
						</option>
					))}
				</select>
				<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-300">
					<svg
						className="fill-current h-4 w-4"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						aria-label="Select dropdown arrow"
						role="img"
					>
						<title>Select dropdown arrow</title>
						<path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
					</svg>
				</div>
			</div>
		</div>
	);
};

const StyleInitializer = ({ children }: { children: React.ReactNode }) => {
	useEffect(() => {
		document.documentElement.classList.remove("loading");
		document.documentElement.classList.add("loaded");
	}, []);

	return <>{children}</>;
};

const App = () => {
	// Initialize with experiment from URL or random
	const [experiment, setExperiment] = useState<Experiment>(
		getInitialExperiment(),
	);

	// Update URL when experiment changes
	const handleExperimentChange = (newExperiment: Experiment) => {
		setExperiment(newExperiment);
		// Find the first query param key for this experiment
		const queryParam = Object.entries(EXPERIMENT_QUERY_PARAMS).find(
			([_, exp]) => exp === newExperiment,
		)?.[0];
		if (queryParam) {
			const url = new URL(window.location.href);
			url.searchParams.set("e", queryParam);
			window.history.replaceState({}, "", url);
		}
	};

	const ExperimentComponent = EXPERIMENT_COMPONENTS[experiment];

	return (
		<>
			<ExperimentComponent />
			<ExperimentChooser
				currentExperiment={experiment}
				onExperimentChange={handleExperimentChange}
			/>
		</>
	);
};

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

createRoot(rootElement).render(
	<StrictMode>
		<StyleInitializer>
			<App />
		</StyleInitializer>
	</StrictMode>,
);

const ascii = [
	"           ______________    ",
	"          /             /|   ",
	"        /____________ /  |   ",
	"       | ___________ |   |   ",
	"       ||   here    ||   |   ",
	"       ||    be     ||   |   ",
	"       ||  dragons  ||   |   ",
	"       ||___________||   |   ",
	"       |   _______   |  /    ",
	"      /|  (_______)  | /     ",
	"     ( |_____________|/      ",
	"      \\                      ",
	"  .=======================.  ",
	"  | ::::::::::::::::  ::: |  ",
	"  | ::::::::::::::[]  ::: |  ",
	"  |   -----------     ::: |  ",
	"  `-----------------------'  ",
];

console.log(
	`%c${ascii.join("\n")}`,
	"font-family: 'Courier New', monospace; letter-spacing: -1px;",
);
