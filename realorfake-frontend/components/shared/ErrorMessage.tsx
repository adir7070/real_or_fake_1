import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface ErrorMessageProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorMessage({ title = "שגיאה", description, onRetry }: ErrorMessageProps) {
  return (
    <Card className="border-destructive/50">
      <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <div>
          <h3 className="font-semibold">{title}</h3>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            נסה שוב
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
