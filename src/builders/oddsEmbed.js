import { MessageEmbed } from "discord.js";
import { getOdds } from "../services/redisCache.js";
import { renderConstructor, renderDriver } from "./renderRich.js";
import { timeUnitl, lastUpdate } from "./timeUtil.js";

export async function renderOdds(value) {
  const oddsData = await getOdds();
  if (!oddsData) return;
  const data = oddsData.find(
    (category) => category.type === value || category.sessionType === value
  );
  const title = data.sessionTitle || data.title;
  function setDescription() {
    if (data.startTime) {
      return "Session starts in ``" + `${timeUnitl(data.startTime)}` + "``";
    } else if (data.type === "constructor") {
      return "2022 Constructor Champsionship Futures";
    } else if (data.type === "drivers") {
      return "2022 Driver Champsionship Futures";
    }
  }
  const description = setDescription();
  const fields = data.tables.map((table) => renderTableToField(table));
  function renderTableToField(table) {
    const name = `${table.title} - (${table.betCode})`;
    let value = "";
    //- (use code "${table.betCode}" to place bets)
    if (table.type === "driver") {
      value = table.options
        .map((option) => {
          const odds = (option.oddsValue < 0 ? "" : "+") + option.oddsValue;
          const nameRich = renderDriver(option.optionId);
          return `${nameRich}: ` + "``" + `${odds}` + "``";
        })
        .join("\n");
    } else if (table.type === "constructor") {
      value = table.options.map((option) => {
        const odds = (option.oddsValue < 0 ? "" : "+") + option.oddsValue;
        const nameRich = renderConstructor(option.optionId);
        return `${nameRich}: ` + "``" + `${odds}` + "``";
      })
    } else {
      const res = table.options
        .map((option) => {
          const odds = (option.oddsValue < 0 ? "" : "+") + option.oddsValue;
          return `${option.optionName}: ` + "``" + `${odds}` + "``";
        })
        .join("\n");
      value = res;
    }
    // const value = table.options
    //   .map((option) => {
    //     const odds = (option.oddsValue < 0 ? "" : "+") + option.oddsValue;
    //     return `${odds} - ${option.optionName}`;
    //   })
    //   .join("\n");
    return {
      name: name,
      value: value,
    };
  }
  const embed = new MessageEmbed()
    .setColor("#ff1801")
    .setTitle(title)
    .setDescription(description)
    .addFields(fields)
    .setFooter({ text: `Last updated: ${lastUpdate(data.lastUpdate)} ago` });

  return embed;
}
