"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const navLinks: { href: string; key: "nav.home" | "nav.detect" | "nav.model" | "nav.about" }[] = [
  { href: "/", key: "nav.home" },
  { href: "/detect", key: "nav.detect" },
  { href: "/model", key: "nav.model" },
  { href: "/about", key: "nav.about" },
];

export function Nav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav>
      {/* Desktop */}
      <ul className="hidden items-center gap-6 md:flex">
        {navLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-foreground",
                pathname === link.href ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {t(link.key)}
            </Link>
          </li>
        ))}
      </ul>

      {/* Mobile */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="פתח תפריט">
              <Menu className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {navLinks.map((link) => (
              <DropdownMenuItem key={link.href} asChild>
                <Link
                  href={link.href}
                  className={cn(
                    pathname === link.href ? "font-semibold" : ""
                  )}
                >
                  {t(link.key)}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
