import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, AirVent, MapPin, Upload, X } from "lucide-react";
import AddressFieldsForm, { emptyAddress, type AddressData } from "@/components/AddressFieldsForm";
import { toast } from "sonner";

const EQUIPMENT_TYPES = [
  { value: "split", label: "Split" },
  { value: "janela", label: "Janela" },
  { value: "central", label: "Central" },
  { value: "cassete", label: "Cassete" },
  { value: "portatil", label: "Portátil" },
];

const PROBLEM_TYPES = [
  { value: "nao_gela", label: "Não está gelando" },
  { value: "barulho", label: "Fazendo barulho" },
  { value: "vazamento", label: "Vazando água" },
  { value: "nao_liga", label: "Não liga" },
  { value: "manutencao", label: "Manutenção preventiva" },
  { value: "instalacao", label: "Instalação" },
  { value: "outro", label: "Outro" },
];

export interface SignUpFormData {
  name: string;
  phone: string;
  email: string;
  address: AddressData;
  equipmentType: string;
  equipmentBrand: string;
  equipmentModel: string;
  equipmentLabel: string;
  problemType: string;
  description: string;
  photoUrls: string[];
}

interface Props {
  onSubmit: (data: SignUpFormData) => void;
}

export function SignUpDataForm({ onSubmit }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState<AddressData>(emptyAddress);
  const [equipmentType, setEquipmentType] = useState("");
  const [equipmentBrand, setEquipmentBrand] = useState("");
  const [equipmentModel, setEquipmentModel] = useState("");
  const [equipmentLabel, setEquipmentLabel] = useState("");
  const [problemType, setProblemType] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (photoUrls.length + files.length > 5) {
      toast.info("Máximo de 5 fotos");
      return;
    }
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoUrls(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim() || !equipmentType || !description.trim()) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    onSubmit({ name, phone, email, address, equipmentType, equipmentBrand, equipmentModel, equipmentLabel, problemType, description, photoUrls });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" /> Seus dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Nome *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Telefone *</Label>
              <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email *</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" /> Endereço
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AddressFieldsForm value={address} onChange={setAddress} compact />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AirVent className="w-4 h-4 text-blue-600" /> Ar-condicionado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Apelido (opcional)</Label>
            <Input value={equipmentLabel} onChange={e => setEquipmentLabel(e.target.value)} placeholder="Ex: Ar da sala" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Tipo *</Label>
              <select className="w-full text-sm border rounded-md px-3 py-2 bg-white" value={equipmentType} onChange={e => setEquipmentType(e.target.value)} required>
                <option value="">Selecionar...</option>
                {EQUIPMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tipo de problema</Label>
              <select className="w-full text-sm border rounded-md px-3 py-2 bg-white" value={problemType} onChange={e => setProblemType(e.target.value)}>
                <option value="">Selecionar...</option>
                {PROBLEM_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Marca</Label>
              <Input value={equipmentBrand} onChange={e => setEquipmentBrand(e.target.value)} placeholder="LG, Samsung..." />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Modelo</Label>
              <Input value={equipmentModel} onChange={e => setEquipmentModel(e.target.value)} placeholder="9000 BTUs..." />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Fotos (até 5)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {photoUrls.map((url, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img src={url} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoUrls(p => p.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {photoUrls.length < 5 && (
              <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400">
                <Upload className="w-5 h-5 text-gray-400 mb-1" />
                <span className="text-xs text-gray-400">Adicionar</span>
                <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
              </label>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Descrição do problema *</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="resize-none" placeholder="Descreva o que está acontecendo..." />
        </CardContent>
      </Card>

      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 h-12">
        Continuar para agendamento
      </Button>
    </form>
  );
}
