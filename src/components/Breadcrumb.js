import Link from "next/link";

export default function Breadcrumb({ items }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb" id="breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={index} className="breadcrumb-item">
            {index > 0 && (
              <span className="material-symbols-outlined separator" aria-hidden="true">
                chevron_right
              </span>
            )}
            {isLast ? (
              <span className="current" aria-current="page">
                {item.label}
              </span>
            ) : (
              <Link href={item.href}>{item.label}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
