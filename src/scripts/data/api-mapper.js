import Map from '../utils/map';

function toNumberOrNull(value) {
  if (value === undefined || value === null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function postMapper(post) {
  const latitude = toNumberOrNull(post.lat ?? post.location?.lat ?? null);
  const longitude = toNumberOrNull(post.lon ?? post.location?.lon ?? null);

  let placeName = null;
  if (latitude != null && longitude != null) {
    try {
      placeName = await Map.getPlaceNameByCoordinate(latitude, longitude);
    } catch (err) {
      console.error('postMapper: failed to get place name', err);
      placeName = null;
    }
  }

  return {
    ...post,
    lat: latitude,
    lon: longitude,
    location: {
      ...post.location,
      lat: latitude,
      lon: longitude,
      placeName,
    },
  };
}