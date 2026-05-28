import Link from "next/link";
import Image from "next/image";
import { Nav } from "./Nav";
import { LocaleSwitcher } from "./LocaleSwitcher";

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Image src="/logo.svg" alt="RealOrFake" width={80} height={28} priority />
        </Link>
        <Nav />
        <LocaleSwitcher />
      </div>
    </header>
  );
}
