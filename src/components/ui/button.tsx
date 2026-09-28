import type { ComponentProps } from "react";

type ButtonProps = ComponentProps<"button">;

export function Button({ className = "", type = "button", ...props }: ButtonProps) {
  return <button className={`button-primary ${className}`} type={type} {...props} />;
}
