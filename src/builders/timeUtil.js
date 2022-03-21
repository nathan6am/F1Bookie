import moment from "moment";
import momentDurationFormatSetup from "moment-duration-format";

momentDurationFormatSetup(moment);

export function timeUnitl(date) {
  const duration = moment.duration(moment(date).diff(moment()));
  return duration.format("dd[d] : h[h] : mm : ss", {
    trim: false,
  });
}
export function lastUpdate(date) {
  const duration = moment.duration(moment().diff(moment(date)));
  return duration.format("h [hrs], m [min]");
}
