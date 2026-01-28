import { QRCodeSVG } from "qrcode.react";
import { Package, Phone, MapPin, User, Building, Calendar, Truck } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface ShipmentLabelProps {
  shipment: {
    id: string;
    tracking_number: string;
    recipient_name: string;
    recipient_phone: string;
    recipient_address: string | null;
    recipient_city: string | null;
    recipient_area: string | null;
    product_name: string | null;
    cod_amount: number | null;
    shipping_fee: number | null;
    weight: number | null;
    created_at: string;
    notes: string | null;
  };
  companyName?: string;
  companyPhone?: string;
}

const ShipmentLabel = ({ shipment, companyName = "WayFlow", companyPhone = "19999" }: ShipmentLabelProps) => {
  const trackingUrl = `${window.location.origin}/track/${shipment.tracking_number}`;

  return (
    <div
      id={`label-${shipment.id}`}
      className="bg-white p-6 border-2 border-black w-[400px] print:w-full print:border-0"
      dir="rtl"
      style={{ fontFamily: "Arial, sans-serif" }}
    >
      {/* Header */}
      <div className="flex justify-between items-center border-b-2 border-black pb-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold">{companyName}</h1>
          <p className="text-sm">{companyPhone}</p>
        </div>
        <div className="text-left">
          <p className="text-xs text-gray-600">رقم التتبع</p>
          <p className="text-lg font-bold font-mono">{shipment.tracking_number}</p>
        </div>
      </div>

      {/* QR Code and Main Info */}
      <div className="flex gap-4 mb-4">
        <div className="flex-shrink-0">
          <QRCodeSVG 
            value={trackingUrl}
            size={100}
            level="M"
            includeMargin={false}
          />
          <p className="text-[8px] text-center mt-1 text-gray-500">امسح للتتبع</p>
        </div>
        
        <div className="flex-1 space-y-2">
          {/* Recipient */}
          <div className="border border-gray-300 rounded p-2">
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
              <User className="h-3 w-3" />
              المستلم
            </div>
            <p className="font-bold text-lg">{shipment.recipient_name}</p>
            <div className="flex items-center gap-1 mt-1">
              <Phone className="h-3 w-3 text-gray-500" />
              <span className="font-mono">{shipment.recipient_phone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="border border-gray-300 rounded p-2 mb-3">
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
          <MapPin className="h-3 w-3" />
          العنوان
        </div>
        <p className="font-medium">
          {shipment.recipient_address || ""}
          {shipment.recipient_area && ` - ${shipment.recipient_area}`}
        </p>
        {shipment.recipient_city && (
          <p className="text-sm font-bold mt-1 flex items-center gap-1">
            <Building className="h-3 w-3" />
            {shipment.recipient_city}
          </p>
        )}
      </div>

      {/* Product and Amount */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="border border-gray-300 rounded p-2">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <Package className="h-3 w-3" />
            المنتج
          </div>
          <p className="font-medium text-sm truncate">{shipment.product_name || "-"}</p>
          {shipment.weight && (
            <p className="text-xs text-gray-500">{shipment.weight} كجم</p>
          )}
        </div>
        
        <div className="border-2 border-black rounded p-2 bg-gray-50">
          <p className="text-xs text-gray-500">المبلغ المطلوب</p>
          <p className="text-xl font-bold text-center">
            {shipment.cod_amount ? `${shipment.cod_amount} ج.م` : "مدفوع"}
          </p>
        </div>
      </div>

      {/* Notes */}
      {shipment.notes && (
        <div className="border border-dashed border-gray-400 rounded p-2 mb-3 bg-yellow-50">
          <p className="text-xs text-gray-500 mb-1">ملاحظات:</p>
          <p className="text-sm">{shipment.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center border-t border-gray-300 pt-2 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {format(new Date(shipment.created_at), "yyyy/MM/dd", { locale: ar })}
        </div>
        <div className="flex items-center gap-1">
          <Truck className="h-3 w-3" />
          رسوم الشحن: {shipment.shipping_fee || 0} ج.م
        </div>
      </div>

      {/* Barcode-style tracking number */}
      <div className="mt-3 text-center border-t-2 border-black pt-2">
        <p className="font-mono text-2xl tracking-widest font-bold">
          {shipment.tracking_number}
        </p>
      </div>
    </div>
  );
};

export default ShipmentLabel;
