import React from "react"
import {Button} from "@/components/ui/button"
import {KeyRound} from "lucide-react"
import {cn} from "@/lib/utils"
import {GoogleSignInButton} from "./GoogleSignInButton"

export interface ProviderSignInButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  providerId: string
  displayName: string
  href?: string
  className?: string
}

export const ProviderSignInButton: React.FC<ProviderSignInButtonProps> = ({
  providerId,
  displayName,
  href,
  className,
  ...props
}) => {
  const normalizedId = providerId.toLowerCase()
  const normalizedName = displayName.toLowerCase()

  // Delegate to GoogleSignInButton with official Google branding
  if (normalizedId === "google" || normalizedName === "google") {
    return (
      <GoogleSignInButton
        href={href}
        className={className}
        text="Sign in with Google"
        {...(props as React.ComponentProps<typeof GoogleSignInButton>)}
      />
    )
  }

  const buttonText = `Sign in with ${displayName}`

  const content = (
    <>
      <div className="flex size-5 items-center justify-center">
        <KeyRound className="size-5 text-muted-foreground" />
      </div>
      <span className="font-medium tracking-tight text-foreground">{buttonText}</span>
    </>
  )

  const buttonClasses = cn(
    "relative flex w-full items-center justify-center gap-3 rounded-lg border border-border/80 bg-background/80 px-4 py-2.5 shadow-sm transition-all duration-200 hover:bg-accent hover:border-border active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    className
  )

  if (href) {
    return (
      <Button asChild variant="outline" size="lg" className={buttonClasses}>
        <a href={href} aria-label={buttonText}>
          {content}
        </a>
      </Button>
    )
  }

  return (
    <Button variant="outline" size="lg" className={buttonClasses} {...props}>
      {content}
    </Button>
  )
}
