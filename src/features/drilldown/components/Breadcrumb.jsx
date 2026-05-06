const Breadcrumb = ({ levels, path, onJump }) => (
  <nav className="breadcrumb" aria-label="Drilldown breadcrumb">
    <button type="button" className="crumb" onClick={() => onJump(0)}>
      Root
    </button>
    {path.map((step, index) => {
      const level = levels.find((item) => item.id === step.levelId);
      const label = `${level?.label ?? step.levelId}: ${step.value}`;

      return (
        <button
          key={`${step.levelId}-${index}`}
          type="button"
          className="crumb"
          onClick={() => onJump(index)}
        >
          {label}
        </button>
      );
    })}
  </nav>
);

export default Breadcrumb;
