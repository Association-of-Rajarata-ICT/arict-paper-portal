// Course code set one character per cell, like the index-number boxes on an answer script.
export default function CodeBoxes({ code = "", size = "md" }) {
  const cleaned = String(code || "").replace(/\s+/g, "").toUpperCase();
  const chars = Array.from(cleaned).slice(0, 12);

  if (chars.length === 0) {
    return <span className={`code-boxes code-boxes--${size} code-boxes--empty`}>No code</span>;
  }

  return (
    <span className={`code-boxes code-boxes--${size}`}>
      <span className="sr-only">Course code {cleaned}</span>
      {chars.map((char, index) => (
        <span key={index} className="code-box" aria-hidden="true">
          {char}
        </span>
      ))}
    </span>
  );
}
