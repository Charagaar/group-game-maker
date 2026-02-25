import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "pointer-events-auto inline-flex items-center justify-center gap-2 whitespace-nowrap rounded text-sm font-semibold tracking-[0.02em] ring-offset-background transition-[transform,box-shadow,background-color,color,border-color,opacity] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-100 disabled:text-slate-400 disabled:border-slate-200/80 disabled:bg-white/55 disabled:shadow-none disabled:transform-none shadow-sm [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-[hsl(var(--primary)/0.22)] bg-white text-black shadow-[0_8px_24px_hsl(220_45%_72%_/_0.18)] hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_12px_28px_hsl(220_45%_72%_/_0.24)] active:translate-y-0",
        destructive:
          "border border-red-200 bg-destructive text-destructive-foreground shadow-[0_8px_18px_hsl(0_70%_55%_/_0.2)] hover:-translate-y-0.5 hover:bg-destructive/90 hover:shadow-[0_12px_24px_hsl(0_70%_55%_/_0.24)] active:translate-y-0",
        outline:
          "border border-[hsl(var(--primary)/0.25)] bg-white text-black shadow-[0_8px_24px_hsl(220_45%_72%_/_0.12)] hover:-translate-y-0.5 hover:bg-[hsl(var(--primary)/0.06)] hover:text-black active:translate-y-0",
        secondary:
          "border border-[hsl(var(--secondary)/0.26)] bg-[hsl(var(--secondary)/0.14)] text-foreground shadow-[0_6px_18px_hsl(265_50%_75%_/_0.14)] hover:-translate-y-0.5 hover:bg-[hsl(var(--secondary)/0.2)] active:translate-y-0",
        ghost: "hover:bg-white/70 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3.5",
        lg: "h-11 px-8",
        icon: "h-10 w-10 rounded-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
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
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
