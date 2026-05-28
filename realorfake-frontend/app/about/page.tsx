import { ExternalLink } from "@/components/shared/ExternalLink";

export default function AboutPage() {
  return (
    <div className="prose prose-slate mx-auto max-w-2xl">
      <h1>אודות RealOrFake</h1>

      <h2>מהו הפרויקט?</h2>
      <p>
        RealOrFake הוא כלי זיהוי תמונות שנוצרו ע״י בינה מלאכותית, שפותח כפרויקט גמר לקורס למידת
        מכונה. הכלי מנתח תמונות ומחזיר ניתוח מפורט: האם התמונה אמיתית או שנוצרה ע״י AI — יחד עם
        רמת הביטחון של המודל ומפת חום (Grad-CAM) המציגה את האזורים שהשפיעו על ההחלטה.
      </p>

      <h2>מי בנה את זה?</h2>
      <p>
        הפרויקט פותח על ידי <strong>עדיר שלומוב</strong> במסגרת קורס למידת מכונה. הפרויקט קשור
        לפלטפורמת{" "}
        <ExternalLink href="https://felora.ai">Felora</ExternalLink> — פלטפורמת AI ישראלית ליצירת
        תוכן, שהוותה השראה לפיתוח הכלי.
      </p>

      <h2>המוטיבציה</h2>
      <p>
        עם התפשטות כלי ה-AI ליצירת תמונות כמו DALL-E, Midjourney ו-Stable Diffusion, קיימת צורך
        גוברת בכלים שיאפשרו לזהות תמונות מזויפות. RealOrFake נועד לתת מענה לאתגר זה תוך שמירה על
        שקיפות — המודל לא רק מוסר פסיקה, אלא גם מסביר את ההחלטה שלו.
      </p>

      <h2>טכנולוגיה</h2>
      <p>
        הפרויקט מבוסס על Vision Transformer (ViT) שעבר Fine-tuning על מאגר תמונות של תמונות אמיתיות
        ותמונות שנוצרו ע״י AI ממחוללים שונים. הממשק הקדמי בנוי עם Next.js 14 ו-TypeScript; ה-API
        בנוי עם FastAPI ו-PyTorch.
      </p>

      <h2>קישורים</h2>
      <ul>
        <li>
          <ExternalLink href="https://github.com/adirshlomo/realorfake">
            קוד מקור ב-GitHub
          </ExternalLink>
        </li>
        <li>
          <ExternalLink href="https://felora.ai">Felora — פלטפורמת AI ישראלית</ExternalLink>
        </li>
      </ul>

      <p className="text-sm text-muted-foreground">
        © {new Date().getFullYear()} Adir Shlomov — MIT License
      </p>
    </div>
  );
}
