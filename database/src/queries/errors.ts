export class DataFeaturePendingError extends Error {
  constructor(feature: string) {
    super(`${feature}: 10–11-р долоо хоногт хэрэгжинэ`);
    this.name = 'DataFeaturePendingError';
  }
}
