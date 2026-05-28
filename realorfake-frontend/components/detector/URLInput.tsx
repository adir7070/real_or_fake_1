"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/useTranslation";

const schema = z.object({ url: z.string().url("נא להזין כתובת URL תקפה") });
type FormValues = z.infer<typeof schema>;

export interface URLInputProps {
  onAccepted: (url: string) => void;
  disabled?: boolean;
}

export function URLInput({ onAccepted, disabled }: URLInputProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  function onSubmit(data: FormValues) {
    onAccepted(data.url);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
      <Label htmlFor="image-url">{t("detect.upload.url_placeholder")}</Label>
      <div className="flex gap-2">
        <Input
          id="image-url"
          type="url"
          placeholder={t("detect.upload.url_placeholder")}
          disabled={disabled}
          {...register("url")}
          className="flex-1"
        />
        <Button type="submit" disabled={disabled}>
          {t("detect.upload.url_submit")}
        </Button>
      </div>
      {errors.url && <p className="text-sm text-destructive">{errors.url.message}</p>}
    </form>
  );
}
