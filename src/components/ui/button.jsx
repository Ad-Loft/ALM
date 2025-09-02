import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary/80 text-primary-foreground shadow-lg border border-primary/90 hover:bg-primary hover:shadow-xl backdrop-blur-sm",
        destructive:
          "bg-destructive/80 text-destructive-foreground shadow-lg border border-destructive/90 hover:bg-destructive hover:shadow-xl backdrop-blur-sm",
        outline:
          "border border-glass-border bg-transparent shadow-md hover:bg-accent/80 hover:text-accent-foreground backdrop-blur-sm",
        secondary:
          "bg-secondary/80 text-secondary-foreground shadow-md border border-secondary/90 hover:bg-secondary hover:shadow-lg backdrop-blur-sm",
        ghost: "hover:bg-accent/80 hover:text-accent-foreground backdrop-blur-sm",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 rounded-md px-4",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
