import type { FormHTMLAttributes, HTMLAttributes, LabelHTMLAttributes } from "react";

export function Form({ className = "", ...props }: FormHTMLAttributes<HTMLFormElement>) {
  return <form className={`space-y-4 ${className}`} {...props} />;
}

export function FormItem({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`space-y-2 ${className}`} {...props} />;
}

export function FormLabel({ className = "", ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={`text-sm font-medium ${className}`} {...props} />;
}

export function FormMessage({ className = "", ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-sm text-[var(--destructive)] ${className}`} {...props} />;
}
