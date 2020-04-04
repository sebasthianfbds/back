export function formateDate(date: Date) {
  if (!date) return undefined;
  return `${formatValue(date?.getDay())}/${formatValue(
    date?.getMonth()
  )}/${formatValue(date?.getFullYear())} ${formatValue(
    date?.getHours()
  )}:${formatValue(date?.getMinutes())}:${formatValue(date?.getSeconds())}`;
}

function formatValue(value: number) {
  return value.toString().padStart(2, "0");
}
