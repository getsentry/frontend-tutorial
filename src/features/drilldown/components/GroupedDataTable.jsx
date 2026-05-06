import { buildGroupedTableSegments, collectTableColumnKeys } from '../utils.js';

const GroupedDataTable = ({ rows, levels }) => {
  const columns = collectTableColumnKeys(rows);
  const segments = buildGroupedTableSegments(rows, levels);

  if (!rows.length) {
    return <p className="empty-state">No table rows available.</p>;
  }

  return (
    <table className="data-table data-table-grouped">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column} scope="col">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {segments.map((segment, index) => {
          if (segment.kind === 'group') {
            return (
              <tr
                key={`g-${segment.depth}-${segment.value}-${index}`}
                className={`group-row group-row depth-${segment.depth}`}
              >
                <td colSpan={columns.length} className="group-cell">
                  <span className="group-level">{segment.levelLabel}</span>
                  <span className="group-value">{segment.value}</span>
                </td>
              </tr>
            );
          }

          const row = segment.row;
          const rk = row.id ?? row.key ?? index;
          return (
            <tr key={`r-${rk}`} className="data-row">
              {columns.map((column) => (
                <td key={`${rk}-${column}`}>{String(row[column] ?? '-')}</td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default GroupedDataTable;
