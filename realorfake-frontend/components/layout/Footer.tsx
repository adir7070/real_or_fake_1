import { ExternalLink } from "@/components/shared/ExternalLink";

export function Footer() {
  return (
    <footer className="border-t py-6">
      <div className="container mx-auto max-w-6xl px-4">
        <p className="text-center text-sm text-muted-foreground">
          RealOrFake © {new Date().getFullYear()} —{" "}
          <ExternalLink href="https://github.com/adirshlomo/realorfake">GitHub</ExternalLink>
          {" — "}קורס למידת מכונה
        </p>
      </div>
    </footer>
  );
}
