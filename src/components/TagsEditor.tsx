import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { toast } from "sonner";

const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 30;

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

/**
 * Editor de tags livres do cliente (CRM F5, task 5.2). Espelha os limites
 * validados no backend (`ClientService#normalizeTags`): até 10 tags, até 30
 * caracteres cada — valida no front pra feedback imediato, mas o backend é
 * quem garante a regra de verdade.
 */
export function TagsEditor({ tags, onChange, placeholder = "Adicionar tag e Enter..." }: Props) {
  const [draft, setDraft] = useState("");

  const addTag = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (tags.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
      setDraft("");
      return;
    }
    if (trimmed.length > MAX_TAG_LENGTH) {
      toast.error(`Tag muito longa (máx. ${MAX_TAG_LENGTH} caracteres)`);
      return;
    }
    if (tags.length >= MAX_TAGS) {
      toast.error(`No máximo ${MAX_TAGS} tags por cliente`);
      return;
    }
    onChange([...tags, trimmed]);
    setDraft("");
  };

  const removeTag = (tag: string) => onChange(tags.filter(t => t !== tag));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map(tag => (
          <Badge key={tag} variant="secondary" className="gap-1 h-6 px-2 text-xs">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-red-600"
              aria-label={`Remover tag ${tag}`}
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          if (e.key === "Enter") {
            e.preventDefault();
            addTag();
          }
        }}
        onBlur={addTag}
        placeholder={placeholder}
        maxLength={MAX_TAG_LENGTH}
      />
    </div>
  );
}
