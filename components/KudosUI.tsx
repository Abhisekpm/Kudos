import Link from "next/link";
import Image from "next/image";
import type {
  ButtonHTMLAttributes,
  ComponentProps,
  HTMLAttributes,
  ReactNode,
} from "react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const buttonVariants = {
  primary:
    "bg-kudos-purple text-white shadow-kudos-sm hover:-translate-y-0.5 hover:bg-kudos-purple-dark hover:shadow-kudos-md active:translate-y-0 active:scale-[0.98]",
  dark: "bg-kudos-ink text-white shadow-kudos-sm hover:-translate-y-0.5 hover:bg-[#30245a] hover:shadow-kudos-md active:translate-y-0 active:scale-[0.98]",
  secondary:
    "border border-kudos-ink/10 bg-white/80 text-kudos-ink shadow-kudos-sm hover:-translate-y-0.5 hover:border-kudos-purple/30 hover:bg-white hover:shadow-kudos-md active:translate-y-0 active:scale-[0.98]",
  danger:
    "bg-kudos-danger text-white shadow-kudos-sm hover:-translate-y-0.5 hover:brightness-95 hover:shadow-kudos-md active:translate-y-0 active:scale-[0.98]",
  ghost: "text-kudos-ink-soft hover:bg-kudos-purple-light hover:text-kudos-ink active:scale-[0.98]",
} as const;

const buttonSizes = {
  sm: "min-h-10 rounded-xl px-4 py-2 text-sm",
  md: "min-h-12 rounded-2xl px-5 py-3 text-base",
  lg: "min-h-14 rounded-2xl px-6 py-4 text-lg",
} as const;

type ButtonStyleProps = {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  className?: string;
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: ButtonStyleProps = {}) {
  return cx(
    "inline-flex items-center justify-center gap-2 font-bold transition-[transform,background-color,border-color,box-shadow,opacity] duration-200 ease-out disabled:pointer-events-none disabled:opacity-50",
    buttonVariants[variant],
    buttonSizes[size],
    className,
  );
}

type KudosButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyleProps;

export function KudosButton({
  variant,
  size,
  className,
  type = "button",
  ...props
}: KudosButtonProps) {
  return <button type={type} className={buttonStyles({ variant, size, className })} {...props} />;
}

type KudosButtonLinkProps = ComponentProps<typeof Link> & ButtonStyleProps;

export function KudosButtonLink({
  variant,
  size,
  className,
  ...props
}: KudosButtonLinkProps) {
  return <Link className={buttonStyles({ variant, size, className })} {...props} />;
}

type KudosCardProps = HTMLAttributes<HTMLDivElement> & {
  elevated?: boolean;
};

export function KudosCard({ elevated = false, className, ...props }: KudosCardProps) {
  return (
    <div
      className={cx(
        "rounded-[1.75rem] border border-white/80 bg-white/88 backdrop-blur-sm",
        elevated ? "shadow-kudos-md" : "shadow-kudos-sm",
        className,
      )}
      {...props}
    />
  );
}

const badgeTones = {
  purple: "bg-kudos-purple-light text-kudos-purple-dark",
  sun: "bg-kudos-sun/25 text-[#765313]",
  mint: "bg-kudos-mint/25 text-[#1e6b57]",
  coral: "bg-kudos-coral/20 text-[#9a3f42]",
  neutral: "bg-kudos-ink/6 text-kudos-ink-soft",
} as const;

export function KudosBadge({
  tone = "purple",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof badgeTones }) {
  return (
    <span
      className={cx(
        "inline-flex min-h-7 items-center gap-1 rounded-full px-3 py-1 text-xs font-bold",
        badgeTones[tone],
        className,
      )}
      {...props}
    />
  );
}

const avatarTones = {
  purple: "bg-kudos-lilac text-kudos-purple-dark",
  sun: "bg-kudos-sun/55 text-[#6c4b0f]",
  mint: "bg-kudos-mint/50 text-[#175847]",
  coral: "bg-kudos-coral/45 text-[#82393e]",
  sky: "bg-kudos-sky/45 text-[#245979]",
} as const;

export function PlayerAvatar({
  name,
  src,
  tone = "purple",
  size = "md",
  className,
}: {
  name: string;
  src?: string;
  tone?: keyof typeof avatarTones;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "h-10 w-10 text-sm",
    md: "h-14 w-14 text-lg",
    lg: "h-20 w-20 text-2xl",
  } as const;
  const imageSizes = {
    sm: "40px",
    md: "56px",
    lg: "80px",
  } as const;

  return (
    <span
      className={cx(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white font-extrabold uppercase shadow-kudos-sm",
        avatarTones[tone],
        sizes[size],
        className,
      )}
      title={name}
      aria-label={name}
    >
      {src ? (
        <Image src={src} alt="" fill sizes={imageSizes[size]} className="object-cover" />
      ) : (
        name.trim().slice(0, 1)
      )}
    </span>
  );
}

export function ProgressMeter({
  value,
  label,
  tone = "purple",
  className,
}: {
  value: number;
  label: string;
  tone?: "purple" | "sun" | "mint" | "coral";
  className?: string;
}) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const fills = {
    purple: "bg-kudos-purple",
    sun: "bg-kudos-sun",
    mint: "bg-kudos-mint",
    coral: "bg-kudos-coral",
  } as const;

  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between gap-4 text-xs font-bold text-kudos-ink-soft">
        <span>{label}</span>
        <span>{Math.round(clampedValue)}%</span>
      </div>
      <div
        className="h-3 overflow-hidden rounded-full bg-kudos-purple-light"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clampedValue)}
      >
        <div
          className={cx("h-full rounded-full transition-[width] duration-700 ease-out", fills[tone])}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}

export function StarCount({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cx("inline-flex items-center gap-1 font-extrabold", className ?? "text-kudos-ink")}>
      {children}
      <LogoStar className="text-kudos-sun" />
    </span>
  );
}

export function LogoStar({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex h-[1em] w-[1em] shrink-0 items-center justify-center font-sans text-[1em] font-black leading-none",
        className,
      )}
      aria-hidden="true"
    >
      ✦
    </span>
  );
}

export function Sparkle({ className }: { className?: string }) {
  return (
    <span className={cx("inline-block text-kudos-purple", className)} aria-hidden="true">
      ✦
    </span>
  );
}
