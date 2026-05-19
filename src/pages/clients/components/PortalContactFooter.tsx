import { Phone, Mail } from "lucide-react";

interface Props {
  phone: string | null;
  email: string;
}

export function PortalContactFooter({ phone, email }: Props) {
  return (
    <div className="text-center text-xs text-gray-400 space-y-1 pt-4">
      {phone && (
        <p className="flex items-center justify-center gap-1">
          <Phone className="w-3 h-3" /> {phone}
        </p>
      )}
      {email && (
        <p className="flex items-center justify-center gap-1">
          <Mail className="w-3 h-3" /> {email}
        </p>
      )}
    </div>
  );
}
