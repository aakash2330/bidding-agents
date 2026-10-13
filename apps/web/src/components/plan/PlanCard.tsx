import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function PlanCard({
  title,
  description,
  placeholder,
  plan,
  pending = false,
  error = null,
}: {
  title: string;
  description: string;
  placeholder: string;
  plan: string | null;
  pending?: boolean;
  error?: string | null;
}) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {pending ? (
          <p className="text-sm text-muted-foreground">Planning…</p>
        ) : null}
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        {plan ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {plan}
          </p>
        ) : null}
        {!pending && !error && !plan ? (
          <p className="text-sm text-muted-foreground">{placeholder}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
