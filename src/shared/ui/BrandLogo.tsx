import { Leaf } from "lucide-react";

export function BrandLogo() {
  return (
    <span className="brand-logo" aria-label="Hi-calories">
      <span>H</span>
      <span className="brand-logo-i">
        <Leaf aria-hidden="true" />
        <span>ı</span>
      </span>
      <span>-calories</span>
    </span>
  );
}
