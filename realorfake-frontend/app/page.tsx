import Link from "next/link";
import Image from "next/image";
import { Brain, Eye, LockOpen } from "lucide-react";
import { dictionary } from "@/lib/i18n/dictionary";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const t = dictionary.he;

const features = [
  {
    icon: Brain,
    title: "מבוסס Transfer Learning",
    description: "המודל מבוסס על ViT שאומן מראש על מיליוני תמונות",
  },
  {
    icon: Eye,
    title: "Heatmap מסביר את ההחלטה",
    description: "ראה בדיוק אילו אזורים בתמונה הובילו להחלטה",
  },
  {
    icon: LockOpen,
    title: "פתוח, ללא תשלום וללא הרשמה",
    description: "כלי חינמי לחלוטין, אין צורך בחשבון משתמש",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-16">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 py-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-6xl">{t["landing.title"]}</h1>
        <p className="max-w-xl text-lg text-muted-foreground md:text-xl">{t["landing.subtitle"]}</p>
        <Button asChild size="lg" className="mt-2">
          <Link href="/detect">{t["landing.cta"]}</Link>
        </Button>
      </section>

      {/* Feature cards */}
      <section className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title}>
              <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Sample band */}
      <section className="rounded-xl bg-muted/50 p-8">
        <h2 className="mb-6 text-center text-xl font-semibold">דוגמאות תמונות</h2>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
          <Link href="/detect" className="group flex flex-col items-center gap-2">
            <div className="overflow-hidden rounded-lg border shadow-sm transition-transform group-hover:scale-105">
              <Image
                src="/samples/real_01.jpg"
                alt="תמונה אמיתית לדוגמה"
                width={240}
                height={180}
                className="object-cover"
                unoptimized
              />
            </div>
            <span className="text-sm font-medium text-green-600">תמונה אמיתית</span>
          </Link>
          <Link href="/detect" className="group flex flex-col items-center gap-2">
            <div className="overflow-hidden rounded-lg border shadow-sm transition-transform group-hover:scale-105">
              <Image
                src="/samples/fake_01.jpg"
                alt="תמונה מזויפת לדוגמה"
                width={240}
                height={180}
                className="object-cover"
                unoptimized
              />
            </div>
            <span className="text-sm font-medium text-red-600">תמונה שנוצרה ע״י AI</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
