import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99]',
  {
    variants: {
      variant: {
        primary: 'bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600',
        secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100',
        outline: 'border border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900',
        ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800',
        danger: 'bg-red-700 text-white hover:bg-red-800',
      },
      size: {
        sm: 'h-10 px-3 text-sm',
        md: 'h-12 px-4 text-base min-w-11',
        lg: 'h-14 px-5 text-base min-w-12',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>

export function Button({ className, variant, size, ...props }: Props) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
