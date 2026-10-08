export default function Chip({ children, variant = "default", icon = null }) {
  const classNames = ["chip"];
  if (variant === "accent") classNames.push("chip-accent");
  if (variant === "outlined") classNames.push("chip-outlined");
  if (variant === "pill") classNames.push("chip-pill");

  return (
    <span className={classNames.join(" ")}>
      {icon && (
        <span className="material-symbols-outlined" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
}
