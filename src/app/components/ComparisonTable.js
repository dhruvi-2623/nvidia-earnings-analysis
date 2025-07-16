export default function ComparisonTable({ data }) {
  if (!data || data.length === 0) return <p>No comparison data available</p>;

  return (
    <table className="comparison-table">
      <thead>
        <tr>
          <th>Quarter</th>
          <th>Management Change</th>
          <th>Q&A Change</th>
          <th>New Themes</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={index}>
            <td>{row.quarter.replace('_', ' ')}</td>
            <td className={row.managementChange >= 0 ? 'positive' : 'negative'}>
              {row.managementChange >= 0 ? '+' : ''}{row.managementChange.toFixed(2)}
            </td>
            <td className={row.qaChange >= 0 ? 'positive' : 'negative'}>
              {row.qaChange >= 0 ? '+' : ''}{row.qaChange.toFixed(2)}
            </td>
            <td>
              {row.newThemes.length > 0 ? (
                <ul>
                  {row.newThemes.map((theme, i) => (
                    <li key={i}>{theme}</li>
                  ))}
                </ul>
              ) : 'No new themes'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}