interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
}

export function BrandLogo({ size = "md", className = "", showText = true }: BrandLogoProps) {
  const heightMap = {
    sm: 28,
    md: 38,
    lg: 48,
  };

  const height = heightMap[size] || 38;

  return (
    <div className={"brand-logo-container " + className} style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
      <img
        src="/images/brand_logo.png"
        alt="Hi-calories Logo"
        height={height}
        style={{
          height: height + "px",
          width: "auto",
          objectFit: "contain",
          display: "block",
        }}
        onError={(e) => {
          // Fallback if image path differs
          (e.currentTarget as HTMLImageElement).src = "/images/brand_logo.png";
        }}
      />
    </div>
  );
}
