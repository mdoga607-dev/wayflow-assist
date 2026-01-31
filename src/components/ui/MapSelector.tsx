/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/ship/MapSelector.tsx
import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '@/integrations/supabase/client';

// تصحيح أيقونة الماركر
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapSelectorProps {
  onLocationSelect: (address: string, lat: number, lng: number, city: string, area: string) => void;
  initialLocation?: { lat: number; lng: number };
}

export function MapSelector({ onLocationSelect, initialLocation }: MapSelectorProps) {
  const [markerPosition, setMarkerPosition] = useState(initialLocation || { lat: 26.8206, lng: 30.8025 }); // وسط مصر
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [areas, setAreas] = useState<Array<{ id: string; name: string; governorate: string; city: string; key_words: string[] }>>([]);
  const mapRef = useRef<any>(null);

  // جلب المناطق الحقيقية من قاعدة البيانات
  useEffect(() => {
    const fetchAreas = async () => {
      const { data, error } = await supabase
        .from('areas')
        .select('id, name, governorate, city, key_words')
        .eq('status', 'active')
        .order('coverage_percentage', { ascending: false });

      if (!error && data) {
        setAreas(data);
      }
    };

    fetchAreas();
  }, []);

  const handleMapClick = (lat: number, lng: number) => {
    setMarkerPosition({ lat, lng });
    
    // البحث العكسي للحصول على العنوان الحقيقي
    reverseGeocode(lat, lng);
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsSearching(true);
    try {
      // استخدام Nominatim للبحث العكسي (مجاني)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=ar&addressdetails=1`
      );
      
      const result = await response.json();
      
      if (result && result.address) {
        const address = result.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        const city = result.address.city || result.address.town || result.address.village || 'مصر';
        const area = result.address.suburb || result.address.neighbourhood || '';
        
        onLocationSelect(address, lat, lng, city, area);
      } else {
        // البحث في قاعدة البيانات المحلية للمناطق
        const matchingArea = areas.find(area => 
          area.key_words?.some(keyword => 
            keyword.toLowerCase().includes(searchQuery.toLowerCase())
          )
        );
        
        if (matchingArea) {
          onLocationSelect(
            matchingArea.name,
            lat,
            lng,
            matchingArea.governorate,
            matchingArea.city
          );
        } else {
          onLocationSelect(
            `إحداثيات: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
            lat,
            lng,
            'مصر',
            ''
          );
        }
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      onLocationSelect(
        `إحداثيات: ${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        lat,
        lng,
        'مصر',
        ''
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // البحث في قاعدة البيانات أولاً
      const { data: areaData } = await supabase
        .from('areas')
        .select('id, name, governorate, city, key_words')
        .or(`name.ilike.%${searchQuery}%,governorate.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`)
        .limit(1);

      if (areaData && areaData.length > 0) {
        // استخدام إحداثيات تقريبية للمحافظة (يمكن تحسينها لاحقاً)
        const governorateCoords: { [key: string]: { lat: number; lng: number } } = {
          'القاهرة': { lat: 30.0444, lng: 31.2357 },
          'الجيزة': { lat: 30.0131, lng: 31.2089 },
          'الإسكندرية': { lat: 31.2001, lng: 29.9187 },
          'الشرقية': { lat: 30.5882, lng: 31.7837 },
          'الدقهلية': { lat: 31.0409, lng: 31.3785 },
          'الغربية': { lat: 30.8489, lng: 30.9917 },
          'المنوفية': { lat: 30.5409, lng: 31.0409 },
          'البحيرة': { lat: 30.9167, lng: 30.4167 },
          'كفر الشيخ': { lat: 31.1009, lng: 30.9461 },
          'الفيوم': { lat: 29.3082, lng: 30.8417 },
          'بني سويف': { lat: 29.0661, lng: 31.0994 },
          'المنيا': { lat: 28.1099, lng: 30.7503 },
          'أسيوط': { lat: 27.1817, lng: 31.1834 },
          'سوهاج': { lat: 26.5561, lng: 31.6948 },
          'قنا': { lat: 26.1617, lng: 32.7281 },
          'الأقصر': { lat: 25.6872, lng: 32.6396 },
          'أسوان': { lat: 24.0889, lng: 32.8994 },
        };

        const coords = governorateCoords[areaData[0].governorate] || { lat: 26.8206, lng: 30.8025 };
        setMarkerPosition(coords);
        mapRef.current?.panTo([coords.lat, coords.lng]);
        
        onLocationSelect(
          areaData[0].name,
          coords.lat,
          coords.lng,
          areaData[0].governorate,
          areaData[0].city
        );
        return;
      }

      // البحث باستخدام Nominatim إذا لم توجد نتائج في قاعدة البيانات
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery + ' مصر')}` +
        `&format=json&limit=1&countrycodes=eg&accept-language=ar`
      );
      
      const results = await response.json();
      
      if (results && results.length > 0) {
        const lat = parseFloat(results[0].lat);
        const lng = parseFloat(results[0].lon);
        setMarkerPosition({ lat, lng });
        mapRef.current?.panTo([lat, lng]);
        
        const address = results[0].display_name.replace(', Egypt', '').replace(', مصر', '');
        const city = address.includes('القاهرة') ? 'القاهرة' : 
                     address.includes('الإسكندرية') ? 'الإسكندرية' : 
                     address.includes('الجيزة') ? 'الجيزة' : 'مصر';
        
        onLocationSelect(address, lat, lng, city, '');
      } else {
        alert('لم يتم العثور على عنوان. حاول استخدام اسم مدينة أو محافظة.');
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
          ابحث عن عنوان مصري أو انقر على الخريطة لتحديد الموقع بدقة
        </p>
        
        <form onSubmit={handleSearch} className="relative">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="ابحث باسم المدينة أو المنطقة (مثل: وسط القاهرة، شارع المعز...)"
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
        
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700">
            💡 نصائح البحث: استخدم أسماء المدن (القاهرة، جدة)، المحافظات (الغربية، الشرقية)، 
            أو معالم بارزة (كورنيش الإسكندرية، شارع التسعين)
          </p>
        </div>
      </div>
      
      <div className="h-[400px] w-full">
        <MapContainer
          center={[markerPosition.lat, markerPosition.lng]}
          zoom={8}
          minZoom={6}
          maxZoom={18}
          maxBounds={[[22.0, 25.0], [31.7, 36.5]] as any}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          scrollWheelZoom={true}
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
          
          {/* عرض حدود المحافظات المصرية (اختياري - يتطلب ملف GeoJSON) */}
          {/* <GeoJSON data={egyptGovernoratesGeoJSON} style={{ color: '#1976d2', weight: 2, fillOpacity: 0.1 }} /> */}
        </MapContainer>
      </div>
      
      <div className="p-4 bg-muted/20 border-t">
        <p className="text-sm font-medium flex items-center gap-1">
          <MapPin className="h-4 w-4 text-primary" />
          الموقع المحدد: {markerPosition.lat.toFixed(5)}, {markerPosition.lng.toFixed(5)}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const { latitude, longitude } = position.coords;
                  setMarkerPosition({ lat: latitude, lng: longitude });
                  mapRef.current?.panTo([latitude, longitude]);
                  reverseGeocode(latitude, longitude);
                },
                (error) => {
                  console.error('Error getting location:', error);
                  alert('غير قادر على تحديد موقعك الحالي. تأكد من تفعيل خدمات الموقع.');
                },
                { enableHighAccuracy: true, timeout: 10000 }
              );
            }}
          >
            <MapPin className="h-3 w-3 ml-1" />
            تحديد موقعي الحالي
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onLocationSelect('', 0, 0, '', '')}
          >
            مسح الموقع
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          🌍 خريطة مجانية 100% بدون أي تكاليف (OpenStreetMap) • تدعم جميع محافظات مصر
        </p>
      </div>
    </Card>
  );
}

// مكون فرعي لالتقاط نقرات الخريطة
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}