export function convertDriverId(driverId) {
  switch (driverId) {
    case "verstappen":
      return "max_verstappen";
    case "schumacher":
      return "mick_schumacher";
    case "magnussen":
      return "kevin_magnussen";
    default:
      return driverId;
  }
}
