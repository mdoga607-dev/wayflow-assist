/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/ui/MapSelector.tsx
import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { MapPin, Search, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// تصحيح أيقونة الماركر
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface MapSelectorProps {
  onLocationSelect: (address: string, lat: number, lng: number, city: string, area: string) => void;
  initialLocation?: { lat: number; lng: number };
}

export function MapSelector({ onLocationSelect, initialLocation }: MapSelectorProps) {
  const [markerPosition, setMarkerPosition] = useState(initialLocation || { lat: 30.0444, lng: 31.2357 });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef<any>(null);

  const handleMapClick = (lat: number, lng: number) => {
    setMarkerPosition({ lat, lng });
    
    // تقدير المدينة من الإحداثيات (بدون API خارجي)
    const city = lat > 30.8 && lat < 31.3 && lng > 30.0 && lng < 31.5 ? 'القاهرة' : 
                 lat > 31.0 && lng < 30.5 ? 'الإسكندرية' : 'مصر';
    
    onLocationSelect(
      `إحداثيات: ${lat.toFixed(5)}, ${lng.toFixed(5)} - ${city}`,
      lat,
      lng,
      city,
      ''
    );
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // استخدام Nominatim (خدمة مجانية من OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery + ' مصر')}&format=json&limit=1&countrycodes=eg&accept-language=ar`
      );
      
      const results = await response.json();
      
      if (results && results.length > 0) {
        const lat = parseFloat(results[0].lat);
        const lng = parseFloat(results[0].lon);
        setMarkerPosition({ lat, lng });
        
        const address = results[0].display_name.replace(', Egypt', '').replace(', مصر', '');
        const city = address.includes('القاهرة') ? 'القاهرة' : 
                     address.includes('الإسكندرية') ? 'الإسكندرية' : 'مصر';
        
        onLocationSelect(address, lat, lng, city, '');
      } else {
        alert('لم يتم العثور على عنوان. حاول استخدام أسماء أماكن شهيرة في مصر.');
      }
    } catch (error) {
      console.error('خطأ في البحث:', error);
      alert('حدث خطأ أثناء البحث. تأكد من اتصالك بالإنترنت.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">اختر الموقع على خريطة مصر</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          ابحث عن عنوان مصري أو انقر على الخريطة لتحديد الموقع
        </p>
        
        <form onSubmit={handleSearch} className="relative">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="ابحث عن عنوان في مصر (مثل: وسط القاهرة)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 pl-4"
              dir="rtl"
            />
            {isSearching && (
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
            )}
          </div>
        </form>
      </div>
      
      <div className="h-[400px] w-full">
        <MapContainer
          center={[markerPosition.lat, markerPosition.lng]}
          zoom={10}
          minZoom={7}
          maxBounds={[[22.0, 25.0], [31.7, 36.5]] as any}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={handleMapClick} />
          <Marker 
            position={[markerPosition.lat, markerPosition.lng]}
            icon={L.divIcon({
              className: 'custom-marker',
              html: '<div style="background:#d24b60;color:white;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-weight:bold;box-shadow:0 2px 10px rgba(0,0,0,0.3);border:3px solid white">📍</div>',
              iconSize: [30, 30],
              iconAnchor: [15, 30]
            })}
          />
        </MapContainer>
      </div>
      
      <div className="p-4 bg-muted/20 border-t">
        <p className="text-sm font-medium flex items-center gap-1">
          <MapPin className="h-4 w-4 text-primary" />
          الموقع المحدد: {markerPosition.lat.toFixed(5)}, {markerPosition.lng.toFixed(5)}
        </p>
        <Button 
          onClick={() => onLocationSelect('', 0, 0, '', '')} 
          variant="outline" 
          size="sm"
          className="w-full mt-2"
        >
          مسح الموقع المحدد
        </Button>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          🌍 خريطة مجانية 100% بدون أي تكاليف (OpenStreetMap)
        </p>
      </div>
    </Card>
  );
}