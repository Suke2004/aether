import { NavLink as RouterNavLink, type NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

// We override className to be a string only, as we handle the function logic internally.
export interface NavLinkCompatProps
  extends Omit<NavLinkProps, "className" | "style"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
  style?: React.CSSProperties;
  children?:
    | React.ReactNode
    | ((props: { isActive: boolean; isPending: boolean }) => React.ReactNode);
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        className={({ isActive, isPending }) =>
          cn(
            className,
            isActive && activeClassName,
            isPending && pendingClassName
          )
        }
        {...props}
      />
    );
  }
);

NavLink.displayName = "NavLink";

export { NavLink };
