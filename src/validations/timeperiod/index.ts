import Validation from '../validation';

export default class extends Validation {
  public id = 'timeperiod';
  public github = 'stevef';
  public version = '0.2.0';

  async validate(): Promise<boolean> {
    const { propEntryStart = 0, propEntryEnd = 0 } = this.params;

    if (!propEntryStart || !propEntryEnd || propEntryStart >= propEntryEnd)
      return false;

    const now = new Date().getTime();
    const startTime = new Date(propEntryStart).getTime();
    const endTime = new Date(propEntryEnd).getTime();

    // Only allow proposals being submitted in this time window.
    return now >= startTime && now <= endTime;
  }
}
