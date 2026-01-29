// components/ship/ShipmentLabel.tsx
import { Shipment } from "@/hooks/useShipments";
import { QRCodeSVG } from "qrcode.react";

interface ShipmentLabelProps {
  shipment: Shipment;
}

const statusLabels: Record<string, string> = {
  delivered: "تم التسليم",
  transit: "قيد التوصيل",
  pending: "في الانتظار",
  delayed: "متأخر",
  returned: "مرتجع",
};

export default function ShipmentLabel({ shipment }: ShipmentLabelProps) {
  const trackingUrl = `${window.location.origin}/track/${shipment.tracking_number}`;
  
  return (
    <div 
      className="p-4 border text-xs bg-white h-full w-full"
      style={{ 
        fontFamily: "'Tajawal', Arial, sans-serif",
        direction: "rtl",
        height: "100%",
        width: "100%",
        boxSizing: "border-box"
      }}
    >
      {/* Header with QR */}
      <div className="flex items-start justify-between border-b pb-3 mb-3">
        <div className="text-center flex-1">
          <h2 
            className="font-bold text-lg mb-1"
            style={{ fontSize: "16px", fontWeight: "bold" }}
          >
            بوليصة شحن
          </h2>
          <p className="text-sm opacity-70">Shipping Label</p>
        </div>
        
        {/* QR Code */}
        <div className="flex-shrink-0">
          <QRCodeSVG 
            value={trackingUrl}
            size={64}
            level="M"
            includeMargin={false}
          />
        </div>
      </div>

      {/* Tracking Number */}
      <div className="mb-3">
        <label className="block text-xs font-semibold mb-1">رقم التتبع:</label>
        <div 
          className="font-mono font-bold text-lg bg-gray-100 p-2 rounded text-center"
          style={{ fontSize: "18px", backgroundColor: "#f3f4f6" }}
        >
          {shipment.tracking_number}
        </div>
      </div>

      {/* Recipient Info */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-semibold mb-1">اسم المستلم:</label>
          <p className="font-medium">{shipment.recipient_name}</p>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">الهاتف:</label>
          <p className="font-mono font-medium" style={{ direction: "ltr", textAlign: "right" }}>
            {shipment.recipient_phone}
          </p>
        </div>
      </div>

      {/* Address */}
      <div className="mb-3">
        <label className="block text-xs font-semibold mb-1">العنوان:</label>
        <div className="space-y-1">
          {shipment.recipient_city && (
            <p>المدينة: {shipment.recipient_city}</p>
          )}
          {shipment.recipient_area && (
            <p>الحي: {shipment.recipient_area}</p>
          )}
          {shipment.recipient_address && (
            <p>العنوان التفصيلي: {shipment.recipient_address}</p>
          )}
        </div>
      </div>

      {/* Shipment Details */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-semibold mb-1">الحالة:</label>
          <span 
            className={`inline-block px-2 py-1 text-xs font-medium rounded ${
              shipment.status === "delivered"
                ? "bg-green-100 text-green-800"
                : shipment.status === "transit"
                ? "bg-blue-100 text-blue-800"
                : shipment.status === "pending"
                ? "bg-yellow-100 text-yellow-800"
                : shipment.status === "delayed"
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {statusLabels[shipment.status || "pending"] || "غير محدد"}
          </span>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">المبلغ:</label>
          <p className="font-bold">
            {shipment.cod_amount ? `${shipment.cod_amount} ر.س` : "—"}
          </p>
        </div>
      </div>

      {/* Product Info */}
      {shipment.product_name && (
        <div className="mb-3">
          <label className="block text-xs font-semibold mb-1">اسم المنتج:</label>
          <p>{shipment.product_name}</p>
        </div>
      )}

      {/* Notes */}
      {shipment.notes && (
        <div className="mb-3">
          <label className="block text-xs font-semibold mb-1">ملاحظات:</label>
          <p className="text-sm">{shipment.notes}</p>
        </div>
      )}

      {/* Shipper & Delegate */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {shipment.shippers?.name && (
          <div>
            <label className="block text-xs font-semibold mb-1">التاجر:</label>
            <p>{shipment.shippers.name}</p>
          </div>
        )}
        {shipment.delegates?.name && (
          <div>
            <label className="block text-xs font-semibold mb-1">المندوب:</label>
            <p>{shipment.delegates.name}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t pt-2 mt-3 text-center text-xs opacity-60">
        <p>تاريخ الإنشاء: {new Date(shipment.created_at).toLocaleDateString("ar-EG")}</p>
      </div>
    </div>
  );
}