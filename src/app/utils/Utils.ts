export class Utils {
  static isMobile(): boolean {
    return navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/webOS/i) || navigator.userAgent.match(/iPhone/i) || navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPod/i) || navigator.userAgent.match(/BlackBerry/i) || navigator.userAgent.match(/Windows Phone/i) ? true : false;
  }
  static normalizeDate(date?: string): string | undefined {
    if (!date) return undefined;  // se è null/undefined esci
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  static wordsToNumbers: Record<string, number> = {
    'zero': 0, 'uno': 1, 'una': 1,
    'due': 2, 'tre': 3, 'quattro': 4,
    'cinque': 5, 'sei': 6, 'sette': 7,
    'otto': 8, 'nove': 9, 'dieci': 10,
    'undici': 11, 'dodici': 12, 'tredici': 13,
    'quattordici': 14, 'quindici': 15,
    'sedici': 16, 'diciassette': 17,
    'diciotto': 18, 'diciannove': 19,
    'venti': 20, 'ventuno': 21, 'ventidue': 22,
    'ventitre': 23, 'ventiquattro': 24, 'venticinque': 25,
    'ventisei': 26, 'ventisette': 27,
    'ventotto': 28, 'ventinove': 29,
    'trenta': 30, 'trentuno': 31
  }
  static parseNumbers = (text: string): number[] => {
    const nums: number[] = [];

    // 1. cerca cifre già numeriche
    const digits = text.match(/\d+/g);
    if (digits) {
      nums.push(...digits.map(n => parseInt(n, 10)));
    }

    // 2. cerca parole
    const tokens = text.toLowerCase().split(/\s+/);
    for (const t of tokens) {
      if (Utils.wordsToNumbers[t] !== undefined) {
        nums.push(Utils.wordsToNumbers[t]);
      }
    }

    return nums;
  };
  static isAndroid(): boolean {
    return /Android/i.test(navigator.userAgent);
  }

  static isIos(): boolean {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
  }
}