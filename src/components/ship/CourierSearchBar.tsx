// components/ship/CourierSearchBar.tsx
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Delegate, Sheet } from '@/hooks/useCouriersShipments';

interface CourierSearchBarProps {
  couriers: Delegate[];
  sheets: Sheet[];
  onSearch: (courierId: string, sheetId?: string) => void;
  initialCourierId?: string;
  initialSheetId?: string;
}

const CourierSearchBar = ({
  couriers,
  sheets,
  onSearch,
  initialCourierId = '',
  initialSheetId = ''
}: CourierSearchBarProps) => {
  const [selectedCourier, setSelectedCourier] = useState(initialCourierId);
  const [selectedSheet, setSelectedSheet] = useState(initialSheetId);

  useEffect(() => {
    setSelectedCourier(initialCourierId);
    setSelectedSheet(initialSheetId);
  }, [initialCourierId, initialSheetId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCourier) {
      onSearch(selectedCourier, selectedSheet || undefined);
    }
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 min-w-[250px]">
          <label className="block text-sm font-medium mb-1">اختر مندوب</label>
          <Select value={selectedCourier} onValueChange={setSelectedCourier}>
            <SelectTrigger>
              <SelectValue placeholder="اختر مندوب" />
            </SelectTrigger>
            <SelectContent>
              {couriers.map((courier) => (
                <SelectItem key={courier.id} value={courier.id}>
                  {courier.name} {courier.phone && `(${courier.phone})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {sheets.length > 0 && (
          <div className="flex-1 min-w-[250px]">
            <label className="block text-sm font-medium mb-1">اختر شيت</label>
            <Select value={selectedSheet} onValueChange={setSelectedSheet}>
              <SelectTrigger>
                <SelectValue placeholder="اختر شيت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">جميع الشيتات</SelectItem>
                {sheets.map((sheet) => (
                  <SelectItem key={sheet.id} value={sheet.id}>
                    {sheet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-end">
          <Button type="submit" className="gap-2 min-w-[120px]">
            <Search className="h-4 w-4" />
            بحث
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default CourierSearchBar;