import { SignOutButton } from "@/components/auth/sign-out-button";

/**
 * Signed-in user cluster for the site header (name + sign out).
 * App navigation links live in the header's primary nav; keeping them
 * here as well overcrowded the header.
 */
export function AuthenticatedNav({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="hidden max-w-32 truncate px-2 text-body-sm font-medium text-foreground xl:block"
        title={name}
      >
        {name}
      </span>
      <SignOutButton />
    </div>
  );
}
