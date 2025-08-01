
import React, { useRef, useEffect, memo } from 'react';
import { View, Platform } from 'react-native';
import { MapView, Marker, Polyline } from 'react-native-amap3d';
import type { CameraPosition } from 'react-native-amap3d';
import { Tour, POI } from '@/types';

// Import SVG files as React components
import MarkerSelected from '~/assets/marker-selected.svg';
import MarkerDefault from '~/assets/marker-default.svg';

// POIMarker 组件，使用新的 Marker
interface POIMarkerProps {
  poi: POI;
  index: number;
  isSelected: boolean;
  onSelect: (poi: POI) => void;
}

const POIMarker = memo(({ poi, isSelected, onSelect }: POIMarkerProps) => {
  const handlePress = () => {
    onSelect(poi);
  };

  // Render the SVG component *inside* the <Marker>.
  // This creates a custom marker view. You can now control the size!
  return (
    <Marker
      position={{
        latitude: poi.coord.lat,
        longitude: poi.coord.lng,
      }}
      onPress={handlePress}
      // No longer using the `icon` or `title` prop here
    >
      {/* The content inside the marker becomes the custom icon */}
      <View style={{ alignItems: 'center' }}>
        {isSelected ? (
          <MarkerSelected width={48} height={48} />
        ) : (
          <MarkerDefault width={36} height={36} />
        )}
      </View>
    </Marker>
  );
});
POIMarker.displayName = 'POIMarker';


interface TourMapProps {
  tour: Tour | null;
  currentPOI?: POI | null;
  onPOISelect?: (poi: POI) => void;
}

export const TourMap = memo(({ tour, currentPOI, onPOISelect }: TourMapProps) => {
  // 3. 将 MapView ref 的类型改为 react-native-amap3d 的 MapView
  const mapRef = useRef<MapView>(null);

  // 4. 替换 initialRegion 为 initialCameraPosition
  //    高德地图使用 zoom 级别（3-20），而不是经纬度增量。15 是一个比较合适的城市级别缩放。
  const initialCameraPosition: CameraPosition | undefined = tour?.pois[0] ? {
    target: {
      latitude: tour.pois[0].coord.lat,
      longitude: tour.pois[0].coord.lng,
    },
    zoom: 15,
  } : undefined;

  // 5. 替换地图视角控制逻辑
  useEffect(() => {
    if (!mapRef.current || !tour) return;

    if (currentPOI) {
      // animateToRegion 替换为 moveCamera
      mapRef.current.moveCamera(
        {
          target: {
            latitude: currentPOI.coord.lat,
            longitude: currentPOI.coord.lng,
          },
          zoom: 17, // 聚焦到单个点时，放大一些
          tilt: 30,
        },
        600 // 动画时长 (ms)
      );
    } else if (tour.pois.length > 0) {
      // fitToCoordinates 的替换逻辑
      // amap3d 没有直接的 fitToCoordinates 方法。我们采用一种简化的方式：
      // 移动到第一个点的位置，并设置一个能看清大概范围的 zoom level。
      mapRef.current.moveCamera(
        {
          target: {
            latitude: tour.pois[0].coord.lat,
            longitude: tour.pois[0].coord.lng,
          },
          zoom: 12,
        },
        600
      );
    }
  }, [currentPOI, tour]);

  // 6. Polyline 坐标格式兼容，无需修改
  const polylineCoords = React.useMemo(() => {
    return tour?.route ? tour.route.map(([lng, lat]) => ({
      latitude: lat,
      longitude: lng,
    })) : [];
  }, [tour?.route]);

  return (
    <View style={{ flex: 1 }}>
      {/* 7. 更新 MapView 的 props */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialCameraPosition={initialCameraPosition}
        myLocationEnabled // showsUserLocation -> myLocationEnabled
        myLocationButtonEnabled={false} // showsMyLocationButton -> myLocationButtonEnabled
        compassEnabled={false} // showsCompass -> compassEnabled
        tiltGesturesEnabled={false} // pitchEnabled -> tiltGesturesEnabled
        rotateGesturesEnabled={false} // rotateEnabled -> rotateGesturesEnabled
        // 移除 provider 和 moveOnMarkerPress 属性
      >
        {tour?.pois.map((poi, index) => (
          <POIMarker
            key={poi.id}
            poi={poi}
            index={index}
            isSelected={currentPOI?.id === poi.id}
            onSelect={onPOISelect!}
          />
        ))}

        {/* 8. 更新 Polyline 的 props */}
        {polylineCoords.length > 0 && (
          <Polyline
            points={polylineCoords} // coordinates -> points
            color="#3B82F6" // strokeColor -> color
            width={4} // strokeWidth -> width
            dotted // lineDashPattern={[5, 5]} -> dotted={true}
          />
        )}
      </MapView>
    </View>
  );
});
TourMap.displayName = 'TourMap';