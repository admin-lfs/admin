"use client";

import * as React from "react";
import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    const [isChecked, setIsChecked] = React.useState(checked || false);

    React.useEffect(() => {
      setIsChecked(checked || false);
    }, [checked]);

    const handleClick = () => {
      const newChecked = !isChecked;
      setIsChecked(newChecked);
      if (onCheckedChange) {
        onCheckedChange(newChecked);
      }
    };

    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={isChecked}
        ref={ref}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center",
          isChecked && "bg-primary text-primary-foreground",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {isChecked && <CheckIcon className="h-4 w-4" />}
      </button>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
