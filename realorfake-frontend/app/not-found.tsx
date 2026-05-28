import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <h2 className="text-2xl font-semibold">הדף לא נמצא</h2>
      <p className="text-muted-foreground">הדף שחיפשת אינו קיים.</p>
      <Button asChild>
        <Link href="/">חזרה לדף הבית</Link>
      </Button>
    </div>
  );
}
