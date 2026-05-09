import {Button as ButtonPrimitive} from "@base-ui/react/button"
import {Slot} from "@radix-ui/react-slot"
import {cn} from "@/lib/utils"
import {buttonVariants, type ButtonVariantsProps} from "./button.variants"

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonPrimitive.Props & ButtonVariantsProps & {asChild?: boolean}) {
  const Comp = asChild ? Slot : ButtonPrimitive
  return <Comp data-slot="button" className={cn(buttonVariants({variant, size, className}))} {...props} />
}

export {Button}
