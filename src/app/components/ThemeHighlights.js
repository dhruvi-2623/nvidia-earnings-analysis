export default function ThemeHighlights({ themes }) {
  if (!themes || themes.length === 0) return <p>No theme data available</p>;

  return (
    <div className="themes-container">
      {themes.map((theme, index) => (
        <div key={index} className="theme-card">
          <h3>Theme #{index + 1}</h3>
          <p>{theme}</p>
        </div>
      ))}
    </div>
  );
}