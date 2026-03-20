"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "keep" | "fail" | "pending";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-keep text-surface font-mono font-bold hover:glow-keep-strong",
  secondary:
    "border border-ghost-border text-keep font-mono hover:bg-keep/10",
  ghost:
    "text-foreground-muted font-mono hover:text-foreground hover:bg-surface-high",
  keep: "bg-keep text-surface font-mono font-bold hover:glow-keep-strong",
  fail: "bg-fail text-surface font-mono font-bold hover:glow-fail-strong",
  pending:
    "bg-pending text-surface font-mono font-bold hover:glow-pending-strong",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`rounded-none px-5 py-2.5 text-sm tracking-wide uppercase transition-all cursor-pointer ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
