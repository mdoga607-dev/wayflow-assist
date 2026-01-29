// src/components/balance/PaymentMethodSelector.tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PaymentMethodSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

const paymentMethods = [
  { value: 'cash', label: 'نقداً', icon: '💵' },
  { value: 'bank_transfer', label: 'حوالة بنكية', icon: '🏦' },
  { value: 'wallet', label: 'محفظة إلكترونية', icon: '📱' },
  { value: 'credit', label: 'دفع آجل', icon: '💳' }
];

export function PaymentMethodSelector({ value, onValueChange, disabled }: PaymentMethodSelectorProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="اختر طريقة الدفع" />
      </SelectTrigger>
      <SelectContent>
        {paymentMethods.map((method) => (
          <SelectItem key={method.value} value={method.value}>
            <div className="flex items-center gap-2">
              <span>{method.icon}</span>
              <span>{method.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}