import * as React from "react";
import { cn } from "cn";

/**
 * Shared content-width wrapper. Use for page sections so horizontal
 * rhythm stays consistent across the product.
 */
export function Container({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8", className)}
      {...props}
    />
  );
}
