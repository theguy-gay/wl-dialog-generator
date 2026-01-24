export const forEachNamed = <T>(named: { [name: string]: T }, biconsumer: (name: string, obj: T) => void) => {
    Object.entries(named).forEach(entry => biconsumer(entry[0], entry[1]));
}

export const numberToKeyWord = (num: number) => {
  switch (num) {
    case 1: return "One";
    case 2: return "Two";
    case 3: return "Three";
    case 4: return "Four";
    case 5: return "Five";
    case 6: return "Six";
    case 7: return "Seven";
    case 8: return "Eight";
    case 9: return "Nine";
    case 10: return "Zero";
    default:
      return "Number out of range";
  }
}

export const getTriggerEventFromName = (name: string) => {
    return `${name}TriggerEvent`;
}