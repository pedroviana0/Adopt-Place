import { Badge } from "@/components/ui/badge";
import type { Tag } from "@/lib/domain/tags";

const styles: Record<Tag["kind"], string> = {
  porte: "bg-secondary text-secondary-foreground",
  sexo: "bg-secondary text-secondary-foreground",
  castrado: "bg-primary/15 text-primary border-primary/20",
  vacinado: "bg-primary/15 text-primary border-primary/20",
  vermifugado: "bg-primary/15 text-primary border-primary/20",
  testado: "bg-primary/15 text-primary border-primary/20",
};

export function TagBadge({ tag }: { tag: Tag }) {
  return (
    <Badge variant="outline" className={`rounded-full border ${styles[tag.kind]}`}>
      {tag.label}
    </Badge>
  );
}
