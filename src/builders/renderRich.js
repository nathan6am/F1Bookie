import { createRequire } from "module";
const require = createRequire(import.meta.url);
const Drivers = require("../json/Drivers.json");
const Constructors = require("../json/Constructors.json");
const drivers = Drivers.Drivers;
const constructors = Constructors.Constructors;

export function renderDriver(driverId) {
  const driverData = drivers.find((driver) =>
    driver.driverId.includes(driverId.toLowerCase())
  );
  if (!driverData) return null;
  return `${driverData.flag} ${driverData.givenName} ${driverData.familyName} (${driverData.code})`;
 
}

export function renderConstructor(constructorId) {
  const constructorData = constructors.find(constructor => constructorId === constructorId)
  if (!constructorData) return null;
  return `${constructorData.emojicode}${constructorData.name}`
}
