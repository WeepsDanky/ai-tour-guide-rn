import React from 'react';
import { View } from 'react-native';
import { Tour } from '@/types';
import { TourCard } from '@/ui/molecules/TourCard';

interface BentoGridProps {
  tours: Tour[];
  onTourPress: (tour: Tour) => void;
  pattern?: 'default' | 'featured' | 'compact';
}

export function BentoGrid({ tours, onTourPress, pattern = 'default' }: BentoGridProps) {
  if (!Array.isArray(tours) || tours.length === 0) return null;

  const renderPattern = () => {
    switch (pattern) {
      case 'featured':
        return renderFeaturedPattern();
      case 'compact':
        return renderCompactPattern();
      default:
        return renderDefaultPattern();
    }
  };

  const renderFeaturedPattern = () => {
    const [featured, ...rest] = tours;
    const remaining = rest.slice(0, 4);

    return (
      <View className="gap-3">
        {/* Featured tour - full width */}
        <View className="w-full">
          <TourCard
            tour={featured}
            onPress={() => onTourPress(featured)}
            variant="featured"
            showDescription={true}
          />
        </View>

        {/* Grid of smaller cards */}
        <View className="flex-row gap-3">
          <View className="flex-1 gap-3">
            {remaining[0] && (
              <TourCard
                tour={remaining[0]}
                onPress={() => onTourPress(remaining[0])}
                variant="medium"
              />
            )}
            {remaining[2] && (
              <TourCard
                tour={remaining[2]}
                onPress={() => onTourPress(remaining[2])}
                variant="small"
              />
            )}
          </View>
          <View className="flex-1 gap-3">
            {remaining[1] && (
              <TourCard
                tour={remaining[1]}
                onPress={() => onTourPress(remaining[1])}
                variant="small"
              />
            )}
            {remaining[3] && (
              <TourCard
                tour={remaining[3]}
                onPress={() => onTourPress(remaining[3])}
                variant="medium"
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderDefaultPattern = () => {
    const chunks = [];
    for (let i = 0; i < tours.length; i += 6) {
      chunks.push(tours.slice(i, i + 6));
    }

    return (
      <View className="gap-4">
        {chunks.map((chunk, chunkIndex) => (
          <View key={chunkIndex} className="gap-3">
            {/* First row: large + 2 small */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                {chunk[0] && (
                  <TourCard
                    tour={chunk[0]}
                    onPress={() => onTourPress(chunk[0])}
                    variant="large"
                    showDescription={true}
                  />
                )}
              </View>
              <View className="w-[45%] gap-3">
                {chunk[1] && (
                  <TourCard
                    tour={chunk[1]}
                    onPress={() => onTourPress(chunk[1])}
                    variant="small"
                  />
                )}
                {chunk[2] && (
                  <TourCard
                    tour={chunk[2]}
                    onPress={() => onTourPress(chunk[2])}
                    variant="small"
                  />
                )}
              </View>
            </View>

            {/* Second row: 3 medium cards */}
            {(chunk[3] || chunk[4] || chunk[5]) && (
              <View className="flex-row gap-3">
                {chunk[3] && (
                  <View className="flex-1">
                    <TourCard
                      tour={chunk[3]}
                      onPress={() => onTourPress(chunk[3])}
                      variant="medium"
                    />
                  </View>
                )}
                {chunk[4] && (
                  <View className="flex-1">
                    <TourCard
                      tour={chunk[4]}
                      onPress={() => onTourPress(chunk[4])}
                      variant="medium"
                    />
                  </View>
                )}
                {chunk[5] && (
                  <View className="flex-1">
                    <TourCard
                      tour={chunk[5]}
                      onPress={() => onTourPress(chunk[5])}
                      variant="medium"
                    />
                  </View>
                )}
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderCompactPattern = () => {
    return (
      <View className="flex-row flex-wrap gap-2">
        {tours.map((tour) => (
          <View key={tour.id} className="w-[48%]">
            <TourCard
              tour={tour}
              onPress={() => onTourPress(tour)}
              variant="small"
            />
          </View>
        ))}
      </View>
    );
  };

  return <View className="px-4">{renderPattern()}</View>;
}