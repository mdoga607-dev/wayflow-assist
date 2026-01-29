// src/components/balance/TransactionTypeSelector.tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TransactionTypeSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

const transactionTypes = [
  { value: 'payment', label: 'دفع', description: 'دفع من التاجر' },
  { value: 'collection', label: 'تحصيل', description: 'تحصيل من المندوب' },
  { value: 'refund', label: 'مرتجع', description: 'إرجاع مبلغ' },
  { value: 'expense', label: 'مصروف', description: 'مصروف تشغيلي' },
  { value: 'transfer', label: 'تحويل', description: 'تحويل بين حسابات' }
];

export function TransactionTypeSelector({ value, onValueChange, disabled }: TransactionTypeSelectorProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="اختر نوع العملية" />
      </SelectTrigger>
      <SelectContent>
        {transactionTypes.map((type) => (
          <SelectItem key={type.value} value={type.value}>
            <div>
              <div className="font-medium">{type.label}</div>
              <div className="text-xs text-muted-foreground">{type.description}</div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}