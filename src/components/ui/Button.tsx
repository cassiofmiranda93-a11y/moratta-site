import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "outline";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-[#173B63] text-white hover:bg-[#102A46] shadow-lg hover:shadow-xl",

  secondary:
    "bg-[#D9AA45] text-white hover:bg-[#C9982D] shadow-lg hover:shadow-xl",

  outline:
    "border-2 border-[#173B63] text-[#173B63] hover:bg-[#173B63] hover:text-white",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold transition-all duration-300 ${variants[variant]} ${className}`}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export default Button;