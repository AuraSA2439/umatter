import Map from '../utils/map';

export async function postMapper(post) {
  const latitude = post.lat ?? post.location?.lat;
  const longitude = post.lon ?? post.location?.lon;

  const placeName = await Map.getPlaceNameByCoordinate(latitude, longitude);

  return {
    ...post,
    location: {
      lat: latitude,
      lon: longitude,
      placeName,
    },
  };
}