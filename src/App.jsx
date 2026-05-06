import DrilldownContainer from './features/drilldown/components/DrilldownContainer.jsx';
import { DMA_DRILL_LEVELS } from './mocks/dmaDrilldownLevels.js';
import './styles.css';

const App = () => (
  <div className="app-shell">
    <DrilldownContainer config={DMA_DRILL_LEVELS} />
  </div>
);

export default App;
