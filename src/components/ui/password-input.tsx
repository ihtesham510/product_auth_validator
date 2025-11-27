import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

export interface PasswordInputProps
  extends Omit<React.ComponentProps<"input">, "type"> {
  showToggle?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, showToggle = true, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    return (
      <InputGroup>
        <InputGroupInput
          ref={ref}
          type={showPassword ? "text" : "password"}
          className={className}
          {...props}
        />
        {showToggle && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={props.disabled}
              aria-label={showPassword ? "Hide password" : "Show password"}
              size="icon-xs"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
