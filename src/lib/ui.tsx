// src/lib/ui.tsx
import React from "react";

export const LUNA = {
  bg: "#0D0D0D",
  panel: "#151515",
  text: "#FFFFFF",
  textMuted: "#A3A3A3",
  gold: "#F9C74F",
  orange: "#F9844A",
  soft: "#FFD166",
  border: "#262626",
};

export const cx = (...cls: (string | false | null | undefined)[]) =>
  cls.filter(Boolean).join(" ");

export const Card: React.FC<React.PropsWithChildren<{ className?: string; style?: React.CSSProperties }>> = ({ children, className, style }) => (
  <div
    className={cx("rounded-2xl border overflow-hidden", className)}
    style={{ borderColor: LUNA.border, background: LUNA.panel, ...style }}
  >
    {children}
  </div>
);

export const CardHeader: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className }) => (
  <div className={cx("px-4 py-3 border-b", className)} style={{ borderColor: LUNA.border }}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className }) => (
  <div className={cx("text-white font-semibold", className)}>{children}</div>
);

export const CardContent: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className }) => (
  <div className={cx("p-4", className)}>{children}</div>
);

export const Button: React.FC<
  React.PropsWithChildren<{ onClick?: () => void; variant?: "primary"|"secondary"|"outline"|"ghost"; className?: string }>
> = ({ children, onClick, variant = "primary", className }) => (
  <button
    onClick={onClick}
    className={cx(
      "rounded-xl px-3 py-2 text-sm transition",
      variant === "primary" && "bg-[#F9C74F] text-black hover:opacity-90",
      variant === "secondary" && "bg-[#FFD166] text-black hover:opacity-90",
      variant === "outline" && "border border-[#262626] text-white hover:bg-[#1b1b1b]",
      variant === "ghost" && "text-zinc-400 hover:text-white",
      className
    )}
  >
    {children}
  </button>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
  <input
    {...props}
    className={cx(
      "w-full rounded-xl bg-[#151515] border border-[#262626] px-3 py-2 text-sm text-white placeholder:text-zinc-500",
      className
    )}
  />
);

export const SelectBox: React.FC<{
  value?: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  options: string[];
  className?: string;
}> = ({ value, onChange, placeholder, options, className }) => (
  <select
    value={value ?? ""}
    onChange={(e) => onChange?.(e.target.value || "")}
    className={cx("w-full rounded-xl bg-[#151515] border border-[#262626] px-3 py-2 text-sm text-white", !value && "text-zinc-500", className)}
  >
    <option value="">{placeholder || "Select"}</option>
    {options.map((o) => (
      <option key={o} value={o} className="text-white">
        {o}
      </option>
    ))}
  </select>
);

export const Badge: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className }) => (
  <span className={cx("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium", className)}>{children}</span>
);

export const Separator: React.FC<{ className?: string }> = ({ className }) => (
  <hr className={cx("border-0 h-px w-full", className)} style={{ background: LUNA.border }} />
);
