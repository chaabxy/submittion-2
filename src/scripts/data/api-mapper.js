import Map from '../utils/map';

export async function storyMapper(story) {
  if (!story) {
    console.error('Story object is undefined');
    return {
      id: 'unknown',
      name: 'Unknown',
      description: 'Story details not available',
      photoUrl: 'images/placeholder-image.jpg',
      createdAt: new Date().toISOString(),
      location: { lat: 0, lon: 0, placeName: 'Unknown location' },
    };
  }

  if (!story.location && (story.lat !== undefined || story.lon !== undefined)) {
    story.location = {
      lat: story.lat,
      lon: story.lon,
    };
  }

  if (!story.location) {
    story.location = { lat: 0, lon: 0 };
  }

  try {
    const lat = story.location.lat !== undefined ? story.location.lat : 0;
    const lon = story.location.lon !== undefined ? story.location.lon : 0;

    let placeName = `${lat}, ${lon}`;

    if ((lat !== 0 || lon !== 0) && !isNaN(Number(lat)) && !isNaN(Number(lon))) {
      try {
        const apiPlaceName = await Map.getPlaceNameByCoordinate(Number(lat), Number(lon));
        if (apiPlaceName && apiPlaceName !== 'Unknown location') {
          placeName = apiPlaceName;
        }
      } catch (locationError) {
        console.error('Error getting place name:', locationError);
      }
    }

    return {
      ...story,
      location: {
        ...story.location,
        lat,
        lon,
        placeName,
      },
    };
  } catch (error) {
    console.error('Error mapping story:', error);
    const lat = story.location.lat !== undefined ? story.location.lat : 0;
    const lon = story.location.lon !== undefined ? story.location.lon : 0;

    return {
      ...story,
      location: {
        ...story.location,
        lat,
        lon,
        placeName: `${lat}, ${lon}`,
      },
    };
  }
}
