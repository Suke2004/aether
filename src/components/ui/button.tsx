import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-base font-bold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_4px_0_hsl(210_100%_40%)] hover:shadow-[0_6px_0_hsl(210_100%_40%)] hover:-translate-y-0.5 active:shadow-[0_2px_0_hsl(210_100%_40%)] active:translate-y-0.5",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_4px_0_hsl(0_60%_45%)] hover:shadow-[0_6px_0_hsl(0_60%_45%)] hover:-translate-y-0.5 active:shadow-[0_2px_0_hsl(0_60%_45%)] active:translate-y-0.5",
        outline:
          "border-2 border-primary bg-background text-primary hover:bg-primary/10 shadow-[0_4px_0_hsl(var(--primary)/0.3)] hover:shadow-[0_6px_0_hsl(var(--primary)/0.3)] hover:-translate-y-0.5 active:shadow-[0_2px_0_hsl(var(--primary)/0.3)] active:translate-y-0.5",
        secondary:
          "bg-secondary text-secondary-foreground border-2 border-secondary-foreground/20 shadow-[0_4px_0_hsl(270_40%_70%)] hover:shadow-[0_6px_0_hsl(270_40%_70%)] hover:-translate-y-0.5 active:shadow-[0_2px_0_hsl(270_40%_70%)] active:translate-y-0.5",
        ghost: 
          "text-foreground hover:bg-secondary hover:text-primary rounded-xl",
        link: 
          "text-primary underline-offset-4 hover:underline",
        success:
          "bg-success text-white shadow-[0_4px_0_hsl(145_70%_35%)] hover:shadow-[0_6px_0_hsl(145_70%_35%)] hover:-translate-y-0.5 active:shadow-[0_2px_0_hsl(145_70%_35%)] active:translate-y-0.5",
        coin:
          "bg-gradient-to-r from-coin to-fun-orange text-amber-900 font-display shadow-coin hover:-translate-y-0.5 active:translate-y-0.5",
        fun:
          "bg-gradient-to-r from-fun-pink to-accent text-white shadow-[0_4px_0_hsl(280_70%_50%)] hover:shadow-[0_6px_0_hsl(280_70%_50%)] hover:-translate-y-0.5 active:shadow-[0_2px_0_hsl(280_70%_50%)] active:translate-y-0.5",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-xl px-4 text-sm",
        lg: "h-14 rounded-2xl px-8 text-lg",
        xl: "h-16 rounded-3xl px-10 text-xl",
        icon: "h-12 w-12 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
