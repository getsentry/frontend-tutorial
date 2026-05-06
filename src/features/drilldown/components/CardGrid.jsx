import { getItemLabel, getItemMetric } from '../utils.js';

const CardGrid = ({ items, onCardClick }) => (
  <section className="card-grid" aria-label="Card drilldown view">
    {items.map((item, index) => {
      const label = getItemLabel(item);
      const metric = getItemMetric(item);
      const key = item.id ?? `${label}-${index}`;

      return (
        <button
          type="button"
          className="data-card"
          key={key}
          onClick={() => onCardClick(item, label)}
        >
          <span className="data-card-label">{label}</span>
          {metric !== null && metric !== undefined && (
            <span className="data-card-metric">{metric}</span>
          )}
        </button>
      );
    })}
    {items.length === 0 && <p className="empty-state">No cards available.</p>}
  </section>
);

export default CardGrid;
